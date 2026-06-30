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
- Source unique de vérité : **`src/version.js`** (`version` en SemVer +
  `buildDate` au format `AAAA-MM-JJ`).
- **À chaque modification notable**, incrémenter `version` et mettre `buildDate`
  à jour, puis ajouter une entrée dans **`CHANGELOG.md`**.
- Règle SemVer (`MAJEUR.MINEUR.CORRECTIF`) :
  - `CORRECTIF` : correction de bug, ajustement mineur.
  - `MINEUR` : nouvelle fonctionnalité rétrocompatible.
  - `MAJEUR` : changement cassant (structure de données, URL, etc.).

### 2. Structure du code maintenable (React + Vite)
- Garder une **séparation claire des responsabilités** :
  - `src/components/` → composants React de présentation (un fichier = un composant).
  - `src/lib/` → logique réutilisable (hooks, utilitaires : fetch, presse-papiers).
  - `src/App.jsx` → composition + état global de la page.
  - `src/styles.css` → présentation (CSS maison).
  - `public/data/`, `public/assets/` → données/icônes générées (ne pas éditer à la main).
  - `scripts/` → outils de build (génération des données/assets).
- Les données (`public/data/items.json`) et les icônes (`public/assets/`) sont
  **générées** par `scripts/build-data.js`. Ne jamais les modifier à la main :
  régénérer via `npm run build-data`.
- Toute nouvelle dépendance ou source de données doit être documentée dans le
  `README.md`.

### 3. Pas de code « en un seul fichier » (anti toile d'araignée)
- **Interdit** de tout entasser dans un seul gros composant illisible.
- Découper par **responsabilité** ; quand un composant dépasse ~150–200 lignes
  ou mélange plusieurs préoccupations, le scinder (composant dédié, hook, util).
- Extraire la logique réutilisable dans `src/lib/` (hooks `useX`, utilitaires).
- Éviter les dépendances circulaires et les composants « fourre-tout ».
- Un composant / une fonction = une responsabilité claire.

### 4. Respecter les standards de développement
- **Nommage** : `camelCase` pour variables/fonctions, `PascalCase` pour les
  composants React et leurs fichiers (`CatalogTable.jsx`), `kebab-case` pour les
  classes CSS, `UPPER_SNAKE_CASE` pour les constantes globales.
- **Indentation** : 2 espaces. Point-virgules en JS. Guillemets simples en JS.
- Composants fonctionnels + hooks ; pas d'état global non maîtrisé.
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
npm install                 # installe React/Vite + minecraft-data/assets
npm run dev                 # serveur de dev Vite -> http://localhost:5173
npm run build               # build de production -> dist/
npm run preview             # prévisualise le build de production
npm run build-data          # régénère public/data + public/assets (ids Bedrock)
MC_VERSION=1.21.x MC_BEDROCK_VERSION=1.21.x npm run build-data   # autres versions
```

> Le déploiement GitHub Pages se fait via **GitHub Actions** (build Vite).
> Source à régler sur « GitHub Actions » dans *Settings → Pages*.

---

## ✅ Checklist avant chaque commit

- [ ] La version (`src/version.js`) et `CHANGELOG.md` sont à jour si nécessaire.
- [ ] `npm run build` passe sans erreur.
- [ ] Le code reste découpé par responsabilité (pas de composant fourre-tout).
- [ ] Les standards de nommage/format sont respectés.
- [ ] Le site se charge sans erreur console (testé via un serveur local).
- [ ] Les données générées n'ont pas été éditées à la main.
