# OneBlock Loot Table 🧱

Interface web servant de catalogue de **tous les blocs et items de Minecraft**
(inventaire créatif, dernière version stable). Première brique d'un futur outil
de création de *loot tables* pour OneBlock.

➡️ **Démo en ligne** : `https://<ton-pseudo-github>.github.io/Oneblock-Loottable/`
(remplace `<ton-pseudo-github>` une fois GitHub Pages activé).

## ✨ Fonctionnalités

- Catalogue complet : **1415 entrées** (952 blocs + 463 items) de Minecraft **1.21.8**.
- Recherche instantanée (nom affiché ou identifiant `minecraft:…`).
- Filtres : Tout / Blocs / Items.
- Icônes officielles (textures 16×16) pour quasiment chaque entrée.
- Clic sur une carte → copie de l'identifiant (ex. `minecraft:diamond`) dans le presse-papiers.
- Chargement progressif (scroll infini), responsive.

## 🚀 Mettre la page en ligne avec GitHub Pages

Tu as **deux options**. La première est la plus simple.

### Option A — Déployer depuis la branche (sans configuration, recommandé pour débuter)

1. Pousse ce dépôt sur GitHub (déjà fait si tu lis ceci).
2. Va dans **Settings** (Paramètres) du dépôt → menu **Pages** (colonne de gauche).
3. Sous **Build and deployment** → **Source**, choisis **Deploy from a branch**.
4. **Branch** : sélectionne la branche qui contient le site
   (`main` après fusion, ou directement la branche de travail), puis le dossier **`/ (root)`**.
5. Clique **Save**. Attends 1–2 minutes.
6. L'URL publique s'affiche en haut de la page Pages :
   `https://<ton-pseudo-github>.github.io/Oneblock-Loottable/`.

> Le fichier `.nojekyll` est déjà présent pour que GitHub serve correctement
> les dossiers `assets/`, `css/`, `js/`.

### Option B — Déployer via GitHub Actions (automatique à chaque push)

1. **Settings** → **Pages** → **Source** : choisis **GitHub Actions**.
2. Le workflow `.github/workflows/deploy-pages.yml` se déclenche à chaque push
   sur `main`/`master` (ou manuellement via l'onglet **Actions** → *Run workflow*).
3. À la fin du job, l'URL de déploiement apparaît dans l'onglet **Actions**
   et dans **Settings → Pages**.

> ℹ️ Le workflow ne se déclenche que sur `main`/`master`. Si tu travailles sur une
> autre branche, fusionne-la d'abord, ou lance le workflow manuellement.

## 🛠️ Développement local

```bash
# Servir le site localement (n'importe quel serveur statique fait l'affaire)
npm start          # -> http://localhost:5173
# ou
python3 -m http.server 5173
```

Ouvre ensuite `http://localhost:5173`.

> ⚠️ Ouvrir `index.html` directement par `file://` ne fonctionne pas :
> le navigateur bloque le `fetch` du JSON. Utilise un petit serveur local.

## 🔄 Régénérer le catalogue (changer de version de Minecraft)

Les données et les icônes sont générées à partir des paquets
[`minecraft-data`](https://github.com/PrismarineJS/minecraft-data) et
[`minecraft-assets`](https://github.com/PrismarineJS/minecraft-assets).

```bash
npm install
npm run build-data          # version par défaut : 1.21.8
# pour une autre version (doit exister dans les DEUX paquets) :
MC_VERSION=1.21.6 npm run build-data
```

Cela régénère `data/items.json` et les dossiers `assets/items/`, `assets/blocks/`.

## 📁 Structure

```
.
├── index.html               # page principale
├── css/style.css            # styles
├── js/app.js                # logique (recherche, filtres, rendu)
├── data/items.json          # catalogue généré (id, nom, type, icône)
├── assets/items/*.png       # icônes des items
├── assets/blocks/*.png      # icônes des blocs
├── scripts/build-data.js    # générateur des données + textures
└── .github/workflows/       # déploiement GitHub Pages (option B)
```

## 📜 Crédits

Données et textures issues des projets **PrismarineJS** (`minecraft-data`,
`minecraft-assets`). Minecraft est une marque de **Mojang Studios**.
Projet communautaire non affilié à Mojang/Microsoft.
