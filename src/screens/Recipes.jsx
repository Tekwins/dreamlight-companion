import { useState } from 'preact/hooks';
import { useStore } from '../lib/store.js';
import { useDesktop } from '../lib/router.js';
import { RECIPES, RECIPE_TYPES, ingredientOwned, missingFor } from '../data/recipes.js';
import { recipeLovers, newId } from '../lib/game.js';
import { Icon, Thumb, Seg, Search, Back, Stars, norm } from '../ui.jsx';

const RECIPE = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

export function Recipes({ selectedId }) {
  const { state } = useStore();
  const desktop = useDesktop();
  const [type, setType] = useState('all');
  const [star, setStar] = useState(0);
  const [sort, setSort] = useState('name');
  const [q, setQ] = useState('');
  const [favOnly, setFavOnly] = useState(false);

  const selected = selectedId ? RECIPE[selectedId] : null;
  if (selected && !desktop) return <div class="page"><RecipeDetail r={selected} /></div>;

  let list = RECIPES.filter((r) => (type === 'all' || r.type === type) && (!star || r.stars === star));
  if (favOnly) list = list.filter((r) => state.favorites[r.id]);
  if (q) list = list.filter((r) => norm(r.name + ' ' + r.ingredients.join(' ')).includes(norm(q)));
  const byName = (a, b) => a.name.localeCompare(b.name, 'fr');
  list = list.slice().sort(
    sort === 'stars' ? (a, b) => b.stars - a.stars || byName(a, b)
      : sort === 'ing' ? (a, b) => a.ingredients.length - b.ingredients.length || byName(a, b)
        : byName
  );

  const listView = (
    <div class="list">
      {list.map((r) => {
        const miss = missingFor(r, state.pantry).length;
        return (
          <a key={r.id} href={`#/recettes/${r.id}`} class={'item' + (selected?.id === r.id ? ' selected' : '')} style={{ alignItems: 'center' }}>
            <Thumb file={r.file} name={r.name} />
            <div class="body">
              <div class="between">
                <span class="name">{r.name}{state.favorites[r.id] ? ' ★' : ''}</span>
                <Stars n={r.stars} />
              </div>
              <span class="small muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {RECIPE_TYPES[r.type]} · {r.ingredients.join(', ')}
              </span>
              {miss === 0 && <span class="small" style={{ color: 'var(--teal)', fontWeight: 800 }}>Tout est dans ton garde-manger</span>}
            </div>
          </a>
        );
      })}
      {!list.length && <div class="empty">Aucune recette ne correspond.</div>}
      <div class="small muted" style={{ textAlign: 'center', padding: '8px' }}>Échantillon de départ : la liste complète arrive avec le script de données.</div>
    </div>
  );

  return (
    <div class="page wide">
      <div class="between">
        <h1>Recettes</h1>
        <div class="row" style={{ gap: '8px' }}>
          <a class="icon-btn" href="#/courses" aria-label="Liste de courses"><Icon name="list" /></a>
          <a class="btn sm" href="#/garde-manger"><Icon name="fridge" size={18} />Garde-manger</a>
        </div>
      </div>
      <Search value={q} onInput={setQ} placeholder="Recette ou ingrédient…" />
      <Seg label="Type de plat" value={type} onChange={setType} options={[['all', 'Toutes'], ['E', 'Entrées'], ['P', 'Plats'], ['D', 'Desserts']]} />
      <div class="chips">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} class={'chip' + (star === n ? ' on' : '')} aria-pressed={star === n} onClick={() => setStar(star === n ? 0 : n)}>{n}★</button>
        ))}
        <button class={'chip' + (favOnly ? ' on' : '')} aria-pressed={favOnly} onClick={() => setFavOnly(!favOnly)}>Favoris</button>
      </div>
      <div class="between wrap">
        <span class="small muted" style={{ fontWeight: 700 }}>{list.length} recette{list.length > 1 ? 's' : ''}</span>
        <div class="row wrap" style={{ gap: '4px' }}>
          <span class="small muted" style={{ fontWeight: 700 }}>Trier :</span>
          {[['name', 'Nom'], ['stars', '★'], ['ing', 'Ingrédients']].map(([id, l]) => (
            <button key={id} class={'chip' + (sort === id ? ' on' : '')} style={{ minHeight: '32px', fontSize: '12px' }} aria-pressed={sort === id} onClick={() => setSort(id)}>{l}</button>
          ))}
        </div>
      </div>
      {desktop ? (
        <div class="split">
          {listView}
          <div class="detail">{selected ? <RecipeDetail r={selected} embedded /> : <div class="empty">Choisis une recette pour voir sa fiche.</div>}</div>
        </div>
      ) : listView}
    </div>
  );
}

export function RecipeDetail({ r, embedded }) {
  const { state, update } = useStore();
  const fav = !!state.favorites[r.id];
  const unique = Array.from(new Set(r.ingredients));
  const missing = missingFor(r, state.pantry);
  const lovers = recipeLovers(r);

  const togglePantry = (ing) => update((s) => ({ pantry: { ...s.pantry, [ing]: !s.pantry[ing] } }));
  const addMissing = () => update((s) => ({
    shopping: [...s.shopping, ...missing.map((name) => ({ id: newId(), name, qty: 1, kind: 'autre', where: '', for: r.name, done: false }))]
  }));

  return (
    <div class="stack" style={{ gap: '18px' }}>
      <div class="between">
        {!embedded ? <Back href="#/recettes" label="Recettes" /> : <span />}
        <button class={'icon-btn' + (fav ? ' on' : '')} aria-pressed={fav} aria-label="Favori"
          onClick={() => update((s) => ({ favorites: { ...s.favorites, [r.id]: !fav } }))}>
          <Icon name="star" fill={fav ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div class="row" style={{ gap: '16px' }}>
        <Thumb file={r.file} name={r.name} lg />
        <div class="stack" style={{ gap: '6px' }}>
          <h1 style={{ fontSize: '26px' }}>{r.name}</h1>
          <span style={{ fontSize: '18px' }}><Stars n={r.stars} /></span>
          <div class="row" style={{ gap: '6px' }}>
            <span class="pill">{RECIPE_TYPES[r.type]}</span>
            {r.veg && <span class="pill">Végétarien</span>}
          </div>
        </div>
      </div>

      <section class="stack">
        <div class="between">
          <h2>Ingrédients</h2>
          <span style={{ fontWeight: 800, color: 'var(--teal)' }}>{unique.length - missing.length} / {unique.length} en stock</span>
        </div>
        <div class="card list-rows" style={{ padding: '2px 14px' }}>
          {r.ingredients.map((ing, i) => {
            const own = ingredientOwned(ing, state.pantry);
            return (
              <div key={i} class="list-row">
                <span style={{ flex: 1, fontWeight: 800 }}>{ing}</span>
                <button class={'btn sm' + (own ? ' ok' : ' ghost')} aria-pressed={own} onClick={() => togglePantry(ing)}>
                  {own ? 'J’en ai' : 'Manque'}
                </button>
              </div>
            );
          })}
        </div>
        <div class="small muted">Les ingrédients génériques (Légume, Fruit, Épice…) acceptent n'importe quel ingrédient de la catégorie. Il faut aussi 1 charbon pour cuisiner.</div>
        {missing.length > 0
          ? <button class="btn" onClick={addMissing}>Ajouter les {missing.length} manquant{missing.length > 1 ? 's' : ''} à ma liste</button>
          : <span class="btn ok" style={{ pointerEvents: 'none' }}>Tout est en stock</span>}
        <a href="#/courses" style={{ alignSelf: 'center', fontWeight: 800, minHeight: '40px', display: 'inline-flex', alignItems: 'center' }}>Voir ma liste de courses</a>
      </section>

      {lovers.length > 0 && (
        <section class="stack">
          <h2>Les animaux qui l'adorent</h2>
          {lovers.map(([id, name, level]) => (
            <div key={id} class="item" style={{ alignItems: 'center' }}>
              <span class="name" style={{ flex: 1 }}>{name}</span>
              <span class={'tag' + (level === 'Préféré' ? ' rare' : ' outline')}>{level.toUpperCase()}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
