#!/usr/bin/env node
// Récupère les pages utiles des wikis Dreamlight Valley (API MediaWiki, anglais + wiki Fandom FR)
// et les images des objets déjà référencés dans src/data.
//
// Utilisation (depuis le dossier du projet, Node 18 ou plus) :
//   npm run data            -> pages brutes dans data/raw/<wiki>/<page>.json
//   npm run data -- images  -> images dans public/img/ (pour ne plus dépendre du wiki)
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
  { wiki: 'frfandom', category: 'Quêtes', listOnly: true }
];

const UA = 'DreamlightCompagnon/0.1 (usage personnel ; contact via GitHub Tekwins)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(wiki, params) {
  const url = WIKIS[wiki].api + '?' + new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} sur ${url}`);
  return res.json();
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

async function fetchPages() {
  for (const t of TARGETS) {
    try {
      const titles = t.category ? await categoryPages(t.wiki, t.category) : [t.page];
      if (t.listOnly) { await saveTitleList(t.wiki, t.category, titles); continue; }
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
    // critters.js/resources.js : le nom anglais sert de fichier (pas d'extension dans la source).
    if (f === 'critters.js' || f === 'resources.js') {
      for (const m of src.matchAll(/'([A-Z][A-Za-z' .-]+)'(?=\s*,\s*\[)/g)) files.add(m[1] + '.png'); // fichiers des animaux
      for (const m of src.matchAll(/\['[^']+', '([A-Z][A-Za-z' .-]+)'/g)) files.add(m[1] + '.png'); // noms anglais des ressources
      for (const m of src.matchAll(/\['(?:fruit|epice|champi)', '[^']+', '([A-Z][A-Za-z' .-]+)'/g)) files.add(m[1] + '.png'); // cueillette
    }
    // recettes et habitants (nom de fichier déjà littéral ; gère les apostrophes échappées, ex. "Winnie l\'ourson.png")
    for (const m of src.matchAll(/'((?:[^'\\]|\\.)*\.png)'/g)) files.add(m[1].replace(/\\'/g, "'"));
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

async function fetchImages() {
  await mkdir('public/img', { recursive: true });
  const files = await referencedImages();
  console.log(files.length, 'images à récupérer');
  for (const name of files) {
    const out = path.join('public/img', name.replace(/ /g, '_'));
    if (existsSync(out)) continue;
    try {
      const url = await findImageUrl(name);
      if (!url) { console.warn('  ?? introuvable', name); continue; }
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      const type = res.headers.get('content-type') || '';
      // Les CDN protégés (Cloudflare) peuvent répondre 200 avec une page de vérification HTML
      // au lieu de l'image : on vérifie le type réel avant d'écrire le fichier.
      if (!type.startsWith('image/')) { console.warn('  ?? pas une image (protection anti-robot ?)', name); continue; }
      await writeFile(out, Buffer.from(await res.arrayBuffer()));
      console.log('  ok', name);
    } catch (e) {
      console.warn('  !!', name, '-', e.message);
    }
    await sleep(250);
  }
}

const mode = process.argv[2];
if (mode === 'images') await fetchImages();
else await fetchPages();
