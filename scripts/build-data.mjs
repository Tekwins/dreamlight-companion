#!/usr/bin/env node
// Génère src/data/recipes.js (et prépare villagers/succès/voie des étoiles) à partir
// des pages brutes de data/raw/frfandom (wiki Fandom francophone : noms déjà en français).
//
// Utilisation : npm run build-data

import { readFile, readdir, writeFile } from 'node:fs/promises';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([a-zA-Z]:)/, '$1');
const RAW = ROOT + 'data/raw/frfandom';

function num(s) {
  return parseInt((s || '').replace(/[^0-9]/g, ''), 10) || 0;
}

function slug(name) {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Catégories d'extension telles que taguées en fin de page sur le wiki FR.
const EXT_CAT = {
  "A Rift in Time (Île de l'Éternité)": 'rift',
  'The Storybook Vale': 'vale',
  'Wishblossom Ranch': 'ranch',
  'Honeyglow Woods': 'honeyglow'
};

// Normalise les variantes singulier/pluriel ou alias d'un même ingrédient générique ou nommé.
const NORMALIZE = {
  'Légumes': 'Légume', 'Fruits': 'Fruit', 'Céréales': 'Céréale', 'Poissons': 'Poisson',
  'Épices et herbes': 'Épice', 'Épices': 'Épice',
  'Sucres': 'Sucrerie', 'Sucré': 'Sucrerie',
  'Protéine': 'Protéines',
  'Oeuf': 'Œuf', 'Oeufs': 'Œufs', 'Algues': 'Algue', 'Glaces': 'Glace pilée',
  'Calamar': 'Calmar', 'Dattes': 'Datte', 'Épinards': 'Épinard',
  "Figues cosmiques": 'Figue cosmique', 'Cactibaies': 'Cactobaie', "Poires nichées": 'Poire nichée'
};

function normalizeIngredient(name) {
  return NORMALIZE[name] || name;
}

async function parsePlats() {
  const files = (await readdir(RAW)).filter((f) => !f.startsWith('_'));
  const recipes = [];
  for (const f of files) {
    const raw = JSON.parse(await readFile(RAW + '/' + f, 'utf8'));
    const wt = raw.wikitext || '';
    if (!/\{\{Plats\|/.test(wt) || raw.title.startsWith('Modèle')) continue;

    const img = wt.match(/image1=([^|\n]+?\.png)/);
    const price = wt.match(/prix_de_vente=([^{|\n]+)\{\{Pièce\}\}/);
    const energy = wt.match(/energie=([^{|\n]+)\{\{Energie\}\}/);
    const etoile = wt.match(/etoile=(★+)/);
    const ingField = wt.match(/ingrédients=([\s\S]*?)\|\s*(?:<br\s*\/?>\s*)?(?:row2|etoile)=/i);
    if (!etoile || energy == null || price == null || !ingField) continue;

    const cats = [...wt.matchAll(/\[\[Catégorie:([^\]]+)\]\]/g)].map((m) => m[1]);
    let type = null;
    for (const c of cats) {
      if (c.includes("Hors-d'oeuvre")) type = 'E';
      else if (c.includes('Plats principaux')) type = 'P';
      else if (c.includes('Desserts')) type = 'D';
    }
    if (!type) continue;
    let ext = null;
    for (const c of cats) if (EXT_CAT[c]) ext = EXT_CAT[c];

    const ingredients = [];
    const re = /\[\[:Catégorie:[^|\]]+\|([^\]]+)\]\]|\[\[:Catégorie:([^\]|]+)\]\]|\{\{Cat\|([^}|]+)\}\}|\[\[([^\]|]+)\]\]/g;
    let m;
    while ((m = re.exec(ingField[1]))) {
      const val = m[1] || m[2] || m[3] || m[4];
      if (val && val !== 'Plats') ingredients.push(normalizeIngredient(val));
    }
    if (!ingredients.length) continue;

    recipes.push({
      name: raw.title,
      file: img ? img[1] : raw.title + '.png',
      type,
      stars: etoile[1].length,
      energy: num(energy[1]),
      price: num(price[1]),
      ingredients,
      ext
    });
  }
  return recipes;
}

// Ingrédients animaux (poisson, fruits de mer, viande) : cassent le flag "veg".
const NON_VEG = new Set([
  'Poisson', 'Fruits de mer', 'Protéines', 'Volaille', 'Porc', 'Gibier',
  'Hareng', 'Thon', 'Saumon', 'Morue', 'Bar', 'Truite arc-en-ciel', 'Crevette', 'Homard', 'Calmar', 'Crabe',
  'Carpe', 'Carpe koï', 'Perche', 'Brème', 'Tilapia', 'Esturgeon blanc', 'Thazard', 'Fugu', 'Espadon',
  'Baudroie', 'Doré jaune', 'Sole', 'Moule', 'Huître', 'Pétoncle', 'Palourde', 'Pieuvre', 'Piranha',
  'Alose', 'Bar alpin rouge', 'Anguille électrique', 'Pirarucu', 'Lamproie', 'Scorpion',
  'Poisson tigré', 'Poisson volant', 'Poisson-robot', 'Poisson-squelette', 'Poisson en peluche',
  'Poisson des sables', 'Poisson des dunes', 'Poisson blanc des montagnes', "Poisson de l'Ici et là",
  'Crevette prismatique', 'Hippocampe', 'Escargot trompette', 'Escargot de mer',
  "Bernard-l'hermite à chapeau de sorcier", 'Loup de mer', 'Périophtalme stygien',
  'Jolie étoile de mer rose', 'Étoile de mer bleue brillante', 'Caviar vert', 'Corail de miel', 'Cavalos', 'Ver des sables'
]);

function isVeg(ingredients) {
  return !ingredients.some((i) => NON_VEG.has(i));
}

// Rayons du garde-manger : classement des ingrédients spécifiques (hors catégories génériques).
const AISLES = {
  'Légumes': ['Tomate', 'Oignon', 'Pomme de terre', 'Courgette', 'Aubergine', 'Carotte', 'Laitue', 'Concombre', 'Poireau', 'Gombo', 'Piment',
    'Maïs', 'Olives', 'Haricots', 'Radis', 'Chou de Bruxelles', 'Poivron', 'Haricots verts', 'Chou-fleur', 'Citrouille', 'Radicchio', 'Asperge',
    "L-OEUF-gumes de printemps", 'Betterave', 'Chou', 'Céleri', 'Navet', 'Chou frisé écarlate', 'Cosses de bourgeon-bouffi', 'Bambou',
    'Pâtisson doré', 'Panais', 'Brocoli', 'Lentilles corail', 'Yuccarina', 'Okra', 'Épinard', 'Colza', 'Courgerond'],
  'Fruits': ['Pomme', 'Banane', 'Citron', 'Framboise', 'Fève de cacao', 'Amandes', 'Ambroisie', 'Fraises spirales', 'Baies acidulées',
    'Groseille', 'Myrtille', 'Noix de coco', 'Kaki', 'Cerise', 'Fraise', 'Fruit de Dreamlight', 'Noix de muscade', 'Pomme d\'or', 'Melon miel',
    'Rhubarbe', 'Pêche à aiguilles', 'Datte', 'Physalis', 'Ananas', 'Cacahuète', 'Carambole', 'Châtaigne', 'Fruit délici-oeuf', 'Baie de genièvre',
    'Raisin', 'Figue cosmique', 'Cactobaie', 'Fantasmangue', 'Fruit sucette', 'Groseilles rouges', 'Poire nichée', 'Melon'],
  'Épices et herbes': ['Basilic', 'Ail', 'Origan', 'Gingembre', 'Vanille', 'Menthe', 'Cannelle', 'Cumin', 'Épice foudroyante', 'Poivre noir',
    'Paprika', 'Noix de muscade', 'Aneth', 'Majesthé', 'Baie de genièvre',
    'Feuilles de thé au chrysanthème', 'Feuilles de thé au jasmin', 'Feuilles de thé oolong'],
  'Céréales et sucre': ['Blé', 'Riz', 'Canne à sucre', 'Soja', 'Avoine', 'Agave', 'Miel doré', 'Graines de chia', 'Grain élyséen',
    'Seigle féerique', 'Fève de cacao festive', 'Guimauve rose', 'Guimauve bleue', 'Orge perlé', 'Orge', 'Gelée sucrée', 'Blé khorasan féerique'],
  'Crèmerie (chez Rémy)': ['Fromage', 'Lait', 'Œuf', 'Beurre', 'Yaourt', 'Feta feuillet', 'Œufs d\'oiseau-pelle', 'Œuf printanier sauvage'],
  'Mer': ['Poisson', 'Hareng', 'Thon', 'Saumon', 'Crevette', 'Homard', 'Algue', 'Morue', 'Bar', 'Truite arc-en-ciel', 'Calmar', 'Crabe',
    'Carpe', 'Carpe koï', 'Perche', 'Brème', 'Tilapia', 'Esturgeon blanc', 'Thazard', 'Fugu', 'Espadon', 'Baudroie', 'Doré jaune', 'Sole',
    'Moule', 'Huître', 'Pétoncle', 'Palourde', 'Pieuvre', 'Piranha', 'Alose', 'Bar alpin rouge', 'Anguille électrique', 'Pirarucu', 'Lamproie',
    'Poisson tigré', 'Poisson volant', 'Poisson-robot', 'Poisson-squelette', 'Poisson en peluche', 'Poisson des sables', 'Poisson des dunes',
    'Poisson blanc des montagnes', "Poisson de l'Ici et là", 'Crevette prismatique', 'Hippocampe', 'Escargot trompette', 'Escargot de mer',
    "Bernard-l'hermite à chapeau de sorcier", 'Loup de mer', 'Périophtalme stygien', 'Jolie étoile de mer rose', 'Étoile de mer bleue brillante',
    'Caviar vert', 'Corail de miel', 'Cavalos'],
  'Autres': ['Champignon', 'Glace pilée', 'Grain de café', 'Volaille', 'Porc', 'Gibier', 'Porcinis', 'Truffe', 'Résine d\'arbre', 'Ver des sables', 'Scorpion']
};

function buildPantryGroups(allIngredients) {
  const placed = new Set();
  const groups = Object.entries(AISLES).map(([title, items]) => {
    const present = [...new Set(items)].filter((i) => allIngredients.has(i) && !placed.has(i));
    present.forEach((i) => placed.add(i));
    return [title, present];
  });
  const rest = [...allIngredients].filter((i) => !placed.has(i));
  if (rest.length) groups[groups.length - 1][1] = [...groups[groups.length - 1][1], ...rest];
  // Ordre alphabétique français réel dans chaque rayon (pas l'ordre de fréquence du wiki anglais).
  for (const g of groups) g[1].sort((a, b) => a.localeCompare(b, 'fr'));
  return groups;
}

function jsArray(arr, indent = '  ') {
  return '[' + arr.map((x) => (typeof x === 'string' ? `'${x.replace(/'/g, "\\'")}'` : x)).join(', ') + ']';
}

// Ordre alphabétique français réel (pas l'ordre de fréquence du wiki anglais).
function sortedFr(arr) {
  return [...arr].sort((a, b) => a.localeCompare(b, 'fr'));
}

// Ids déjà utilisés dans l'ancienne liste d'habitants (progression d'amitié déjà enregistrée
// chez les joueurs par cet id en localStorage/Supabase) : on les conserve à l'identique.
const OLD_VILLAGER_ID = {
  'Mickey': 'mickey', 'Minnie': 'minnie', 'Dingo': 'dingo', 'Donald': 'donald', 'Rémy': 'remy',
  'Merlin': 'merlin', 'Elsa': 'elsa', 'Anna': 'anna', 'Kristoff': 'kristoff', 'Vaiana': 'vaiana',
  'Maui': 'maui', 'Scar': 'scar', 'Ursula': 'ursula', 'WALL-E': 'walle', 'Mirabel': 'mirabel',
  'Simba': 'simba', 'Nala': 'nala', 'Stitch': 'stitch', 'Belle': 'belle', 'La Bête': 'bete',
  'Mère Gothel': 'gothel', 'Raiponce': 'raiponce', "Buzz l'Éclair": 'buzz', 'Woody': 'woody',
  'Jack Skellington': 'jack', 'Oswald': 'oswald', 'Vanellope': 'vanellope', 'Ariel': 'ariel',
  'Prince Eric': 'eric', 'Mulan': 'mulan', 'Mushu': 'mushu', 'Cruella': 'cruella'
};

// La page "L'Oublié" a une infobox mal renseignée (image d'une autre entité, "La reine noir") :
// on retombe sur le nom de la page pour le fichier image plutôt que cette valeur erronée.
const VILLAGER_FILE_OVERRIDE = { "L'Oublié": "L'Oublié.png" };

async function parsePersonnages() {
  const files = (await readdir(RAW)).filter((f) => !f.startsWith('_'));
  const villagers = [];
  for (const f of files) {
    const raw = JSON.parse(await readFile(RAW + '/' + f, 'utf8'));
    const wt = raw.wikitext || '';
    if (!/\{\{Personnages\|/.test(wt) || raw.title.startsWith('Modèle')) continue;
    const img = wt.match(/image1=([^|\n]+?\.png)/);
    if (!img && !VILLAGER_FILE_OVERRIDE[raw.title]) continue;
    const cats = [...wt.matchAll(/\[\[Catégorie:([^\]]+)\]\]/g)].map((m) => m[1]);
    let ext = null;
    for (const c of cats) if (EXT_CAT[c]) ext = EXT_CAT[c];
    const name = raw.title;
    const id = OLD_VILLAGER_ID[name] || slug(name);
    const file = VILLAGER_FILE_OVERRIDE[name] || img[1];
    villagers.push({ id, name, file, ext });
  }
  return villagers.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

async function writeVillagers(villagers) {
  const lines = [];
  lines.push('// Habitants, générés depuis le wiki Fandom francophone (Catégorie:Personnages).');
  lines.push('// ext : extension requise.');
  lines.push('export const VILLAGERS = [');
  for (const v of villagers) {
    lines.push(`  ['${v.id}', '${v.name.replace(/'/g, "\\'")}', '${v.file.replace(/'/g, "\\'")}'${v.ext ? `, '${v.ext}'` : ''}],`);
  }
  lines.push('].map(([id, name, file, ext]) => ({ id, name, file, ext: ext || null }));');
  lines.push('');
  await writeFile(ROOT + 'src/data/villagers.js', lines.join('\n'));
  console.log('src/data/villagers.js écrit (' + villagers.length + ' habitants).');
}

async function parseSucces() {
  const raw = JSON.parse(await readFile(RAW + '/Succès.json', 'utf8'));
  const wt = raw.wikitext || '';
  const rows = wt.split('|-').slice(1).map((r) => r.trim()).filter((r) => r && !r.startsWith('style=') && !r.startsWith('!'));
  const items = [];
  for (const row of rows) {
    const cells = row.split('\n').map((c) => c.replace(/^\|/, '').trim()).filter((c) => c.length);
    if (cells.length < 5) continue;
    const [name, action, xbox, ps, steam] = cells;
    items.push({ id: 'succes-' + slug(name), name, action, rewards: { xbox, ps, steam } });
  }
  return items;
}

async function writeAchievements(items) {
  const lines = [];
  lines.push('// Succès, générés depuis le wiki Fandom francophone (page "Succès").');
  lines.push("// rewards : récompense sur chaque plateforme ('-' = non applicable).");
  lines.push('export const ACHIEVEMENTS = [');
  for (const a of items) {
    lines.push(`  { id: '${a.id}', name: '${a.name.replace(/'/g, "\\'")}', action: '${a.action.replace(/'/g, "\\'")}', rewards: { xbox: '${a.rewards.xbox}', ps: '${a.rewards.ps}', steam: '${a.rewards.steam}' } },`);
  }
  lines.push('];');
  lines.push('');
  await writeFile(ROOT + 'src/data/achievements.js', lines.join('\n'));
  console.log('src/data/achievements.js écrit (' + items.length + ' succès).');
}

function cleanWikitext(s) {
  return s
    .replace(/\{\{Cat\|([^}|]+)\}\}/g, '$1')
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/\[\[[^\]|]*\|([^\]]+)\]\]/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/<br\s*\/?>/gi, ' · ')
    .replace(/'''/g, '')
    .replace(/''/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function parseStarPath(file) {
  const raw = JSON.parse(await readFile(RAW + '/' + file, 'utf8'));
  const wt = raw.wikitext || '';
  const dates = wt.match(/Disponible du ([^.\n]+)\./);
  const desc = wt.match(/''([^']{20,}?)''/);
  const tiers = [];
  const tierRe = /===Palier (\d+)===[\s\S]*?<gallery[^>]*>([\s\S]*?)<\/gallery>/g;
  let m;
  while ((m = tierRe.exec(wt))) {
    const rewards = m[2].split('\n').map((l) => l.trim()).filter(Boolean).map((line) => {
      const [filePart, ...rest] = line.split('|');
      return { file: filePart.trim(), caption: cleanWikitext(rest.join('|')) };
    }).filter((r) => r.caption);
    tiers.push({ tier: Number(m[1]), rewards });
  }
  return {
    id: 'starpath-' + slug(raw.title),
    name: raw.title.replace(/^Voie des étoiles /, ''),
    dates: dates ? dates[1].trim() : '',
    description: desc ? cleanWikitext(desc[1]) : '',
    tiers
  };
}

async function writeStarPath(paths) {
  const lines = [];
  lines.push('// Voie des étoiles en cours, générées depuis le wiki Fandom francophone.');
  lines.push('// À régénérer avec npm run data puis npm run build-data quand la Voie des étoiles change.');
  lines.push('export const STAR_PATHS = ' + JSON.stringify(paths, null, 1) + ';');
  lines.push('');
  await writeFile(ROOT + 'src/data/starpath.js', lines.join('\n'));
  console.log('src/data/starpath.js écrit (' + paths.length + ' voies).');
}

// Liste minimale (nom seulement) : le détail par quête (récompenses, étapes) demande
// de scraper chaque page individuellement, pas encore fait (voir _liste_Quêtes.json).
async function writeQuestsList() {
  const raw = JSON.parse(await readFile(RAW + '/_liste_Quêtes.json', 'utf8'));
  const names = raw.titles.filter((t) => !t.startsWith('Modèle')).sort((a, b) => a.localeCompare(b, 'fr'));
  const lines = [];
  lines.push('// Liste des quêtes (noms uniquement), générée depuis le wiki Fandom francophone.');
  lines.push('// Le détail (récompenses, étapes, donneur) demande de scraper chaque page individuellement : pas encore fait.');
  lines.push('export const QUESTS = [');
  for (const name of names) {
    lines.push(`  { id: 'quest-${slug(name)}', name: '${name.replace(/'/g, "\\'")}' },`);
  }
  lines.push('];');
  lines.push('');
  await writeFile(ROOT + 'src/data/quests.js', lines.join('\n'));
  console.log('src/data/quests.js écrit (' + names.length + ' quêtes, noms seulement).');
}

async function main() {
  const recipes = await parsePlats();
  console.log('Recettes extraites :', recipes.length);

  // "Poisson" reste affiché comme ingrédient du garde-manger (cf. ingredientOwned : "j'ai un poisson, peu importe lequel").
  const genericKeys = new Set(['Légume', 'Fruit', 'Céréale', 'Épice', 'Herbe', 'Fruits de mer', 'Sucrerie', 'Protéines', 'Laitages']);
  const allIngredients = new Set();
  for (const r of recipes) for (const i of r.ingredients) if (!genericKeys.has(i)) allIngredients.add(i);

  const lines = [];
  lines.push("// Recettes complètes, générées depuis le wiki Fandom francophone (Catégorie:Plats).");
  lines.push("// type : E = entrée, P = plat, D = dessert. veg = végétarien (pour les Pégases), déduit des ingrédients.");
  lines.push("// Les ingrédients génériques (Légume, Fruit, Épice, Céréale, Poisson, Fruits de mer, Sucrerie, Protéines, Laitages…) acceptent");
  lines.push("// n'importe quel ingrédient de la catégorie.");
  lines.push('');
  lines.push("export const RECIPE_TYPES = { E: 'Entrée', P: 'Plat', D: 'Dessert' };");
  lines.push('');
  lines.push('export const RECIPES = [');
  for (const r of recipes.sort((a, b) => a.name.localeCompare(b.name, 'fr'))) {
    const file = `'${r.file.replace(/'/g, "\\'")}'`;
    lines.push(`  ['${r.name.replace(/'/g, "\\'")}', ${file}, '${r.type}', ${r.stars}, ${r.energy}, ${r.price}, ${jsArray(r.ingredients)}, ${isVeg(r.ingredients)}${r.ext ? `, '${r.ext}'` : ''}],`);
  }
  lines.push('].map(([name, file, type, stars, energy, price, ingredients, veg, ext]) => ({');
  lines.push("  id: 'recipe-' + name.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),");
  lines.push('  name, file, type, stars, energy, price, ingredients, veg, ext: ext || null');
  lines.push('}));');
  lines.push('');
  lines.push("// Catégories : un ingrédient générique est satisfait par n'importe lequel de ces objets.");
  lines.push('export const CATEGORIES = {');
  lines.push(`  'Légume': ${jsArray(sortedFr(AISLES['Légumes']))},`);
  lines.push(`  'Céréale': ${jsArray(sortedFr(['Blé', 'Riz', 'Orge', 'Maïs', 'Avoine']))},`);
  lines.push(`  'Fruit': ${jsArray(sortedFr(AISLES['Fruits']))},`);
  lines.push(`  'Épice': ${jsArray(sortedFr(AISLES['Épices et herbes']))},`);
  lines.push(`  'Herbe': ${jsArray(sortedFr(['Basilic', 'Origan', 'Menthe']))},`);
  lines.push(`  'Poisson': ${jsArray(sortedFr(['Hareng', 'Thon', 'Saumon', 'Morue', 'Bar', 'Carpe', 'Carpe koï', 'Perche', 'Sole', 'Truite arc-en-ciel']))},`);
  lines.push(`  'Fruits de mer': ${jsArray(sortedFr(['Crevette', 'Homard', 'Crabe', 'Calmar', 'Moule', 'Huître', 'Pétoncle', 'Palourde']))},`);
  lines.push(`  'Sucrerie': ${jsArray(sortedFr(['Canne à sucre', 'Vanille', 'Fève de cacao', 'Miel doré', 'Gelée sucrée']))},`);
  lines.push(`  'Protéines': ${jsArray(sortedFr(['Volaille', 'Porc', 'Gibier']))},`);
  lines.push(`  'Laitages': ${jsArray(sortedFr(['Fromage', 'Lait', 'Beurre', 'Yaourt']))}`);
  lines.push('};');
  lines.push('');
  lines.push('// Ingrédients proposés dans le garde-manger, par rayon.');
  lines.push('export const PANTRY_GROUPS = [');
  for (const [title, items] of buildPantryGroups(allIngredients)) {
    lines.push(`  [${JSON.stringify(title)}, ${jsArray(items)}],`);
  }
  lines.push('];');
  lines.push('');
  lines.push('export function ingredientOwned(ing, have) {');
  lines.push('  if (have[ing]) return true;');
  lines.push("  if (ing === 'Poisson' && Object.keys(have).some((k) => have[k] && CATEGORIES['Poisson'].includes(k))) return true;");
  lines.push('  return (CATEGORIES[ing] || []).some((x) => have[x]);');
  lines.push('}');
  lines.push('');
  lines.push('export function missingFor(recipe, have) {');
  lines.push('  return Array.from(new Set(recipe.ingredients)).filter((i) => !ingredientOwned(i, have));');
  lines.push('}');
  lines.push('');

  await writeFile(ROOT + 'src/data/recipes.js', lines.join('\n'));
  console.log('src/data/recipes.js écrit.');

  const villagers = await parsePersonnages();
  console.log('Habitants extraits :', villagers.length);
  await writeVillagers(villagers);

  const achievements = await parseSucces();
  console.log('Succès extraits :', achievements.length);
  await writeAchievements(achievements);

  const starPaths = await Promise.all([
    parseStarPath('Voie des étoiles Élégance spectrale.json'),
    parseStarPath('Voie des étoiles Aventure maritime.json')
  ]);
  console.log('Voies des étoiles extraites :', starPaths.length);
  await writeStarPath(starPaths);

  await writeQuestsList();
}

await main();
