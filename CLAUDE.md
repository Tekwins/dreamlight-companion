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
- `src/data/` : données du jeu (biomes, animaux + horaires, cultures, poissons, gemmes, cueillette, recettes, habitants,
  succès, Voie des étoiles, quêtes, meubles, souvenirs). La plupart sont générées par `scripts/build-data.mjs` depuis
  `data/raw/` (pages du wiki récupérées par `scripts/scrape-wiki.mjs`, voir ses commentaires d'en-tête pour les modes :
  tout, `images`, `quetes`, `collection`) ; `resources.js` et `critters.js` restent à la main.
  Biomes référencés par identifiant (`BIOMES` dans `biomes.js`) ; chaque biome porte son extension (`rift`, `vale`, `ranch`).
  `furniture.js` : les 23 vraies catégories du jeu (pas une simplification), un meuble peut en avoir plusieurs.
  `memories.js` : souvenirs groupés par univers Disney/Pixar, numérotés (pas de nom individuel dans le jeu).
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

## Reste à faire
- **Notifications push** : tout est codé (client `src/lib/push.js` + fonction Supabase `daily-reminders`), mais le
  déploiement (clés VAPID, `supabase functions deploy`, planification cron) doit se faire depuis le compte Supabase
  de Tek — étapes dans `supabase/functions/daily-reminders/README.md`.
- **Images manquantes**, toutes avec repli sur l'initiale (composant `Thumb`), pas bloquant :
  - Habitants et souvenirs : 100 % récupérées.
  - Meubles (`furniture.js`) : ~365/1304 (28 %) — mydreamlightvalley.com n'a pas de page pour la plupart des
    variantes (couleur/style). Matching déjà optimisé (voir `fetchFurnitureFromMdv()` dans `scrape-wiki.mjs` :
    décodage d'entités HTML + repli par jeu de tokens triés) ; pas de piste automatisée supplémentaire connue.
  - 12 images de recettes et 54 images Voie des étoiles/cosmétiques : définitivement bloquées (wiki EN épuisé,
    CDN Fandom protégé par Cloudflare) — ne pas retenter, voir les commentaires de `scripts/scrape-wiki.mjs`.
- Historique des Voies des étoiles passées (27 voies, noms EN uniquement, pas de catégorie wiki FR) : Tek a décliné
  ce scraping une première fois — ne relancer que s'il le redemande explicitement.
- **Récompenses d'amitié** : 147/689 proviennent de mydreamlightvalley.com ou du wiki anglais (pas du wiki FR),
  marquées « nom à vérifier en jeu » dans `Friends.jsx`. Pas un bug, juste pas confirmé par la source officielle.
- **Bonus de rôle des habitants** : calculé (`roleBonus()` dans `Friends.jsx`), formule communautaire du wiki
  anglais (dreamlightvalleywiki.com/Bonuses, non confirmée par Gameloft) : base (20 % Jardinage, 25 % les autres
  rôles) + 3,5 %/niveau du compagnon actif + 1 %/niveau de chaque autre habitant sur le même rôle.
- **Délai de repousse des fleurs décoratives** (Cueillette) : pas encore suivi — mécanique réelle trouvée sur
  dreamlightvalleywiki.com/Foraging#Flower_Spawning (4 paliers de rareté : 6/4/3/2 fleurs par biome → 20/30/40/60 min
  par fleur, max 2h pour tout repousser ; le minuteur interne tourne en continu, donc seule la 1ère fleur après un
  nettoyage complet a un délai incertain). Nécessite un nouveau jeu de données (~75 fleurs, nom FR + biome + rareté)
  et une maquette d'interface pour le minuteur — à faire en concertation avec Tek vu l'ampleur.

Maquette alignée (https://claude.ai/artifact/4SfLa7iz17AMGsGRtj8zFR) : écrans principaux, vue « Par biome »
(Potager/Pêche/Cueillette/Mines), recherche globale détaillée, Collection (Voie étoilée/Souvenirs/Meubles).

## Commandes
```bash
npm install
npm run dev     # http://localhost:5173/dreamlight-companion/
npm run build
```
