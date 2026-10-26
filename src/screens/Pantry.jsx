import { useStore } from '../lib/store.js';
import { RECIPES, PANTRY_GROUPS, missingFor, RECIPE_TYPES } from '../data/recipes.js';
import { Back, Stars } from '../ui.jsx';

export function Pantry() {
  const { state, update } = useStore();
  const have = state.pantry;
  const toggle = (name) => update((s) => ({ pantry: { ...s.pantry, [name]: !s.pantry[name] } }));
  const byStars = (a, b) => b.r.stars - a.r.stars || a.r.name.localeCompare(b.r.name, 'fr');
  // Masque les recettes des extensions désactivées.
  const visible = RECIPES.filter((r) => !r.ext || state.extensions[r.ext]);
  const scored = visible.map((r) => ({ r, miss: missingFor(r, have) }));
  const ok = scored.filter((x) => !x.miss.length).sort(byStars);
  const almost = scored.filter((x) => x.miss.length === 1).sort(byStars);

  return (
    <div class="page wide">
      <Back href="#/recettes" label="Recettes" />
      <div class="between">
        <h1>Mon garde-manger</h1>
        <button class="btn sm ghost" onClick={() => update({ pantry: {} })}>Tout vider</button>
      </div>
      <div class="muted">Touche ce que tu as dans ton coffre.</div>

      <div class="home-grid">
        <div class="stack" style={{ gap: '14px' }}>
          {PANTRY_GROUPS.map(([title, items]) => (
            <section key={title} class="stack">
              <span class="small muted" style={{ fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{title}</span>
              <div class="row wrap" style={{ gap: '6px' }}>
                {items.map((name) => (
                  <button key={name} class={'chip' + (have[name] ? ' on' : '')} aria-pressed={!!have[name]} onClick={() => toggle(name)}>{name}</button>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div class="stack" style={{ gap: '14px' }}>
          <h2>Tu peux cuisiner <span style={{ color: 'var(--teal)' }}>({ok.length})</span></h2>
          {ok.map(({ r }) => (
            <a key={r.id} href={`#/recettes/${r.id}`} class="item" style={{ alignItems: 'center' }}>
              <div class="body"><span class="name">{r.name}</span><span class="small muted">{RECIPE_TYPES[r.type]}</span></div>
              <Stars n={r.stars} />
            </a>
          ))}
          {!ok.length && <div class="small muted">Rien pour l'instant : ajoute des ingrédients.</div>}
          <h2>Il te manque 1 ingrédient <span style={{ color: 'var(--warn)' }}>({almost.length})</span></h2>
          {almost.map(({ r, miss }) => (
            <a key={r.id} href={`#/recettes/${r.id}`} class="item" style={{ alignItems: 'center' }}>
              <div class="body"><span class="name">{r.name}</span><span class="small" style={{ color: 'var(--warn)', fontWeight: 800 }}>Manque : {miss[0]}</span></div>
              <Stars n={r.stars} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
