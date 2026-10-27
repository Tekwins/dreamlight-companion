#!/usr/bin/env node
// Génère src/data/recipes.js (et prépare villagers/succès/voie des étoiles) à partir
// des pages brutes de data/raw/frfandom (wiki Fandom francophone : noms déjà en français).
//
// Utilisation : npm run build-data

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([a-zA-Z]:)/, '$1');
const RAW = ROOT + 'data/raw/frfandom';
const RAW_DLV = ROOT + 'data/raw/dlv';

function num(s) {
  return parseInt((s || '').replace(/[^0-9]/g, ''), 10) || 0;
}

function slug(name) {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Catégories d'extension telles que taguées en fin de page sur le wiki FR. Quelques pages ont des
// coquilles (ex. « The Storybook Valey », « A Rift in Time » sans le suffixe) : on les reconnaît
// aussi, plutôt que de laisser l'habitant/la quête retomber à tort en "jeu de base".
const EXT_CAT = {
  "A Rift in Time (Île de l'Éternité)": 'rift',
  'A Rift in Time': 'rift',
  'The Storybook Vale': 'vale',
  'The Storybook Valey': 'vale',
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

// Ces fiches ne portent pas le tag [[Catégorie:A Rift in Time (Île de l'Éternité)]] (contrairement
// aux autres habitants de l'extension), mais leurs quêtes d'histoire le portent, tout comme le
// champ |collection=Eternity Isle du wiki anglais : on corrige à la main plutôt que d'attendre
// que le wiki FR les retague.
const VILLAGER_EXT_OVERRIDE = { Jafar: 'rift', Gaston: 'rift', EVE: 'rift', Raiponce: 'rift' };

// Nom tel qu'utilisé en jeu, quand il diffère du titre de la page wiki. Tek confirme en jeu.
const VILLAGER_NAME_OVERRIDE = { 'Marraine la Fée': 'La bonne fée' };

// Catégories à ignorer pour déterminer l'univers Disney/Pixar d'un habitant (ne sont ni
// l'extension ni l'univers : juste des rangements wiki).
const UNIVERSE_SKIP = new Set(['Personnages', 'Jeu de base', ...Object.keys(EXT_CAT)]);

function parseUniverse(cats) {
  const rest = cats.filter((c) => !UNIVERSE_SKIP.has(c));
  // La dernière catégorie restante est la bonne quand il y en a plusieurs (une catégorie portant
  // le nom même de l'habitant précède parfois son vrai univers, ex. Maléfique -> La Belle au bois dormant).
  return rest.length ? rest[rest.length - 1] : null;
}

// ==Parcours de récompenses== : un tableau wiki Niveau/Image/Nom/Typologie, une ligne par palier
// d'amitié débloqué.
function parseVillagerRewards(wt) {
  const sec = wt.match(/==\s*Parcours de récompenses\s*==\n([\s\S]*?)\n\|\}/);
  if (!sec) return [];
  const blocks = sec[1].split(/\n\|-[^\n]*\n/).map((b) => b.trim()).filter((b) => /Amitié\s*\d+/.test(b));
  const rewards = [];
  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.startsWith('|'));
    const lvlM = lines[0]?.match(/Amitié\s*(\d+)/);
    if (!lvlM || lines.length < 4) continue;
    const name = cleanWikitext(lines[2].replace(/^\|/, '')).replace(/\*+$/, '').trim();
    const type = cleanWikitext(lines[3].replace(/^\|/, '')).trim();
    if (!name) continue; // ligne laissée vide sur le wiki (contenu pas encore documenté)
    rewards.push({ level: +lvlM[1], name, type });
  }
  return rewards;
}

async function parsePersonnages() {
  const files = (await readdir(RAW)).filter((f) => !f.startsWith('_'));
  const villagers = [];
  for (const f of files) {
    const raw = JSON.parse(await readFile(RAW + '/' + f, 'utf8'));
    const wt = raw.wikitext || '';
    // L'infobox est parfois sur plusieurs lignes ("{{Personnages\n|title1=...") au lieu de
    // "{{Personnages|title1=..." : les deux formes doivent être reconnues (ex. Hercule, Phil).
    if (!/\{\{Personnages[|\s]/.test(wt) || raw.title.startsWith('Modèle')) continue;
    const img = wt.match(/image1=([^|\n]+?\.png)/);
    if (!img && !VILLAGER_FILE_OVERRIDE[raw.title]) continue;
    const cats = [...wt.matchAll(/\[\[Catégorie:([^\]]+)\]\]/g)].map((m) => m[1]);
    let ext = null;
    for (const c of cats) if (EXT_CAT[c]) ext = EXT_CAT[c];
    const wikiName = raw.title;
    ext = VILLAGER_EXT_OVERRIDE[wikiName] || ext;
    // L'id reste basé sur le titre wiki d'origine, pour ne pas perdre la progression déjà
    // enregistrée (amitié, favoris…) d'un habitant renommé par VILLAGER_NAME_OVERRIDE.
    const id = OLD_VILLAGER_ID[wikiName] || slug(wikiName);
    const name = VILLAGER_NAME_OVERRIDE[wikiName] || wikiName;
    const file = VILLAGER_FILE_OVERRIDE[wikiName] || img[1];
    const universe = parseUniverse(cats);
    const rewards = parseVillagerRewards(wt);
    villagers.push({ id, name, file, ext, universe, rewards });
  }
  return villagers.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

async function writeVillagers(villagers) {
  const lines = [];
  lines.push('// Habitants, générés depuis le wiki Fandom francophone (Catégorie:Personnages).');
  lines.push("// ext : extension requise. universe : univers Disney/Pixar d'origine, si identifié.");
  lines.push('// rewards : récompenses débloquées à chaque palier d\'amitié (niveau, nom, type).');
  lines.push('export const VILLAGERS = [');
  for (const v of villagers) {
    const entry = { id: v.id, name: v.name, file: v.file };
    if (v.ext) entry.ext = v.ext;
    if (v.universe) entry.universe = v.universe;
    if (v.rewards.length) entry.rewards = v.rewards;
    lines.push('  ' + JSON.stringify(entry) + ',');
  }
  lines.push('].map((v) => ({ ext: null, universe: null, rewards: [], ...v }));');
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
  // [\s\S] (pas [^'] ) : le texte français contient des apostrophes simples (d'une, l'épée…),
  // seule une paire d'apostrophes doublées '' doit marquer la fin de l'italique.
  const desc = wt.match(/''([\s\S]{20,}?)''/);
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

// Chaque page de quête a une fiche {{Quête|...}} avec son type (Histoire/Amitié/Royaume/…) et,
// pour les quêtes d'amitié, l'image de l'habitant concerné : ça suffit à les regrouper sans
// avoir à corréler avec le wiki anglais. Les pages de Catégorie:Quêtes sans cette fiche (179 sur
// 658) sont en fait des objets (récompenses) mal catégorisés sur le wiki : on les ignore.
// ==Objectifs== est une liste wiki : '#' = étape, '#*' = détail (quantité d'ingrédient, astuce…).
function parseSteps(wt) {
  // Le wiki écrit tantôt "==Objectifs==", tantôt "== Objectifs ==" (espaces variables).
  const m = wt.match(/==\s*Objectifs\s*==\n([\s\S]*?)(?:\n==|$)/);
  if (!m) return [];
  const steps = [];
  for (const line of m[1].split('\n')) {
    if (/^#\*/.test(line)) {
      // [[]] : lien vide laissé par le wiki (ingrédient/récompense non renseigné).
      const text = cleanWikitext(line.replace(/^#\*+/, '')).replace(/^\[\[\]\]$/, '').trim();
      if (text && steps.length) steps[steps.length - 1].subs.push(text);
    } else if (/^#/.test(line)) {
      const text = cleanWikitext(line.replace(/^#+/, '')).replace(/^\[\[\]\]$/, '').trim();
      if (text) steps.push({ text, subs: [] });
    }
  }
  return steps;
}

// Valeur d'un champ d'infobox, en suivant la profondeur des gabarits {{...}} pour ne pas
// s'arrêter sur un '|' interne (ex. autre={{Pic 20P|Alpes enchantées}} [[Voie des souhaits]]).
function infoboxField(wt, field) {
  const start = wt.indexOf(field + '=');
  if (start === -1) return null;
  let i = start + field.length + 1;
  let depth = 0;
  let out = '';
  while (i < wt.length) {
    if (wt[i] === '{' && wt[i + 1] === '{') { depth++; out += '{{'; i += 2; continue; }
    if (wt[i] === '}' && wt[i + 1] === '}') {
      if (depth === 0) break;
      depth--; out += '}}'; i += 2; continue;
    }
    if (depth === 0 && (wt[i] === '|' || wt[i] === '\n')) break;
    out += wt[i]; i++;
  }
  return out;
}

// La ligne "'''Récompenses :'''" du corps est bien plus souvent présente que les champs de
// l'infobox (393 pages sur 479) : on la préfère, avec l'infobox en repli.
function parseRewards(wt) {
  // {{Pièce}} est le seul gabarit qui porte une info (l'unité) au lieu d'être pure déco.
  const piece = (s) => s.replace(/\{\{Pièce\}\}/g, 'pièces');
  // Un lien vide [[]] trahit un champ de récompense laissé incomplet sur le wiki.
  const dropEmpty = (s) => s.replace(/\s*\+?\s*\[\[\]\]/g, '').trim();
  // La récompense tient parfois sur la même ligne, parfois en liste à puces "*…" (une par ligne).
  const body = wt.match(/'''Récompenses\s*:'''\s*\n?([\s\S]*?)(?:\n\s*\n|\n==|$)/);
  if (body) {
    const lines = body[1].split('\n').map((l) => l.replace(/^\*+\s*/, '').trim()).filter(Boolean);
    return lines.map((l) => dropEmpty(cleanWikitext(piece(l)))).filter(Boolean).join(' + ');
  }
  const xp = infoboxField(wt, 'expérience');
  const autre = infoboxField(wt, 'autre');
  const parts = [xp && cleanWikitext(xp) + ' pts', autre && dropEmpty(cleanWikitext(piece(autre)))].filter(Boolean);
  return parts.join(' + ');
}

async function parseQuests(villagers) {
  const villagerByFile = Object.fromEntries(villagers.map((v) => [v.file, v]));
  const files = (await readdir(RAW)).filter((f) => !f.startsWith('_'));
  const quests = [];
  for (const f of files) {
    const raw = JSON.parse(await readFile(RAW + '/' + f, 'utf8'));
    const wt = raw.wikitext || '';
    if (!/\{\{Quête\|/.test(wt) || raw.title.startsWith('Modèle')) continue;
    const typeM = wt.match(/type_de_quête=([^{|\n]+)/);
    const type = (typeM ? typeM[1] : '').trim();
    const imgM = wt.match(/image1=([^|\n]+?\.png)/);
    const villager = imgM ? villagerByFile[imgM[1]] : null;
    let kind = 'other';
    if (type.startsWith('Histoire')) kind = 'story';
    else if (type.startsWith('Amitié') && villager) kind = 'friendship';
    // Extension requise : la catégorie de la quête elle-même (fiable pour rift/vale/ranch), avec
    // la fiche de l'habitant en repli (les quêtes Honeyglow Woods ne portent pas toujours le tag).
    const cats = [...wt.matchAll(/\[\[Catégorie:([^\]]+)\]\]/g)].map((m) => m[1]);
    let ext = null;
    for (const c of cats) if (EXT_CAT[c]) ext = EXT_CAT[c];
    ext = ext || villager?.ext || null;
    // Description : les paragraphes en italique entre la fiche et ==Objectifs==.
    const introM = wt.match(/\}\}\n+([\s\S]*?)\n==\s*Objectifs\s*==/);
    const description = introM ? cleanWikitext(introM[1]).slice(0, 600) : '';
    quests.push({
      name: raw.title, kind, villagerId: villager?.id, villagerName: villager?.name, ext,
      description, steps: parseSteps(wt), rewards: parseRewards(wt)
    });
  }
  return quests;
}

async function writeQuests(quests) {
  const byName = (a, b) => a.name.localeCompare(b.name, 'fr');
  const order = { story: 0, friendship: 1, other: 2 };
  quests.sort((a, b) => order[a.kind] - order[b.kind]
    || (a.villagerName || '').localeCompare(b.villagerName || '', 'fr') || byName(a, b));
  const lines = [];
  lines.push('// Quêtes, générées depuis le wiki Fandom francophone (Catégorie:Quêtes).');
  lines.push("// kind : 'story' (quête principale), 'friendship' (quête d'habitant, avec villagerId/villagerName) ou 'other'");
  lines.push('// (royaume, quotidienne, événement, lot de rêve…). steps : étapes (et leurs détails en sub-liste).');
  lines.push('// ext : extension requise, si la quête en dépend.');
  lines.push('export const QUESTS = [');
  for (const q of quests) {
    const entry = { id: 'quest-' + slug(q.name), name: q.name, kind: q.kind };
    if (q.kind === 'friendship') { entry.villagerId = q.villagerId; entry.villagerName = q.villagerName; }
    if (q.ext) entry.ext = q.ext;
    if (q.description) entry.description = q.description;
    if (q.steps.length) entry.steps = q.steps;
    if (q.rewards) entry.rewards = q.rewards;
    lines.push('  ' + JSON.stringify(entry) + ',');
  }
  lines.push('];');
  lines.push('');
  await writeFile(ROOT + 'src/data/quests.js', lines.join('\n'));
  console.log('src/data/quests.js écrit (' + quests.length + ' quêtes).');
}

// Les 23 vraies catégories de meubles du jeu (trouvées dans Modèle:NAVBOX Meubles du wiki FR,
// pas inventées) : un meuble peut appartenir à plusieurs à la fois.
const FURNITURE_CATS = [
  ['maison', 'Maison'], ['essentiels', 'Essentiels'], ['decor', 'Décor'], ['huisseries', 'Huisseries'],
  ['tables', 'Tables'], ['lits', 'Lits'], ['sieges', 'Sièges'], ['stockage', 'Espace de stockage'],
  ['appareil', 'Appareil'], ['electronique', 'Appareils électroniques'], ['commodites', 'Commodités'],
  ['art', 'Art'], ['luminaires', 'Luminaires'], ['feuillage', 'Feuillage'], ['tapis', 'Tapis'],
  ['divers', 'Divers'], ['papier-peint', 'Papier peint'], ['sols', 'Sols'], ['portes', 'Portes'],
  ['fenetres', 'Fenêtres'], ['paysage', 'Paysage'], ['mur', 'Mur'], ['plafond', 'Plafond'],
  ['attractions', 'Attractions']
];

async function parseFurniture() {
  const byName = new Map();
  for (const [id, label] of FURNITURE_CATS) {
    const file = RAW + '/_liste_' + label + '.json';
    if (!existsSync(file)) continue;
    const raw = JSON.parse(await readFile(file, 'utf8'));
    for (const title of raw.titles) {
      if (!byName.has(title)) byName.set(title, new Set());
      byName.get(title).add(id);
    }
  }
  return [...byName.entries()]
    .map(([name, cats]) => ({ id: 'meuble-' + slug(name), name, file: name + '.png', cats: [...cats] }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

async function writeFurniture(items) {
  const lines = [];
  lines.push('// Meubles, générés depuis les listes de catégories du wiki Fandom francophone.');
  lines.push("// FURNITURE_CATEGORIES : les 23 catégories réelles du jeu (Modèle:NAVBOX Meubles),");
  lines.push('// pas une simplification inventée. Un meuble peut appartenir à plusieurs à la fois.');
  lines.push("// Pas de prix/dimensions : juste de quoi cocher ce qu'on possède, par catégorie.");
  lines.push('export const FURNITURE_CATEGORIES = [');
  for (const [id, label] of FURNITURE_CATS) lines.push(`  ['${id}', ${JSON.stringify(label)}],`);
  lines.push('];');
  lines.push('');
  lines.push('export const FURNITURE = [');
  for (const it of items) {
    lines.push(`  { id: '${it.id}', name: ${JSON.stringify(it.name)}, file: ${JSON.stringify(it.file)}, cats: ${JSON.stringify(it.cats)} },`);
  }
  lines.push('];');
  lines.push('');
  await writeFile(ROOT + 'src/data/furniture.js', lines.join('\n'));
  console.log('src/data/furniture.js écrit (' + items.length + ' meubles).');
}

// Noms d'univers Disney/Pixar officiels en français, pour traduire les titres de section du
// wiki EN (seule source avec les souvenirs déjà groupés par univers). Les sections sans
// correspondance ici (journaux/carnets, Événements à part, notes diverses) ne sont pas des
// souvenirs {{Memory|...}} structurés : on ne les inclut pas plutôt que d'inventer une liste.
const MEMORY_UNIVERSE_FR = {
  'Dreamlight Valley': 'Dreamlight Valley',
  Events: 'Événements',
  'WALL-E': 'WALL-E',
  Moana: 'Vaiana',
  Ratatouille: 'Ratatouille',
  Brave: 'Rebelle',
  "Tim Burton's The Nightmare Before Christmas": "L'Étrange Noël de Monsieur Jack",
  Encanto: 'Encanto',
  'Lilo & Stitch': 'Lilo et Stitch',
  Aladdin: 'Aladdin',
  'Beauty and the Beast': 'La Belle et la Bête',
  Hercules: 'Hercule',
  'Sleeping Beauty': 'La Belle au bois dormant',
  'The Princess and the Frog': 'La Princesse et la Grenouille',
  'Wreck-It Ralph': 'Les Mondes de Ralph',
  Cinderella: 'Cendrillon',
  'The Lion King': 'Le Roi Lion',
  'The Little Mermaid': 'La Petite Sirène',
  Frozen: 'La Reine des neiges',
  Tangled: 'Raiponce',
  'Monsters, Inc.': 'Monstres et Cie',
  'Toy Story': 'Toy Story',
  'Mickey & Friends': 'Mickey et ses amis',
  'The Sword in the Stone': "Merlin l'enchanteur",
  'Snow White': 'Blanche-Neige',
  Mulan: 'Mulan',
  'One Hundred and One Dalmatians': 'Les 101 Dalmatiens',
  'Peter Pan': 'Peter Pan',
  'Winnie the Pooh': "Winnie l'ourson"
};

async function parseMemories() {
  const raw = JSON.parse(await readFile(RAW_DLV + '/Memories.json', 'utf8'));
  // Des souvenirs pas encore confirmés par la communauté sont parfois mis en commentaire HTML
  // (ex. <!--{{Memory|Dreamlight Valley Memory 8|12|...|missing=yes}}-->) : à exclure, sinon on
  // compte deux fois le même souvenir (vu sur "Dreamlight Valley Memory 8" avant ce correctif).
  const wt = (raw.wikitext || '').replace(/<!--[\s\S]*?-->/g, '');
  const sectionRe = /^==+\s*(?:<span[^>]*>)?(?:\[\[File:[^\]]*\]\]\s*)?([^=<\n]+?)\s*(?:<\/span>)?==+\s*$/gm;
  const matches = [...wt.matchAll(sectionRe)];
  const items = [];
  const seenFiles = new Set();
  for (let i = 0; i < matches.length; i++) {
    const fr = MEMORY_UNIVERSE_FR[matches[i][1].trim()];
    if (!fr) continue;
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : wt.length;
    const body = wt.slice(start, end);
    const links = [...body.matchAll(/\{\{Memory\|([^|}]+)\|/g)].map((m) => m[1].trim());
    for (const link of links) {
      const file = link + '.png';
      // Un même visuel est parfois réutilisé pour plusieurs entrées du wiki (vignette générique
      // « pièce manquante », ou une série de journaux qui partage sa couverture) : une seule
      // coche dans la collection plutôt que plusieurs lignes identiques et déroutantes.
      if (seenFiles.has(file)) continue;
      seenFiles.add(file);
      const idx = items.filter((it) => it.universe === fr).length + 1;
      items.push({ id: 'souvenir-' + slug(fr) + '-' + idx, universe: fr, index: idx, file });
    }
  }
  return items;
}

async function writeMemories(items) {
  const lines = [];
  lines.push('// Souvenirs, générés depuis la page "Memories" du wiki EN (dreamlightvalleywiki.com),');
  lines.push("// seule source où ils sont déjà groupés par univers Disney/Pixar. Pas de nom individuel");
  lines.push("// distinctif dans le jeu lui-même (juste numérotés par univers) : noms d'univers traduits");
  lines.push('// à la main (noms Disney officiels), items simplement numérotés.');
  lines.push('export const MEMORIES = [');
  for (const it of items) {
    lines.push(`  { id: '${it.id}', universe: ${JSON.stringify(it.universe)}, index: ${it.index}, file: ${JSON.stringify(it.file)} },`);
  }
  lines.push('];');
  lines.push('');
  await writeFile(ROOT + 'src/data/memories.js', lines.join('\n'));
  console.log('src/data/memories.js écrit (' + items.length + ' souvenirs).');
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

  const quests = await parseQuests(villagers);
  console.log('Quêtes extraites :', quests.length);
  await writeQuests(quests);

  const furniture = await parseFurniture();
  console.log('Meubles extraits :', furniture.length);
  await writeFurniture(furniture);

  const memories = await parseMemories();
  console.log('Souvenirs extraits :', memories.length);
  await writeMemories(memories);
}

await main();
