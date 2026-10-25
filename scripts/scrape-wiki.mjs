#!/usr/bin/env node
// Récupère les pages utiles des deux wikis Dreamlight Valley (API MediaWiki)
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
  dlv: 'https://dreamlightvalleywiki.com/api.php',
  fandom: 'https://disneydreamlightvalley.fandom.com/api.php'
};

// Pages et catégories à récupérer. Les catégories sont développées en pages.
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
  { wiki: 'fandom', page: 'Quests' }
];

const UA = 'DreamlightCompagnon/0.1 (usage personnel ; contact via GitHub Tekwins)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(wiki, params) {
  const url = WIKIS[wiki] + '?' + new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} sur ${url}`);
  return res.json();
}

async function categoryPages(wiki, category) {
  const pages = [];
  let cont = {};
  do {
    const data = await api(wiki, { action: 'query', list: 'categorymembers', cmtitle: 'Category:' + category, cmlimit: '500', ...cont });
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

async function fetchPages() {
  for (const t of TARGETS) {
    try {
      const titles = t.category ? await categoryPages(t.wiki, t.category) : [t.page];
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
    for (const m of src.matchAll(/'([A-Z][A-Za-z' .-]+)'(?=\s*,\s*\[)/g)) files.add(m[1] + '.png'); // fichiers des animaux
    for (const m of src.matchAll(/\['[^']+', '([A-Z][A-Za-z' .-]+)'/g)) files.add(m[1] + '.png'); // noms anglais des ressources
    for (const m of src.matchAll(/\['(?:fruit|epice|champi)', '[^']+', '([A-Z][A-Za-z' .-]+)'/g)) files.add(m[1] + '.png'); // cueillette
  }
  return [...files];
}

async function fetchImages() {
  await mkdir('public/img', { recursive: true });
  const files = await referencedImages();
  console.log(files.length, 'images à récupérer');
  for (const name of files) {
    const out = path.join('public/img', name.replace(/ /g, '_'));
    if (existsSync(out)) continue;
    try {
      const data = await api('dlv', { action: 'query', titles: 'File:' + name, prop: 'imageinfo', iiprop: 'url' });
      const url = data.query.pages[0]?.imageinfo?.[0]?.url;
      if (!url) { console.warn('  ?? introuvable', name); continue; }
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
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
