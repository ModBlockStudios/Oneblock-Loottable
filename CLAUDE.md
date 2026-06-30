# CLAUDE.md

Ce fichier guide Claude Code (et tout contributeur) lors du travail sur ce
dépôt. **Ces règles sont obligatoires** et priment sur les habitudes par défaut.

## 🎯 Objectif du projet

Interface web servant de catalogue des blocs et items Minecraft **Bedrock**
(les identifiants exposés sont ceux de Bedrock), première brique d'un futur
outil de création de **loot tables OneBlock**. Le site est statique et déployé
via **GitHub Pages**.

---

## 📏 Règles à respecter impérativement

### 1. Versioning visible sur le site
- La version de l'interface **doit toujours être affichée** dans l'en-tête du
  site, afin de vérifier en un coup d'œil si la version en ligne / en review
  est à jour.
- Source unique de vérité : **`js/version.js`** (`version` en SemVer +
  `buildDate` au format `AAAA-MM-JJ`).
- **À chaque modification notable**, incrémenter `version` et mettre `buildDate`
  à jour, puis ajouter une entrée dans **`CHANGELOG.md`**.
- Règle SemVer (`MAJEUR.MINEUR.CORRECTIF`) :
  - `CORRECTIF` : correction de bug, ajustement mineur.
  - `MINEUR` : nouvelle fonctionnalité rétrocompatible.
  - `MAJEUR` : changement cassant (structure de données, URL, etc.).

### 2. Structure du code maintenable
- Garder une **séparation claire des responsabilités** :
  - `index.html` → structure/markup uniquement.
  - `css/` → présentation uniquement.
  - `js/` → logique uniquement.
  - `data/` → données générées (ne pas éditer à la main).
  - `scripts/` → outils de build (génération des données/assets).
- Les données (`data/items.json`) et les icônes (`assets/`) sont **générées**
  par `scripts/build-data.js`. Ne jamais les modifier à la main : régénérer via
  `npm run build-data`.
- Toute nouvelle dépendance ou source de données doit être documentée dans le
  `README.md`.

### 3. Pas de code « en un seul fichier » (anti toile d'araignée)
- **Interdit** de tout entasser dans un seul gros fichier illisible.
- Découper par **responsabilité** ; quand un fichier JS dépasse ~250–300 lignes
  ou mélange plusieurs préoccupations, le scinder en modules dédiés
  (ex. `js/version.js`, `js/data.js`, `js/ui.js`, `js/filters.js`, …).
- Éviter les dépendances circulaires et les fonctions « fourre-tout ».
- Une fonction = une responsabilité claire ; préférer plusieurs petites
  fonctions à une fonction géante.

### 4. Respecter les standards de développement
- **Nommage** : `camelCase` pour les variables/fonctions JS, `kebab-case` pour
  les fichiers et les classes CSS, `UPPER_SNAKE_CASE` pour les constantes
  globales.
- **Indentation** : 2 espaces. Point-virgules en JS. Guillemets simples en JS.
- `'use strict'` et code encapsulé (IIFE ou modules), pas de fuite dans le
  scope global non maîtrisée.
- **Lisibilité** : commentaires utiles (le *pourquoi*, pas le *quoi* évident),
  noms explicites, pas de code mort.
- **Accessibilité & responsive** : conserver les attributs ARIA, la navigation
  clavier et le rendu mobile existants.
- **Commits** : messages clairs et descriptifs, en français, au présent
  (ex. `feat: ajoute le filtre par catégorie`). Préfixes conseillés :
  `feat`, `fix`, `refactor`, `docs`, `chore`, `style`.

---

## 🌿 Branche de travail

- Développer sur la branche dédiée : **`claude/minecraft-lootable-interface-2mfzmn`**.
- Committer avec des messages clairs, puis pousser sur cette branche.
- Ne pas pousser sur une autre branche sans autorisation explicite.

---

## 🔧 Commandes utiles

```bash
npm install                 # installe minecraft-data + minecraft-assets
npm run build-data          # régénère data/ + assets/ (ids Bedrock, textures Java)
MC_VERSION=1.21.x MC_BEDROCK_VERSION=1.21.x npm run build-data   # autres versions
npm start                   # sert le site en local sur http://localhost:5173
```

> ⚠️ Toujours servir le site via un serveur local (pas `file://`), sinon le
> `fetch` de `data/items.json` est bloqué par le navigateur.

---

## ✅ Checklist avant chaque commit

- [ ] La version (`js/version.js`) et `CHANGELOG.md` sont à jour si nécessaire.
- [ ] Les `?v=` de cache-busting dans `index.html` (css/js) correspondent à la
      nouvelle version.
- [ ] Le code reste découpé par responsabilité (pas de fichier fourre-tout).
- [ ] Les standards de nommage/format sont respectés.
- [ ] Le site se charge sans erreur console (testé via un serveur local).
- [ ] Les données générées n'ont pas été éditées à la main.
