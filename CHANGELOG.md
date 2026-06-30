# Changelog

Toutes les modifications notables de l'interface sont consignées ici.
Le format suit [Keep a Changelog](https://keepachangelog.com/fr/) et le
versionnage [SemVer](https://semver.org/lang/fr/).

> La version affichée dans l'en-tête du site correspond au champ `version`
> de `js/version.js`. Vérifie-la pour savoir si la page en ligne est à jour.

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
