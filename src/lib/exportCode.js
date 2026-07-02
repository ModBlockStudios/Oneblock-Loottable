import { qualify } from './ids.js';

/*
 * Deux formats d'export :
 *
 * 1) FORMAT PLUGIN (vue Code + « Télécharger ») — celui du dev. Les groupes sont
 *    APLATIS dans `blocks` (pas de mention de groupe) :
 *      { "phases": [ { "blocks": [ { "name": "minecraft:stone", "weight": 49.5 } ] } ],
 *        "loot_tables": { ... } }
 *
 * 2) FORMAT PARTAGE (« Exporter (partage) », fichiers GitHub) — pour recharger
 *    dans le site. Les phases RÉFÉRENCENT les groupes ; les définitions sont en
 *    bas dans `groups` :
 *      { "phases": [ { "blocks": [ { "group_name": "stone", "weight": 99 } ] } ],
 *        "groups": { "stone": [ { "name": "minecraft:stone", "weight": 50 } ] } }
 */

// Chemin loot_table d'un coffre (lie l'entrée de phase à son contenu).
function chestPath(entry) {
  return 'path/to/' + (entry.label?.trim() || 'Nom_custom');
}

/*
 * Poids final d'un bloc issu d'un groupe, une fois APLATI (format plugin/simu).
 * Sémantique « part » : le weight du groupe est sa part dans le tiers ; à
 * l'intérieur, les blocs se répartissent au prorata de leur weight interne.
 *   final = weight_groupe × (weight_bloc / somme_du_groupe)   (arrondi 3 déc.)
 */
export function groupBlockWeight(groupTierWeight, blockWeight, groupSum) {
  if (!groupSum) return 0;
  return Math.round(((groupTierWeight || 0) * (blockWeight || 0)) / groupSum * 1000) / 1000;
}

/*
 * Aplati les entrées d'un tiers : un groupe devient ses blocs (weights aplatis) ;
 * items et coffres sont laissés tels quels. Partagé par l'export plugin et le
 * simulateur, pour un comportement identique.
 */
export function flattenEntries(entries, groupsById) {
  const out = [];
  for (const e of entries || []) {
    if (e.kind === 'group') {
      const g = groupsById && groupsById.get(e.groupId);
      if (!g) continue;
      const sum = g.blocks.reduce((s, b) => s + (b.weight || 0), 0);
      for (const b of g.blocks) {
        out.push({ ...b, kind: 'item', weight: groupBlockWeight(e.weight, b.weight, sum) });
      }
    } else {
      out.push(e);
    }
  }
  return out;
}

function entryToBlock(entry) {
  if (entry.kind === 'chest') {
    return { name: 'minecraft:chest', loot_table: chestPath(entry), weight: entry.weight };
  }
  return { name: qualify(entry.name), weight: entry.weight };
}

/* ---------- Format PLUGIN (dev) : groupes aplatis ---------- */
export function buildPhases(config) {
  if (!config) return { phases: [] };
  const groupsById = new Map((config.groups || []).map((g) => [g.id, g]));
  const phases = config.tiers.map((tier, i) => {
    const blocks = flattenEntries(tier.entries, groupsById).map(entryToBlock);
    return i === 0 ? { blocks } : { blockstobreak: tier.unlockAt, blocks };
  });
  return { phases };
}

// Contenu des coffres, indexé par chemin loot_table. Vide s'il n'y a aucun coffre.
export function buildLootTables(config) {
  const tables = {};
  if (!config) return tables;
  for (const tier of config.tiers) {
    for (const entry of tier.entries) {
      if (entry.kind !== 'chest') continue;
      tables[chestPath(entry)] = (entry.contents || []).map((c) => ({
        name: qualify(c.name),
        min: c.min,
        max: c.max,
      }));
    }
  }
  return tables;
}

export function buildExport(config) {
  const out = buildPhases(config);
  const tables = buildLootTables(config);
  if (Object.keys(tables).length > 0) out.loot_tables = tables;
  return out;
}

export function configToJson(config) {
  return JSON.stringify(buildExport(config), null, 2);
}

/* ---------- Format PARTAGE : références de groupes + section `groups` ---------- */
// Noms uniques et lisibles des groupes (clé dans `groups` / `group_name`).
function groupNameMap(config) {
  const byId = new Map();
  const used = new Set();
  for (const g of config?.groups || []) {
    let base = (g.name || '').trim() || 'Groupe';
    let key = base;
    let n = 2;
    while (used.has(key)) key = base + ' ' + n++;
    used.add(key);
    byId.set(g.id, key);
  }
  return byId;
}

function shareBlock(entry, nameOf) {
  if (entry.kind === 'group') return { group_name: nameOf.get(entry.groupId), weight: entry.weight };
  if (entry.kind === 'chest') {
    return { name: 'minecraft:chest', loot_table: chestPath(entry), weight: entry.weight };
  }
  return { name: qualify(entry.name), weight: entry.weight };
}

export function buildShareExport(config) {
  if (!config) return { phases: [] };
  const nameOf = groupNameMap(config);
  const phases = config.tiers.map((tier, i) => {
    const blocks = tier.entries
      .filter((e) => e.kind !== 'group' || nameOf.has(e.groupId))
      .map((e) => shareBlock(e, nameOf));
    return i === 0 ? { blocks } : { blockstobreak: tier.unlockAt, blocks };
  });
  const out = { phases };
  const tables = buildLootTables(config);
  if (Object.keys(tables).length > 0) out.loot_tables = tables;

  const groups = config.groups || [];
  if (groups.length > 0) {
    out.groups = {};
    for (const g of groups) {
      out.groups[nameOf.get(g.id)] = g.blocks.map((b) => ({ name: qualify(b.name), weight: b.weight }));
    }
  }
  return out;
}

export function configToShareJson(config) {
  return JSON.stringify(buildShareExport(config), null, 2);
}
