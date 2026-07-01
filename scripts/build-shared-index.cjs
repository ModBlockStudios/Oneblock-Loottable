/*
 * Génère public/data/configs/index.json : la liste des fichiers de configs
 * partagées présents dans le dossier. Comme GitHub Pages ne liste pas les
 * dossiers, l'app a besoin de cet index pour savoir quoi charger.
 *
 * Lancé automatiquement avant chaque build (script `prebuild`), donc il suffit
 * de déposer (drag & drop) un .json dans public/data/configs/ et de committer :
 * le déploiement régénère l'index tout seul.
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'public', 'data', 'configs');
fs.mkdirSync(dir, { recursive: true });

const files = fs
  .readdirSync(dir)
  .filter((f) => f.toLowerCase().endsWith('.json') && f.toLowerCase() !== 'index.json')
  .sort();

fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify(files, null, 2) + '\n');
console.log(`build-shared-index : ${files.length} config(s) partagée(s) → index.json`);
