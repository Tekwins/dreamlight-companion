import { useState } from 'preact/hooks';
import { useStore } from '../lib/store.js';
import { BIOME, extOfBiomes, biomeEnabled } from '../data/biomes.js';
import { CROPS, FISH, GEMS, FORAGE, RIPPLES, GEM_COLORS } from '../data/resources.js';
import { RECIPES, RECIPE_TYPES, CATEGORIES } from '../data/recipes.js';
import { VARIANTS, SPECIES } from '../data/critters.js';
import { visibleItems, critterEnabled, biomeName } from '../lib/game.js';
import { formatDuration } from '../lib/time.js';
import { Icon, Thumb, Back, BiomePill, ExtTag, Stars, Search, norm } from '../ui.jsx';

const OBJ_SOURCES = [
  ['potager', 'Potager', CROPS],
  ['peche', 'Pêche', FISH],
  ['cueillette', 'Cueillette', FORAGE],
  ['mines', 'Mines', GEMS]
];
const CATS = [['all', 'Tout'], ['objets', 'Objets'], ['recettes', 'Recettes'], ['animaux', 'Animaux']];
const CAT_LABEL = { fruit: 'Fruit', epice: 'Épice', champi: 'Champignon' };
const SOURCE_PREFIX = { potager: 'Graines en vente', peche: 'Pêche', cueillette: 'Cueillette', mines: 'Mine' };

// Catégorie officielle d'un ingrédient (celle utilisée par les recettes génériques), si connue.
function categoryOf(name) {
  const hit = Object.entries(CATEGORIES).find(([, list]) => list.includes(name));
  return hit?.[0] || null;
}

// Recettes qui acceptent cet ingrédient : soit nommé précisément, soit via sa catégorie générique.
function recipesUsing(name) {
  const generics = Object.entries(CATEGORIES).filter(([, list]) => list.includes(name)).map(([g]) => g);
  return RECIPES.filter((r) => r.ingredients.includes(name) || generics.some((g) => r.ingredients.includes(g)));
}

// Le nom est-il cité tel quel (mot entier) dans ce texte libre ? Pas de déduction par catégorie
// ici : les champs fav/liked des animaux sont du texte libre, pas une donnée structurée.
function mentions(text, name) {
  const t = norm(text || ''), n = norm(name);
  if (!t || !n) return false;
  const re = new RegExp(`(^|[^a-zà-ÿ])${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-zà-ÿ])`);
  return re.test(t);
}

// Espèces (pas couleurs individuelles) dont la nourriture préférée ou aimée cite ce nom.
function animalsLoving(name, exts) {
  const out = [];
  for (const sp of SPECIES) {
    if (!biomeEnabled(sp.biome, exts)) continue;
    if (mentions(sp.fav, name)) out.push([sp, 'Préféré']);
    else if (mentions(sp.liked, name)) out.push([sp, 'Aimé']);
  }
  return out;
}

// Recherche unifiée (objets à récolter, recettes, animaux), sur les données déjà en local.
export function Recherche() {
  const { state } = useStore();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const nq = norm(q);

  let objects = [], recipes = [], animals = [];
  if (nq) {
    for (const [kind, label, items] of OBJ_SOURCES) {
      for (const it of visibleItems(items, state.extensions)) {
        if (norm(it.name).includes(nq)) objects.push({ ...it, kind, label });
      }
    }
    recipes = RECIPES.filter((r) => !r.ext || state.extensions[r.ext])
      .filter((r) => norm(r.name + ' ' + r.ingredients.join(' ')).includes(nq));
    animals = VARIANTS.filter((v) => critterEnabled(v, state.extensions))
      .filter((v) => norm(`${v.name} ${v.favOverride || v.species.fav} ${BIOME[v.species.biome]?.name || ''}`).includes(nq));
  }
  const counts = { all: objects.length + recipes.length + animals.length, objets: objects.length, recettes: recipes.length, animaux: animals.length };

  const showObjects = (cat === 'all' || cat === 'objets') && objects.length > 0;
  const showRecipes = (cat === 'all' || cat === 'recettes') && recipes.length > 0;
  const showAnimals = (cat === 'all' || cat === 'animaux') && animals.length > 0;
  const noResults = !!nq && !counts.all;

  return (
    <div class="page">
      <Back href="#/" label="Aujourd’hui" />
      <h1>Recherche</h1>
      <Search value={q} onInput={setQ} placeholder="Objet, recette, animal…" />

      {!!nq && (
        <div class="chips">
          {CATS.map(([id, label]) => (
            <button key={id} class={'chip' + (cat === id ? ' on' : '')} aria-pressed={cat === id} onClick={() => setCat(id)}>
              {label} ({counts[id]})
            </button>
          ))}
        </div>
      )}

      {!nq && <div class="empty">Tape le nom d'un objet, d'une recette ou d'un animal.</div>}
      {noResults && <div class="empty">Aucun résultat pour « {q} ».</div>}

      {showObjects && (
        <section class="stack">
          <h2>Objets</h2>
          <div class="stack" style={{ gap: '12px' }}>
            {objects.map((it) => <ObjectHero key={it.kind + it.id} it={it} />)}
          </div>
        </section>
      )}

      {showRecipes && (
        <section class="stack">
          <h2>Recettes</h2>
          <div class="list">{recipes.map((r) => <RecipeRow key={r.id} r={r} />)}</div>
        </section>
      )}

      {showAnimals && (
        <section class="stack">
          <h2>Animaux</h2>
          <div class="list">{animals.map((v) => <AnimalRow key={v.id} v={v} />)}</div>
        </section>
      )}
    </div>
  );
}

function ObjectHero({ it }) {
  const { state } = useStore();
  const ext = it.biomes[0] === '*' ? null : extOfBiomes(it.biomes);
  const cat = categoryOf(it.name);
  const kindLabel = cat ? `${cat} · ${it.label}` : it.label;
  const source = `${SOURCE_PREFIX[it.kind]} : ${it.biomes.map(biomeName).join(', ')}`;

  const stats = [];
  if (it.kind === 'potager') {
    stats.push([formatDuration(it.min), 'pousse'], [`${it.seed} → ${it.sell}`, 'graine → vente'],
      [it.water == null ? '?' : `${it.water}`, `arrosage${it.water > 1 ? 's' : ''}`]);
  } else if (it.kind === 'peche') {
    stats.push([RIPPLES[it.ripple]?.label, 'remous']);
    if (it.cond) stats.push([it.cond, 'condition']);
  } else if (it.kind === 'mines') {
    stats.push([`${it.price}`, 'pièces'], [GEM_COLORS[it.color]?.label || it.color, 'couleur']);
  } else if (it.kind === 'cueillette') {
    stats.push([CAT_LABEL[it.cat] || it.cat, 'catégorie']);
    if (it.price > 0) stats.push([`${it.price}`, 'pièces']);
  }

  const recipes = recipesUsing(it.name).filter((r) => !r.ext || state.extensions[r.ext]);
  const lovers = animalsLoving(it.name, state.extensions);

  return (
    <div class="card stack" style={{ gap: '14px' }}>
      <a href={`#/${it.kind}?q=${encodeURIComponent(it.name)}`} class="row" style={{ gap: '14px', alignItems: 'center', color: 'var(--text)' }}>
        <Thumb file={it.file} name={it.name} round={it.kind === 'peche'} lg
          ring={it.kind === 'peche' ? RIPPLES[it.ripple]?.color : it.kind === 'mines' ? GEM_COLORS[it.color]?.color : null} />
        <div class="stack" style={{ gap: '2px', flex: 1, minWidth: 0 }}>
          <span class="small" style={{ fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--teal)' }}>{kindLabel}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '21px', fontWeight: 800 }}>{it.name}</span>
          <ExtTag ext={ext} />
        </div>
        <Icon name="chevron" size={18} class="muted" style={{ flex: 'none' }} />
      </a>

      {!!stats.length && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))`, gap: '8px', textAlign: 'center' }}>
          {stats.map(([value, label]) => (
            <div key={label} style={{ background: 'var(--surface-2)', borderRadius: '12px', padding: '8px 4px' }}>
              <div style={{ fontWeight: 800 }}>{value}</div>
              <div class="small muted">{label}</div>
            </div>
          ))}
        </div>
      )}
      <span class="small muted">{source}</span>
      {it.use && <span class="small" style={{ color: 'var(--accent)', fontWeight: 700 }}>{it.use}</span>}

      {!!recipes.length && (
        <div class="stack">
          <h2>Recettes qui l'utilisent</h2>
          <div class="card list-rows" style={{ padding: '2px 14px', background: 'var(--surface-2)' }}>
            {recipes.map((r) => (
              <a key={r.id} href={`#/recettes/${r.id}`} class="list-row" style={{ color: 'var(--text)' }}>
                <span style={{ flex: 1, fontWeight: 800 }}>{r.name} <span class="small muted" style={{ fontWeight: 600 }}>· {RECIPE_TYPES[r.type]}</span></span>
                <Stars n={r.stars} />
              </a>
            ))}
          </div>
        </div>
      )}

      {!!lovers.length && (
        <div class="stack">
          <h2>Animaux qui l'aiment</h2>
          <div class="card list-rows" style={{ padding: '2px 14px', background: 'var(--surface-2)' }}>
            {lovers.map(([sp, level]) => (
              <div key={sp.id} class="list-row">
                <div class="stack" style={{ gap: '2px', flex: 1 }}>
                  <strong>{sp.name}</strong>
                  <span class="small muted">{biomeName(sp.biome)}</span>
                </div>
                <span class={'tag' + (level === 'Préféré' ? ' rare' : ' outline')}>{level.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RecipeRow({ r }) {
  return (
    <a href={`#/recettes/${r.id}`} class="item" style={{ alignItems: 'center' }}>
      <Thumb file={r.file} name={r.name} />
      <div class="body">
        <div class="between">
          <span class="name">{r.name}</span>
          <Stars n={r.stars} />
        </div>
        <span class="small muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {RECIPE_TYPES[r.type]} · {r.ingredients.join(', ')}
        </span>
      </div>
    </a>
  );
}

function AnimalRow({ v }) {
  return (
    <a href={`#/animaux/${v.id}`} class="item" style={{ alignItems: 'center' }}>
      <Thumb file={v.file + '.png'} name={v.name} />
      <div class="body">
        <span class="name">{v.name}</span>
        <div class="row wrap" style={{ gap: '4px' }}>
          <BiomePill id={v.species.biome} />
          <span class="pill">♥ {v.favOverride || v.species.fav}</span>
        </div>
      </div>
    </a>
  );
}
