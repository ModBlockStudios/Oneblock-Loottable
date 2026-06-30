# Changelog

Toutes les modifications notables de l'interface sont consignées ici.
Le format suit [Keep a Changelog](https://keepachangelog.com/fr/) et le
versionnage [SemVer](https://semver.org/lang/fr/).

> La version affichée dans l'en-tête du site correspond au champ `version`
> de `js/version.js`. Vérifie-la pour savoir si la page en ligne est à jour.

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
