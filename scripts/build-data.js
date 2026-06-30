#!/usr/bin/env node
/*
 * build-data.js
 * -------------------------------------------------------------------------
 * Génère le jeu de données utilisé par l'interface web à partir des paquets
 * npm `minecraft-data` (liste des items/blocs) et `minecraft-assets`
 * (textures PNG).
 *
 * Sortie :
 *   - data/items.json          : la liste complète des items/blocs créatifs
 *   - assets/items/*.png       : icônes des items référencés
 *   - assets/blocks/*.png      : icônes des blocs référencés
 *
 * Usage :
 *   npm install            (installe minecraft-data + minecraft-assets)
 *   node scripts/build-data.js
 *
 * Pour changer de version de Minecraft, modifier la constante MC_VERSION.
 * -------------------------------------------------------------------------
 */
const fs = require('fs');
const path = require('path');

// Dernière version disposant À LA FOIS des données et des textures.
const MC_VERSION = process.env.MC_VERSION || '1.21.8';

const ROOT = path.resolve(__dirname, '..');
const MD_DIR = path.join(ROOT, 'node_modules', 'minecraft-data', 'minecraft-data', 'data', 'pc', MC_VERSION);
const MA_DIR = path.join(ROOT, 'node_modules', 'minecraft-assets', 'minecraft-assets', 'data', MC_VERSION);

const OUT_DATA = path.join(ROOT, 'data');
const OUT_ITEMS_IMG = path.join(ROOT, 'assets', 'items');
const OUT_BLOCKS_IMG = path.join(ROOT, 'assets', 'blocks');

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

console.log(`> Génération des données pour Minecraft ${MC_VERSION}`);

const items = readJSON(path.join(MD_DIR, 'items.json'));
const blocks = readJSON(path.join(MD_DIR, 'blocks.json'));
const itemTextures = readJSON(path.join(MA_DIR, 'items_textures.json'));

// nom du bloc -> true, pour catégoriser item vs bloc
const blockNames = new Set(blocks.map((b) => b.name));

// nom de l'item -> chemin de texture "minecraft:block/xxx" ou "minecraft:item/xxx"
const textureByName = new Map();
for (const t of itemTextures) {
  if (t && t.name && t.texture) textureByName.set(t.name, t.texture);
}

ensureDir(OUT_DATA);
ensureDir(OUT_ITEMS_IMG);
ensureDir(OUT_BLOCKS_IMG);

// Copie un PNG depuis minecraft-assets vers le dossier de sortie s'il existe.
const copied = new Set();
function copyTexture(folder, base) {
  const src = path.join(MA_DIR, folder, base + '.png');
  const destDir = folder === 'blocks' ? OUT_BLOCKS_IMG : OUT_ITEMS_IMG;
  const dest = path.join(destDir, base + '.png');
  const key = folder + '/' + base;
  if (copied.has(key)) return true;
  if (!fs.existsSync(src)) return false;
  fs.copyFileSync(src, dest);
  copied.add(key);
  return true;
}

// Résout l'icône d'un item -> { icon: "items/xxx.png" | "blocks/xxx.png" } ou null
function resolveIcon(name) {
  let tex = textureByName.get(name);
  // Si la table de textures ne référence pas l'item, on tente le nom directement.
  if (!tex || tex === 'minecraft:missingno') tex = null;

  const candidates = [];
  if (tex) {
    const cleaned = tex.replace(/^minecraft:/, ''); // ex: "block/stone" ou "item/apple"
    const parts = cleaned.split('/');
    const base = parts[parts.length - 1];
    const isBlock = cleaned.startsWith('block');
    candidates.push([isBlock ? 'blocks' : 'items', base]);
    // repli sur l'autre dossier au cas où
    candidates.push([isBlock ? 'items' : 'blocks', base]);
  }
  // replis génériques basés sur le nom de l'item lui-même
  candidates.push(['items', name]);
  candidates.push(['blocks', name]);

  // replis ciblés : variantes de blocs dont la texture porte le nom du matériau de base
  // ex: pale_oak_slab -> pale_oak_planks, resin_brick_wall -> resin_bricks
  const woodSuffixes = ['_button', '_fence_gate', '_fence', '_pressure_plate', '_slab', '_stairs', '_door', '_trapdoor'];
  for (const suf of woodSuffixes) {
    if (name.endsWith(suf)) candidates.push(['blocks', name.slice(0, -suf.length) + '_planks']);
  }
  if (name.startsWith('resin_brick')) candidates.push(['blocks', 'resin_bricks']);
  if (name.endsWith('_wood')) candidates.push(['blocks', name.slice(0, -5) + '_log']);
  if (name === 'dried_ghast') candidates.push(['blocks', 'dried_ghast_hydration_0_north']);

  for (const [folder, base] of candidates) {
    if (copyTexture(folder, base)) {
      return folder + '/' + base + '.png';
    }
  }
  return null;
}

const out = [];
let missing = 0;
for (const it of items) {
  if (it.name === 'air') continue; // pas pertinent dans une loot table
  const isBlock = blockNames.has(it.name);
  const icon = resolveIcon(it.name);
  if (!icon) missing++;
  out.push({
    name: it.name,
    displayName: it.displayName,
    stackSize: it.stackSize,
    type: isBlock ? 'block' : 'item',
    icon: icon, // peut être null -> l'UI affiche un placeholder
  });
}

out.sort((a, b) => a.displayName.localeCompare(b.displayName));

const payload = {
  version: MC_VERSION,
  generatedFrom: 'minecraft-data + minecraft-assets',
  count: out.length,
  items: out,
};

fs.writeFileSync(path.join(OUT_DATA, 'items.json'), JSON.stringify(payload));

const nBlocks = out.filter((o) => o.type === 'block').length;
const nItems = out.length - nBlocks;
console.log(`> ${out.length} entrées écrites (${nBlocks} blocs, ${nItems} items)`);
console.log(`> ${copied.size} textures copiées`);
console.log(`> ${missing} entrées sans icône (placeholder utilisé)`);
console.log('> data/items.json généré avec succès.');
