/*
 * Génère le JSON d'une config au format attendu par le plugin :
 *
 *   { "phases": [
 *       { "blocks": [ { "name": "minecraft:stone", "weight": 1 } ] },      // tiers 1
 *       { "blockstobreak": 10, "blocks": [ ... ] }                          // tiers 2…
 *     ],
 *     "loot_tables": {                                                      // en bas,
 *       "path/to/Coffre_or": [                                              // dissocié
 *         { "name": "minecraft:diamond", "min": 3, "max": 5 }
 *       ]
 *     }
 *   }
 *
 *  - phases = tiers ; le tiers 1 n'a pas de `blockstobreak`.
 *  - item  → { name: "minecraft:<id>", weight }
 *  - chest → { name: "minecraft:chest", loot_table: "path/to/<nom>", weight }
 *  - loot_tables = contenu de chaque coffre, indexé par son chemin loot_table.
 */

// Chemin loot_table d'un coffre (lie l'entrée de phase à son contenu).
function chestPath(entry) {
  return 'path/to/' + (entry.label?.trim() || 'Nom_custom');
}

function entryToBlock(entry) {
  if (entry.kind === 'chest') {
    return { name: 'minecraft:chest', loot_table: chestPath(entry), weight: entry.weight };
  }
  return { name: 'minecraft:' + entry.name, weight: entry.weight };
}

export function buildPhases(config) {
  if (!config) return { phases: [] };
  const phases = config.tiers.map((tier, i) => {
    const blocks = tier.entries.map(entryToBlock);
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
        name: 'minecraft:' + c.name,
        min: c.min,
        max: c.max,
      }));
    }
  }
  return tables;
}

// Objet complet exporté : phases puis loot_tables (en bas, seulement si coffres).
export function buildExport(config) {
  const out = buildPhases(config);
  const tables = buildLootTables(config);
  if (Object.keys(tables).length > 0) out.loot_tables = tables;
  return out;
}

export function configToJson(config) {
  return JSON.stringify(buildExport(config), null, 2);
}
