/*
 * Analyse d'un pack Bedrock (.zip) côté navigateur. On ne fait AUCUNE hypothèse
 * sur l'arborescence exacte : on scanne toutes les entrées du zip.
 *   - blocs  : tout JSON contenant `minecraft:block` (+ description.identifier)
 *   - items  : tout JSON contenant `minecraft:item`
 *   - noms   : fichiers .lang (`tile.<id>.name` / `item.<id>.name`)
 *   - icônes : terrain_texture.json / item_texture.json → chemin → PNG du zip
 * Si aucune image n'est trouvée pour une entrée, `icon` reste null.
 */

// Retire un préfixe de namespace éventuel pour l'affichage (mb_ob:foo → foo).
const bareId = (id) => (id.includes(':') ? id.slice(id.indexOf(':') + 1) : id);

const prettify = (id) =>
  bareId(id)
    .split(/[_.]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

// Parse un fichier .lang (clé=valeur, # commentaires) dans la map `out`.
function parseLang(text, out) {
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    // Certaines valeurs ont un commentaire de traduction après « \t» ou « #».
    let val = line.slice(eq + 1);
    const tab = val.indexOf('\t');
    if (tab >= 0) val = val.slice(0, tab);
    out[key] = val.trim();
  }
}

// Normalise une valeur `textures` (string | [string] | {path}) en chemin.
function texturePath(textures) {
  if (!textures) return null;
  if (typeof textures === 'string') return textures;
  if (Array.isArray(textures)) return texturePath(textures[0]);
  if (typeof textures === 'object') return texturePath(textures.path || textures.textures);
  return null;
}

// Clé de texture d'un bloc (material_instances) : instance « * » sinon 1re dispo.
function blockTextureKey(block) {
  const mi = block.components?.['minecraft:material_instances'];
  if (!mi) return null;
  const inst = mi['*'] || mi[Object.keys(mi)[0]];
  if (!inst) return null;
  return typeof inst.texture === 'string' ? inst.texture : null;
}

// Clé d'icône d'un item : `minecraft:icon` (string | {texture} | {textures:{default}}).
function itemIconKey(item) {
  const icon = item.components?.['minecraft:icon'];
  if (!icon) return null;
  if (typeof icon === 'string') return icon;
  if (typeof icon === 'object') return icon.texture || icon.textures?.default || null;
  return null;
}

// full_block → catégorie « full_block », sinon « decoration_block ».
function blockCategory(block) {
  const geo = block.components?.['minecraft:geometry'];
  const name = typeof geo === 'string' ? geo : geo?.identifier;
  return name === 'minecraft:geometry.full_block' ? 'full_block' : 'decoration_block';
}

// Temps de minage éventuel d'un bloc custom (destructible_by_mining).
function blockMining(block) {
  const d = block.components?.['minecraft:destructible_by_mining'];
  const seconds = typeof d === 'object' ? d.seconds_to_destroy : typeof d === 'number' ? d : null;
  if (seconds == null || seconds < 0) return undefined;
  // Modèle simple : temps à la main = hardness × 1.5 ⇒ hardness = seconds / 1.5.
  return { hardness: seconds / 1.5, requiresTool: false, tool: 'none', minLevel: 0, time: seconds };
}

export async function parsePack(file) {
  // Chargé à la demande : JSZip ne pèse sur le bundle qu'au moment d'un import.
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(file);
  const paths = Object.keys(zip.files).filter((p) => !zip.files[p].dir);

  // 1) Noms d'affichage (tous les .lang, en_US prioritaire).
  const names = {};
  const langPaths = paths
    .filter((p) => /\.lang$/i.test(p))
    .sort((a, b) => (/(en_us)/i.test(b) ? 1 : 0) - (/(en_us)/i.test(a) ? 1 : 0));
  for (const p of langPaths) parseLang(await zip.files[p].async('string'), names);

  // 2) Maps de textures (terrain + item).
  const texMap = {};
  for (const p of paths) {
    if (!/(terrain_texture|item_texture)\.json$/i.test(p)) continue;
    try {
      const json = JSON.parse(await zip.files[p].async('string'));
      for (const [k, v] of Object.entries(json.texture_data || {})) {
        const t = texturePath(v && v.textures);
        if (t) texMap[k] = t;
      }
    } catch (e) {
      /* json invalide : on ignore */
    }
  }

  // 3) Index des PNG par chemin normalisé (…/textures/… sans extension).
  const imageByPath = {};
  for (const p of paths) {
    const m = p.match(/(textures\/.*)\.png$/i);
    if (m) imageByPath[m[1].toLowerCase()] = p;
  }

  const resolveIcon = async (key) => {
    if (!key) return null;
    const rel = (texMap[key] || key).replace(/^\/+/, '');
    const zipPath = imageByPath[rel.toLowerCase()];
    if (!zipPath) return null;
    const b64 = await zip.files[zipPath].async('base64');
    return 'data:image/png;base64,' + b64;
  };

  const makeEntry = (id, category, icon, mining, stackSize) => ({
    name: id, // identifiant complet avec namespace (mb_ob:cloud_block)
    displayName:
      names['item.' + id + '.name'] || names['tile.' + id + '.name'] || prettify(id),
    icon,
    category,
    tag: 'custom',
    stackSize: stackSize || 64,
    mining,
    custom: true,
  });

  // 4) Blocs et items. On dédoublonne par identifiant (bloc prioritaire).
  const byId = new Map();
  for (const p of paths) {
    if (!/\.json$/i.test(p)) continue;
    if (!/(^|\/)(blocks|items)\//i.test(p)) continue; // fichiers de définition
    let json;
    try {
      json = JSON.parse(await zip.files[p].async('string'));
    } catch (e) {
      continue;
    }
    const block = json['minecraft:block'];
    const item = json['minecraft:item'];
    if (block && block.description?.identifier) {
      const id = block.description.identifier;
      byId.set(id, makeEntry(id, blockCategory(block), await resolveIcon(blockTextureKey(block)), blockMining(block)));
    } else if (item && item.description?.identifier) {
      const id = item.description.identifier;
      if (byId.has(id)) continue; // un bloc du même id gagne
      const stack = item.components?.['minecraft:max_stack_size'];
      byId.set(id, makeEntry(id, 'item', await resolveIcon(itemIconKey(item)), undefined, stack));
    }
  }

  const items = [...byId.values()].sort((a, b) => a.displayName.localeCompare(b.displayName));
  const packName =
    (names['pack.name'] && names['pack.name'].trim()) ||
    file.name.replace(/\.zip$/i, '');

  return { name: packName, items, count: items.length };
}
