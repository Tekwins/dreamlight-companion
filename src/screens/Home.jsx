import { useStore } from '../lib/store.js';
import { useNow } from '../lib/router.js';
import { crittersNow, sortCritters, starPathEndDate, starPathProgress } from '../lib/game.js';
import { CROPS } from '../data/resources.js';
import { STAR_PATHS } from '../data/starpath.js';
import { VILLAGERS } from '../data/villagers.js';
import { DAYS, todayKey, formatDuration } from '../lib/time.js';
import { Icon, Thumb } from '../ui.jsx';

const CROP = Object.fromEntries(CROPS.map((c) => [c.id, c]));

export function Home() {
  const { state, session } = useStore();
  const now = useNow();
  const exts = state.extensions;
  const today = todayKey(now);

  const critters = sortCritters(crittersNow(exts, now).filter((c) => c.now));
  const notTamed = critters.filter((c) => !state.tamed[c.v.id]);
  const rare = critters.filter((c) => c.rare && !state.tamed[c.v.id]);
  const featured = (notTamed.length ? notTamed : critters).slice(0, 8);

  const plantings = state.plantings.map((p) => {
    const crop = CROP[p.cropId];
    const ready = p.plantedAt + (crop?.min || 0) * 60000;
    return { ...p, crop, left: Math.max(0, Math.ceil((ready - now.getTime()) / 60000)) };
  });

  const villagers = VILLAGERS.filter((v) => !v.ext || exts[v.ext]);
  const talked = villagers.filter((v) => state.friendship[v.id]?.talked === today).length;
  const sp = state.starPath;
  const spDone = sp.duties.filter((d) => d.done).length;
  const spTodo = sp.duties.filter((d) => !d.done).length;
  const hh = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

  // Voie des étoiles officielle mise en avant : celle qui se termine le plus tôt (encore active).
  const spWithEnd = STAR_PATHS.map((p) => ({ p, end: starPathEndDate(p) }));
  const active = spWithEnd.filter((x) => !x.end || x.end.getTime() > now.getTime());
  active.sort((a, b) => (a.end?.getTime() ?? Infinity) - (b.end?.getTime() ?? Infinity));
  const primary = (active[0] || spWithEnd[0])?.p;
  const primaryEnd = primary ? starPathEndDate(primary) : null;
  const primaryDaysLeft = primaryEnd ? Math.max(0, Math.ceil((primaryEnd.getTime() - now.getTime()) / 86400000)) : null;
  const primaryProgress = primary ? starPathProgress(primary, state.starPathRewards) : null;

  return (
    <div class="page wide">
      <header class="between">
        <div class="stack" style={{ gap: '2px' }}>
          <div class="small muted" style={{ fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {DAYS[now.getDay()]} · {hh}
          </div>
          <h1>Ta journée dans la Vallée</h1>
        </div>
        <div class="row" style={{ gap: '8px' }}>
          <a class="icon-btn" href="#/recherche" aria-label="Recherche"><Icon name="search" /></a>
          <a class="icon-btn" href="#/reglages" aria-label="Réglages"><Icon name="gear" /></a>
        </div>
      </header>

      {!session && (
        <a class="banner" href="#/reglages">
          <Icon name="sync" />
          <span style={{ flex: 1, color: 'var(--text)', fontSize: '14px' }}>
            <strong>Connecte-toi</strong> pour retrouver ta progression sur tous tes appareils.
          </span>
          <Icon name="chevron" size={18} />
        </a>
      )}

      <div class="home-grid">
        <div class="stack" style={{ gap: '18px' }}>
          <section class="stack">
            <div class="between">
              <h2>Disponibles maintenant</h2>
              <a href="#/animaux" style={{ fontWeight: 800, fontSize: '14px', padding: '8px 0' }}>Tout voir ({critters.length})</a>
            </div>
            {/* Pas de débordement plein cadre ici : .home-grid est à 2 colonnes sur grand écran,
                le débordement standard de .chips chevaucherait alors la colonne voisine. */}
            <div class="chips" style={{ gap: '12px', margin: 0, padding: 0 }}>
              {featured.map(({ v, rare: r, av }) => (
                <a key={v.id} href={`#/animaux/${v.id}`} class="stack" style={{ alignItems: 'center', width: '78px', flex: 'none', gap: '5px', color: 'var(--text)' }}>
                  <Thumb file={v.file + '.png'} name={v.name} round ring={r ? 'var(--accent)' : av.urgent ? 'var(--warn)' : null} />
                  <span style={{ fontSize: '12px', fontWeight: 800, textAlign: 'center', lineHeight: 1.2 }}>{v.name}</span>
                  {r && <span class="tag rare">RARE</span>}
                  {!r && av.urgent && <span class="tag warn">{av.text.replace('Encore ', '')}</span>}
                </a>
              ))}
              {!featured.length && <span class="muted">Aucun animal pour le moment.</span>}
            </div>
          </section>

          {primary && (
            <a href="#/collection" class="card stack" style={{ gap: '10px', background: 'var(--accent)', color: 'var(--accent-text)' }}>
              <div class="between">
                <div class="stack" style={{ gap: '2px' }}>
                  <span class="small" style={{ fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.75 }}>Voie des étoiles</span>
                  <strong style={{ fontSize: '18px' }}>{primary.name}</strong>
                </div>
                {primaryDaysLeft != null && <span style={{ fontWeight: 900, fontSize: '15px', whiteSpace: 'nowrap' }}>J-{primaryDaysLeft}</span>}
              </div>
              <div class="bar" style={{ background: 'rgba(0,0,0,.2)' }}><div style={{ width: `${primaryProgress.pct}%`, background: 'var(--accent-text)' }} /></div>
              <div class="between small" style={{ fontWeight: 800 }}>
                <span>Palier {primaryProgress.tier} sur {primaryProgress.tierCount}</span>
                <span>{spTodo ? `${spTodo} devoir${spTodo > 1 ? 's' : ''} à faire` : 'Devoirs à jour'}</span>
              </div>
            </a>
          )}

          <div class="tiles">
            <a class="tile" href="#/animaux"><span class="ico" style={{ background: 'var(--teal)' }}><Icon name="paw" /></span><strong>Animaux</strong></a>
            <a class="tile" href="#/recettes"><span class="ico" style={{ background: '#F5C95C' }}><Icon name="pot" /></span><strong>Recettes</strong></a>
            <a class="tile" href="#/potager"><span class="ico" style={{ background: '#9BD77A' }}><Icon name="sprout" /></span><strong>Potager</strong></a>
            <a class="tile" href="#/amitie"><span class="ico" style={{ background: '#F49AC1' }}><Icon name="heart" /></span><strong>Amitié</strong></a>
          </div>
        </div>

        <div class="stack" style={{ gap: '18px' }}>
          <section class="stack">
            <h2>À faire aujourd'hui</h2>
            <div class="card list-rows" style={{ padding: '2px 16px' }}>
              <a class="list-row" href="#/amitie" style={{ color: 'var(--text)' }}>
                <Icon name="heart" />
                <span style={{ flex: 1 }}>Parler aux habitants</span>
                <span class="muted" style={{ fontWeight: 800 }}>{talked}/{villagers.length}</span>
              </a>
              {rare.slice(0, 3).map(({ v }) => (
                <a key={v.id} class="list-row" href={`#/animaux/${v.id}`} style={{ color: 'var(--text)' }}>
                  <Icon name="paw" />
                  <span style={{ flex: 1 }}>Nourrir : {v.name}</span>
                  <span class="tag rare">Rare</span>
                </a>
              ))}
              <a class="list-row" href="#/guide" style={{ color: 'var(--text)' }}>
                <Icon name="star" />
                <span style={{ flex: 1 }}>Devoirs de la Voie des étoiles</span>
                <span class="muted" style={{ fontWeight: 800 }}>{sp.duties.length ? `${spDone}/${sp.duties.length}` : 'à saisir'}</span>
              </a>
            </div>
          </section>

          <section class="stack">
            <div class="between">
              <h2>Mes plantations</h2>
              <a href="#/potager" style={{ fontWeight: 800, fontSize: '14px', padding: '8px 0' }}>Potager</a>
            </div>
            <div class="card list-rows" style={{ padding: '2px 16px' }}>
              {plantings.length ? plantings.map((p) => (
                <div key={p.id} class="list-row">
                  <Icon name="sprout" />
                  <span style={{ flex: 1, fontWeight: 800 }}>{p.crop?.name || 'Culture'} ×{p.qty}</span>
                  {p.left === 0
                    ? <span class="tag">À récolter</span>
                    : <span class="muted" style={{ fontWeight: 700 }}>prêtes dans {formatDuration(p.left)}</span>}
                </div>
              )) : <div class="list-row muted">Aucune plantation en cours.</div>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
