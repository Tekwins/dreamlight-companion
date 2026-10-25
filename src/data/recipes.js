// Recettes. Échantillon vérifié (Dot Esports, VGC) en attendant le script complet.
// type : E = entrée, P = plat, D = dessert. veg = végétarien (pour les Pégases).
// Les ingrédients génériques (Légume, Fruit, Épice, Céréale, Poisson…) acceptent
// n'importe quel ingrédient de la catégorie.

export const RECIPE_TYPES = { E: 'Entrée', P: 'Plat', D: 'Dessert' };

export const RECIPES = [
  ['Plateau de fromages', 'Cheese Platter', 'E', 1, ['Fromage'], true],
  ['Crackers', 'Crackers', 'E', 1, ['Céréale'], true],
  ['Soupe de légumes', 'Vegetable Soup', 'E', 2, ['Légume', 'Légume'], true],
  ['Latte', 'Latte', 'E', 2, ['Grain de café', 'Lait'], true],
  ['Bouchées de pommes de terre', 'Potato Puffs', 'E', 3, ['Pomme de terre', 'Œuf', 'Fromage'], true],
  ['Velouté', 'Creamy Soup', 'E', 4, ['Herbe', 'Lait', 'Pomme de terre', 'Légume'], true],
  ['Pétillant de rêve', 'Dream Fizz', 'E', 4, ['Fruit de rêve', 'Canne à sucre', 'Blé', 'Glace pilée'], true],
  ['Hareng mariné d’Arendelle', 'Arendellian Pickled Herring', 'E', 5, ['Hareng', 'Citron', 'Oignon', 'Ail', 'Épice'], false],
  ['Soupe poireaux-pommes de terre', 'Potato Leek Soup', 'E', 5, ['Pomme de terre', 'Poireau', 'Lait', 'Oignon', 'Ail'], true],
  ['Salade méditerranéenne', 'Mediterranean Salad', 'E', 5, ['Concombre', 'Tomate', 'Oignon', 'Laitue', 'Épice'], true],
  ['Amuse-bouches', 'Hors d’Oeuvres', 'P', 1, ['Épice'], true],
  ['Poisson grillé', 'Grilled Fish', 'P', 1, ['Poisson'], false],
  ['Sushis', 'Sushi', 'P', 2, ['Riz', 'Algue'], false],
  ['Œufs brouillés', 'Scrambled Egg', 'P', 2, ['Œuf', 'Fromage'], true],
  ['Tourte au poisson', 'Fish Pie', 'P', 3, ['Poisson', 'Blé', 'Beurre'], false],
  ['Omelette', 'Omelet', 'P', 3, ['Œuf', 'Fromage', 'Lait'], true],
  ['Omelette au basilic', 'Basil Omelet', 'P', 4, ['Œuf', 'Basilic', 'Fromage', 'Lait'], true],
  ['Pizza margherita', 'Margherita Pizza', 'P', 4, ['Fromage', 'Tomate', 'Blé', 'Épice'], true],
  ['Pizza grecque', 'Greek Pizza', 'P', 5, ['Tomate', 'Fromage', 'Blé', 'Oignon', 'Épice'], true],
  ['Pizza végétarienne', 'Vegetarian Pizza', 'P', 5, ['Légume', 'Légume', 'Blé', 'Fromage', 'Tomate'], true],
  ['Ratatouille', 'Ratatouille', 'P', 5, ['Tomate', 'Oignon', 'Aubergine', 'Courgette', 'Épice'], true],
  ['Gumbo', 'Gumbo', 'P', 5, ['Tomate', 'Oignon', 'Piment', 'Crevette', 'Gombo'], false],
  ['Poisson créole', 'Fish Creole', 'P', 5, ['Poisson', 'Légume', 'Tomate', 'Riz', 'Ail'], false],
  ['Congee de Mushu', 'Mushu’s Congee', 'P', 5, ['Riz', 'Œuf', 'Champignon', 'Ail', 'Gingembre'], false],
  ['Bouillabaisse', 'Bouillabaisse', 'P', 5, ['Fruits de mer', 'Fruits de mer', 'Légume', 'Crevette', 'Tomate'], false],
  ['Lobster roll', 'Lobster Roll', 'P', 5, ['Homard', 'Blé', 'Citron', 'Beurre', 'Ail'], false],
  ['Burger de thon', 'Tuna Burger', 'P', 5, ['Thon', 'Blé', 'Oignon', 'Citron', 'Légume'], false],
  ['Saumon teriyaki', 'Teriyaki Salmon', 'P', 5, ['Saumon', 'Riz', 'Gingembre', 'Soja', 'Canne à sucre'], false],
  ['Salade de fruits', 'Fruit Salad', 'D', 1, ['Fruit'], true],
  ['Pommes caramélisées', 'Caramel Apples', 'D', 2, ['Canne à sucre', 'Pomme'], true],
  ['Tarte aux pommes', 'Apple Pie', 'D', 3, ['Pomme', 'Blé', 'Beurre'], true],
  ['Gaufres', 'Waffles', 'D', 4, ['Blé', 'Lait', 'Œuf', 'Canne à sucre'], true],
  ['Banana split', 'Banana Split', 'D', 5, ['Banane', 'Glace pilée', 'Lait', 'Canne à sucre', 'Sucrerie'], true],
  ['Gâteau d’anniversaire', 'Birthday Cake', 'D', 5, ['Fève de cacao', 'Blé', 'Canne à sucre', 'Œuf', 'Beurre'], true],
  ['Gâteau d’Aurore', 'Aurora’s Cake', 'D', 5, ['Blé', 'Œuf', 'Canne à sucre', 'Lait', 'Framboise'], true],
  ['Gâteau de mariage', 'Wedding Cake', 'D', 5, ['Vanille', 'Canne à sucre', 'Beurre', 'Blé', 'Œuf'], true],
  ['Crème pâtissière aux fruits', 'Pastry Cream and Fruits', 'D', 5, ['Fruit', 'Fruit', 'Fruit', 'Canne à sucre', 'Lait'], true]
].map(([name, en, type, stars, ingredients, veg]) => ({
  id: 'recipe-' + en.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, ''),
  name, file: en.replace(/’/g, "'") + '.png', type, stars, ingredients, veg
}));

// Catégories : un ingrédient générique est satisfait par n'importe lequel de ces objets.
export const CATEGORIES = {
  'Légume': ['Tomate', 'Oignon', 'Pomme de terre', 'Courgette', 'Aubergine', 'Carotte', 'Laitue', 'Concombre', 'Poireau', 'Gombo', 'Piment', 'Poivron', 'Citrouille', 'Chou', 'Brocoli', 'Épinard'],
  'Céréale': ['Blé', 'Riz', 'Orge', 'Maïs'],
  'Fruit': ['Pomme', 'Banane', 'Citron', 'Myrtille', 'Framboise', 'Cerise', 'Noix de coco', 'Fraise', 'Melon', 'Ananas'],
  'Épice': ['Basilic', 'Ail', 'Origan', 'Gingembre', 'Menthe', 'Vanille', 'Cumin', 'Cannelle', 'Paprika'],
  'Herbe': ['Basilic', 'Origan', 'Menthe'],
  'Poisson': ['Hareng', 'Thon', 'Saumon', 'Morue', 'Bar', 'Carpe', 'Perche', 'Sole', 'Truite arc-en-ciel'],
  'Fruits de mer': ['Crevette', 'Homard', 'Crabe', 'Calmar'],
  'Sucrerie': ['Canne à sucre', 'Vanille', 'Fève de cacao']
};

// Ingrédients proposés dans le garde-manger, par rayon.
export const PANTRY_GROUPS = [
  ['Légumes', ['Tomate', 'Oignon', 'Pomme de terre', 'Courgette', 'Aubergine', 'Carotte', 'Laitue', 'Concombre', 'Poireau', 'Gombo', 'Piment']],
  ['Fruits', ['Pomme', 'Banane', 'Citron', 'Framboise', 'Fève de cacao']],
  ['Épices et herbes', ['Basilic', 'Ail', 'Origan', 'Gingembre', 'Vanille']],
  ['Céréales et sucre', ['Blé', 'Riz', 'Canne à sucre', 'Soja']],
  ['Crèmerie (chez Rémy)', ['Fromage', 'Lait', 'Œuf', 'Beurre']],
  ['Mer', ['Poisson', 'Hareng', 'Thon', 'Saumon', 'Crevette', 'Homard', 'Algue']],
  ['Autres', ['Champignon', 'Glace pilée', 'Grain de café']]
];

export function ingredientOwned(ing, have) {
  if (have[ing]) return true;
  if (ing === 'Poisson' && Object.keys(have).some((k) => have[k] && CATEGORIES['Poisson'].includes(k))) return true;
  return (CATEGORIES[ing] || []).some((x) => have[x]);
}

export function missingFor(recipe, have) {
  return Array.from(new Set(recipe.ingredients)).filter((i) => !ingredientOwned(i, have));
}
