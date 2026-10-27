import { useState } from 'preact/hooks';
import { useStore } from '../lib/store.js';
import { useDesktop } from '../lib/router.js';
import { VILLAGERS } from '../data/villagers.js';
import { todayKey } from '../lib/time.js';
import { Icon, Thumb, Seg, Back, ExtTag, GroupTitle } from '../ui.jsx';

const VILLAGER = Object.fromEntries(VILLAGERS.map((v) => [v.id, v]));

// Rôles du jeu (Jardinage/Pêche/Cueillette/Extraction minière/Excavation/Chasse aux anigamis,
// assignables à un habitant à partir du niveau d'amitié 2, via un manuel d'entraînement) : l'app
// ne calcule pas encore les bonus associés, mais retient ici lequel est assigné à qui, pour s'y
// retrouver. (La Table de courbage temporel, niche et liée au Rift, n'est pas encore incluse.)
const JOBS = [
  ['jardinage', 'Jardinage', 'sprout'],
  ['peche', 'Pêche', 'fish'],
  ['cueillette', 'Cueillette', 'basket'],
  ['extraction', 'Extraction minière', 'gem'],
  ['excavation', 'Excavation', 'shovel'],
  ['anigamis', 'Chasse aux anigamis', 'paw']
];
const JOB = Object.fromEntries(JOBS.map(([id, label, icon]) => [id, { label, icon }]));

export function Friends({ selectedId }) {
  const { state, update } = useStore();
  const desktop = useDesktop();
  const today = todayKey();
  const [group, setGroup] = useState('default');

  const selected = selectedId ? VILLAGER[selectedId] : null;
  if (selected && !desktop) return <div class="page"><FriendDetail v={selected} /></div>;

  const list = VILLAGERS.filter((v) => !v.ext || state.extensions[v.ext]).map((v) => {
    const f = state.friendship[v.id] || { level: 0, talked: null };
    return { ...v, level: f.level ?? 0, talked: f.talked === today, job: state.villagerJobs?.[v.id] || null };
  });

  const set = (id, patch) => update((s) => ({
    friendship: { ...s.friendship, [id]: { level: 0, ...(s.friendship[id] || {}), ...patch } }
  }));

  const talkedCount = list.filter((v) => v.talked).length;
  const best = list.filter((v) => v.level >= 10).length;
  // Trié par nom seulement : cocher la discussion du jour ne doit pas faire sauter la carte
  // ailleurs dans la liste (repère visuel sur place plutôt qu'un classement qui bouge).
  const byName = (a, b) => a.name.localeCompare(b.name, 'fr');

  let sections;
  if (group === 'universe') {
    const universes = [...new Set(list.map((v) => v.universe || 'Autres'))]
      .sort((a, b) => (a === 'Autres' ? 1 : b === 'Autres' ? -1 : a.localeCompare(b, 'fr')));
    sections = universes.map((u) => ({ key: u, title: u, items: list.filter((v) => (v.universe || 'Autres') === u).sort(byName) }));
  } else {
    sections = [{ key: 'all', title: null, items: list.slice().sort(byName) }];
  }

  const FriendCard = (v) => {
    const job = v.job && JOB[v.job]; // ignore un ancien identifiant de métier qui n'existerait plus
    return (
      <div key={v.id} class="item" style={{ alignItems: 'center' }}>
        <a href={`#/amitie/${v.id}`} aria-label={`Voir la fiche de ${v.name}`} style={{ position: 'relative', flex: 'none' }}>
          <Thumb file={v.file} name={v.name} round ring={v.level >= 10 ? 'var(--pink)' : 'var(--teal)'} />
          {job && (
            <span title={job.label} style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent)', color: 'var(--accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={job.icon} size={12} />
            </span>
          )}
        </a>
        <div class="body">
          <div class="between">
            <a href={`#/amitie/${v.id}`} class="name" style={{ flex: '1 1 auto', minWidth: 0, color: 'var(--text)' }}>{v.name}</a>
            <span class="row" style={{ gap: '4px', flex: 'none' }}>
              <button class="icon-btn" style={{ width: '32px', height: '32px' }} aria-label={`Baisser le niveau de ${v.name}`} onClick={() => set(v.id, { level: Math.max(0, v.level - 1) })}>−</button>
              <span style={{ fontWeight: 900, minWidth: '72px', textAlign: 'center', color: v.level >= 10 ? 'var(--pink)' : v.level === 0 ? 'var(--muted)' : 'var(--teal)' }}>
                {v.level === 0 ? 'Non rencontré' : `Niv. ${v.level}`}
              </span>
              <button class="icon-btn" style={{ width: '32px', height: '32px' }} aria-label={`Monter le niveau de ${v.name}`} onClick={() => set(v.id, { level: Math.min(10, v.level + 1) })}>+</button>
            </span>
          </div>
          <div class="bar"><div style={{ width: `${v.level * 10}%`, background: v.level >= 10 ? 'var(--pink)' : 'var(--teal)' }} /></div>
        </div>
        <button class={'icon-btn' + (v.talked ? ' on' : '')} aria-pressed={v.talked} aria-label={v.talked ? `Discussion faite avec ${v.name}` : `Marquer la discussion avec ${v.name}`}
          style={v.talked ? { border: '2px solid var(--teal)', color: 'var(--teal)' } : {}}
          onClick={() => set(v.id, { talked: v.talked ? null : today })}>
          <Icon name="heart" fill={v.talked ? 'currentColor' : 'none'} />
        </button>
      </div>
    );
  };

  const listView = (
    <div class="stack" style={{ gap: '16px' }}>
      {sections.map((s) => (
        <section key={s.key} class="stack">
          {s.title && <GroupTitle title={s.title} count={`${s.items.length}`} />}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))', gap: '8px' }}>
            {s.items.map(FriendCard)}
          </div>
        </section>
      ))}
    </div>
  );

  return (
    <div class="page wide">
      <h1>Amitié</h1>
      <div class="grid-2">
        <div class="card"><div class="big-num" style={{ fontSize: '24px' }}>{talkedCount} / {list.length}</div><div class="small muted" style={{ fontWeight: 700 }}>parlés aujourd'hui</div></div>
        <div class="card"><div class="big-num" style={{ fontSize: '24px', color: 'var(--pink)' }}>{best}</div><div class="small muted" style={{ fontWeight: 700 }}>meilleurs amis (niv. 10)</div></div>
      </div>
      <div class="small muted" style={{ lineHeight: 1.45 }}>
        Discussion du jour : +500 d'amitié. Cadeau favori du jour : +1 500 en plus de sa valeur (les 3 favoris changent chaque jour, à voir dans Collection › Personnages du jeu).
      </div>
      <Seg small label="Classer" value={group} onChange={setGroup} options={[['default', 'Par défaut'], ['universe', 'Par univers Disney']]} />

      {desktop ? (
        <div class="split">
          {listView}
          <div class="detail">{selected ? <FriendDetail v={selected} embedded /> : <div class="empty">Choisis un habitant pour voir sa fiche.</div>}</div>
        </div>
      ) : listView}
    </div>
  );
}

function FriendDetail({ v, embedded }) {
  const { state, update } = useStore();
  const today = todayKey();
  const f = state.friendship[v.id] || { level: 0, talked: null };
  const level = f.level ?? 0;
  const talked = f.talked === today;
  const job = state.villagerJobs?.[v.id] || null;

  const set = (patch) => update((s) => ({ friendship: { ...s.friendship, [v.id]: { level: 0, ...(s.friendship[v.id] || {}), ...patch } } }));
  const setJob = (id) => update((s) => ({ villagerJobs: { ...s.villagerJobs, [v.id]: job === id ? null : id } }));

  return (
    <div class="stack" style={{ gap: '18px' }}>
      {!embedded && <Back href="#/amitie" label="Amitié" />}
      <div class="row" style={{ gap: '16px' }}>
        <Thumb file={v.file} name={v.name} round lg ring={level >= 10 ? 'var(--pink)' : 'var(--teal)'} />
        <div class="stack" style={{ gap: '6px', flex: 1 }}>
          <h1 style={{ fontSize: '26px' }}>{v.name}</h1>
          <div class="row wrap" style={{ gap: '6px' }}>
            {v.universe && <span class="pill">{v.universe}</span>}
            <ExtTag ext={v.ext} />
          </div>
        </div>
      </div>

      <section class="card stack" style={{ gap: '12px' }}>
        <div class="between">
          <h2>Amitié</h2>
          <span style={{ fontWeight: 900, color: level >= 10 ? 'var(--pink)' : 'var(--teal)' }}>{level === 0 ? 'Non rencontré' : `Niveau ${level}`}</span>
        </div>
        <div class="bar"><div style={{ width: `${level * 10}%`, background: level >= 10 ? 'var(--pink)' : 'var(--teal)' }} /></div>
        <div class="grid-2">
          <button class="btn ghost" onClick={() => set({ level: Math.max(0, level - 1) })}>− Niveau</button>
          <button class="btn ghost" onClick={() => set({ level: Math.min(10, level + 1) })}>+ Niveau</button>
        </div>
        <button class={'btn' + (talked ? ' ok' : '')} onClick={() => set({ talked: talked ? null : today })}>
          {talked ? <><Icon name="check" size={18} />Discussion faite aujourd'hui</> : 'Marquer la discussion du jour'}
        </button>
      </section>

      <section class="stack">
        <h2>Rôle</h2>
        <div class="small muted">Celui que tu lui as attribué en jeu (dès le niveau 2, avec un manuel d'entraînement). L'appli ne calcule pas encore les bonus, juste un repère pour s'y retrouver.</div>
        <div class="chips" style={{ margin: 0, padding: 0 }}>
          {JOBS.map(([id, label, icon]) => (
            <button key={id} class={'chip' + (job === id ? ' on' : '')} aria-pressed={job === id} onClick={() => setJob(id)}>
              <Icon name={icon} size={16} />{label}
            </button>
          ))}
        </div>
      </section>

      {!!v.rewards.length && (
        <section class="stack">
          <h2>Récompenses d'amitié</h2>
          <div class="card list-rows" style={{ padding: '2px 16px' }}>
            {v.rewards.map((r) => {
              const unlocked = level >= r.level;
              return (
                <div key={r.level} class="list-row">
                  <span class="tag" style={{ flex: 'none', background: unlocked ? 'var(--teal)' : 'var(--line)', color: unlocked ? '#14123A' : 'var(--muted)' }}>Niv. {r.level}</span>
                  <div class="stack" style={{ gap: '2px', flex: 1 }}>
                    <span style={{ fontWeight: 800, opacity: unlocked ? 1 : 0.6 }}>{r.name}</span>
                    <span class="small muted">{r.type}</span>
                  </div>
                  {unlocked && <Icon name="check" size={18} style={{ color: 'var(--teal)', flex: 'none' }} />}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
