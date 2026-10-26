import { useState } from 'preact/hooks';
import { useStore } from '../lib/store.js';
import { newId } from '../lib/game.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { STAR_PATHS } from '../data/starpath.js';
import { QUESTS } from '../data/quests.js';
import { VILLAGERS } from '../data/villagers.js';
import { Icon, Seg, Search, Thumb, norm } from '../ui.jsx';

const VILLAGER = Object.fromEntries(VILLAGERS.map((v) => [v.id, v]));
const KIND_LABEL = { story: 'Quêtes principales', other: 'Autres quêtes' };

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

// Quêtes regroupées : principales, puis d'amitié par habitant (avec son portrait), puis autres
// (royaume, quotidiennes, événements…). Repliées par défaut ; un clic déplie description/étapes/récompense.
function Quests() {
  const { state, update } = useStore();
  const done = state.quests;
  const [q, setQ] = useState('');
  const [open, setOpen] = useState({});
  const toggle = (id) => update((s) => ({ quests: { ...s.quests, [id]: !s.quests[id] } }));
  const toggleOpen = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));
  // Quêtes d'une extension désactivée (principales, d'amitié ou autres) : masquées, comme le reste de l'appli.
  const visible = QUESTS.filter((x) => !x.ext || state.extensions[x.ext]);
  const count = visible.filter((x) => done[x.id]).length;
  const list = q
    ? visible.filter((x) => norm(`${x.name} ${x.villagerName || ''}`).includes(norm(q)))
    : visible;

  const story = list.filter((x) => x.kind === 'story');
  const other = list.filter((x) => x.kind === 'other');
  const friendship = list.filter((x) => x.kind === 'friendship');
  const villagerIds = [...new Set(friendship.map((x) => x.villagerId))]
    .sort((a, b) => (VILLAGER[a]?.name || '').localeCompare(VILLAGER[b]?.name || '', 'fr'));

  const Row = (x) => {
    const hasDetail = !!(x.description || x.steps?.length || x.rewards);
    const isOpen = hasDetail && open[x.id];
    return (
      <div key={x.id} class="stack" style={{ gap: 0 }}>
        <div class="list-row">
          <input type="checkbox" checked={!!done[x.id]} aria-label={x.name} style={{ width: '20px', height: '20px', accentColor: 'var(--accent)', flex: 'none' }}
            onChange={() => toggle(x.id)} />
          <button type="button" onClick={() => hasDetail && toggleOpen(x.id)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', padding: 0, textAlign: 'left', font: 'inherit', color: 'inherit', cursor: hasDetail ? 'pointer' : 'default' }}>
            <span style={{ flex: 1, fontWeight: 700, textDecoration: done[x.id] ? 'line-through' : 'none' }}>{x.name}</span>
            {hasDetail && (
              <Icon name="chevron" size={16} style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s', color: 'var(--muted)', flex: 'none' }} />
            )}
          </button>
        </div>
        {isOpen && <QuestDetail x={x} />}
      </div>
    );
  };

  return (
    <div class="stack" style={{ gap: '14px' }}>
      <div class="between">
        <h2>Quêtes</h2>
        <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{count} / {visible.length} faites</span>
      </div>
      <Search value={q} onInput={setQ} placeholder="Chercher une quête ou un habitant…" />
      {!list.length && <div class="empty">Aucune quête ne correspond.</div>}

      {!!story.length && (
        <section class="stack">
          <h2>{KIND_LABEL.story}</h2>
          <div class="card list-rows" style={{ padding: '2px 16px' }}>{story.map(Row)}</div>
        </section>
      )}

      {!!villagerIds.length && (
        <section class="stack">
          <h2>Quêtes d'habitant</h2>
          <div class="stack" style={{ gap: '10px' }}>
            {villagerIds.map((vid) => {
              const v = VILLAGER[vid];
              const vQuests = friendship.filter((x) => x.villagerId === vid);
              return (
                <div key={vid} class="stack" style={{ gap: '4px' }}>
                  <div class="row" style={{ gap: '8px' }}>
                    <Thumb file={v?.file} name={v?.name || '?'} round />
                    <strong>{v?.name || vid}</strong>
                  </div>
                  <div class="card list-rows" style={{ padding: '2px 16px' }}>{vQuests.map(Row)}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {!!other.length && (
        <section class="stack">
          <h2>{KIND_LABEL.other}</h2>
          <div class="card list-rows" style={{ padding: '2px 16px' }}>{other.map(Row)}</div>
        </section>
      )}
    </div>
  );
}

// Détail déplié d'une quête : résumé, étapes (avec leurs détails) et récompense.
function QuestDetail({ x }) {
  return (
    <div class="stack" style={{ gap: '10px', padding: '2px 0 16px 32px' }}>
      {x.description && <p class="small muted" style={{ margin: 0, lineHeight: 1.5 }}>{x.description}</p>}
      {!!x.steps?.length && (
        <ol class="stack" style={{ gap: '6px', margin: 0, paddingLeft: '18px' }}>
          {x.steps.map((s, i) => (
            <li key={i} style={{ fontSize: '14px', lineHeight: 1.4 }}>
              {s.text}
              {!!s.subs.length && (
                <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
                  {s.subs.map((sub, j) => (
                    <li key={j} class="small muted" style={{ lineHeight: 1.4 }}>{sub}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      )}
      {x.rewards && <span class="small" style={{ fontWeight: 800, color: 'var(--accent)' }}>Récompense : {x.rewards}</span>}
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
      <a href="#/collection" class="btn ghost" style={{ alignSelf: 'flex-start' }}>
        <Icon name="star" size={18} />Voir ma Collection
      </a>
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
