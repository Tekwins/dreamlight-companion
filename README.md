# Dreamlight Compagnon

Compagnon de jeu non officiel pour **Disney Dreamlight Valley**, pour un usage personnel.
Fonctionne sur iPhone, Android et ordinateur (application installable, utilisable hors ligne).

Adresse une fois déployée : https://tekwins.github.io/dreamlight-companion/

## Ce que fait l'appli

- **Aujourd'hui** : animaux présents maintenant (couleurs rares en tête), choses à faire, minuteurs du potager.
- **Animaux** : horaires de chaque couleur, disponibilité en temps réel, méthode d'approche, nourriture, suivi de l'apprivoisement.
- **Vallée** : potager (rentabilité à l'heure, minuteurs), pêche (remous), cueillette, mines — tout regroupé et filtrable par biome.
- **Recettes** : filtres par type et étoiles, garde-manger (« que puis-je cuisiner ? »), liste de courses.
- **Amitié**, **Voie des étoiles**, **Réglages** (extensions possédées, thème Nuit étoilée ou Château, sauvegarde).

Chaque personne a **son propre compte** : la progression est synchronisée entre ses appareils et
n'est jamais visible par un autre compte.

## Mise en route (une seule fois)

### 1. Base de données Supabase
1. Ouvrir le projet Supabase › **SQL Editor** › *New query*.
2. Coller le contenu de [`supabase/schema.sql`](supabase/schema.sql) et cliquer sur **Run**.
3. **Authentication › URL Configuration** :
   - *Site URL* : `https://tekwins.github.io/dreamlight-companion/`
   - *Redirect URLs* : ajouter `https://tekwins.github.io/dreamlight-companion/` et `http://localhost:5173/dreamlight-companion/`

### 2. Publication sur GitHub Pages
Dans le dépôt GitHub › **Settings › Pages** › *Source* : **GitHub Actions**.
Chaque envoi sur la branche `main` republie l'appli automatiquement.

### 3. Installer l'appli
- **iPhone** (Safari) : Partager › *Sur l'écran d'accueil*.
- **Android** (Chrome) : menu ⋮ › *Installer l'application*.
- **Ordinateur** (Chrome ou Edge) : icône d'installation dans la barre d'adresse. L'appli s'ouvre dans sa propre fenêtre, à placer sur le second écran.

## Données du jeu

Les fichiers `src/data/*.js` contiennent les données vérifiées sur le Dreamlight Valley Wiki
(animaux et horaires, cultures, gemmes) et des guides de jeu (pêche, cueillette, échantillon de recettes).

Pour récupérer les pages complètes des wikis (recettes, habitants, quêtes, succès, Voies des étoiles) :

```bash
npm install
npm run data            # pages brutes dans data/raw/
npm run data -- images  # images dans public/img/
```

## Développement

```bash
npm install
npm run dev     # http://localhost:5173/dreamlight-companion/
npm run build
```

Données : Dreamlight Valley Wiki et Disney Dreamlight Valley Wiki (Fandom). Appli non affiliée à Disney ni à Gameloft.
