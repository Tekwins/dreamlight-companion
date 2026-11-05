# Dreamlight Compagnon — notes pour Claude Code

Appli compagnon non officielle de Disney Dreamlight Valley, pour Tek et sa femme (usage personnel).
Interface et textes **en français**. Répondre à Tek en français.

## Pile technique
- Vite 8 + Preact 11 (JSX), PWA via vite-plugin-pwa. Pas de TypeScript, pas de framework CSS.
- Navigation par `#` (`src/lib/router.js`) car hébergé sur GitHub Pages sous `/dreamlight-companion/`.
- Déploiement : `.github/workflows/deploy.yml`, à chaque push sur `main` → https://tekwins.github.io/dreamlight-companion/
- Supabase (projet `idmeekuelqbomisvnosn`) : connexion par lien magique (PKCE), table `user_state`
  (une ligne jsonb par compte, RLS : chaque compte ne voit que sa ligne). Schéma : `supabase/schema.sql`.
  Connexion par **code à 6 chiffres** (`verifyOtp`) en plus du lien : sur iOS, l'appli installée sur l'écran d'accueil
  ne partage pas le stockage de Safari, donc le lien seul ne la connecte pas. Le modèle d'e-mail « Magic Link » de
  Supabase doit contenir `{{ .Token }}` (modèle prêt : `supabase/email-magic-link.html`, à coller dans le dashboard).
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
  `Carte.jsx` (écran `#/carte`) : carte interactive, conçue dans une session Claude Design séparée (artifact
  `PXoWydsbHUosmc2fEL6f2B`) puis intégrée ici. Le jeu de base reprend les 8 vrais biomes ; les zones des 3
  extensions (ex. « L'Oasis », « La Cour ») sont des lieux plus précis que nos biomes actuels, pas encore une
  donnée de jeu confirmée — gardées en local dans `Carte.jsx` (tableaux `RIFT_ZONES`/`VALE_ZONES`/`RANCH_ZONES`),
  rattachées au biome réel le plus proche pour les ressources/pêche/animaux, disposition plausible mais pas
  géographiquement garantie (aucune carte officielle assemblée trouvée pour les extensions, voir mémoire).
  Texture de chaque zone (`TILE` dans `Carte.jsx`) : vraie tuile de carte extraite du bundle Unity
  `ui-images-menu-map-hires_assets_all.bundle`, recadrée/compressée en `.webp` dans `public/img/map/`.
  Association zone ↔ tuile fiable pour le jeu de base (noms de tuiles explicites : plaza, meadow, beach…),
  au mieux pour les extensions quand plusieurs tuiles partagent un biome sans distinction claire (ex. les
  4 tuiles « desert » pour les 4 zones de Dunes scintillantes) — vérifié à l'œil quand possible (eau pour
  L'Oasis, canyon rougeâtre pour Ravin ravissant, etc.), sinon assigné dans l'ordre.
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
  - Habitants, souvenirs, recettes et fleurs décoratives : 100 % récupérées.
  - Meubles (`furniture.js`) : 996/1304 (76 %, contre 28 % avant le 2026-11-05) — récupérées directement depuis
    les fichiers du jeu installé (voir mémoire `project-data-pipeline-state`, section UnityPy/LocDB, pour la
    méthode complète si à refaire — inclut désormais aussi `LocDB_en-US.zip`, la localisation anglaise du jeu,
    utilisée en complément du français pour fiabiliser la recherche de sprite et vérifier les correspondances
    existantes : passe de vérification faite le 2026-11-05 sur les 628 meubles + 40 fleurs récupérés cette
    semaine, aucune erreur confirmée). Les ~308 restants n'ont pas de nom interne reconnu (texte introuvable
    dans les .locbin) ou ne pointent que vers un sprite au nom générique/ambigu partagé par plusieurs objets
    différents (ex. « Color01 », « Rug », « MarketStall », « FurnitureBundle ») — volontairement laissés sans
    image plutôt que de risquer une image fausse.
  - Voie des étoiles (`starpath.js`) : 15/54 (10 récupérées le 2026-11-05 via extraction locale — 7 meubles,
    3 compagnons/figurines). Les 39 restantes (vêtements, motifs, maquillage, cadres photo, revêtements) sont
    bloquées différemment des meubles : ces bundles exportent leurs sprites sous des noms génériques de variante
    de couleur (« color01 », « var03»…) sans aucun lien avec l'identité de l'objet — pas juste ambigu comme pour
    les meubles, carrément introuvable par nom. Pas de piste automatisée restante, voir mémoire.
- Historique des Voies des étoiles passées (27 voies, noms EN uniquement, pas de catégorie wiki FR) : Tek a décliné
  ce scraping une première fois — ne relancer que s'il le redemande explicitement.
- **Récompenses d'amitié** : 83/689 encore marquées « nom à vérifier en jeu » dans `Friends.jsx` (147 avant le
  2026-11-05 — 64 vérifiées/traduites depuis la localisation officielle du jeu, `npm run data -- locdb` puis
  `npm run build-data`, voir mémoire). Les 83 restants n'ont pas de texte officiel trouvé dans les .locbin —
  25 ont pour seul nom « Design Motif » (texte générique de mydreamlightvalley.com lui-même, pas un nom d'objet
  à chercher), les autres (motifs nommés, vêtements, meubles) n'ont simplement pas de correspondance dans les
  fichiers de localisation ouverts jusqu'ici. Pas un bug, juste pas confirmé.
  Chaque récompense affiche désormais une vignette (`<Thumb>`, repli sur l'initiale comme ailleurs dans
  l'appli). Images récupérées par deux méthodes complémentaires : 93/145 meubles de récompense depuis les
  fichiers du jeu (bundle déjà extrait), puis 69 de plus (41 vêtements, 21 meubles supplémentaires, 4
  autocollants, 2 divers) depuis mydreamlightvalley.com (`npm run data -- recompenses-images`, catégories
  `/fr/clothing/` et `/fr/motif/` jamais exploitées avant — contournement du blocage des vêtements côté
  fichiers du jeu, voir mémoire). Autocollants/motifs restent à 164/178 sans image (formulation trop
  différente entre le wiki FR et mydreamlightvalley.com, et pas mal de liens d'images cassés côté MDV).
- **Bonus de rôle des habitants** : calculé (`roleBonus()` dans `Friends.jsx`), formule communautaire du wiki
  anglais (dreamlightvalleywiki.com/Bonuses, non confirmée par Gameloft) : base (20 % Jardinage, 25 % les autres
  rôles) + 3,5 %/niveau du compagnon actif + 1 %/niveau de chaque autre habitant sur le même rôle.
- **Délai de repousse des fleurs décoratives** (Cueillette) : suivi via un minuteur manuel (« Mes parcelles de
  fleurs », comme les plantations du Potager). `src/data/flowers.js` (72 fleurs, générées depuis Catégorie:Fleurs
  du wiki FR, voir `parseFleurs()` dans build-data.mjs) : biome + rareté/délai (formule communautaire du wiki
  anglais, dreamlightvalleywiki.com/Foraging#Flower_Spawning, non confirmée par Gameloft — 4 paliers, 6/4/3/2
  fleurs par biome → 20/30/40/60 min/fleur, 2h pour tout repousser). Absentes : Crocus/Muguet (Wishblossom Ranch)
  et Chardon/Digitale (Honeyglow Woods), pas encore de fiche individuelle sur le wiki FR ; Fleurs en soie (Ranch),
  mécanisme différent (repousse par sous-zone, pas le système à 4 paliers) ; images non récupérables (même blocage
  Cloudflare que les meubles, pas de catégorie fleurs sur mydreamlightvalley.com).

Maquette alignée (https://claude.ai/artifact/4SfLa7iz17AMGsGRtj8zFR) : écrans principaux, vue « Par biome »
(Potager/Pêche/Cueillette/Mines), recherche globale détaillée, Collection (Voie étoilée/Souvenirs/Meubles).

## Commandes
```bash
npm install
npm run dev     # http://localhost:5173/dreamlight-companion/
npm run build
```
