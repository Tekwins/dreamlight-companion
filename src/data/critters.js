// Animaux (bestioles) et horaires de chaque couleur.
// Source : Dreamlight Valley Wiki, page « Critters ».
// Horaires par jour, du dimanche (0) au samedi (6), heure locale réelle :
//   'A' = toute la journée, 'M' = 0 h-12 h, 'S' = 12 h-24 h, '-' = absent,
//   ou une liste de plages [[début, fin], ...] en heures.
// file : nom du fichier image sur le wiki.

const A = 'A', M = 'M', S = 'S', _ = '-';
const every = (v) => [v, v, v, v, v, v, v];

// tame : { min, exact } = nombre de repas (premier repas du jour seulement) pour apprivoiser,
// trouvé sur le wiki EN (« Minimum Feedings »). exact: false = minimum seulement, le jeu peut
// en demander plus au hasard au-delà. Absent = non documenté sur le wiki (singes, hiboux,
// bébés dragons, pégases) : pas de barre segmentée pour ces espèces, juste le compteur.

// steps : décomposé en étapes numérotées dans la fiche animal (1 seule étape = pas de numéro affiché).
export const METHODS = {
  none: { label: 'Aucun jeu', steps: ['Approche-toi simplement et donne-lui à manger.'] },
  chase: { label: 'Poursuite', steps: ['Quand il te remarque, suis-le jusqu’à ce qu’il s’arrête.', 'Donne-lui à manger.'] },
  redlight: { label: 'Feu rouge, feu vert', steps: ['Avance quand il est détendu, tête baissée.', 'Quand il relève la tête, ne bouge plus, sinon il change d’endroit.', 'Une fois à côté de lui, donne-lui à manger.'] },
  patience: { label: 'Patience', steps: ['Attends qu’il soit prêt (qu’il sorte de sa cachette ou finisse sa ronde).', 'Donne-lui à manger.'] }
};

export const SPECIES = [
  {
    id: 'ecureuil', name: 'Écureuils', biome: 'esplanade', method: 'none',
    tame: { min: 2, exact: true },
    fav: 'Cacahuète', liked: 'Fruits des buissons et des arbres',
    rewards: { fav: 'Éclat de rêve, Éclat de souvenir, Sac de motifs', liked: 'Éclat de rêve, Éclat de souvenir, Origan ×3' },
    variants: [
      ['ecureuil-noir', 'Écureuil noir', 'Black Squirrel', [M, _, A, _, A, A, _]],
      ['ecureuil-classique', 'Écureuil classique', 'Classic Squirrel', [S, A, _, _, A, _, A]],
      ['ecureuil-gris', 'Écureuil gris', 'Gray Squirrel', [S, _, A, A, _, _, A]],
      ['ecureuil-roux', 'Écureuil roux', 'Red Squirrel', [M, A, _, A, _, A, _]],
      ['ecureuil-blanc', 'Écureuil blanc', 'White Squirrel', [A, _, _, _, _, _, _]]
    ]
  },
  {
    id: 'lievre', name: 'Lièvres', biome: 'prairie', method: 'chase',
    tame: { min: 2, exact: true },
    fav: 'Carotte', liked: 'Céréales, épices et herbes, légumes, fruits issus de graines',
    rewards: { fav: 'Éclat de rêve, Éclat de souvenir, Sac de motifs', liked: 'Éclat de rêve, Éclat de souvenir, Graines de laitue ×4' },
    variants: [
      ['lievre-noir', 'Lièvre noir', 'Black Rabbit', [M, A, _, A, _, A, _]],
      ['lievre-brun', 'Lièvre brun', 'Brown Rabbit', [S, _, A, A, _, _, A]],
      ['lievre-calicot', 'Lièvre calicot', 'Calico Rabbit', [_, _, _, _, A, _, _]],
      ['lievre-classique', 'Lièvre classique', 'Classic Rabbit', [S, A, _, _, A, _, A]],
      ['lievre-blanc', 'Lièvre blanc', 'White Rabbit', [M, _, A, _, A, A, _]]
    ]
  },
  {
    id: 'tortue', name: 'Tortues de mer', biome: 'plage', method: 'patience',
    tame: { min: 3, exact: false },
    fav: 'Algue', liked: 'Fruits de mer',
    tip: 'Tu peux aussi poser une algue devant elle : elle sort tout de suite.',
    rewards: { fav: 'Éclat de rêve, Éclat de souvenir, Sac de motifs', liked: 'Éclat de rêve, Éclat de souvenir, Noix de coco ×2' },
    variants: [
      ['tortue-noire', 'Tortue de mer noire', 'Black Sea Turtle', [_, A, _, _, _, _, _]],
      ['tortue-brune', 'Tortue de mer brune', 'Brown Sea Turtle', [M, A, _, A, _, A, _]],
      ['tortue-classique', 'Tortue de mer classique', 'Classic Sea Turtle', [S, A, _, _, A, _, A]],
      ['tortue-violette', 'Tortue de mer violette', 'Purple Sea Turtle', [M, _, A, _, A, A, _]],
      ['tortue-blanche', 'Tortue de mer blanche', 'White Sea Turtle', [S, _, A, A, _, _, A]]
    ]
  },
  {
    id: 'raton', name: 'Ratons laveurs', biome: 'foret', method: 'redlight',
    tame: { min: 3, exact: false },
    fav: 'Myrtille', liked: 'Groseille à maquereau, Framboise, Fraise',
    rewards: { fav: 'Éclat de rêve, Éclat de souvenir, Sac de motifs', liked: 'Éclat de rêve, Éclat de souvenir, Ail ×2' },
    variants: [
      ['raton-noir', 'Raton laveur noir', 'Black Raccoon', [S, _, A, A, _, _, A]],
      ['raton-bleu', 'Raton laveur bleu', 'Blue Raccoon', [_, _, _, A, _, _, _]],
      ['raton-classique', 'Raton laveur classique', 'Classic Raccoon', [S, A, _, _, A, _, A]],
      ['raton-roux', 'Raton laveur roux', 'Red Raccoon', [M, A, _, A, _, A, _]],
      ['raton-blanc', 'Raton laveur blanc', 'White Raccoon', [M, _, A, _, A, A, _]]
    ]
  },
  {
    id: 'crocodile', name: 'Crocodiles', biome: 'bayou', method: 'redlight',
    tame: { min: 4, exact: false },
    fav: 'Homard', liked: 'Poissons et fruits de mer du Bayou',
    rewards: { fav: 'Éclat de rêve ×2, Éclat de souvenir, Sac de motifs', liked: 'Éclat de rêve, Éclat de souvenir, Graines de concombre' },
    variants: [
      ['croco-bleu', 'Crocodile bleu', 'Blue Crocodile', [M, A, _, A, _, A, _]],
      ['croco-classique', 'Crocodile classique', 'Classic Crocodile', [S, A, _, _, A, _, A]],
      ['croco-dore', 'Crocodile doré', 'Golden Crocodile', [M, _, A, _, A, A, _]],
      ['croco-rose', 'Crocodile rose', 'Pink Crocodile', [_, _, _, _, _, _, A]],
      ['croco-rouge', 'Crocodile rouge', 'Red Crocodile', [S, _, A, A, _, _, A]],
      ['croco-blanc', 'Crocodile blanc', 'White Crocodile', [A, _, _, _, _, _, _]]
    ]
  },
  {
    id: 'passereau', name: 'Passereaux', biome: 'plateau', method: 'none',
    tame: { min: 4, exact: false },
    fav: 'Fleurs (selon la couleur)', liked: 'Toutes les autres fleurs',
    rewards: { fav: 'Éclat de rêve ×2, Éclat de souvenir, Sac de motifs', liked: 'Éclat de rêve, Éclat de souvenir, Fève de cacao, Cerise ou Cristal' },
    variants: [
      ['passereau-emeraude', 'Passereau émeraude', 'Emerald Sunbird', [S, _, A, A, _, _, A], 'Fleurs vertes et jaunes'],
      ['passereau-dore', 'Passereau doré', 'Golden Sunbird', [M, _, A, _, A, A, _], 'Fleurs orange et jaunes'],
      ['passereau-orchidee', 'Passereau orchidée', 'Orchid Sunbird', [_, _, _, _, _, A, _], 'Fleurs roses et violettes'],
      ['passereau-rouge', 'Passereau rouge', 'Red Sunbird', [S, A, _, _, A, _, A], 'Fleurs bleues et rouges'],
      ['passereau-turquoise', 'Passereau turquoise', 'Turquoise Sunbird', [M, A, _, A, _, A, _], 'Fleurs vertes et roses']
    ]
  },
  {
    id: 'renard', name: 'Renards', biome: 'hauteurs', method: 'chase',
    tame: { min: 5, exact: false },
    fav: 'Esturgeon blanc', liked: 'Poissons et fruits de mer des Hauteurs',
    rewards: { fav: 'Éclat de rêve ×2, Éclat de souvenir, Sac de motifs', liked: 'Éclat de rêve, Éclat de souvenir, Lingot de fer' },
    variants: [
      ['renard-noir', 'Renard noir', 'Black Fox', [S, _, A, A, _, _, A]],
      ['renard-bleu', 'Renard bleu', 'Blue Fox', [M, _, A, _, A, A, _]],
      ['renard-classique', 'Renard classique', 'Classic Fox', [M, A, _, A, _, A, _]],
      ['renard-roux', 'Renard roux', 'Red Fox', [_, _, _, _, _, _, A]],
      ['renard-blanc', 'Renard blanc', 'White Fox', [S, A, _, _, A, _, A]]
    ]
  },
  {
    id: 'corbeau', name: 'Corbeaux', biome: 'terres', method: 'patience',
    tame: { min: 5, exact: false },
    fav: 'Plats 5 étoiles', liked: 'Plats 3 et 4 étoiles',
    tip: 'Attends qu’il ait fini de tourner au-dessus de ta tête.',
    rewards: { fav: 'Éclat de rêve ×3, Éclat de souvenir, Sac de motifs', liked: 'Éclat de rêve, Éclat de souvenir, Lingot d’or' },
    variants: [
      ['corbeau-bleu', 'Corbeau bleu', 'Blue Raven', [M, _, A, _, A, A, _]],
      ['corbeau-brun', 'Corbeau brun', 'Brown Raven', [_, _, A, _, _, _, _]],
      ['corbeau-classique', 'Corbeau classique', 'Classic Raven', [S, A, _, _, A, _, A]],
      ['corbeau-rouge', 'Corbeau rouge', 'Red Raven', [M, A, _, A, _, A, _]],
      ['corbeau-blanc', 'Corbeau blanc', 'White Raven', [S, _, A, A, _, _, A]]
    ]
  },
  {
    id: 'capybara', name: 'Capybaras', biome: 'meandres', method: 'none',
    tame: { min: 3, exact: true },
    fav: 'Chou', liked: 'Céréales, épices et herbes, légumes, fruits issus de graines',
    rewards: { fav: 'Éclat de rêve ×2, Éclat de souvenir, Sac de motifs', liked: 'Éclat de rêve, Éclat de souvenir, Bambou ×3' },
    variants: [
      ['capybara-noir-blanc', 'Capybara noir et blanc', 'Black and White Capybara', [S, _, A, _, A, S, S], 'La Promenade'],
      ['capybara-raye-bleu', 'Capybara rayé bleu', 'Blue Striped Capybara', [_, M, M, M, A, _, A], 'Le Bosquet'],
      ['capybara-classique', 'Capybara classique', 'Classic Capybara', every(A), 'Les Prés'],
      ['capybara-tachete-gris', 'Capybara tacheté gris', 'Gray Spotted Capybara', [A, S, S, S, _, A, _], 'Le Lagon'],
      ['capybara-raye-rouge', 'Capybara rayé rouge et blanc', 'Red and White Striped Capybara', [_, _, _, _, _, _, A], 'Le Lagon'],
      ['capybara-toon', 'Capybara toon', 'Toon Capybara', every(A), 'Le Bosquet · après la quête « The Spark of Imagination »']
    ]
  },
  {
    id: 'cobra', name: 'Cobras', biome: 'dunes', method: 'redlight',
    tame: { min: 3, exact: true },
    fav: 'Œuf', liked: 'Produits laitiers et huiles',
    rewards: { fav: 'Éclat de rêve ×2, Éclat de souvenir, Sac de motifs', liked: 'Éclat de rêve, Éclat de souvenir, Agave ×3' },
    variants: [
      ['cobra-raye-bleu-rouge', 'Cobra rayé bleu et rouge', 'Blue and Red Striped Cobra', [A, S, S, _, A, _, S], 'Le Désert'],
      ['cobra-classique', 'Cobra classique', 'Classic Cobra', every(A), 'Les Plaines'],
      ['cobra-raye-vert', 'Cobra rayé vert et blanc', 'Green and White Striped Cobra', [_, _, _, _, A, _, _], 'La Lisière'],
      ['cobra-tachete-rose', 'Cobra tacheté rose', 'Pink Spotted Cobra', [M, A, _, M, M, A, _], 'L’Oasis'],
      ['cobra-toon', 'Cobra toon', 'Toon Cobra', every(A), 'Le Désert · après la quête « The Spark of Imagination »'],
      ['cobra-raye-jaune', 'Cobra rayé jaune et violet', 'Yellow and Purple Striped Cobra', [S, _, A, S, S, _, A], 'La Lisière']
    ]
  },
  {
    id: 'singe', name: 'Singes', biome: 'port', method: 'chase',
    fav: 'Desserts 5 étoiles', liked: 'Plats 3 étoiles ou plus',
    rewards: { fav: 'Éclat de rêve ×2, Éclat de souvenir, Sac de motifs', liked: 'Éclat de rêve, Éclat de souvenir, Cumin ×3' },
    variants: [
      ['singe-beige', 'Singe beige', 'Beige Monkey', [A, S, _, S, A, S, _], 'Les Ruines'],
      ['singe-noir-brun', 'Singe noir et brun', 'Black and Brown Monkey', [S, _, S, A, S, _, A], 'La Cour'],
      ['singe-noir-gris', 'Singe noir et gris', 'Black and Gray Monkey', [_, _, A, _, _, _, _], 'Les Ruines'],
      ['singe-classique', 'Singe classique', 'Classic Monkey', every(A), 'Les Quais'],
      ['singe-roux-beige', 'Singe roux et beige', 'Red and Beige Monkey', [_, M, A, M, _, M, A], 'Le Belvédère'],
      ['singe-toon', 'Singe toon', 'Toon Monkey', every(A), 'Les Quais · après la quête « The Spark of Imagination »']
    ]
  },
  {
    id: 'hibou', name: 'Hiboux', biome: 'reliure', method: 'none',
    fav: 'Orge', liked: 'Céréales',
    rewards: { fav: 'Éclat de rêve, Éclat de souvenir, Sac de motifs', liked: 'Éclat de rêve, Éclat de souvenir, Pomme de pin ×2' },
    variants: [
      ['hibou-brun', 'Hibou brun', 'Brown Owl', [_, A, A, A, A, A, _], 'Bibliothèque du savoir'],
      ['hibou-sombre', 'Hibou sombre', 'Dark Owl', [A, _, _, _, _, _, A], 'Bibliothèque du savoir'],
      ['hibou-blanc', 'Hibou blanc', 'White Owl', every([[15, 20]])],
      ['hibou-violet', 'Hibou violet', 'Purple Owl', every([[0, 9]])]
    ]
  },
  {
    id: 'dragon', name: 'Bébés dragons', biome: 'comte', method: 'patience',
    fav: 'Glace pure, Magma (normaux ou brillants)', liked: 'Gemmes',
    tip: 'Reste immobile à côté de lui quelques secondes, jusqu’à ce qu’il ne soit plus timide.',
    rewards: { fav: 'Éclat de rêve, Éclat de souvenir, Sac de motifs', liked: 'Éclat de rêve, Éclat de souvenir, Bois pétrifié ×2' },
    variants: [
      ['dragon-bleu', 'Bébé dragon bleu', 'Blue Baby Dragon', [_, _, A, A, A, A, _], 'Bois sauvages'],
      ['dragon-vert', 'Bébé dragon vert', 'Green Baby Dragon', [[[10, 18]], [[10, 18]], [[10, 18]], [[10, 18]], [[10, 18]], _, _], 'Forteresse tombée'],
      ['dragon-violet', 'Bébé dragon violet', 'Purple Baby Dragon', every(M), 'Marais du Haricot magique'],
      ['dragon-rouge', 'Bébé dragon rouge', 'Red Baby Dragon', [A, _, _, _, _, _, A], 'Chutes de la Théière'],
      ['dragon-sarcelle', 'Bébé dragon sarcelle', 'Teal Baby Dragon', [A, _, _, A, A, A, A], 'Bois sauvages']
    ]
  },
  {
    id: 'pegase', name: 'Pégases', biome: 'mythopie', method: 'chase',
    fav: 'Plats végétariens 5 étoiles', liked: 'Plats végétariens 4 étoiles ou moins',
    rewards: { fav: 'Éclat de rêve, Éclat de souvenir, Sac de motifs', liked: 'Éclat de rêve, Éclat de souvenir, Épice de foudre ×2' },
    variants: [
      ['pegase-noir', 'Pégase noir', 'Black Pegasus', [A, _, _, A, A, A, A], 'Champs Élysées'],
      ['pegase-bleu', 'Pégase bleu', 'Blue Pegasus', [_, A, A, A, _, _, _], 'Plaines ardentes'],
      ['pegase-peche', 'Pégase pêche', 'Peach Pegasus', every([[6, 14]]), 'Mont Olympe'],
      ['pegase-rose', 'Pégase rose', 'Pink Pegasus', [A, _, _, _, A, A, A], 'Champs Élysées'],
      ['pegase-jaune', 'Pégase jaune', 'Yellow Pegasus', [_, _, [[18, 24]], [[18, 24]], [[18, 24]], [[18, 24]], [[18, 24]]], 'Ombre de la Statue']
    ]
  },
  {
    id: 'oie', name: 'Oies', biome: 'alpes', method: 'patience',
    tame: { min: 1, exact: true },
    fav: 'Groseille rouge', liked: 'Myrtille, Groseille à maquereau, Framboise, Fraise',
    tip: 'Elles sont craintives et se cachent : attends qu’elles ressortent.',
    rewards: { fav: 'Éclat de rêve ×2, Éclat de souvenir, Sac de motifs', liked: 'Éclat de rêve, Éclat de souvenir, Graines de blé' },
    variants: [
      ['oie-noire', 'Oie noire', 'Black Goose', every([[5, 11]]), 'Sommet argenté'],
      ['oie-bleue', 'Oie bleue', 'Blue Goose', every([[18, 20]]), 'Voie des souhaits'],
      ['oie-doree', 'Oie dorée', 'Golden Goose', every([[7, 8], [19, 20]]), 'Combe du fouilleur'],
      ['oie-blanche', 'Oie', 'Goose', [A, A, _, A, _, A, _], 'Ranch de Florespérance'],
      ['oie-du-nord', 'Oie du nord', 'True North Goose', [_, _, A, _, A, _, A], 'Highlands du Ranch']
    ]
  },
  {
    id: 'mouffette', name: 'Mouffettes', biome: 'gulch', method: 'redlight',
    tame: { min: 2, exact: true },
    fav: 'Champignon de Paris, Pêche à aiguilles', liked: 'Fromage, Œuf, Fruits, Légumes',
    rewards: { fav: 'Éclat de rêve ×2, Éclat de souvenir, Sac de motifs', liked: 'Éclat de rêve, Éclat de souvenir, Graines de carotte' },
    variants: [
      ['mouffette-brune', 'Mouffette brune', 'Brown Skunk', [S, S, _, S, _, S, _], 'Parcs du cachemire'],
      ['mouffette-motifs', 'Mouffette à motifs', 'Patterned Skunk', every(A), 'Plateau Haute Couture · seulement par temps couvert ou pluie'],
      ['mouffette', 'Mouffette', 'Skunk', every(M), 'Rivière du podium'],
      ['mouffette-blanche', 'Mouffette blanche', 'White Skunk', [S, _, S, _, S, _, S], 'Marécage de la mode']
    ]
  },
  {
    id: 'abeille', name: 'Abeilles', biome: 'pixie', method: 'chase',
    tame: { min: 3, exact: true },
    fav: 'Corail de miel', liked: 'Toutes les fleurs',
    rewards: { fav: 'Éclat de rêve ×2, Éclat de souvenir, Sac de motifs', liked: 'Éclat de rêve, Éclat de souvenir, Graines d’épinard' },
    variants: [
      ['abeille-bleue', 'Abeille bleue', 'Blue Sweet Bee', every(A), 'Chutes du miel · seulement par temps clair'],
      ['abeille-rose', 'Abeille rose', 'Pink Sweet Bee', every(A), 'Plaines des fées'],
      ['abeille', 'Abeille', 'Sweet Bee', every([[7, 20]]), 'Rivages de la coupe glacée'],
      ['abeille-blanche', 'Abeille blanche', 'White Sweet Bee', every([[20, 24]]), 'Champs des Rêves bleus']
    ]
  }
];

// Liste à plat de toutes les couleurs, avec leur espèce.
export const VARIANTS = SPECIES.flatMap((sp) =>
  sp.variants.map(([id, name, file, schedule, extra]) => ({
    id, name, file, schedule, species: sp,
    // Pour les passereaux, extra = nourriture préférée ; sinon, sous-zone.
    favOverride: sp.id === 'passereau' ? extra : null,
    area: sp.id === 'passereau' ? null : extra || null
  }))
);

export const VARIANT = Object.fromEntries(VARIANTS.map((v) => [v.id, v]));

// Rareté : nombre d'heures de présence par semaine.
export function weeklyHours(schedule) {
  return schedule.reduce((sum, d) => sum + rangesOf(d).reduce((s, [a, b]) => s + (b - a), 0), 0);
}

export function rangesOf(day) {
  if (day === 'A') return [[0, 24]];
  if (day === 'M') return [[0, 12]];
  if (day === 'S') return [[12, 24]];
  if (Array.isArray(day)) return day;
  return [];
}
