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

const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

// « 23 septembre au 8 décembre 2026 » -> Date de fin réelle (ou null si illisible).
export function starPathEndDate(sp) {
  const m = sp.dates?.match(/au\s+(\d{1,2})\w*\s+([a-zéû]+)\s+(\d{4})/i);
  if (!m) return null;
  const month = MONTHS_FR.indexOf(m[2].toLowerCase());
  if (month === -1) return null;
  return new Date(+m[3], month, +m[1], 23, 59, 59);
}

// Progression d'une Voie des étoiles : récompenses cochées (Collection) + palier le plus haut
// entièrement obtenu (les paliers se débloquent dans l'ordre en jeu).
export function starPathProgress(sp, done) {
  const entries = sp.tiers.flatMap((t, ti) => t.rewards.map((r, ri) => ({ key: `${sp.id}:${ti}:${ri}`, tier: t.tier, ...r })));
  const got = entries.filter((e) => done[e.key]).length;
  const pct = entries.length ? Math.round((got / entries.length) * 100) : 0;
  let tier = 0;
  for (const t of sp.tiers) {
    const tierEntries = entries.filter((e) => e.tier === t.tier);
    if (tierEntries.length && tierEntries.every((e) => done[e.key])) tier = t.tier;
    else break;
  }
  return { entries, got, pct, tier, tierCount: sp.tiers.length };
}

let uid = 0;
export function newId() {
  uid += 1;
  return Date.now().toString(36) + '-' + uid;
}
