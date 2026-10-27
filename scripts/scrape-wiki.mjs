#!/usr/bin/env node
// Récupère les pages utiles des wikis Dreamlight Valley (API MediaWiki, anglais + wiki Fandom FR)
// et les images des objets déjà référencés dans src/data.
//
// Utilisation (depuis le dossier du projet, Node 18 ou plus) :
//   npm run data              -> pages brutes dans data/raw/<wiki>/<page>.json
//   npm run data -- images    -> images dans public/img/ (pour ne plus dépendre du wiki)
//   npm run data -- quetes    -> relance juste les ~660 pages de quêtes (sans tout retélécharger)
//   npm run data -- collection -> listes de catégories Meubles + page Souvenirs (pour Collection)
//
// Les pages brutes servent ensuite à générer les fichiers de src/data
// (recettes complètes, habitants, quêtes, succès, Voies des étoiles).

import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const WIKIS = {
  dlv: { api: 'https://dreamlightvalleywiki.com/api.php', catNS: 'Category' },
  fandom: { api: 'https://disneydreamlightvalley.fandom.com/api.php', catNS: 'Category' },
  // Wiki Fandom francophone : noms déjà en français (recettes, personnages, succès…).
  frfandom: { api: 'https://disneydreamlightvalley.fandom.com/fr/api.php', catNS: 'Catégorie' }
};

// Pages et catégories à récupérer. Les catégories sont développées en pages
// (sauf listOnly: true, qui se contente de la liste des titres, sans ouvrir chaque page).
const TARGETS = [
  { wiki: 'dlv', page: 'Critters' },
  { wiki: 'dlv', page: 'Crop Seeds' },
  { wiki: 'dlv', page: 'Gems' },
  { wiki: 'dlv', page: 'Fishing' },
  { wiki: 'dlv', page: 'Foraging' },
  { wiki: 'dlv', page: 'Meals' },
  { wiki: 'dlv', page: 'Friendship' },
  { wiki: 'dlv', page: 'Villagers' },
  { wiki: 'dlv', page: 'Quests' },
  { wiki: 'dlv', page: 'Dreamlight Duties' },
  { wiki: 'dlv', page: 'Star Path' },
  { wiki: 'dlv', category: 'Star Paths' },
  { wiki: 'fandom', page: 'Star Path' },
  { wiki: 'fandom', page: 'Meals' },
  { wiki: 'fandom', page: 'Characters' },
  { wiki: 'fandom', page: 'Quests' },
  // Wiki FR : source principale pour les noms français (recettes, habitants, succès, voie des étoiles).
  { wiki: 'frfandom', category: 'Plats' },
  { wiki: 'frfandom', category: 'Personnages' },
  { wiki: 'frfandom', page: 'Succès' },
  { wiki: 'frfandom', page: 'Voie des étoiles Élégance spectrale' },
  { wiki: 'frfandom', page: 'Voie des étoiles Aventure maritime' },
  // Chaque page de quête a une fiche avec son type (Histoire/Amitié) et, pour les quêtes
  // d'amitié, l'image de l'habitant concerné : pas besoin de corréler avec le wiki anglais.
  { wiki: 'frfandom', category: 'Quêtes' },
  // Meubles : ~1400 fiches individuelles, trop pour les ouvrir une à une. Un meuble peut
  // appartenir à plusieurs de ces 23 catégories à la fois (vraie taxonomie du jeu, trouvée dans
  // Modèle:NAVBOX Meubles) : on ne récupère que la liste des titres par catégorie (listOnly),
  // pas les fiches complètes (prix/dimensions non nécessaires pour une simple collection cochée).
  { wiki: 'frfandom', category: 'Maison', listOnly: true, group: 'collection' },
  { wiki: 'frfandom', category: 'Essentiels', listOnly: true, group: 'collection' },
  { wiki: 'frfandom', category: 'Décor', listOnly: true, group: 'collection' },
  { wiki: 'frfandom', category: 'Huisseries', listOnly: true, group: 'collection' },
  { wiki: 'frfandom', category: 'Tables', listOnly: true, group: 'collection' },
  { wiki: 'frfandom', category: 'Lits', listOnly: true, group: 'collection' },
  { wiki: 'frfandom', category: 'Sièges', listOnly: true, group: 'collection' },
  { wiki: 'frfandom', category: 'Espace de stockage', listOnly: true, group: 'collection' },
  { wiki: 'frfandom', category: 'Appareil', listOnly: true, group: 'collection' },
  { wiki: 'frfandom', category: 'Appareils électroniques', listOnly: true, group: 'collection' },
  { wiki: 'frfandom', category: 'Commodités', listOnly: true, group: 'collection' },
  { wiki: 'frfandom', category: 'Art', listOnly: true, group: 'collection' },
  { wiki: 'frfandom', category: 'Luminaires', listOnly: true, group: 'collection' },
  { wiki: 'frfandom', category: 'Feuillage', listOnly: true, group: 'collection' },
  { wiki: 'frfandom', category: 'Tapis', listOnly: true, group: 'collection' },
  { wiki: 'frfandom', category: 'Divers', listOnly: true, group: 'collection' },
  { wiki: 'frfandom', category: 'Papier peint', listOnly: true, group: 'collection' },
  { wiki: 'frfandom', category: 'Sols', listOnly: true, group: 'collection' },
  { wiki: 'frfandom', category: 'Portes', listOnly: true, group: 'collection' },
  { wiki: 'frfandom', category: 'Fenêtres', listOnly: true, group: 'collection' },
  { wiki: 'frfandom', category: 'Paysage', listOnly: true, group: 'collection' },
  { wiki: 'frfandom', category: 'Mur', listOnly: true, group: 'collection' },
  { wiki: 'frfandom', category: 'Plafond', listOnly: true, group: 'collection' },
  { wiki: 'frfandom', category: 'Attractions', listOnly: true, group: 'collection' },
  // Souvenirs : une seule page sur le wiki EN (dlv), déjà groupée par univers Disney/Pixar via
  // des gabarits {{Memory|...}} (245 souvenirs). Pas d'équivalent FR page-par-page : les noms
  // d'univers seront traduits à la main dans build-data.mjs (noms Disney officiels bien connus).
  { wiki: 'dlv', page: 'Memories', group: 'collection' }
];

const UA = 'DreamlightCompagnon/0.1 (usage personnel ; contact via GitHub Tekwins)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// En cas de 429, le wiki indique combien de temps attendre (en-tête retry-after, en secondes) :
// on patiente ce délai (+marge) puis on réessaie, plutôt que d'abandonner l'objet en cours.
async function api(wiki, params, tries = 3) {
  const url = WIKIS[wiki].api + '?' + new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.status === 429) {
      const wait = (parseInt(res.headers.get('retry-after'), 10) || 300) * 1000 + 5000;
      console.log(`    (429, attente de ${Math.round(wait / 1000)}s avant de réessayer…)`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} sur ${url}`);
    return res.json();
  }
  throw new Error('429 persistant après plusieurs attentes');
}

async function categoryPages(wiki, category) {
  const pages = [];
  let cont = {};
  do {
    const data = await api(wiki, { action: 'query', list: 'categorymembers', cmtitle: WIKIS[wiki].catNS + ':' + category, cmlimit: '500', ...cont });
    pages.push(...data.query.categorymembers.filter((m) => m.ns === 0).map((m) => m.title));
    cont = data.continue || null;
    await sleep(300);
  } while (cont);
  return pages;
}

async function savePage(wiki, title) {
  const dir = path.join('data', 'raw', wiki);
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, title.replace(/[\\/:*?"<>|]/g, '_') + '.json');
  const data = await api(wiki, { action: 'parse', page: title, prop: 'wikitext|text|images', redirects: '1' });
  if (data.error) throw new Error(data.error.info);
  await writeFile(file, JSON.stringify({ wiki, title, fetchedAt: new Date().toISOString(), ...data.parse }, null, 1));
  console.log('  ok', wiki, title);
}

// Pour listOnly: on garde juste les titres (pas de détail par page, catégorie trop volumineuse pour l'instant).
async function saveTitleList(wiki, category, titles) {
  const dir = path.join('data', 'raw', wiki);
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, '_liste_' + category.replace(/[\\/:*?"<>|]/g, '_') + '.json');
  await writeFile(file, JSON.stringify({ wiki, category, fetchedAt: new Date().toISOString(), titles }, null, 1));
  console.log('  ok', wiki, 'liste', category, '(' + titles.length + ')');
}

async function fetchPages(targets = TARGETS) {
  for (const t of targets) {
    try {
      const titles = t.category ? await categoryPages(t.wiki, t.category) : [t.page];
      if (t.listOnly) { await saveTitleList(t.wiki, t.category, titles); await sleep(1500); continue; }
      for (const title of titles) {
        try { await savePage(t.wiki, title); } catch (e) { console.warn('  !!', t.wiki, title, '-', e.message); }
        await sleep(400); // rester poli avec les wikis
      }
    } catch (e) {
      console.warn('!!', t.wiki, t.category || t.page, '-', e.message);
    }
  }
  console.log('\nPages enregistrées dans data/raw/. Envoie ce dossier à Claude pour générer les données complètes.');
}

// Repère tous les noms de fichiers image cités dans src/data (« Xxx.png »).
async function referencedImages() {
  const files = new Set();
  for (const f of await readdir('src/data')) {
    const src = await readFile(path.join('src/data', f), 'utf8');
    // critters.js : [id, nom FR, nom EN, horaire] -> le nom anglais (juste avant l'horaire) sert de fichier.
    if (f === 'critters.js') {
      for (const m of src.matchAll(/'([A-Z][A-Za-z' .-]+)'(?=\s*,\s*\[)/g)) files.add(m[1] + '.png');
    }
    // resources.js : [nom FR, nom EN, ...] (CROPS/FISH/GEMS) ou ['catégorie', nom FR, nom EN, ...] (FORAGE) ;
    // la négation évite que la 1re regex ne capture à tort le nom FR d'une ligne FORAGE (2e élément).
    if (f === 'resources.js') {
      for (const m of src.matchAll(/\[(?!'(?:fruit|epice|champi)')'[^']+', '([A-Z][A-Za-z' .-]+)'/g)) files.add(m[1] + '.png');
      for (const m of src.matchAll(/\['(?:fruit|epice|champi)', '[^']+', '([A-Z][A-Za-z' .-]+)'/g)) files.add(m[1] + '.png');
    }
    // recettes et habitants (nom de fichier déjà littéral ; gère les apostrophes échappées, ex. "Winnie l\'ourson.png")
    for (const m of src.matchAll(/'((?:[^'\\]|\\.)*\.png)'/g)) files.add(m[1].replace(/\\'/g, "'"));
    // voies des étoiles, quêtes, habitants (générés en JSON.stringify, donc entre guillemets doubles).
    for (const m of src.matchAll(/"((?:[^"\\]|\\.)*\.png)"/g)) files.add(m[1].replace(/\\(.)/g, '$1'));
  }
  return [...files];
}

// Certaines images (recettes, habitants) viennent du wiki FR : si le wiki anglais ne les a pas, on y cherche aussi.
async function findImageUrl(name) {
  for (const wiki of ['dlv', 'frfandom']) {
    try {
      const data = await api(wiki, { action: 'query', titles: 'File:' + name, prop: 'imageinfo', iiprop: 'url' });
      const url = data.query?.pages?.[0]?.imageinfo?.[0]?.url;
      if (url) return url;
    } catch { /* on essaie le wiki suivant */ }
  }
  return null;
}

// Enregistre l'image pointée par `url` sous public/img/<name>, en vérifiant que c'est
// bien une image (un CDN protégé peut répondre 200 avec une page de vérification HTML).
async function saveImage(url, name, tries = 3) {
  const out = path.join('public/img', name.replace(/ /g, '_'));
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.status === 429) {
      const wait = (parseInt(res.headers.get('retry-after'), 10) || 300) * 1000 + 5000;
      console.log(`    (429, attente de ${Math.round(wait / 1000)}s avant de réessayer…)`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) return 'HTTP ' + res.status;
    const type = res.headers.get('content-type') || '';
    if (!type.startsWith('image/')) return 'pas une image (protection anti-robot ?)';
    await writeFile(out, Buffer.from(await res.arrayBuffer()));
    return 'ok';
  }
  return '429 persistant';
}

async function fetchImages() {
  await mkdir('public/img', { recursive: true });
  const files = await referencedImages();
  console.log(files.length, 'images à récupérer');

  // Meubles : la quasi-totalité n'est documentée que sur le wiki FR (Fandom, bloqué par
  // Cloudflare) — inutile de perdre 12s par échec dessus. mydreamlightvalley.com héberge ses
  // propres images (~3870 meubles répertoriés, bonne couverture) : on l'essaie en premier,
  // avant même le wiki, uniquement pour les meubles.
  const furnitureMod = await import('../src/data/furniture.js');
  const missingFurniture = furnitureMod.FURNITURE.filter((f) => !existsSync(path.join('public/img', f.file.replace(/ /g, '_'))));
  if (missingFurniture.length) {
    console.log(missingFurniture.length, "meubles sans image, on essaie mydreamlightvalley.com d'abord");
    const map = await mdvNameMap('furniture', 'furnitures', /^Meubles\s+/);
    for (const it of missingFurniture) {
      const url = map[normName(it.name)];
      if (!url) continue;
      try {
        const result = await saveImage(url, it.file);
        if (result === 'ok') console.log('  ok (mdv)', it.file);
        else console.warn('  ?? (mdv)', it.file, '-', result);
      } catch (e) {
        console.warn('  !! (mdv)', it.file, '-', e.message);
      }
      await sleep(300);
    }
  }

  for (const name of files) {
    const out = path.join('public/img', name.replace(/ /g, '_'));
    if (existsSync(out)) continue;
    try {
      const url = await findImageUrl(name);
      if (!url) { console.warn('  ?? introuvable', name); continue; }
      const result = await saveImage(url, name);
      if (result === 'ok') console.log('  ok', name);
      else console.warn('  ??', name, '-', result);
    } catch (e) {
      console.warn('  !!', name, '-', e.message);
    }
    await sleep(12000); // délai généreux entre chaque image : évite de redéclencher la limite du wiki
  }

  await fetchImagesFromMdv();
}

// Repli pour les recettes/habitants encore sans image : mydreamlightvalley.com/fr héberge
// ses propres images (pas sur l'infrastructure Fandom bloquée par Cloudflare), associées à
// une page par nom français (ex. /fr/meal/ajiaco, /fr/character/aladdin).
const MDV = 'https://www.mydreamlightvalley.com';

function normName(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

async function mdvSlugs(category) {
  const res = await fetch(MDV + '/fr_sitemap.xml', { headers: { 'User-Agent': UA } });
  const xml = await res.text();
  const re = new RegExp('<loc>(' + MDV.replace(/[.]/g, '\\.') + '/fr/' + category + '/[a-z0-9-]+)</loc>', 'g');
  return [...new Set([...xml.matchAll(re)].map((m) => m[1].split('/').pop()))];
}

// Table nom français normalisé -> URL d'image, pour une catégorie mydreamlightvalley.com
// (meal/character/furniture…). imgFolder : dossier d'images du site, pas toujours le même mot
// que la catégorie d'URL (ex. furniture -> furnitures) ; prefixRe : préfixe du <title> à retirer
// avant le nom (varie selon la catégorie : "Détail: ", "Personnage: ", "Meubles ").
async function mdvNameMap(category, imgFolder = '(?:meals|characters)', prefixRe = /^(Détail|Personnage): /) {
  const slugs = await mdvSlugs(category);
  const map = {};
  for (const slug of slugs) {
    try {
      const res = await fetch(`${MDV}/fr/${category}/${slug}`, { headers: { 'User-Agent': UA } });
      const html = await res.text();
      const titleM = html.match(/<title>([^<]*)<\/title>/);
      const imgM = html.match(new RegExp('src="(\\/images\\/' + imgFolder + '\\/[^"]+\\.png[^"]*)"'));
      const name = titleM?.[1]?.replace(/ - My Dreamlight Valley$/, '').replace(prefixRe, '').trim();
      if (name && imgM) map[normName(name)] = MDV + imgM[1];
    } catch { /* page suivante */ }
    await sleep(120);
  }
  return map;
}

async function fetchImagesFromMdv() {
  const recipesMod = await import('../src/data/recipes.js');
  const villagersMod = await import('../src/data/villagers.js');
  const targets = [
    { items: recipesMod.RECIPES, category: 'meal' },
    { items: villagersMod.VILLAGERS, category: 'character' }
  ];
  for (const { items, category } of targets) {
    const missing = items.filter((it) => !existsSync(path.join('public/img', it.file.replace(/ /g, '_'))));
    if (!missing.length) continue;
    console.log(missing.length, category === 'meal' ? 'recettes' : 'habitants', 'encore sans image, on essaie mydreamlightvalley.com');
    const map = await mdvNameMap(category);
    for (const it of missing) {
      const url = map[normName(it.name)];
      if (!url) continue;
      try {
        const result = await saveImage(url, it.file);
        if (result === 'ok') console.log('  ok (mdv)', it.file);
        else console.warn('  ?? (mdv)', it.file, '-', result);
      } catch (e) {
        console.warn('  !! (mdv)', it.file, '-', e.message);
      }
      await sleep(120);
    }
  }
}

const mode = process.argv[2];
if (mode === 'images') await fetchImages();
// Relance juste les quêtes (657 pages) sans retéléchargement complet : npm run data -- quetes
else if (mode === 'quetes') await fetchPages(TARGETS.filter((t) => t.category === 'Quêtes'));
// Meubles (listes de catégories) + Souvenirs (page Memories) : npm run data -- collection
else if (mode === 'collection') await fetchPages(TARGETS.filter((t) => t.group === 'collection'));
else await fetchPages();
