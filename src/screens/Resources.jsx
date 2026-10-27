import { useState, useEffect } from 'preact/hooks';
import { useStore } from '../lib/store.js';
import { useNow } from '../lib/router.js';
import { BIOMES, EXTENSIONS, extOfBiomes } from '../data/biomes.js';
import { CROPS, FISH, GEMS, FORAGE, RIPPLES, GEM_COLORS } from '../data/resources.js';
import { visibleItems, newId, biomeName } from '../lib/game.js';
import { formatDuration } from '../lib/time.js';
import { Icon, Thumb, Seg, Back, BiomePills, GroupTitle, ExtTag, Search, norm } from '../ui.jsx';

const CAT_LABEL = { fruit: 'Fruit', epice: 'Épice', champi: 'Champignon' };

const CONFIG = {
  potager: {
    title: 'Potager', items: CROPS, unit: 'culture', biomeHint: 'Biome où acheter les graines',
    sorts: [['profit', 'Rentabilité'], ['fast', 'Rapidité'], ['sell', 'Prix'], ['name', 'Nom']],
    sorters: {
      profit: (a, b) => b.profit - a.profit, fast: (a, b) => a.min - b.min,
      sell: (a, b) => b.sell - a.sell, name: (a, b) => a.name.localeCompare(b.name, 'fr')
    }
  },
  peche: {
    title: 'Pêche', items: FISH, unit: 'poisson',
    sorts: [['ripple', 'Remous'], ['name', 'Nom']],
    sorters: {
      ripple: (a, b) => ['or', 'bleu', 'blanc'].indexOf(a.ripple) - ['or', 'bleu', 'blanc'].indexOf(b.ripple) || a.name.localeCompare(b.name, 'fr'),
      name: (a, b) => a.name.localeCompare(b.name, 'fr')
    }
  },
  cueillette: {
    title: 'Cueillette', items: FORAGE, unit: 'élément',
    sorts: [['name', 'Nom'], ['price', 'Prix']],
    sorters: { name: (a, b) => a.name.localeCompare(b.name, 'fr'), price: (a, b) => b.price - a.price }
  },
  mines: {
    title: 'Mines', items: GEMS, unit: 'gemme',
    sorts: [['price', 'Prix'], ['name', 'Nom'], ['color', 'Couleur']],
    sorters: {
      price: (a, b) => b.price - a.price, name: (a, b) => a.name.localeCompare(b.name, 'fr'),
      color: (a, b) => Object.keys(GEM_COLORS).indexOf(a.color) - Object.keys(GEM_COLORS).indexOf(b.color) || a.name.localeCompare(b.name, 'fr')
    }
  }
};

export function ResourceScreen({ kind, initialQ }) {
  const cfg = CONFIG[kind];
  const { state, update } = useStore();
  const [view, setView] = useState('biome');
  const [biome, setBiome] = useState('');
  const [sort, setSort] = useState(cfg.sorts[0][0]);
  const [sortDir, setSortDir] = useState(1);
  const [ripple, setRipple] = useState('all');
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState(initialQ || '');
  const [planting, setPlanting] = useState(null);
  // Arrivée depuis la Recherche globale avec un terme différent : on le reprend.
  useEffect(() => { if (initialQ) setQ(initialQ); }, [initialQ]);

  let items = visibleItems(cfg.items, state.extensions);
  const present = BIOMES.filter((b) => items.some((it) => it.biomes.includes(b.id)));

  if (biome) items = items.filter((it) => it.biomes.includes(biome) || it.biomes[0] === '*');
  if (kind === 'peche' && ripple !== 'all') items = items.filter((it) => it.ripple === ripple);
  if (kind === 'cueillette' && cat !== 'all') items = items.filter((it) => it.cat === cat);
  if (q) items = items.filter((it) => norm(it.name).includes(norm(q)));
  items = items.slice().sort((a, b) => sortDir * cfg.sorters[sort](a, b));

  let groups;
  if (view === 'biome') {
    // Une section par biome présent (un objet dispo dans plusieurs biomes apparaît dans chacun),
    // plus une section « Partout » en tête pour les objets universels (ex. l'onyx).
    const everywhere = items.filter((it) => it.biomes[0] === '*');
    groups = present
      .filter((b) => !biome || b.id === biome)
      .map((b) => ({ key: b.id, title: b.name, color: b.color, items: items.filter((it) => it.biomes.includes(b.id)) }))
      .filter((g) => g.items.length);
    if (everywhere.length) groups.unshift({ key: 'partout', title: 'Partout', color: 'var(--muted)', items: everywhere });
  } else if (view === 'ext') {
    // Jeu de base d'abord, puis une section par extension active, dans l'ordre d'EXTENSIONS.
    const base = items.filter((it) => it.biomes[0] === '*' || !extOfBiomes(it.biomes));
    groups = [{ key: 'base', title: 'Jeu de base', color: 'var(--muted)', items: base }];
    for (const e of EXTENSIONS) {
      const extItems = items.filter((it) => it.biomes[0] !== '*' && extOfBiomes(it.biomes) === e.id);
      if (extItems.length) groups.push({ key: e.id, title: e.name, color: 'var(--accent)', items: extItems });
    }
    groups = groups.filter((g) => g.items.length);
  } else {
    groups = [{ key: 'all', title: null, items }];
  }

  const addToShopping = (it) => {
    update((s) => ({
      shopping: [...s.shopping, {
        id: newId(), name: it.name, qty: 1, done: false, for: '',
        kind: kind === 'peche' ? 'peche' : kind === 'mines' ? 'mines' : kind === 'potager' ? 'graines' : 'cueillette',
        where: it.biomes.map(biomeName).join(', ') + (it.ripple ? ` · remous ${RIPPLES[it.ripple].label.toLowerCase()}` : '')
      }]
    }));
  };

  const plural = (n) => `${n} ${cfg.unit}${n > 1 ? 's' : ''}`;

  return (
    <div class="page wide">
      <Back href="#/vallee" label="Vallée" />
      <div class="between">
        <h1>{cfg.title}</h1>
        <Seg small label="Affichage" value={view} onChange={setView} options={[['biome', 'Par biome'], ['list', 'Liste'], ['ext', 'Par extension']]} />
      </div>

      {kind === 'potager' && <Plantings onPlant={() => setPlanting(true)} />}
      {kind === 'mines' && (
        <div class="small muted" style={{ lineHeight: 1.45 }}>
          40 d'énergie par coup de pioche · l'onyx, présent partout, sert au vernis de pioche qui garantit une gemme à chaque coup · les gemmes brillantes valent 4 fois le prix.
        </div>
      )}
      {kind === 'cueillette' && (
        <div class="small muted" style={{ lineHeight: 1.45 }}>
          Fruits, épices et champignons réapparaissent chaque jour à un nouvel endroit du biome (pas de minuteur précis à afficher). Seules les fleurs décoratives ont un vrai délai de réapparition (jusqu'à 2 h selon leur rareté) ; elles ne sont pas encore suivies ici.
        </div>
      )}

      <Search value={q} onInput={setQ} placeholder={`Chercher un${cfg.unit === 'culture' ? 'e' : ''} ${cfg.unit}…`} />

      <div class="chips" role="group" aria-label={cfg.biomeHint || 'Biome'}>
        <button class={'chip' + (!biome ? ' on' : '')} aria-pressed={!biome} onClick={() => setBiome('')}>Tous les biomes</button>
        {present.map((b) => (
          <button key={b.id} class={'chip' + (biome === b.id ? ' on' : '')} aria-pressed={biome === b.id} onClick={() => setBiome(b.id)}>
            <span class="dot" style={{ background: b.color }} />{b.name}
          </button>
        ))}
      </div>

      {kind === 'peche' && (
        <Seg label="Couleur du remous" value={ripple} onChange={setRipple}
          options={[['all', 'Tous', 'var(--muted)'], ...Object.entries(RIPPLES).map(([id, r]) => [id, r.label, r.color])]} />
      )}
      {kind === 'cueillette' && (
        <Seg label="Catégorie" value={cat} onChange={setCat} options={[['all', 'Tout'], ['fruit', 'Fruits'], ['epice', 'Épices'], ['champi', 'Champis']]} />
      )}

      <div class="between wrap">
        <span class="small muted" style={{ fontWeight: 700 }}>{plural(items.length)}</span>
        <div class="row wrap" style={{ gap: '4px' }}>
          <span class="small muted" style={{ fontWeight: 700 }}>Trier :</span>
          {cfg.sorts.map(([id, label]) => (
            <button key={id} class={'chip' + (sort === id ? ' on' : '')} style={{ minHeight: '32px', fontSize: '12px' }} aria-pressed={sort === id}
              onClick={() => {
                if (sort === id) setSortDir((d) => -d);
                else { setSort(id); setSortDir(1); }
              }}>
              {label}{sort === id ? (sortDir === 1 ? ' ↑' : ' ↓') : ''}
            </button>
          ))}
        </div>
      </div>

      <div class="stack" style={{ gap: '14px' }}>
        {groups.map((g) => (
          <section key={g.key} class="stack">
            {g.title && <GroupTitle color={g.color} title={g.title} count={plural(g.items.length)} />}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: '8px' }}>
              {g.items.map((it) => (
                <ResourceItem key={it.id} kind={kind} it={it} selected={biome}
                  onAction={() => (kind === 'potager' ? setPlanting(it) : addToShopping(it))} />
              ))}
            </div>
          </section>
        ))}
        {!groups.length && <div class="empty">Rien ne correspond à ces filtres.</div>}
      </div>

      {planting && <PlantModal initial={planting === true ? null : planting} onClose={() => setPlanting(null)} />}
    </div>
  );
}

function ResourceItem({ kind, it, selected, onAction }) {
  const ext = it.biomes[0] === '*' ? null : extOfBiomes(it.biomes);
  return (
    <div class="item">
      <Thumb file={it.file} name={it.name} round={kind === 'peche'}
        ring={kind === 'peche' ? RIPPLES[it.ripple].color : kind === 'mines' ? GEM_COLORS[it.color]?.color : null} />
      <div class="body">
        <div class="row wrap" style={{ gap: '6px' }}>
          <span class="name">{it.name}</span>
          {kind === 'peche' && <span class="tag" style={{ background: RIPPLES[it.ripple].color }}>{RIPPLES[it.ripple].label}</span>}
          {kind === 'mines' && <span class="tag" style={{ background: GEM_COLORS[it.color]?.color }}>{GEM_COLORS[it.color]?.label}</span>}
          {it.cond && <span class="tag" style={{ background: '#7DB4F5' }}>{it.cond}</span>}
          {kind === 'cueillette' && <span class="tag outline">{CAT_LABEL[it.cat]}</span>}
          <ExtTag ext={ext} />
        </div>
        <BiomePills ids={it.biomes} selected={selected} />
        {kind === 'potager' && (
          <span class="small muted">
            {formatDuration(it.min)} · graine {it.seed} → vente {it.sell} · {it.water == null ? '?' : it.water} arrosage{it.water > 1 ? 's' : ''}
          </span>
        )}
        {it.use && <span class="small" style={{ color: 'var(--accent)', fontWeight: 700 }}>{it.use}</span>}
        {it.todo && <span class="small muted">Nom français à vérifier</span>}
      </div>
      <div class="side" style={{ gap: '6px' }}>
        {kind === 'potager' && <><span class="big-num">{it.profit}</span><span class="small muted" style={{ fontWeight: 700 }}>pièces/h</span></>}
        {(kind === 'mines' || (kind === 'cueillette' && it.price > 0)) && <><span class="big-num">{it.price}</span><span class="small muted" style={{ fontWeight: 700 }}>pièces</span></>}
        <button class="icon-btn" style={{ width: '38px', height: '38px' }} onClick={onAction}
          aria-label={kind === 'potager' ? `Planter : ${it.name}` : `Ajouter à la liste de courses : ${it.name}`}>
          <Icon name={kind === 'potager' ? 'sprout' : 'plus'} size={18} />
        </button>
      </div>
    </div>
  );
}

function Plantings({ onPlant }) {
  const { state, update } = useStore();
  const now = useNow(15000);
  const crop = Object.fromEntries(CROPS.map((c) => [c.id, c]));
  return (
    <div class="card stack" style={{ gap: '6px' }}>
      <div class="between">
        <span class="small" style={{ fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--green)' }}>Mes plantations</span>
        <button class="btn sm" onClick={onPlant}><Icon name="plus" size={16} />Planter</button>
      </div>
      {state.plantings.map((p) => {
        const c = crop[p.cropId];
        const left = Math.max(0, Math.ceil((p.plantedAt + (c?.min || 0) * 60000 - now.getTime()) / 60000));
        return (
          <div key={p.id} class="between" style={{ minHeight: '40px' }}>
            <span style={{ fontWeight: 800 }}>{c?.name || 'Culture'} ×{p.qty}</span>
            <span class="row" style={{ gap: '8px' }}>
              {left === 0 ? <span class="tag">À récolter</span> : <span class="small muted" style={{ fontWeight: 700 }}>prêtes dans {formatDuration(left)}</span>}
              <button class="icon-btn" style={{ width: '36px', height: '36px' }} aria-label="Retirer (récolté)"
                onClick={() => update((s) => ({ plantings: s.plantings.filter((x) => x.id !== p.id) }))}>
                <Icon name={left === 0 ? 'check' : 'x'} size={18} />
              </button>
            </span>
          </div>
        );
      })}
      {!state.plantings.length && <span class="small muted">Aucune plantation. Touche « Planter » quand tu sèmes pour lancer un minuteur.</span>}
    </div>
  );
}

function PlantModal({ initial, onClose }) {
  const { state, update } = useStore();
  const crops = visibleItems(CROPS, state.extensions).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  const [cropId, setCropId] = useState(initial?.id || crops[0]?.id);
  const [qty, setQty] = useState(10);
  const save = () => {
    update((s) => ({ plantings: [...s.plantings, { id: newId(), cropId, qty: Number(qty) || 1, plantedAt: Date.now() }] }));
    onClose();
  };
  return (
    <div class="modal-back" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="modal" role="dialog" aria-modal="true" aria-label="Nouvelle plantation">
        <h2>Nouvelle plantation</h2>
        <label class="field">Culture
          <select value={cropId} onChange={(e) => setCropId(e.currentTarget.value)}>
            {crops.map((c) => <option key={c.id} value={c.id}>{c.name} ({formatDuration(c.min)})</option>)}
          </select>
        </label>
        <label class="field">Quantité
          <input type="number" min="1" value={qty} onInput={(e) => setQty(e.currentTarget.value)} />
        </label>
        <div class="small muted">Le minuteur démarre maintenant. Pense à arroser : la pousse ne commence qu'une fois arrosée.</div>
        <div class="grid-2">
          <button class="btn ghost" onClick={onClose}>Annuler</button>
          <button class="btn" onClick={save}>Planter</button>
        </div>
      </div>
    </div>
  );
}

