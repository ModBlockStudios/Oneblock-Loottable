# OneBlock Loot Table 🧱

Interface web servant de catalogue de **tous les blocs et items de Minecraft
Bedrock** (inventaire créatif). Première brique d'un futur outil de création de
*loot tables* pour OneBlock.

➡️ **Démo en ligne** : `https://<ton-pseudo-github>.github.io/Oneblock-Loottable/`
(remplace `<ton-pseudo-github>` une fois GitHub Pages activé).

## ✨ Fonctionnalités

- **Édition Bedrock** : les identifiants affichés sont ceux de Bedrock
  (ex. `minecraft:web`, `minecraft:magma`, `minecraft:noteblock`).
- Catalogue complet : **1408 entrées** (436 full blocks, 514 decoration blocks,
  458 items).
- Présentation en **tableau** : icône, nom, identifiant, catégorie, taille de pile.
- Recherche instantanée (nom affiché ou identifiant).
- Filtres : **Tout / Full Block / Decoration Block / Item**.
  - *Full Block* = bloc cube plein (géométrie cube de Minecraft).
  - *Decoration Block* = le reste (escaliers, dalles, portes, plantes…).
- Icônes officielles (textures 16×16) pour quasiment chaque entrée.
- Clic sur une ligne → copie de l'identifiant (ex. `minecraft:diamond`).
- Design épuré noir & blanc, chargement progressif (scroll infini), responsive.

> ℹ️ **Note technique** : le contenu (blocs/items) est identique entre les
> éditions Java et Bedrock. La liste « propre » de l'inventaire créatif et les
> textures proviennent des données **Java** ; les identifiants sont convertis en
> **Bedrock** via une table de correspondance validée contre `minecraft-data`.

## 🧰 Stack technique

- **React 18** + **Vite** (build statique).
- Aucune librairie UI : CSS maison (DA noir & blanc épurée).
- Données + icônes générées (voir plus bas), servies depuis `public/`.

## 🚀 Mettre la page en ligne avec GitHub Pages

L'application a une **étape de build** (Vite), le déploiement se fait donc via
**GitHub Actions** (le mode « Deploy from a branch » ne convient pas car il ne
build pas).

1. **Settings** (Paramètres) du dépôt → menu **Pages** (colonne de gauche).
2. Sous **Build and deployment** → **Source**, choisis **GitHub Actions**.
3. Le workflow `.github/workflows/deploy-pages.yml` (build Vite + déploiement)
   se déclenche à chaque push sur `main`/`master`, ou manuellement via l'onglet
   **Actions** → *Run workflow*.
4. À la fin du job, l'URL publique apparaît dans **Actions** et **Settings → Pages** :
   `https://<ton-pseudo-github>.github.io/Oneblock-Loottable/`.

> ℹ️ Le chemin de base (`/Oneblock-Loottable/`) est configuré dans
> `vite.config.js`. Si tu renommes le dépôt, mets-le à jour.

## 🛠️ Développement local

```bash
npm install
npm run dev        # serveur de dev Vite -> http://localhost:5173
npm run build      # build de production -> dist/
npm run preview    # prévisualise le build de production
```

## 🔄 Régénérer le catalogue (changer de version de Minecraft)

Les données et les icônes sont générées à partir des paquets
[`minecraft-data`](https://github.com/PrismarineJS/minecraft-data) et
[`minecraft-assets`](https://github.com/PrismarineJS/minecraft-assets).

```bash
npm install
npm run build-data          # défaut : textures Java 1.21.8, ids Bedrock 1.21.111
# pour d'autres versions :
MC_VERSION=1.21.6 MC_BEDROCK_VERSION=1.21.90 npm run build-data
```

- `MC_VERSION` : version Java pour la liste créative + les textures
  (doit exister dans `minecraft-data` ET `minecraft-assets`).
- `MC_BEDROCK_VERSION` : version Bedrock servant à **valider** les identifiants
  convertis (doit exister dans `minecraft-data`).

Cela régénère `public/data/items.json` et les dossiers `public/assets/items/`,
`public/assets/blocks/`. La table de correspondance Java→Bedrock se trouve en
haut de `scripts/build-data.js` (`JAVA_TO_BEDROCK`).

## 📁 Structure

```
.
├── index.html                  # point d'entrée Vite
├── vite.config.js              # config Vite (base path, plugin React)
├── src/
│   ├── main.jsx                # montage React
│   ├── App.jsx                 # composition + état (recherche, filtres, toast)
│   ├── version.js              # version de l'interface (source unique)
│   ├── styles.css              # styles (DA noir & blanc épurée)
│   ├── components/             # Header, Toolbar, CatalogTable, CatalogRow, Toast
│   └── lib/                    # useCatalog (fetch), copy (presse-papiers)
├── public/
│   ├── data/items.json         # catalogue généré (id Bedrock, nom, catégorie, icône)
│   ├── data/configs/           # configs PARTAGÉES (.json) chargées pour tous
│   └── assets/{items,blocks}/  # icônes
├── scripts/build-data.js       # générateur (ids Bedrock + textures Java)
├── scripts/build-shared-index.cjs # (re)génère public/data/configs/index.json
└── .github/workflows/          # build + déploiement GitHub Pages
```

## 🌐 Configs partagées

Les fichiers `.json` déposés dans **`public/data/configs/`** sont des configs
exportées depuis le site (bouton **« Exporter (partage) »**). Ils utilisent **le
même format que le code du plugin** (`phases` + `loot_tables` en bas), donc
copier-coller compatible avec le code du dev ; le nom d'affichage et l'icône
sont reconstruits depuis le catalogue à l'ouverture. Elles sont **chargées
automatiquement** pour tous les visiteurs au (re)chargement du site.

- Pour en ajouter/mettre à jour une : dépose (drag & drop) son `.json` dans ce
  dossier et commite. L'index (`index.json`) est **régénéré au build**
  (`npm run prebuild`, lancé avant `npm run build`) — pas besoin de l'éditer.
- Les configs partagées ne sont **pas** sauvegardées dans le navigateur : un
  reload recharge la version présente sur GitHub. Seules les configs perso
  (non partagées) sont conservées en local.

## 📜 Crédits

Données et textures issues des projets **PrismarineJS** (`minecraft-data`,
`minecraft-assets`). Minecraft est une marque de **Mojang Studios**.
Projet communautaire non affilié à Mojang/Microsoft.
