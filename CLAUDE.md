# Dreamlight Compagnon — notes pour Claude Code

Appli compagnon non officielle de Disney Dreamlight Valley, pour Tek et sa femme (usage personnel).
Interface et textes **en français**. Répondre à Tek en français.

## Pile technique
- Vite 8 + Preact 11 (JSX), PWA via vite-plugin-pwa. Pas de TypeScript, pas de framework CSS.
- Navigation par `#` (`src/lib/router.js`) car hébergé sur GitHub Pages sous `/dreamlight-companion/`.
- Déploiement : `.github/workflows/deploy.yml`, à chaque push sur `main` → https://tekwins.github.io/dreamlight-companion/
- Supabase (projet `idmeekuelqbomisvnosn`) : connexion par lien magique (PKCE), table `user_state`
  (une ligne jsonb par compte, RLS : chaque compte ne voit que sa ligne). Schéma : `supabase/schema.sql`.
  La clé anon dans `src/lib/supabase.js` est publique par conception ; ne jamais committer la clé service_role.

## Organisation
- `src/data/` : données du jeu (biomes, animaux + horaires, cultures, poissons, gemmes, cueillette, recettes, habitants).
  Biomes référencés par identifiant (`BIOMES` dans `biomes.js`) ; chaque biome porte son extension (`rift`, `vale`, `ranch`).
- `src/lib/store.js` : progression personnelle (localStorage par compte + synchro Supabase, la version la plus récente gagne).
  Toute nouvelle donnée perso va dans `DEFAULT_STATE`.
- `src/lib/time.js` : disponibilité des animaux (heure locale de l'appareil, comme le jeu).
- `src/screens/` : un fichier par écran. `src/ui.jsx` : composants partagés (Icon, Thumb, BiomePill, Seg, Switch…).
- `src/styles.css` : variables de thème `[data-theme='nuit']` et `[data-theme='chateau']`. Utiliser les variables, pas de couleurs en dur.
- Mise en page : barre du bas sous 960 px, menu latéral + liste/fiche côte à côte au-dessus.

## Règles de conception
- Ressources à récolter : toujours regroupables et filtrables **par biome**, avec les étiquettes de biome colorées sur chaque objet.
- Tout ce qui dépend d'une extension désactivée dans les Réglages doit être masqué partout.
- Images : `public/img/<Fichier_wiki>.png` d'abord, puis le wiki, puis l'initiale (composant `Thumb`).
- Noms français officiels du jeu. Ceux non confirmés portent `todo: true` dans les données.

## Reste à faire (priorités)
1. Lancer `npm run data` (ici, sur la machine de Tek : ses wikis sont accessibles) puis générer depuis `data/raw/`
   les recettes complètes (avec énergie et prix), les habitants, les quêtes, les succès et la Voie des étoiles en cours.
2. `npm run data -- images` pour embarquer les images dans `public/img/`.
3. Vérifier les noms français marqués `todo` (poissons, gemmes, fruits d'extension, biomes de Wishblossom Ranch).
4. Recherche globale (maquette faite), écran Collection, notifications push (Android + iPhone installé sur l'écran d'accueil).
5. Aligner la maquette : https://claude.ai/artifact/4SfLa7iz17AMGsGRtj8zFR

## Commandes
```bash
npm install
npm run dev     # http://localhost:5173/dreamlight-companion/
npm run build
```
