import { useState } from 'preact/hooks';
import { useStore } from '../lib/store.js';
import { newId } from '../lib/game.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { STAR_PATHS } from '../data/starpath.js';
import { QUESTS } from '../data/quests.js';
import { Icon, Seg, Search, Thumb, norm } from '../ui.jsx';

export function Guide() {
  const [tab, setTab] = useState('star');
  return (
    <div class="page">
      <h1>Guide</h1>
      <Seg label="Section du guide" value={tab} onChange={setTab} options={[['quests', 'Quêtes'], ['star', 'Voie des étoiles'], ['ach', 'Succès']]} />
      {tab === 'star' && <StarPath />}
      {tab === 'ach' && <Achievements />}
      {tab === 'quests' && <Quests />}
    </div>
  );
}

// Succès du jeu (trophées/accomplissements), avec suivi personnel « obtenu ».
function Achievements() {
  const { state, update } = useStore();
  const got = state.achievements;
  const count = ACHIEVEMENTS.filter((a) => got[a.id]).length;
  const toggle = (id) => update((s) => ({ achievements: { ...s.achievements, [id]: !s.achievements[id] } }));

  return (
    <div class="stack" style={{ gap: '14px' }}>
      <div class="between">
        <h2>Succès</h2>
        <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{count} / {ACHIEVEMENTS.length} obtenus</span>
      </div>
      <div class="card list-rows" style={{ padding: '2px 16px' }}>
        {ACHIEVEMENTS.map((a) => (
          <div key={a.id} class="list-row">
            <input type="checkbox" checked={!!got[a.id]} aria-label={a.name} style={{ width: '22px', height: '22px', accentColor: 'var(--accent)', flex: 'none' }}
              onChange={() => toggle(a.id)} />
            <div class="stack" style={{ flex: 1, gap: '2px' }}>
              <span style={{ fontWeight: 800, fontSize: '15px', textDecoration: got[a.id] ? 'line-through' : 'none' }}>{a.name}</span>
              <span class="small muted">{a.action}</span>
            </div>
            <div class="stack" style={{ gap: '2px', alignItems: 'flex-end' }}>
              {a.rewards.xbox !== '-' && <span class="small muted" style={{ whiteSpace: 'nowrap' }}>Xbox : {a.rewards.xbox}</span>}
              {a.rewards.ps !== '-' && <span class="small muted" style={{ whiteSpace: 'nowrap' }}>PS : {a.rewards.ps}</span>}
              {a.rewards.steam !== '-' && <span class="small muted" style={{ whiteSpace: 'nowrap' }}>Steam : {a.rewards.steam}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Liste des quêtes (noms seulement pour l'instant) avec case à cocher et recherche.
function Quests() {
  const { state, update } = useStore();
  const done = state.quests;
  const [q, setQ] = useState('');
  const count = QUESTS.filter((x) => done[x.id]).length;
  const toggle = (id) => update((s) => ({ quests: { ...s.quests, [id]: !s.quests[id] } }));
  const list = q ? QUESTS.filter((x) => norm(x.name).includes(norm(q))) : QUESTS;

  return (
    <div class="stack" style={{ gap: '14px' }}>
      <div class="between">
        <h2>Quêtes</h2>
        <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{count} / {QUESTS.length} faites</span>
      </div>
      <Search value={q} onInput={setQ} placeholder="Chercher une quête…" />
      <div class="small muted">Liste des noms seulement : les récompenses et étapes de chaque quête arriveront plus tard.</div>
      <div class="card list-rows" style={{ padding: '2px 16px', maxHeight: '560px', overflowY: 'auto' }}>
        {list.map((x) => (
          <div key={x.id} class="list-row">
            <input type="checkbox" checked={!!done[x.id]} aria-label={x.name} style={{ width: '20px', height: '20px', accentColor: 'var(--accent)', flex: 'none' }}
              onChange={() => toggle(x.id)} />
            <span style={{ flex: 1, fontWeight: 700, textDecoration: done[x.id] ? 'line-through' : 'none' }}>{x.name}</span>
          </div>
        ))}
        {!list.length && <div class="list-row muted">Aucune quête ne correspond.</div>}
      </div>
    </div>
  );
}

function StarPath() {
  const { state, update } = useStore();
  const sp = state.starPath;
  const [label, setLabel] = useState('');
  const [tokens, setTokens] = useState('');
  const set = (patch) => update((s) => ({ starPath: { ...s.starPath, ...patch } }));
  const daysLeft = sp.end ? Math.ceil((new Date(sp.end + 'T23:59:59') - new Date()) / 86400000) : null;

  const add = (e) => {
    e.preventDefault();
    if (!label.trim()) return;
    set({ duties: [...sp.duties, { id: newId(), label: label.trim(), tokens: Number(tokens) || 0, done: false }] });
    setLabel(''); setTokens('');
  };
  const earned = sp.duties.filter((d) => d.done).reduce((n, d) => n + d.tokens, 0);

  return (
    <div class="stack" style={{ gap: '16px' }}>
      <CurrentStarPaths />

      <div class="card stack" style={{ gap: '12px' }}>
        <h2 style={{ fontSize: '16px' }}>Mes devoirs</h2>
        <label class="field">Voie des étoiles en cours
          <input value={sp.name} placeholder="Nom de la Voie" onInput={(e) => set({ name: e.currentTarget.value })} />
        </label>
        <label class="field">Date de fin
          <input type="date" value={sp.end} onInput={(e) => set({ end: e.currentTarget.value })} />
        </label>
        {daysLeft != null && (
          <div class="between">
            <span style={{ fontWeight: 800, color: daysLeft <= 3 ? 'var(--warn)' : 'var(--teal)' }}>
              {daysLeft > 0 ? `Encore ${daysLeft} jour${daysLeft > 1 ? 's' : ''}` : 'Terminée'}
            </span>
            <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{earned} jetons cochés</span>
          </div>
        )}
      </div>

      <section class="stack">
        <h2>Devoirs</h2>
        <form class="row" onSubmit={add}>
          <label class="search" style={{ flex: 1 }}>
            <span class="sr">Nouveau devoir</span>
            <input value={label} onInput={(e) => setLabel(e.currentTarget.value)} placeholder="Ex. : Attraper 10 poissons" />
          </label>
          <label class="search" style={{ width: '90px' }}>
            <span class="sr">Jetons</span>
            <input type="number" min="0" value={tokens} onInput={(e) => setTokens(e.currentTarget.value)} placeholder="Jetons" />
          </label>
          <button class="btn" type="submit" aria-label="Ajouter le devoir"><Icon name="plus" /></button>
        </form>
        <div class="card list-rows" style={{ padding: '2px 14px' }}>
          {sp.duties.map((d) => (
            <div key={d.id} class="list-row">
              <input type="checkbox" checked={d.done} aria-label={d.label} style={{ width: '22px', height: '22px', accentColor: 'var(--accent)' }}
                onChange={() => set({ duties: sp.duties.map((x) => (x.id === d.id ? { ...x, done: !x.done } : x)) })} />
              <span style={{ flex: 1, fontWeight: 700, textDecoration: d.done ? 'line-through' : 'none' }}>{d.label}</span>
              {d.tokens > 0 && <span style={{ fontWeight: 800, color: 'var(--accent)' }}>+{d.tokens}</span>}
              <button class="icon-btn" style={{ width: '36px', height: '36px', background: 'transparent' }} aria-label={`Supprimer ${d.label}`}
                onClick={() => set({ duties: sp.duties.filter((x) => x.id !== d.id) })}><Icon name="x" size={18} /></button>
            </div>
          ))}
          {!sp.duties.length && <div class="list-row muted">Ajoute les devoirs affichés dans le jeu pour les suivre ici.</div>}
        </div>
        {sp.duties.some((d) => d.done) && (
          <button class="btn ghost" onClick={() => set({ duties: sp.duties.filter((d) => !d.done) })}>Retirer les devoirs terminés</button>
        )}
      </section>
    </div>
  );
}

// Voie(s) des étoiles officiellement en cours (nom, dates, paliers de récompenses) : lecture seule.
function CurrentStarPaths() {
  return (
    <div class="stack" style={{ gap: '14px' }}>
      {STAR_PATHS.map((p) => (
        <div key={p.id} class="card stack" style={{ gap: '10px' }}>
          <div class="between wrap">
            <strong style={{ fontSize: '17px' }}>{p.name}</strong>
            <span class="small muted" style={{ fontWeight: 700 }}>{p.dates}</span>
          </div>
          {p.description && <span class="small muted" style={{ lineHeight: 1.45 }}>{p.description}</span>}
          {p.tiers.map((t) => (
            <div key={t.tier} class="stack" style={{ gap: '6px' }}>
              <span class="small" style={{ fontWeight: 900, color: 'var(--accent)' }}>Palier {t.tier}</span>
              <div class="row wrap" style={{ gap: '8px' }}>
                {t.rewards.map((r, i) => (
                  <div key={i} class="stack" style={{ alignItems: 'center', gap: '2px', width: '74px' }}>
                    <Thumb file={r.file} name={r.caption} />
                    <span class="small muted" style={{ textAlign: 'center', fontSize: '10px', lineHeight: 1.2 }}>{r.caption}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
