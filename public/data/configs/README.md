# Configs partagées

Dépose ici (drag & drop) les fichiers `.json` de configs **exportées pour le
partage** depuis le site (bouton **« Exporter (partage) »** dans l'onglet
Lootable).

- Chaque `.json` utilise **le même format que le code du plugin** : un bloc
  `phases` (identifiant + weight, `blockstobreak` par tier) et, en bas, un bloc
  `loot_tables` qui liste le contenu des coffres (`min`/`max`). Copier-coller
  compatible avec le code du dev. Le nom d'affichage et l'icône sont
  reconstruits depuis le catalogue à l'ouverture.
- Toutes les configs de ce dossier sont **chargées automatiquement** pour tous
  les visiteurs du site (au chargement / reload).
- Pas besoin de toucher à `index.json` : il est **régénéré au build**
  (`npm run prebuild`) à partir des fichiers présents.

## Mettre à jour une config partagée

1. Ouvre-la sur le site, édite-la.
2. Clique **« Exporter (partage) »** pour re-télécharger le `.json`.
3. Remplace le fichier ici (même nom) et commite.

> Les modifications faites dans le navigateur sur une config partagée ne sont
> **pas** sauvegardées localement : un reload recharge la version de GitHub.
> Seules tes configs perso (non partagées) sont gardées dans ton navigateur.
