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

/*
 * Édition cible : Minecraft BEDROCK.
 *
 * Les identifiants exposés sont ceux de Bedrock. Mais les TEXTURES
 * (minecraft-assets) et la liste « propre » de l'inventaire créatif ne sont
 * disponibles que pour l'édition Java. Le contenu (blocs/items) étant identique
 * entre éditions, on procède ainsi :
 *   - liste + textures + formes de collision : Java (MC_JAVA_VERSION) ;
 *   - identifiants : convertis en Bedrock via `bedrock/itemIds` (ci-dessous),
 *     validés contre la liste d'items Bedrock de minecraft-data.
 */
const MC_JAVA_VERSION = process.env.MC_VERSION || '1.21.8';
const MC_BEDROCK_VERSION = process.env.MC_BEDROCK_VERSION || '1.21.111';

const ROOT = path.resolve(__dirname, '..');
const MD_DIR = path.join(ROOT, 'node_modules', 'minecraft-data', 'minecraft-data', 'data', 'pc', MC_JAVA_VERSION);
const BEDROCK_DIR = path.join(ROOT, 'node_modules', 'minecraft-data', 'minecraft-data', 'data', 'bedrock', MC_BEDROCK_VERSION);
const MA_DIR = path.join(ROOT, 'node_modules', 'minecraft-assets', 'minecraft-assets', 'data', MC_JAVA_VERSION);

// Sorties dans public/ : Vite copie ce dossier tel quel dans le build.
const OUT_DATA = path.join(ROOT, 'public', 'data');
const OUT_ITEMS_IMG = path.join(ROOT, 'public', 'assets', 'items');
const OUT_BLOCKS_IMG = path.join(ROOT, 'public', 'assets', 'blocks');

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

console.log(`> Génération pour Minecraft Bedrock (identifiants ${MC_BEDROCK_VERSION}, textures Java ${MC_JAVA_VERSION})`);

const items = readJSON(path.join(MD_DIR, 'items.json'));
const blocks = readJSON(path.join(MD_DIR, 'blocks.json'));
const itemTextures = readJSON(path.join(MA_DIR, 'items_textures.json'));
const collisionShapes = readJSON(path.join(MD_DIR, 'blockCollisionShapes.json'));

// Liste d'items Bedrock : sert UNIQUEMENT à valider les identifiants convertis.
const bedrockItemNames = new Set(
  readJSON(path.join(BEDROCK_DIR, 'items.json')).map((i) => i.name)
);

/*
 * Conversion identifiant Java -> identifiant Bedrock.
 *
 * - DROP_JAVA : items Java sans équivalent Bedrock « normal » (debug / retirés).
 * - JAVA_TO_BEDROCK : renommages ciblés (vérifiés contre la liste Bedrock).
 * - Bannières et lits : toutes les couleurs partagent l'identifiant Bedrock
 *   `banner` / `bed` (la couleur est une data value). Le nom affiché conserve
 *   la couleur pour rester lisible.
 */
const DROP_JAVA = new Set([
  'test_block', 'test_instance_block', 'debug_stick', 'knowledge_book',
  'furnace_minecart', 'spectral_arrow', 'tipped_arrow',
]);

const JAVA_TO_BEDROCK = {
  chain: 'iron_chain', cobblestone_stairs: 'stone_stairs', cobweb: 'web',
  dead_bush: 'deadbush', end_stone_brick_stairs: 'end_brick_stairs',
  frogspawn: 'frog_spawn', light: 'light_block', lily_pad: 'waterlily',
  oak_button: 'wooden_button', oak_door: 'wooden_door', oak_fence_gate: 'fence_gate',
  oak_pressure_plate: 'wooden_pressure_plate', oak_trapdoor: 'trapdoor',
  powered_rail: 'golden_rail', prismarine_brick_stairs: 'prismarine_bricks_stairs',
  small_dripleaf: 'small_dripleaf_block', stone_slab: 'normal_stone_slab',
  bricks: 'brick_block', dirt_path: 'grass_path', end_stone_bricks: 'end_bricks',
  flowering_azalea_leaves: 'azalea_leaves_flowered', jack_o_lantern: 'lit_pumpkin',
  light_gray_glazed_terracotta: 'silver_glazed_terracotta', magma_block: 'magma',
  melon: 'melon_block', spawner: 'mob_spawner', nether_bricks: 'nether_brick',
  nether_quartz_ore: 'quartz_ore', note_block: 'noteblock',
  red_nether_bricks: 'red_nether_brick', rooted_dirt: 'dirt_with_roots',
  slime_block: 'slime', snow_block: 'snow', terracotta: 'hardened_clay',
  waxed_copper_block: 'waxed_copper', map: 'empty_map',
  glow_item_frame: 'glow_frame', item_frame: 'frame',
  zombified_piglin_spawn_egg: 'zombie_pigman_spawn_egg',
};

function toBedrockId(javaName) {
  if (/_banner$/.test(javaName)) return 'banner';
  if (/_bed$/.test(javaName)) return 'bed';
  return JAVA_TO_BEDROCK[javaName] || javaName;
}

// nom du bloc -> true, pour catégoriser item vs bloc
const blockNames = new Set(blocks.map((b) => b.name));
const blockByName = new Map(blocks.map((b) => [b.name, b]));

/*
 * Données de minage d'un bloc (pour le simulateur OneBlock) :
 *  - hardness     : dureté Minecraft ;
 *  - requiresTool : le bloc nécessite un outil pour dropper (harvestTools) ;
 *  - tool         : type d'outil efficace (pickaxe/shovel/axe/hoe/sword/none) ;
 *  - time         : temps de minage À LA MAIN en secondes
 *                   (null = incassable, 0 = instantané, sinon hardness×1.5 ou ×5).
 */
function toolFromMaterial(material, requiresTool) {
  const m = material || '';
  if (m.includes('mineable/pickaxe')) return 'pickaxe';
  if (m.includes('mineable/shovel')) return 'shovel';
  if (m.includes('mineable/axe')) return 'axe';
  if (m.includes('mineable/hoe')) return 'hoe';
  if (m.includes('sword')) return 'sword';
  // « incorrect_for_wooden_tool » = minerais/obsidienne → pioche
  if (requiresTool) return 'pickaxe';
  return 'none';
}

function miningOf(name) {
  const b = blockByName.get(name);
  if (!b) return null; // items : pas de minage
  const requiresTool = !!(b.harvestTools && Object.keys(b.harvestTools).length > 0);
  const tool = toolFromMaterial(b.material, requiresTool);
  let time;
  if (!b.diggable || b.hardness === null || b.hardness < 0) {
    time = null; // incassable
  } else if (b.hardness === 0) {
    time = 0; // instantané
  } else {
    time = Math.round(b.hardness * (requiresTool ? 5 : 1.5) * 100) / 100;
  }
  return { hardness: b.hardness, requiresTool, tool, time };
}

/*
 * Classification "bloc plein" (full block) vs "bloc de décoration".
 *
 * Un bloc plein utilise la géométrie cube de Minecraft : sa forme de collision
 * est UNE seule boîte couvrant toute l'emprise horizontale (x:0→1, z:0→1),
 * du sol jusqu'à une hauteur quasi complète. Cela couvre stone, glass, leaves,
 * grass_block, soul_sand, farmland… et exclut escaliers, dalles, portes,
 * clôtures, plantes, etc.
 */
const FULL_HEIGHT_MIN = 0.85; // tolérance (soul_sand = 0.875, farmland = 0.9375)

function isFullBox(boxes) {
  if (!Array.isArray(boxes) || boxes.length !== 1) return false;
  const [x0, y0, z0, x1, y1, z1] = boxes[0];
  return x0 === 0 && z0 === 0 && x1 === 1 && z1 === 1 && y0 === 0 && y1 >= FULL_HEIGHT_MIN;
}

function isFullBlock(name) {
  const sid = collisionShapes.blocks[name];
  if (sid === undefined) return false;
  const ids = Array.isArray(sid) ? sid : [sid];
  // Plein uniquement si TOUTES les variantes d'état sont un cube plein.
  return ids.every((id) => isFullBox(collisionShapes.shapes[id]));
}

// Catégorie finale exposée à l'UI : full_block | decoration_block | item
function categoryOf(name) {
  if (!blockNames.has(name)) return 'item';
  return isFullBlock(name) ? 'full_block' : 'decoration_block';
}

/*
 * Sous-catégorie (tag) — inspirée du rangement créatif de Mojang, pour trier
 * finement (nourriture, armures, armes, outils, minerais, bois…).
 * Une seule étiquette par entrée, choisie par ordre de priorité.
 * Calculée à partir du nom Java + enchantCategories + foods.json.
 */
const foodNames = new Set(readJSON(path.join(MD_DIR, 'foods.json')).map((f) => f.name));
const enchantById = new Map(items.map((it) => [it.name, it.enchantCategories || []]));

function subCategoryOf(name) {
  const ench = enchantById.get(name) || [];
  const has = (c) => ench.includes(c);
  const re = (r) => r.test(name);

  // ---- Items (priorité au plus spécifique) ----
  if (re(/_spawn_egg$/)) return 'spawn_egg';
  if (re(/^music_disc_|^disc_fragment/)) return 'music_disc';
  if (foodNames.has(name) || re(/^(milk_bucket|honey_bottle|cookie|cake)$/)) return 'food';
  if (re(/potion$|^glass_bottle$|^dragon_breath$|^experience_bottle$/)) return 'potion';
  // Outils AVANT armes (une hache a la catégorie 'weapon' mais reste un outil)
  if (re(/_(pickaxe|axe|shovel|hoe)$|^(shears|flint_and_steel|fishing_rod|brush|spyglass|lead|name_tag|compass|recovery_compass|clock|goat_horn|bundle)$|bucket$/) || has('mining') || has('fishing')) {
    return 'tool';
  }
  if (has('weapon') || has('sword') || has('bow') || has('crossbow') || has('trident') || has('mace') || re(/^(arrow|shield)$/)) {
    return 'weapon';
  }
  if (has('armor') || re(/_horse_armor$|^(elytra|turtle_helmet)$/)) return 'armor';
  if (re(/boat$|minecart$|^saddle$|on_a_stick$/)) return 'transport';
  if (re(/_dye$/)) return 'dye';

  // ---- Blocs (best-effort, large) ----
  if (blockNames.has(name)) {
    if (re(/_ore$|^ancient_debris$|^raw_\w+_block$/)) return 'ore';
    if (re(/^(crafting_table|furnace|blast_furnace|smoker|chest|trapped_chest|ender_chest|barrel|anvil|chipped_anvil|damaged_anvil|grindstone|smithing_table|loom|cartography_table|fletching_table|stonecutter|enchanting_table|brewing_stand|beacon|lectern|bell|bookshelf|chiseled_bookshelf|composter|cauldron|jukebox|lodestone|respawn_anchor|conduit|hopper|spawner|mob_spawner)$/)) return 'utility';
    if (re(/redstone|piston|observer|dispenser|dropper|repeater|comparator|lever|_button$|_pressure_plate$|rail$|^rail$|target$|tripwire|daylight_detector|sculk_sensor|noteblock|^note_block$|_lamp$/)) return 'redstone';
    if (re(/torch$|lantern$|^glowstone$|^sea_lantern$|candle$|campfire$|^end_rod$|froglight$|^shroomlight$|^glow_lichen$/)) return 'light';
    if (re(/_(log|wood|planks|stem|hyphae)$|^stripped_/)) return 'wood';
    if (re(/^(wool|carpet|concrete|concrete_powder|stained_glass|stained_glass_pane|terracotta|glazed_terracotta|shulker_box|candle|bed|banner|wool_carpet)$|^(white|orange|magenta|light_blue|yellow|lime|pink|gray|light_gray|cyan|purple|blue|brown|green|red|black|silver)_/)) return 'colored';
    if (re(/sapling|leaves$|flower|mushroom|fungus|roots$|sprouts$|fern$|grass$|vine|lily|kelp|seagrass|coral|bamboo|cactus|sugar_cane|moss|lichen|propagule|pickle|dripleaf|spore_blossom|petals$|wart$|bush$|tulip$|orchid$|allium$|bluet$|poppy$|dandelion$|sunflower$|lilac$|peony$|pitcher|nylium|podzol|mycelium/)) return 'plant';
    return 'building'; // pierre, briques, verre, béton non coloré, etc.
  }

  // ---- Items restants (matériaux/ingrédients) ----
  return 'material';
}

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
let dropped = 0;
const unknownBedrock = []; // identifiants convertis introuvables côté Bedrock
for (const it of items) {
  if (it.name === 'air') continue; // pas pertinent dans une loot table
  if (DROP_JAVA.has(it.name)) { dropped++; continue; } // pas d'équivalent Bedrock

  const bedrockId = toBedrockId(it.name);
  if (!bedrockItemNames.has(bedrockId)) unknownBedrock.push(it.name + ' -> ' + bedrockId);

  // La résolution texture + catégorie reste basée sur le nom Java (visuel identique).
  const category = categoryOf(it.name); // full_block | decoration_block | item
  const tag = subCategoryOf(it.name); // sous-catégorie (food, armor, ore…)
  const mining = miningOf(it.name); // données de minage (blocs uniquement)
  const icon = resolveIcon(it.name);
  if (!icon) missing++;
  const entry = {
    name: bedrockId, // identifiant Bedrock
    displayName: it.displayName,
    stackSize: it.stackSize,
    category: category,
    tag: tag,
    icon: icon, // peut être null -> l'UI affiche un placeholder
  };
  if (mining) entry.mining = mining;
  out.push(entry);
}

out.sort((a, b) => a.displayName.localeCompare(b.displayName));

const payload = {
  edition: 'Bedrock',
  version: MC_BEDROCK_VERSION,
  texturesVersion: MC_JAVA_VERSION,
  generatedFrom: 'minecraft-data (bedrock ids + java textures) + minecraft-assets',
  count: out.length,
  items: out,
};

fs.writeFileSync(path.join(OUT_DATA, 'items.json'), JSON.stringify(payload));

const nFull = out.filter((o) => o.category === 'full_block').length;
const nDeco = out.filter((o) => o.category === 'decoration_block').length;
const nItems = out.filter((o) => o.category === 'item').length;
console.log(`> ${out.length} entrées écrites (${nFull} full blocks, ${nDeco} decoration blocks, ${nItems} items)`);
const tagCounts = {};
for (const o of out) tagCounts[o.tag] = (tagCounts[o.tag] || 0) + 1;
console.log('> sous-catégories :', JSON.stringify(tagCounts));
console.log(`> ${dropped} items Java sans équivalent Bedrock retirés`);
console.log(`> ${copied.size} textures copiées`);
console.log(`> ${missing} entrées sans icône (placeholder utilisé)`);
if (unknownBedrock.length) {
  console.warn(`> ⚠️  ${unknownBedrock.length} identifiants Bedrock non validés :`);
  console.warn('   ' + unknownBedrock.join(', '));
}
console.log('> data/items.json généré avec succès.');
