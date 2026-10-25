import { BIOME, biomeEnabled } from '../data/biomes.js';
import { VARIANTS } from '../data/critters.js';
import { isAvailable, rareToday, availabilityLabel, todayKey } from './time.js';

export function critterEnabled(v, exts) {
  return biomeEnabled(v.species.biome, exts);
}

// Animaux visibles avec leur disponibilité, triés : urgents, rares, puis par nom.
export function crittersNow(exts, now) {
  return VARIANTS.filter((v) => critterEnabled(v, exts)).map((v) => {
    const av = availabilityLabel(v.schedule, now);
    return { v, av, now: isAvailable(v.schedule, now), rare: rareToday(v.schedule, now) };
  });
}

export function sortCritters(list) {
  return list.slice().sort((a, b) =>
    (b.now - a.now) || ((b.av.urgent ? 1 : 0) - (a.av.urgent ? 1 : 0)) || (b.rare - a.rare) || a.v.name.localeCompare(b.v.name, 'fr')
  );
}

// Garde seulement les biomes accessibles ; retire l'objet s'il n'en reste aucun.
export function visibleItems(items, exts) {
  return items
    .map((it) => ({ ...it, biomes: it.biomes.filter((b) => b === '*' || biomeEnabled(b, exts)) }))
    .filter((it) => it.biomes.length);
}

// Repas : quels animaux l'adorent ?
export function recipeLovers(r) {
  const out = [];
  if (r.stars === 5) out.push(['corbeau', 'Corbeaux', 'Préféré']);
  else if (r.stars >= 3 && r.stars <= 4) out.push(['corbeau', 'Corbeaux', 'Aimé']);
  if (r.type === 'D' && r.stars === 5) out.push(['singe', 'Singes', 'Préféré']);
  else if (r.stars >= 3) out.push(['singe', 'Singes', 'Aimé']);
  if (r.veg && r.type !== 'D') out.push(['pegase', 'Pégases', r.stars === 5 ? 'Préféré' : 'Aimé']);
  return out;
}

// Nourrissage : seul le premier repas de la journée compte.
export function feedInfo(state, variantId) {
  const log = state.feedLog[variantId] || { count: 0, last: null };
  return { ...log, fedToday: log.last === todayKey() };
}

export function biomeName(id) {
  return id === '*' ? 'Partout' : BIOME[id]?.name || id;
}

let uid = 0;
export function newId() {
  uid += 1;
  return Date.now().toString(36) + '-' + uid;
}
