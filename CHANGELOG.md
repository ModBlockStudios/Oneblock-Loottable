# Changelog

Toutes les modifications notables de l'interface sont consignées ici.
Le format suit [Keep a Changelog](https://keepachangelog.com/fr/) et le
versionnage [SemVer](https://semver.org/lang/fr/).

> La version affichée dans l'en-tête du site correspond au champ `version`
> de `js/version.js`. Vérifie-la pour savoir si la page en ligne est à jour.

## [3.23.0] — 2026-07-01

### Ajouté
- **Colonne « Chance »** dans les tiers Lootable (à droite de Weight) : affiche
  le **% de tirage** de chaque entrée (weight ÷ somme des weights du tiers). Pur
  affichage indicatif, **mis à jour en direct** quand on change un weight — plus
  simple à lire que des weights bruts.

## [3.22.1] — 2026-07-01

### Corrigé
- **Recette de la pelle** : elle n'exige plus 3 matériaux mais **1 seul**
  (2 bois + 1 matériau), conformément à Minecraft. La recette dépend désormais
  du type d'outil (pioche/hache = 3 matériaux, pelle = 1) ; le manche reste 2.

## [3.22.0] — 2026-07-01

### Changé
- **Le fichier de partage utilise le format du plugin** (phases + `loot_tables`
  en bas), pour rester **copier-coller compatible** avec le code du dev : plus
  de format « interne » séparé. Le site sait relire ce format et **reconstruit
  le nom d'affichage / l'icône depuis le catalogue** (le fichier ne contient que
  l'identifiant + weight, et pour les coffres le `loot_table` + `min`/`max`).
  L'ancien format interne reste lisible en repli.

## [3.21.0] — 2026-07-01

### Ajouté
- **Configs partagées via GitHub** : un dossier `public/data/configs/` où l'on
  dépose (drag & drop) des `.json` de configs. Elles sont **chargées
  automatiquement** pour tous les visiteurs au (re)chargement du site.
  - bouton **« Exporter (partage) »** : télécharge la config au **format interne
    complet** (tiers, blocs, coffres + contenu) à déposer dans le dossier.
  - les configs partagées sont marquées **🌐** ; elles sont éditables en séance
    mais **non sauvegardées** (un reload recharge la version GitHub). Seules les
    configs perso restent dans le navigateur.
  - l'index du dossier est **régénéré au build** (`prebuild`) : pas besoin de
    l'éditer à la main, le simple dépôt d'un fichier suffit.

## [3.20.0] — 2026-06-30

### Ajouté
- **Export du contenu des coffres** : la vue Code ajoute, **en bas du JSON et
  dissocié des phases**, un bloc `loot_tables` indexé par le chemin de chaque
  coffre (`path/to/<nom>`), listant son contenu (`{ name, min, max }`).
- **Bouton « Télécharger »** dans la vue Code : exporte la config en fichier
  `.json` (nommé d'après la config) pour l'uploader sur GitHub.

## [3.19.0] — 2026-06-30

### Ajouté
- **Renommer une config existante** : bouton « Renommer » dans la barre de
  configs, qui ouvre un champ pré-rempli (Entrée pour valider, Échap/Annuler
  pour abandonner). Un nom vide est ignoré.

## [3.18.0] — 2026-06-30

### Ajouté
- **Tri par weight** des tiers Lootable : à l'entrée dans l'onglet et au reload,
  les entrées de chaque tiers sont reclassées **du weight le plus grand au plus
  petit** (tri stable : à weight égal, l'ordre d'ajout est conservé). Pas de
  réordonnancement en direct pendant l'édition pour éviter que les lignes sautent.

## [3.17.0] — 2026-06-30

### Ajouté
- **Outils en or** (sidegrade « rapide », fidèle au jeu) dans le simulateur :
  - **très rapides** (vitesse 12) mais **niveau de récolte 0** (comme le bois) :
    ne minent pas le fer/diamant.
  - **hors de la progression linéaire** : proposés seulement comme option rapide
    quand l'outil actuel est encore niveau 0 (à la main ou en bois), jamais
    au-dessus de pierre/fer. Recette : 2 planches + 3 or (lingot/or brut/minerai,
    `gold_block` = 9). Bouton distinct « Crafter Or (rapide) ».

## [3.16.1] — 2026-06-30

### Corrigé
- **Animation de cassage plus réactive** : suppression de la transition CSS
  (`0.05s`) sur le remplissage du bloc et la barre de progression. La boucle
  met déjà la valeur à jour à chaque frame ; la transition ne faisait qu'ajouter
  un retard, rendant l'animation invisible sur les minages courts.

## [3.16.0] — 2026-06-30

### Ajouté
- **Palier d'outils « Cuivre »** (Copper Age) dans le simulateur, intercalé
  entre Pierre et Fer :
  - plus rapide que la pierre (vitesse 5 vs 4) et **même niveau de récolte que
    le fer** (peut donc miner le diamant).
  - recette : 2 planches + 3 cuivre (`copper_ingot`/`raw_copper`/minerai ;
    `copper_block` = 9). Désormais proposé au craft quand il améliore l'outil
    en pierre.

## [3.15.2] — 2026-06-30

### Corrigé
- **Minage en chaîne (suite)** : le réarmage du chrono passait par un effet
  React *passif* (exécuté après le paint), donc certaines frames cassaient
  encore le bloc suivant avec le temps du précédent — visible surtout entre deux
  blocs de types différents (ex. planche → terre). La détection du nouveau bloc
  est désormais **synchrone dans la boucle de minage** (comparaison du `blockId`
  via ref) : impossible de recompter avec un `mineMs` périmé.

## [3.15.1] — 2026-06-30

### Corrigé
- **Minage en chaîne** : en gardant le clic maintenu entre deux blocs, le bloc
  suivant cassait trop vite et sans animation, car la boucle réutilisait le
  temps de minage du bloc précédent (ref pas encore rafraîchie). Le chrono est
  désormais **réarmé à l'arrivée du nouveau bloc** (via `blockId`), avec son
  propre temps de minage et l'animation de cassage qui repart de zéro.

## [3.15.0] — 2026-06-30

### Ajouté
- **Retour visuel de minage** plus clair : un remplissage « cassage » monte
  du bas vers le haut **sur le bloc** lui-même, et le pourcentage de progression
  s'affiche pendant le minage. La barre de progression est rendue plus visible.

### Corrigé
- Le **sélecteur d'items** (page Lootable) classe désormais les résultats par
  pertinence (exact → préfixe → contient) avant de plafonner à 40. Un bloc comme
  **Stone** n'est plus coupé par la limite et réapparaît dans les suggestions.

## [3.14.1] — 2026-06-30

### Changé
- Le **craft consomme désormais les ressources** de l'inventaire (au lieu
  d'exiger juste de les avoir). Les petits items sont utilisés en premier ;
  casser un log (×4) ou un bloc (×9) **rend la monnaie** en item de base
  (ex. 2 logs pour 5 bois → 3 planches rendues).
- Le journal des drops devient l'« **Inventaire** » (se réduit au craft).

## [3.14.0] — 2026-06-30

### Ajouté
- **Craft d'outils** dans le simulateur (étape 4 — outils) :
  - panneau « Outils » (Pioche / Pelle / Hache) qui **propose le meilleur palier
    abordable** selon les ressources minées (recette : 2 planches + 3 matériau ;
    un `_block` = 9). Outil **permanent** une fois crafté ; on ne propose ensuite
    que mieux.
  - le **minage utilise le meilleur outil** : vitesse selon le palier
    (bois→netherite) et **drop conditionnel** (il faut le niveau d'outil requis
    pour récolter le bloc, sinon il casse sans rien donner).
- Données : `minLevel` (niveau d'outil requis) ajouté à `mining`.
- Libs `crafting.js` ; `mining.js` étendu (`mineTimeWithTools`, `canHarvestWith`).

## [3.13.0] — 2026-06-30

### Ajouté
- **Page « Visualisation »** (3ᵉ onglet) — simulateur OneBlock (étapes 2-3) :
  - on choisit une config ; un bloc s'affiche au centre.
  - **clic maintenu** pour le miner, avec barre de progression au **temps de
    minage Minecraft à la main** (`mining.time`).
  - au cassage : drop ajouté au journal, **bloc suivant tiré** selon les weights
    du tiers ; le compteur de blocs minés fait **avancer de tiers** via
    `blockstobreak`.
  - **journal des drops** (cumulé) ; bouton Réinitialiser.
  - un **coffre** tiré → ouvre son contenu inline (quantités min–max) — version
    de base (les vraies loot tables externes = étape 4).
- Composants `MiningStage`, `DropsList` ; lib `sim.js`.

## [3.12.0] — 2026-06-30

### Ajouté
- **Temps de minage** par bloc (étape 1 du simulateur OneBlock) :
  - colonne **« Minage »** dans la Table (temps à la main : `instant`,
    `X s`, ou `incassable`).
  - données générées (`mining`) : `hardness`, `requiresTool`, `tool`
    (pickaxe/shovel/axe/hoe/sword), `time` (secondes à la main), pour les blocs.
  - formule : `hardness × 1.5` (cassable à la main) ou `× 5` (outil requis) ;
    `0` = instantané, `null` = incassable.
- Lib `mining.js` (formatage + durée), réutilisable par le futur simulateur.

## [3.11.0] — 2026-06-30

### Changé
- Dans un **tiers**, on ne peut ajouter que des **blocs** (Full Block /
  Decoration Block) — logique OneBlock (on mine des blocs, pas des items).
- Les **items** restent disponibles uniquement dans les **coffres**.
- Le sélecteur du tiers est filtré sur les blocs ; celui des coffres garde tout.

## [3.10.0] — 2026-06-30

### Ajouté
- **Bouton « Code »** (à droite de « Créer ») : bascule sur une vue **JSON
  read-only** de la config courante, avec un bouton **Copier**.
- Format généré : `{ "phases": [...] }` où 1 phase = 1 tiers.
  - Tiers 1 → `{ "blocks": [...] }` ; tiers suivants → `{ "blockstobreak": <seuil>, "blocks": [...] }`.
  - Item → `{ "name": "minecraft:<id>", "weight": N }`.
  - Chest → `{ "name": "minecraft:chest", "loot_table": "path/to/<nom>", "weight": N }`.
- **Nom personnalisé par coffre** (champ texte) utilisé dans `loot_table`.
  Le contenu inline d'un chest reste éditable mais est ignoré dans l'export.
- Composants `CodeView` ; lib `exportCode` ; hook `setChestLabel`.

## [3.9.0] — 2026-06-30

### Ajouté
- Seuil **« Block à miner »** par tiers : nombre de blocs à miner pour débloquer
  ce tiers. Le **Tiers 1 est fixé à 0** ; les suivants sont éditables.
- Validation **strictement croissante** : un tiers est toujours supérieur au
  précédent. Si une valeur casse l'ordre, les tiers suivants se réajustent
  automatiquement (cascade). Migration auto des configs existantes.
- Composant `UnlockInput` ; hook `setTierUnlock` + normalisation `normalizeUnlocks`.

## [3.8.0] — 2026-06-30

### Changé
- Dans un **chest**, la quantité d'un item devient une **plage min–max**
  (ex. « entre 3 et 5 ») au lieu d'un nombre fixe : deux champs `min` / `max`.
- Migration auto des contenus existants (`quantity: N` → `min: N, max: N`).
- Nouveau composant `RangeInput` ; hook `setChestRange` (remplace
  `setChestQuantity`).

## [3.7.0] — 2026-06-30

### Ajouté
- **Entrées « Chest »** dans les tiers : un chest a son propre weight (comme un
  item) mais contient une liste d'items / blocs, chacun avec une **quantité**.
- Bouton **« 📦 Ajouter un Chest »** par tiers ; ligne de chest dépliable
  (éditeur de contenu : picker + quantités) ; retrait du chest.
- Composants `ChestRow`, `ChestEditor`, `LootItemRow`. Hook étendu
  (`addChest`, `addChestItem`, `removeChestItem`, `setChestQuantity`,
  `removeEntry` générique). Entrées identifiées par `entryId` (item ou chest).

## [3.6.0] — 2026-06-30

### Ajouté
- **Tiers par config** : une config contient maintenant plusieurs tableaux de
  loot (Tiers 1, 2, 3…), chacun avec son sélecteur d'items et ses weights.
- Deux boutons en bas : **« + Ajouter un tiers »** (tableau vierge) et
  **« Dupliquer le dernier tiers »** (copie modifiable du précédent).
- Suppression / vidage d'un tiers (au moins un tiers conservé).
- Migration automatique des configs existantes (l'ancienne liste devient
  le « Tiers 1 ») — aucune perte de données.
- Composant `TierCard`.

## [3.5.0] — 2026-06-30

### Ajouté
- **Aide à l'écriture (autocomplétion)** pour `#` et `!` : en tapant l'un de ces
  préfixes, une liste de tags / catégories s'affiche (avec leur nombre),
  filtrée au fur et à mesure. Sélection à la souris ou au clavier (↑/↓ + Entrée,
  Échap pour fermer).
- Nouveau composant réutilisable `SearchField`, utilisé par la Table et par le
  sélecteur d'items de la Lootable.

## [3.4.1] — 2026-06-30

### Ajouté
- La recherche par préfixe (`#tag`, `!catégorie`) fonctionne aussi dans le
  **sélecteur d'items de la page Lootable** (réutilise `makeFilter`).

## [3.4.0] — 2026-06-30

### Ajouté
- **Recherche par préfixe** dans la page Table :
  - `#tag` → filtre par sous-catégorie (ex. `#bois`, `#food`, `#armure`).
  - `!catégorie` → filtre par catégorie (ex. `!item`, `!full`, `!deco`).
  - sinon : recherche par nom / identifiant (comme avant).
  - Tolère les accents et le pluriel ; marche sur le libellé FR comme sur la
    clé technique. Astuce affichée sous le champ de recherche.
- Moteur de recherche extrait dans `src/lib/search.js` ; libellés de catégorie
  centralisés dans `src/lib/categories.js`.

## [3.3.0] — 2026-06-30

### Changé
- **Sélection inversée** : on ajoute les items **depuis la page Lootable**
  (sélecteur de recherche intégré), sans aller-retour avec la page Table.
  La page Table redevient un catalogue de référence (bouton + retiré).

### Ajouté
- **Configs nommées** : créer plusieurs loot tables, leur donner un nom et
  basculer de l'une à l'autre (menu déroulant). Suppression d'une config.
- **Colonne « Weight »** : champ nombre éditable (entier ≥ 1) pour chaque entrée.
- Persistance de toutes les configs + de la config courante (localStorage).
- Composants : `ConfigBar`, `ItemPicker`, `WeightInput` ; hook `useLootConfigs`
  (remplace `useLootTable`).

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
