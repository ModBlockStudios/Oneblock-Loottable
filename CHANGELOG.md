# Changelog

Toutes les modifications notables de l'interface sont consignées ici.
Le format suit [Keep a Changelog](https://keepachangelog.com/fr/) et le
versionnage [SemVer](https://semver.org/lang/fr/).

> La version affichée dans l'en-tête du site correspond au champ `version`
> de `js/version.js`. Vérifie-la pour savoir si la page en ligne est à jour.

## [3.2.0] — 2026-06-30

### Ajouté
- **Navigation par onglets** en haut : **Table** (catalogue) et **Lootable**
  (constructeur). Routage par hash (`#/table`, `#/lootable`).
- **Page Lootable** : tableau des items sélectionnés (vide au départ).
- Depuis la **Table**, bouton **+** sur chaque ligne pour ajouter un item à la
  lootable (re-clic = ✓ → retire). Bouton **×** pour retirer côté Lootable,
  et « Tout vider ». Compteur sur l'onglet Lootable.
- Sélection **persistée** (localStorage) : elle survit aux rechargements.
- Découpage : `src/pages/` (CatalogPage, LootTablePage), hooks
  `useLootTable`, `useHashRoute`, `useToast`, composant `Tabs`.

## [3.1.0] — 2026-06-30

### Ajouté
- **Sous-catégories (tags) filtrables**, inspirées du rangement créatif de
  Mojang : Nourriture, Armure, Arme, Outil, Potion, Œuf d'apparition, Disque,
  Transport, Teinture, Matériau (items) ; Minerai, Bois, Plante, Coloré,
  Redstone, Lumière, Utilitaire, Construction (blocs).
- Colonne **Tag** dans le tableau : clic sur un tag = filtre dessus
  (re-clic = réinitialise). Sélecteur de tag dans la barre d'outils.
- Tags dérivés des données `minecraft-data` (`enchantCategories`, `foods.json`)
  + motifs de noms ; calculés dans `scripts/build-data.cjs` (`subCategoryOf`).

### Changé
- `scripts/build-data.js` renommé en **`scripts/build-data.cjs`** (le projet
  est passé en `"type": "module"` pour Vite).

## [3.0.0] — 2026-06-30

### Changé (cassant)
- **Réécriture en React + Vite.** L'interface n'est plus du HTML/JS « vanilla »
  mais une application React découpée en composants
  (`Header`, `Toolbar`, `CatalogTable`, `CatalogRow`, `Toast`) + hooks
  (`useCatalog`) et utilitaires (`copyText`).
- Build via **Vite** : les bundles JS/CSS sont **hashés** → cache-busting
  natif (le `?v=` manuel n'est plus nécessaire pour le code).
- Déploiement GitHub Pages désormais **via GitHub Actions** (étape de build).
  Régler *Settings → Pages → Source* sur **GitHub Actions**.
- Données et icônes déplacées dans `public/` (servies telles quelles par Vite).

### Conservé
- Toutes les fonctionnalités : tableau, recherche, filtres
  `Tout / Full Block / Decoration Block / Item`, identifiants Bedrock,
  copie au clic, versioning visible, DA noir & blanc épurée.

## [2.0.1] — 2026-06-30

### Corrigé
- **Cache-busting** sur `css/`, `js/` et `data/items.json` (`?v=version`) :
  après un déploiement, le navigateur charge immédiatement les nouveaux
  fichiers au lieu de servir un mélange d'anciens fichiers en cache (qui
  provoquait un thème/version obsolètes et « 0 résultat »).

## [2.0.0] — 2026-06-30

### Changé (cassant)
- **Édition cible : Minecraft Bedrock.** Les identifiants affichés sont
  désormais ceux de Bedrock (ex. `cobweb` → `web`, `magma_block` → `magma`,
  `note_block` → `noteblock`, `nether_quartz_ore` → `quartz_ore`). Conversion
  via une table Java→Bedrock validée contre `minecraft-data` (bedrock 1.21.111).
- **Mise en page en tableau** (icône / nom / identifiant / catégorie / pile)
  à la place des cartes.
- **Direction artistique** épurée noir & blanc (esprit Claude).
- **Catégories** remplacées : `Tout / Full Block / Decoration Block / Item`.
  - *Full Block* = bloc cube plein (géométrie cube de Minecraft), déterminé
    via les formes de collision (`blockCollisionShapes`).
  - *Decoration Block* = le reste (escaliers, dalles, portes, plantes…).
- Structure de données : champ `type` remplacé par `category`.

### Retiré
- 7 items Java sans équivalent Bedrock « normal » (`debug_stick`,
  `knowledge_book`, `furnace_minecart`, `spectral_arrow`, `tipped_arrow`,
  `test_block`, `test_instance_block`).

## [1.1.0] — 2026-06-30

### Ajouté
- Versioning visible dans l'en-tête (badge `vX.Y.Z` + date de build).
- Source unique de vérité de la version : `js/version.js`.
- Ce fichier `CHANGELOG.md` (lié depuis le badge de version).

## [1.0.0] — 2026-06-30

### Ajouté
- Catalogue complet de l'inventaire créatif Minecraft 1.21.8
  (1415 entrées : 952 blocs + 463 items).
- Recherche instantanée, filtres Tout/Blocs/Items, scroll infini.
- Icônes 16×16 officielles, clic = copie de l'identifiant `minecraft:<id>`.
- Générateur de données `scripts/build-data.js`
  (depuis `minecraft-data` + `minecraft-assets`).
- Déploiement GitHub Pages : `.nojekyll`, workflow Actions, guide README.
