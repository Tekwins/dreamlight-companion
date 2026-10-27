import { useState } from 'preact/hooks';
import { useStore } from '../lib/store.js';
import { STAR_PATHS } from '../data/starpath.js';
import { MEMORIES } from '../data/memories.js';
import { FURNITURE, FURNITURE_CATEGORIES } from '../data/furniture.js';
import { starPathProgress } from '../lib/game.js';
import { Icon, Thumb, Back, Seg, Search, norm } from '../ui.jsx';

const TABS = [['star', 'Voie étoilée'], ['souv', 'Souvenirs'], ['meub', 'Meubles']];

// Carte dépliable commune aux 3 onglets : titre, barre %, puis une grille de vignettes à cocher
// une fois ouverte (même principe partout, pour rester cohérent et simple à suivre).
function GroupCard({ title, got, total, children, onToggleOpen, isOpen }) {
  const pct = total ? Math.round((got / total) * 100) : 0;
  const color = pct === 100 ? 'var(--accent)' : 'var(--teal)';
  return (
    <div class="card stack" style={{ gap: '10px' }}>
      <button type="button" onClick={onToggleOpen}
        style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'transparent', border: 0, padding: 0, textAlign: 'left', font: 'inherit', color: 'inherit', cursor: 'pointer' }}>
        <div class="between">
          <strong style={{ fontSize: '16px' }}>{title}</strong>
          <span style={{ fontWeight: 800, color }}>{pct === 100 ? 'Complet' : `${pct} %`}</span>
        </div>
        <div class="bar"><div style={{ width: `${pct}%`, background: color }} /></div>
        <span class="small muted">{got} / {total}</span>
      </button>
      {isOpen && children}
    </div>
  );
}

function Checklist({ items, owned, onToggle, labelOf }) {
  return (
    <div class="row wrap" style={{ gap: '8px' }}>
      {items.map((it) => {
        const checked = !!owned[it.id];
        const label = labelOf(it);
        return (
          <button key={it.id} type="button" onClick={() => onToggle(it.id)} aria-pressed={checked} aria-label={label}
            style={{ width: '74px', background: 'transparent', border: 0, padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', opacity: checked ? 1 : 0.5 }}>
            <div style={{ position: 'relative' }}>
              <Thumb file={it.file} name={label} />
              {checked && (
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent)', color: '#14123A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={13} />
                </span>
              )}
            </div>
            <span class="small muted" style={{ textAlign: 'center', fontSize: '10px', lineHeight: 1.2 }}>{label}</span>
          </button>
        );
      })}
      {!items.length && <span class="small muted">Rien ne correspond.</span>}
    </div>
  );
}

// Voie des étoiles : récompenses de la ou des voies suivies dans l'appli (src/data/starpath.js).
// Pas d'historique des 27 voies passées, choix assumé (cf. feedback_scope_before_scraping).
function StarPathTab() {
  const { state, update } = useStore();
  const [open, setOpen] = useState(STAR_PATHS[0]?.id || null);
  const done = state.starPathRewards;
  const toggle = (key) => update((s) => ({ starPathRewards: { ...s.starPathRewards, [key]: !s.starPathRewards[key] } }));
  const paths = STAR_PATHS.map((sp) => ({ sp, ...starPathProgress(sp, done) }));

  return (
    <div class="stack" style={{ gap: '10px' }}>
      <div class="small muted" style={{ lineHeight: 1.45 }}>
        Récompenses obtenues par Voie des étoiles. Seules les voies suivies dans l'appli apparaissent ici ; les prochaines s'ajouteront d'elles-mêmes.
      </div>
      {paths.map(({ sp, entries, got, pct }) => (
        <GroupCard key={sp.id} title={sp.name} got={got} total={entries.length} isOpen={open === sp.id} onToggleOpen={() => setOpen(open === sp.id ? null : sp.id)}>
          <Checklist items={entries.map((e) => ({ ...e, id: e.key }))} owned={done} onToggle={toggle} labelOf={(e) => e.caption} />
        </GroupCard>
      ))}
      {!paths.length && <div class="empty">Aucune Voie des étoiles suivie pour l'instant.</div>}
    </div>
  );
}

// Souvenirs : page "Memories" du wiki EN, seule source déjà groupée par univers Disney/Pixar
// (voir le commentaire de src/data/memories.js pour l'origine des noms).
function MemoriesTab() {
  const { state, update } = useStore();
  const [open, setOpen] = useState(null);
  const owned = state.memoriesOwned;
  const toggle = (id) => update((s) => ({ memoriesOwned: { ...s.memoriesOwned, [id]: !s.memoriesOwned[id] } }));
  const universes = [...new Set(MEMORIES.map((m) => m.universe))];

  return (
    <div class="stack" style={{ gap: '10px' }}>
      <div class="small muted" style={{ lineHeight: 1.45 }}>
        Souvenirs trouvés dans la Vallée, par univers Disney et Pixar. Coche ceux que tu as déjà trouvés.
      </div>
      {universes.map((u) => {
        const items = MEMORIES.filter((m) => m.universe === u);
        const got = items.filter((m) => owned[m.id]).length;
        return (
          <GroupCard key={u} title={u} got={got} total={items.length} isOpen={open === u} onToggleOpen={() => setOpen(open === u ? null : u)}>
            <Checklist items={items} owned={owned} onToggle={toggle} labelOf={(m) => `${u} #${m.index}`} />
          </GroupCard>
        );
      })}
    </div>
  );
}

// Meubles : 23 vraies catégories du jeu (src/data/furniture.js). Un meuble coché compte dans
// toutes les catégories auxquelles il appartient. Recherche dans la catégorie ouverte, vu le
// nombre de meubles possible (jusqu'à plusieurs centaines pour Décor ou Extérieur).
function FurnitureTab() {
  const { state, update } = useStore();
  const [open, setOpen] = useState(null);
  const [q, setQ] = useState('');
  const owned = state.furnitureOwned;
  const toggle = (id) => update((s) => ({ furnitureOwned: { ...s.furnitureOwned, [id]: !s.furnitureOwned[id] } }));

  const groups = FURNITURE_CATEGORIES
    .map(([id, label]) => ({ id, label, items: FURNITURE.filter((f) => f.cats.includes(id)) }))
    .filter((g) => g.items.length);

  return (
    <div class="stack" style={{ gap: '10px' }}>
      <div class="small muted" style={{ lineHeight: 1.45 }}>
        Meubles débloqués, par catégorie du jeu. Un meuble peut compter dans plusieurs catégories à la fois.
      </div>
      {groups.map((g) => {
        const isOpen = open === g.id;
        const got = g.items.filter((f) => owned[f.id]).length;
        const shown = isOpen && q ? g.items.filter((f) => norm(f.name).includes(norm(q))) : g.items;
        return (
          <GroupCard key={g.id} title={g.label} got={got} total={g.items.length} isOpen={isOpen}
            onToggleOpen={() => { setOpen(isOpen ? null : g.id); setQ(''); }}>
            <Search value={q} onInput={setQ} placeholder={`Chercher dans « ${g.label} »…`} />
            <Checklist items={shown} owned={owned} onToggle={toggle} labelOf={(f) => f.name} />
          </GroupCard>
        );
      })}
    </div>
  );
}

export function Collection() {
  const [tab, setTab] = useState('star');
  return (
    <div class="page">
      <Back href="#/guide" label="Guide" />
      <h1>Collection</h1>
      <Seg label="Type de collection" value={tab} onChange={setTab} options={TABS} />
      {tab === 'star' && <StarPathTab />}
      {tab === 'souv' && <MemoriesTab />}
      {tab === 'meub' && <FurnitureTab />}
    </div>
  );
}
