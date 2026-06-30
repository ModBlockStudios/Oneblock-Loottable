/*
 * Génère le JSON d'une config au format attendu par le plugin :
 *
 *   { "phases": [
 *       { "blocks": [ { "name": "minecraft:stone", "weight": 1 } ] },      // tiers 1
 *       { "blockstobreak": 10, "blocks": [ ... ] }                          // tiers 2…
 *   ] }
 *
 *  - phases = tiers ; le tiers 1 n'a pas de `blockstobreak`.
 *  - item  → { name: "minecraft:<id>", weight }
 *  - chest → { name: "minecraft:chest", loot_table: "path/to/<nom>", weight }
 *    (le contenu inline du chest est volontairement ignoré dans l'export)
 */
function entryToBlock(entry) {
  if (entry.kind === 'chest') {
    return {
      name: 'minecraft:chest',
      loot_table: 'path/to/' + (entry.label?.trim() || 'Nom_custom'),
      weight: entry.weight,
    };
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

export function configToJson(config) {
  return JSON.stringify(buildPhases(config), null, 2);
}
