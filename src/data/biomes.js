// Biomes du jeu, dans l'ordre d'apparition.
// ext : extension requise (null = jeu de base).
// Les noms marqués "à vérifier" n'ont pas encore de traduction française confirmée.
export const EXTENSIONS = [
  { id: 'rift', name: 'A Rift in Time', short: 'Rift', areas: 'Port antique, Dunes scintillantes, Méandres sauvages' },
  { id: 'vale', name: 'The Storybook Vale', short: 'Vale', areas: 'Reliure, Mythopie, Comté des Contes' },
  { id: 'ranch', name: 'Wishblossom Ranch', short: 'Ranch', areas: 'Ranch de Florespérance et ses environs' }
];

export const BIOMES = [
  { id: 'esplanade', name: 'Esplanade', color: '#F5C95C', ext: null },
  { id: 'prairie', name: 'Prairie tranquille', color: '#9BD77A', ext: null },
  { id: 'plage', name: 'Plage enchantée', color: '#7DE0D6', ext: null },
  { id: 'foret', name: 'Forêt du courage', color: '#5FBF7F', ext: null },
  { id: 'bayou', name: 'Bayou de la confiance', color: '#6FA8DC', ext: null },
  { id: 'plateau', name: 'Plateau ensoleillé', color: '#FFB27A', ext: null },
  { id: 'hauteurs', name: 'Hauteurs glacées', color: '#BFE3FF', ext: null },
  { id: 'terres', name: 'Terres oubliées', color: '#C3B6F7', ext: null },
  { id: 'port', name: 'Port antique', color: '#E6C79C', ext: 'rift' },
  { id: 'dunes', name: 'Dunes scintillantes', color: '#F0D27A', ext: 'rift' },
  { id: 'meandres', name: 'Méandres sauvages', color: '#8FD694', ext: 'rift' },
  { id: 'reliure', name: 'Reliure', color: '#D9A6E8', ext: 'vale' },
  { id: 'mythopie', name: 'Mythopie', color: '#FF9D7A', ext: 'vale' },
  { id: 'comte', name: 'Comté des Contes', color: '#F49AC1', ext: 'vale' },
  { id: 'ranch', name: 'Ranch de Florespérance', color: '#B8E07A', ext: 'ranch' },
  { id: 'alpes', name: 'Wishing Alps', color: '#A9D8F0', ext: 'ranch', todo: true },
  { id: 'gulch', name: 'Glamour Gulch', color: '#F7A8C8', ext: 'ranch', todo: true },
  { id: 'pixie', name: 'Pixie Acres', color: '#E9C2FF', ext: 'ranch', todo: true }
];

export const BIOME = Object.fromEntries(BIOMES.map((b) => [b.id, b]));

// Un objet est visible si au moins un de ses biomes est accessible
// avec les extensions actives.
export function biomeEnabled(id, exts) {
  const b = BIOME[id];
  if (!b) return true;
  return !b.ext || !!exts[b.ext];
}

// Extension "propre" d'un objet : seulement si TOUS ses biomes en dépendent.
export function extOfBiomes(ids) {
  const list = ids.map((id) => BIOME[id]?.ext || null);
  if (!list.length || list.some((e) => !e)) return null;
  return list[0];
}
