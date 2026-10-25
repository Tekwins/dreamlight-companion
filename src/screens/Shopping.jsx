import { useState } from 'preact/hooks';
import { useStore } from '../lib/store.js';
import { newId } from '../lib/game.js';
import { Back, Icon } from '../ui.jsx';

const GROUPS = [
  ['graines', 'Graines à acheter', 'var(--green)'],
  ['cueillette', 'À cueillir', 'var(--pink)'],
  ['peche', 'À pêcher', '#7DB4F5'],
  ['mines', 'À miner', '#C3B6F7'],
  ['autre', 'Autres', 'var(--muted)']
];

export function Shopping() {
  const { state, update } = useStore();
  const [name, setName] = useState('');
  const items = state.shopping;
  const done = items.filter((i) => i.done).length;

  const toggle = (id) => update((s) => ({ shopping: s.shopping.map((i) => (i.id === id ? { ...i, done: !i.done } : i)) }));
  const remove = (id) => update((s) => ({ shopping: s.shopping.filter((i) => i.id !== id) }));
  const add = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    update((s) => ({ shopping: [...s.shopping, { id: newId(), name: name.trim(), qty: 1, kind: 'autre', where: '', for: '', done: false }] }));
    setName('');
  };

  return (
    <div class="page">
      <Back href="#/recettes" label="Recettes" />
      <div class="between">
        <h1>Liste de courses</h1>
        <span style={{ fontWeight: 800, color: 'var(--teal)' }}>{done} / {items.length}</span>
      </div>
      <form class="row" onSubmit={add}>
        <label class="search" style={{ flex: 1 }}>
          <span class="sr">Ajouter un objet</span>
          <input value={name} onInput={(e) => setName(e.currentTarget.value)} placeholder="Ajouter un objet…" />
        </label>
        <button class="btn" type="submit" aria-label="Ajouter"><Icon name="plus" /></button>
      </form>

      {GROUPS.map(([kind, title, color]) => {
        const list = items.filter((i) => (i.kind || 'autre') === kind);
        if (!list.length) return null;
        return (
          <section key={kind} class="stack">
            <span class="small" style={{ fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color }}>{title}</span>
            <div class="card list-rows" style={{ padding: '2px 14px' }}>
              {list.map((i) => (
                <div key={i.id} class="list-row">
                  <button class="icon-btn" aria-pressed={i.done} aria-label={i.done ? 'Décocher' : 'Cocher'} onClick={() => toggle(i.id)}
                    style={{ width: '32px', height: '32px', borderRadius: '9px', background: i.done ? 'var(--teal)' : 'transparent', border: i.done ? '0' : '2px solid var(--line)', color: '#14123a' }}>
                    {i.done && <Icon name="check" size={18} />}
                  </button>
                  <div class="stack" style={{ gap: '2px', flex: 1 }}>
                    <span style={{ fontWeight: 800, textDecoration: i.done ? 'line-through' : 'none', color: i.done ? 'var(--muted)' : 'var(--text)' }}>
                      {i.name} {i.qty > 1 && <span class="muted">×{i.qty}</span>}
                    </span>
                    {(i.where || i.for) && <span class="small muted">{[i.where, i.for && `pour ${i.for}`].filter(Boolean).join(' · ')}</span>}
                  </div>
                  <button class="icon-btn" style={{ width: '36px', height: '36px', background: 'transparent' }} aria-label={`Retirer ${i.name}`} onClick={() => remove(i.id)}>
                    <Icon name="x" size={18} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })}
      {!items.length && <div class="empty">Ta liste est vide. Ajoute des objets depuis une recette, la pêche, la cueillette ou les mines.</div>}
      {done > 0 && <button class="btn" onClick={() => update((s) => ({ shopping: s.shopping.filter((i) => !i.done) }))}>Retirer les {done} cochés</button>}
    </div>
  );
}
