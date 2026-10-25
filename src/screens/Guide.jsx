import { useState } from 'preact/hooks';
import { useStore } from '../lib/store.js';
import { newId } from '../lib/game.js';
import { Icon, Seg } from '../ui.jsx';

export function Guide() {
  const [tab, setTab] = useState('star');
  return (
    <div class="page">
      <h1>Guide</h1>
      <Seg label="Section du guide" value={tab} onChange={setTab} options={[['quests', 'Quêtes'], ['star', 'Voie des étoiles'], ['ach', 'Succès']]} />
      {tab === 'star' && <StarPath />}
      {tab !== 'star' && (
        <div class="card empty">
          {tab === 'quests' ? 'Les quêtes' : 'Les succès'} arriveront avec le script de données des wikis, classés par personnage et avec l'étape suivante en premier.
        </div>
      )}
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
      <div class="card stack" style={{ gap: '12px' }}>
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
