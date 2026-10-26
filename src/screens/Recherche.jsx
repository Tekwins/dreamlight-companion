import { useState } from 'preact/hooks';
import { useStore } from '../lib/store.js';
import { BIOME, extOfBiomes } from '../data/biomes.js';
import { CROPS, FISH, GEMS, FORAGE, RIPPLES, GEM_COLORS } from '../data/resources.js';
import { RECIPES, RECIPE_TYPES } from '../data/recipes.js';
import { VARIANTS } from '../data/critters.js';
import { visibleItems, critterEnabled } from '../lib/game.js';
import { Icon, Thumb, Back, BiomePill, BiomePills, ExtTag, Stars, Search, norm } from '../ui.jsx';

const OBJ_SOURCES = [
  ['potager', 'Potager', CROPS],
  ['peche', 'Pêche', FISH],
  ['cueillette', 'Cueillette', FORAGE],
  ['mines', 'Mines', GEMS]
];
const CATS = [['all', 'Tout'], ['objets', 'Objets'], ['recettes', 'Recettes'], ['animaux', 'Animaux']];

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
          <div class="list">{objects.map((it) => <ObjectRow key={it.kind + it.id} it={it} />)}</div>
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

function ObjectRow({ it }) {
  const ext = it.biomes[0] === '*' ? null : extOfBiomes(it.biomes);
  return (
    <a href={`#/${it.kind}?q=${encodeURIComponent(it.name)}`} class="item" style={{ alignItems: 'center' }}>
      <Thumb file={it.file} name={it.name} round={it.kind === 'peche'}
        ring={it.kind === 'peche' ? RIPPLES[it.ripple]?.color : it.kind === 'mines' ? GEM_COLORS[it.color]?.color : null} />
      <div class="body">
        <div class="row wrap" style={{ gap: '6px' }}>
          <span class="name">{it.name}</span>
          <span class="tag outline">{it.label}</span>
          <ExtTag ext={ext} />
        </div>
        <BiomePills ids={it.biomes} />
      </div>
      <Icon name="chevron" size={18} class="muted" style={{ flex: 'none' }} />
    </a>
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
