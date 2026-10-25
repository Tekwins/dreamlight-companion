import { useStore } from '../lib/store.js';
import { VILLAGERS } from '../data/villagers.js';
import { todayKey } from '../lib/time.js';
import { Icon, Thumb } from '../ui.jsx';

export function Friends() {
  const { state, update } = useStore();
  const today = todayKey();
  const list = VILLAGERS.filter((v) => !v.ext || state.extensions[v.ext]).map((v) => {
    const f = state.friendship[v.id] || { level: 1, talked: null };
    return { ...v, level: f.level ?? 1, talked: f.talked === today };
  }).sort((a, b) => (a.talked - b.talked) || a.name.localeCompare(b.name, 'fr'));

  const set = (id, patch) => update((s) => ({
    friendship: { ...s.friendship, [id]: { level: 1, ...(s.friendship[id] || {}), ...patch } }
  }));

  const talkedCount = list.filter((v) => v.talked).length;
  const best = list.filter((v) => v.level >= 10).length;

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))', gap: '8px' }}>
        {list.map((v) => (
          <div key={v.id} class="item" style={{ alignItems: 'center' }}>
            <Thumb name={v.name} round ring={v.level >= 10 ? 'var(--pink)' : 'var(--teal)'} />
            <div class="body">
              <div class="between">
                <span class="name">{v.name}</span>
                <span class="row" style={{ gap: '4px' }}>
                  <button class="icon-btn" style={{ width: '32px', height: '32px' }} aria-label={`Baisser le niveau de ${v.name}`} onClick={() => set(v.id, { level: Math.max(1, v.level - 1) })}>−</button>
                  <span style={{ fontWeight: 900, minWidth: '52px', textAlign: 'center', color: v.level >= 10 ? 'var(--pink)' : 'var(--teal)' }}>Niv. {v.level}</span>
                  <button class="icon-btn" style={{ width: '32px', height: '32px' }} aria-label={`Monter le niveau de ${v.name}`} onClick={() => set(v.id, { level: Math.min(10, v.level + 1) })}>+</button>
                </span>
              </div>
              <div class="bar"><div style={{ width: `${v.level * 10}%`, background: v.level >= 10 ? 'var(--pink)' : 'var(--teal)' }} /></div>
            </div>
            <button class={'icon-btn' + (v.talked ? ' on' : '')} aria-pressed={v.talked} aria-label={v.talked ? `Discussion faite avec ${v.name}` : `Marquer la discussion avec ${v.name}`}
              style={v.talked ? { border: '2px solid var(--teal)', color: 'var(--teal)' } : { background: 'var(--accent)', color: 'var(--accent-text)' }}
              onClick={() => set(v.id, { talked: v.talked ? null : today })}>
              <Icon name={v.talked ? 'check' : 'heart'} />
            </button>
          </div>
        ))}
      </div>
      <div class="small muted" style={{ textAlign: 'center' }}>Liste de départ : tous les habitants arriveront avec le script de données.</div>
    </div>
  );
}
