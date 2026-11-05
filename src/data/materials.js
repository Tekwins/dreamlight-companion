// Matériaux de récolte non associés à un métier (pas de graines à planter, pas de canne à
// pêche dédiée) : bois (hache), minerais/pierres (pioche, comme les gemmes), et matériaux
// de fouille (pelle) ou d'algues (pêche, sans remous). Sources : dreamlightvalleywiki.com
// (page de chaque biome, section Resources) pour la liste et le biome exact, et
// mydreamlightvalley.com/fr/material/foraging pour le nom français et le prix de vente.
// Volontairement exclus : objets d'événements saisonniers (Boule de neige, badges,
// trèfles, papier d'emballage festif...), objets de fouille « épave » (Os, Arme brisée,
// Charnière rouillée...) et objets liés au Rêve (Éclat de rêve/nocturne/pixels) — aucun
// n'est une ressource de biome standard.

// [nom, nom anglais, biomes, prix de vente]
export const WOOD = [
  ['Bois tendre', 'Softwood', ['esplanade', 'prairie', 'bayou', 'foret', 'port'], 5],
  ['Bois dur', 'Hardwood', ['bayou', 'hauteurs', 'foret', 'plateau', 'pixie'], 10],
  ['Bois sec', 'Dry Wood', ['hauteurs', 'terres', 'plateau', 'alpes'], 25],
  // Nom cité par Tek : ne se trouve qu'aux Terres oubliées (contrairement au bois tendre,
  // bien plus répandu).
  ['Bois sombre', 'Dark Wood', ['terres'], 50],
  ['Bois tropical', 'Tropical Wood', ['meandres'], 40],
  ['Bois pétrifié', 'Petrified Wood', ['reliure', 'comte'], 20],
  ['Bois de grange récupéré', 'Reclaimed Barn Wood', ['alpes'], 30]
].map(([name, file, biomes, price]) => ({
  id: 'wood-' + file.toLowerCase().replace(/[^a-z]+/g, '-'),
  name, file: file + '.png', biomes, price
}));

// Minerais et pierres : récoltés à la pioche, comme les gemmes (même section sur la Carte).
export const ORE = [
  ['Pierre', 'Stone', ['esplanade', 'prairie', 'plage', 'bayou', 'hauteurs', 'terres', 'foret', 'plateau', 'reliure', 'mythopie', 'comte', 'gulch'], 2],
  ['Minerai de charbon', 'Coal Ore', ['*'], 5],
  // Nom cité par Tek.
  ['Minerai de fer', 'Iron Ore', ['bayou', 'hauteurs', 'terres', 'foret', 'plateau', 'reliure', 'comte'], 10],
  // Nom cité par Tek.
  ['Pépite d’or', 'Gold Nugget', ['hauteurs', 'terres', 'plateau', 'mythopie'], 20],
  ['Cristal', 'Crystal', ['terres'], 30],
  ['Cuivre', 'Copper', ['port', 'dunes', 'meandres'], 15],
  ['Quartz', 'Quartz', ['port'], 20],
  ['Étain', 'Tin', ['dunes'], 25],
  ['Zinc', 'Zinc', ['meandres'], 30],
  ['Marbre', 'Marble', ['mythopie'], 30],
  ['Minerai d’argent', 'Silver Ore', ['alpes'], 2],
  ['Minerai herbeux', 'Grassy Ore', ['pixie'], 25],
  ['Poussière de fée', 'Pixie Dust', ['alpes', 'gulch', 'pixie'], 15]
].map(([name, file, biomes, price]) => ({
  id: 'ore-' + file.toLowerCase().replace(/[^a-z]+/g, '-'),
  name, file: file + '.png', biomes, price
}));

// Matériaux de fouille (pelle) : argile, terre, sable... et quelques trouvailles propres à
// une zone (ambre, bulles féeriques, roche volcanique...).
export const MATERIALS = [
  ['Terre', 'Soil', ['esplanade', 'prairie', 'bayou', 'hauteurs', 'terres', 'foret', 'plateau', 'port', 'reliure', 'comte', 'pixie'], 3],
  ['Argile', 'Clay', ['bayou', 'terres', 'plateau', 'pixie'], 20],
  ['Galets', 'Pebbles', ['plage', 'terres', 'foret', 'plateau', 'meandres', 'alpes'], 10],
  ['Sable', 'Sand', ['plage', 'dunes', 'gulch'], 8],
  ['Perle', 'Pearl', ['port'], 10],
  ['Verre d’oasis', 'Oasis Glass', ['dunes'], 20],
  ['Ambre', 'Amber', ['meandres'], 30],
  ['Mousse', 'Moss', ['reliure'], 70],
  ['Boue', 'Mud', ['reliure'], 10],
  ['Gravier', 'Gravel', ['mythopie'], 20],
  ['Bulles féeriques', 'Fairy Bubbles', ['comte'], 15],
  ['Roche volcanique', 'Volcanic Rock', ['comte'], 30],
  ['Terre perlée', 'Beady Soil', ['gulch'], 30]
].map(([name, file, biomes, price]) => ({
  id: 'mat-' + file.toLowerCase().replace(/[^a-z]+/g, '-'),
  name, file: file + '.png', biomes, price
}));

// Algues : récoltées à la canne à pêche, sans remous (pas de couleur de cercle). Nom cité
// par Tek. « Algues » (Seaweed) garde son image dans public/img/ (c'est un ingrédient de
// recette comme les poissons), les autres dans le même dossier que les minerais/bois.
export const ALGAE = [
  ['Algues rouges', 'Red Algae', ['prairie', 'plage', 'bayou', 'hauteurs', 'terres', 'foret', 'plateau', 'port', 'meandres', 'reliure', 'mythopie', 'comte', 'alpes', 'gulch'], 150],
  ['Algues', 'Seaweed', ['prairie', 'plage', 'bayou', 'hauteurs', 'terres', 'foret', 'plateau', 'meandres'], 20],
  ['Posidonie', 'Posidonia', ['mythopie'], 20]
].map(([name, file, biomes, price]) => ({
  id: 'algae-' + file.toLowerCase().replace(/[^a-z]+/g, '-'),
  name, file: file + '.png', biomes, price
}));
