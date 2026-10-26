// Ressources à récolter. Sources : Dreamlight Valley Wiki (Crop Seeds, Gems),
// Nintendo Life (pêche), Prima Games et Gamewave (cueillette).
// Les noms français marqués « todo » restent à confirmer dans le jeu.

// [nom, prix graine, minutes de pousse, prix de vente, biomes où acheter, arrosages]
export const CROPS = [
  ['Blé', 'Wheat', 1, 1, 2, ['prairie', 'port'], 1],
  ['Laitue', 'Lettuce', 3, 3, 8, ['prairie'], 1],
  ['Carotte', 'Carrot', 10, 15, 44, ['prairie'], 1],
  ['Canne à sucre', 'Sugarcane', 5, 7, 19, ['plage'], 1],
  ['Tomate', 'Tomato', 8, 25, 22, ['plage', 'meandres'], 2],
  ['Maïs', 'Corn', 15, 12, 16, ['plage', 'dunes'], 1],
  ['Poivron', 'Bell Pepper', 12, 15, 33, ['foret'], 1],
  ['Oignon', 'Onion', 50, 75, 170, ['foret'], 2],
  ['Riz', 'Rice', 35, 50, 61, ['bayou'], 1],
  ['Épinard', 'Spinach', 45, 60, 41, ['bayou'], 2],
  ['Gombo', 'Okra', 135, 120, 114, ['bayou'], 1],
  ['Courgette', 'Zucchini', 30, 40, 52, ['plateau'], 2],
  ['Piment', 'Chili Pepper', 20, 45, 78, ['plateau', 'dunes'], 1],
  ['Coton', 'Cotton', 42, 25, 37, ['plateau'], 3],
  ['Soja', 'Soya', 60, 90, 69, ['plateau'], 2],
  ['Concombre', 'Cucumber', 40, 75, 159, ['hauteurs'], 1],
  ['Aubergine', 'Eggplant', 95, 180, 308, ['hauteurs'], 2],
  ['Asperge', 'Asparagus', 150, 165, 133, ['hauteurs'], 2],
  ['Pomme de terre', 'Potato', 55, 35, 126, ['terres', 'meandres'], 3],
  ['Poireau', 'Leek', 120, 120, 309, ['terres'], 2],
  ['Citrouille', 'Pumpkin', 275, 240, 664, ['terres'], 2],
  ['Céleri', 'Celery', 20, 10, 65, ['port'], 1],
  ['Igname', 'Yam', 15, 15, 36, ['port'], 2],
  ['Raisin', 'Grape', 5, 20, 9, ['port'], 1],
  ['Figue cosmique', 'Cosmic Fig', 10, 25, 22, ['port'], 2],
  ['Colza', 'Canola', 25, 35, 109, ['foret', 'port'], 3],
  ['Brocoli', 'Broccoli', 60, 40, 152, ['dunes'], 2],
  ['Melon', 'Melon', 40, 30, 93, ['dunes'], 1],
  ['Haricot', 'Bean', 50, 60, 49, ['dunes'], 1],
  ['Racine-flûte', 'Flute Root', 70, 75, 112, ['dunes'], 2, true],
  ['Chou', 'Cabbage', 150, 60, 256, ['meandres'], 2],
  ['Ananas', 'Pineapple', 200, 180, 532, ['meandres'], 3],
  ['Navet', 'Turnip', 100, 240, 187, ['meandres'], 1],
  ['Lentille rubis', 'Ruby Lentil', 250, 120, 156, ['meandres'], 1, true],
  ['Orge', 'Barley', 15, 15, 15, ['reliure'], null],
  ['Chou-fleur', 'Cauliflower', 10, 10, 25, ['reliure'], null],
  ['Chia', 'Chia', 5, 5, 6, ['reliure'], null],
  // Nom confirmé via le wiki Fandom FR (ingrédient de recette « Courgerond »)
  ['Courgerond', 'Ring Squash', 20, 30, 41, ['reliure'], null],
  ['Melon miel', 'Honeydew', 40, 45, 125, ['mythopie'], null],
  ['Radicchio', 'Radicchio', 50, 60, 127, ['mythopie'], null],
  ['Poivre noir', 'Black Pepper', 70, 90, 83, ['mythopie'], null],
  ['Radis', 'Radish', 100, 105, 133, ['comte'], null],
  ['Avoine', 'Oat', 150, 120, 99, ['comte'], null],
  ['Seigle féerique', 'Faerie Rye', 60, 72, 62, ['comte'], null, true],
  ['Haricot vert', 'Green Bean', 250, 240, 209, ['comte'], null],
  ['Rhubarbe', 'Rhubarb', 200, 180, 229, ['comte'], null],
  ['Betterave', 'Beetroot', 10, 5, 21, ['alpes'], null]
].map(([name, file, seed, min, sell, biomes, water, todo]) => ({
  id: 'crop-' + file.toLowerCase().replace(/[^a-z]+/g, '-'),
  name, file: file + '.png', seed, min, sell, biomes, water, todo: !!todo,
  profit: Math.round(((sell - seed) / min) * 60)
}));

// [nom, nom anglais, biomes, remous, condition, utilité]
export const FISH = [
  ['Esturgeon blanc', 'White Sturgeon', ['hauteurs'], 'or', '', 'Nourriture préférée des renards'],
  ['Homard', 'Lobster', ['bayou'], 'or', '', 'Nourriture préférée des crocodiles'],
  // Nom confirmé par la fiche du wiki FR ; le remous y est bleu (pas or comme on l'avait noté)
  ['Thazard', 'Kingfish', ['plage'], 'bleu', 'Nuit', ''],
  ['Fugu', 'Fugu', ['plage'], 'or', 'Pluie', ''],
  ['Espadon', 'Swordfish', ['plage'], 'or', '', ''],
  ['Brochet', 'Pike', ['foret'], 'or', '', ''],
  ['Silure', 'Catfish', ['prairie'], 'or', '', ''],
  ['Baudroie', 'Anglerfish', ['terres'], 'or', '', ''],
  ['Doré jaune', 'Walleye', ['plateau'], 'or', '', ''],
  ['Crevette', 'Shrimp', ['plage'], 'bleu', '', 'Pour le Gumbo 5★'],
  // Nom confirmé via le wiki FR (même biome et remous que l'ancienne entrée)
  ['Cavalos', 'Lancetfish', ['terres'], 'bleu', '', ''],
  ['Calmar', 'Squid', ['bayou', 'terres'], 'bleu', '', ''],
  ['Crabe', 'Crab', ['hauteurs'], 'bleu', '', ''],
  ['Carpe', 'Carp', ['foret', 'plateau'], 'bleu', '', ''],
  ['Perche', 'Perch', ['foret', 'plateau'], 'bleu', '', ''],
  ['Brème', 'Bream', ['prairie'], 'bleu', '', ''],
  ['Tilapia', 'Tilapia', ['plateau', 'hauteurs'], 'bleu', '', ''],
  ['Hareng', 'Herring', ['plage', 'bayou'], 'blanc', '', 'Pour le Hareng mariné 5★'],
  ['Saumon', 'Salmon', ['plateau', 'hauteurs'], 'blanc', '', ''],
  ['Thon', 'Tuna', ['bayou', 'terres'], 'blanc', '', ''],
  ['Morue', 'Cod', ['plage', 'bayou', 'terres'], 'blanc', '', ''],
  ['Bar', 'Bass', ['prairie', 'foret', 'plateau', 'hauteurs'], 'blanc', '', ''],
  ['Truite arc-en-ciel', 'Rainbow Trout', ['prairie', 'foret'], 'blanc', '', ''],
  ['Sole', 'Sole', ['terres'], 'blanc', '', '']
].map(([name, file, biomes, ripple, cond, use, todo]) => ({
  id: 'fish-' + file.toLowerCase().replace(/[^a-z]+/g, '-'),
  name, file: file + '.png', biomes, ripple, cond, use, todo: !!todo
}));

// [nom, nom anglais, biomes ('*' = partout), prix]
export const GEMS = [
  ['Diamant', 'Diamond', ['terres'], 600],
  ['Améthyste', 'Amethyst', ['hauteurs', 'terres'], 500],
  ['Zircon bleu', 'Blue Zircon', ['meandres'], 500],
  ['Pierre alvéolée', 'Honeycomb Stone', ['pixie'], 550, true],
  ['Spinelle', 'Spinel', ['meandres'], 450],
  ['Saphir étoilé', 'Star Sapphire', ['comte'], 450, true],
  ['Tourmaline', 'Tourmaline', ['plateau', 'hauteurs'], 420],
  ['Magma', 'Magma', ['mythopie'], 400],
  // Nom confirmé via le wiki FR (champ nom_vo de la fiche)
  ['Miellite', 'Bumblestone', ['dunes'], 400],
  ['Jaspe', 'Jasper', ['gulch'], 400],
  ['Citrine', 'Citrine', ['bayou', 'plateau'], 380],
  ['Alexandrite', 'Alexandrite', ['dunes'], 350],
  ['Émeraude', 'Emerald', ['foret', 'bayou'], 325],
  ['Onyx', 'Onyx', ['*'], 300],
  ['Opale', 'Opal', ['reliure'], 300],
  ['Glace pure', 'Pure Ice', ['comte'], 300],
  // Nom confirmé via le wiki FR (même biome et prix que l'ancienne entrée)
  ['Perrénite', 'Evergem', ['port'], 300],
  ['Aigue-marine', 'Aquamarine', ['plage', 'foret'], 250],
  ['Jade', 'Jade', ['port'], 250],
  ['Pyrite', 'Pyrite', ['alpes'], 250],
  ['Topaze', 'Topaz', ['esplanade', 'port', 'reliure'], 240],
  ['Péridot', 'Peridot', ['prairie', 'plage', 'meandres'], 200],
  ['Grenat', 'Garnet', ['esplanade', 'prairie', 'dunes'], 160]
].map(([name, file, biomes, price, todo]) => ({
  id: 'gem-' + file.toLowerCase().replace(/[^a-z]+/g, '-'),
  name, file: file + '.png', biomes, price, todo: !!todo
}));

// [catégorie, nom, nom anglais, biomes, prix de vente (0 = inconnu), utilité]
export const FORAGE = [
  ['fruit', 'Myrtille', 'Blueberry', ['foret', 'plage'], 29, 'Préférée des ratons laveurs'],
  ['fruit', 'Groseille à maquereau', 'Gooseberry', ['hauteurs', 'terres'], 50, ''],
  ['fruit', 'Cerise', 'Cherry', ['hauteurs', 'plateau'], 42, ''],
  ['fruit', 'Noix de coco', 'Coconut', ['plage'], 42, ''],
  ['fruit', 'Fève de cacao', 'Cocoa Bean', ['plateau', 'bayou'], 38, 'Pour le Gâteau d’anniversaire 5★'],
  ['fruit', 'Citron', 'Lemon', ['foret', 'bayou'], 33, ''],
  ['fruit', 'Banane', 'Banana', ['prairie', 'plage'], 29, 'Pour le Banana split 5★'],
  ['fruit', 'Pomme', 'Apple', ['esplanade', 'terres'], 25, ''],
  ['fruit', 'Framboise', 'Raspberry', ['esplanade', 'prairie'], 21, ''],
  ['fruit', 'Fraise', 'Strawberry', ['port'], 0, ''],
  ['fruit', 'Poire nichée', 'Nestling Pear', ['port'], 0, ''],
  ['fruit', 'Amande', 'Almond', ['meandres'], 0, ''],
  // Nom confirmé via le wiki FR (ingrédient de recette « Fantasmangue », pas « Dreamangue »)
  ['fruit', 'Fantasmangue', 'Dreamango', ['meandres'], 0, ''],
  ['fruit', 'Datte', 'Date', ['dunes'], 0, ''],
  ['fruit', 'Cactobaie', 'Cactoberry', ['dunes'], 0, ''],
  ['epice', 'Basilic', 'Basil', ['prairie'], 0, 'Pour l’Omelette au basilic 4★'],
  ['epice', 'Origan', 'Oregano', ['esplanade'], 0, ''],
  ['epice', 'Ail', 'Garlic', ['foret'], 0, ''],
  ['epice', 'Gingembre', 'Ginger', ['terres'], 0, ''],
  ['epice', 'Menthe', 'Mint', ['hauteurs'], 0, ''],
  ['epice', 'Vanille', 'Vanilla', ['plateau'], 0, ''],
  ['epice', 'Cumin', 'Cumin', ['port'], 0, ''],
  // Nom confirmé via le wiki FR (ingrédient de recette « Majesthé »)
  ['epice', 'Majesthé', 'Majestea', ['port'], 0, ''],
  ['epice', 'Cannelle', 'Cinnamon', ['meandres'], 0, ''],
  ['epice', 'Agave', 'Agave', ['dunes'], 0, ''],
  ['epice', 'Paprika', 'Paprika', ['dunes'], 0, ''],
  ['champi', 'Champignon', 'Mushroom', ['bayou'], 0, '']
].map(([cat, name, file, biomes, price, use, todo]) => ({
  id: 'forage-' + file.toLowerCase().replace(/[^a-z]+/g, '-'),
  cat, name, file: file + '.png', biomes, price, use, todo: !!todo
}));

export const RIPPLES = {
  blanc: { label: 'Blanc', color: '#F4F0FF' },
  bleu: { label: 'Bleu', color: '#7DB4F5' },
  or: { label: 'Or', color: '#F5C95C' }
};
