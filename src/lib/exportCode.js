import { qualify } from './ids.js';

/*
 * Génère le JSON d'une config au format attendu par le plugin :
 *
 *   { "phases": [
 *       { "blocks": [ { "name": "minecraft:stone", "weight": 1 } ] },      // tiers 1
 *       { "blockstobreak": 10, "blocks": [ ... ] }                          // tiers 2…
 *     ],
 *     "loot_tables": { ... },        // coffres (en bas, dissocié)
 *     "groups": { ... },             // définitions des groupes réutilisables
 *     "tier_groups": [ ... ]         // quel tiers référence quel groupe (+ weight)
 *   }
 *
 *  - phases = tiers ; le tiers 1 n'a pas de `blockstobreak`.
 *  - item  → { name: "minecraft:<id>", weight }
 *  - chest → { name: "minecraft:chest", loot_table: "path/to/<nom>", weight }
 *  - groupe → APLATI dans `blocks` : chaque bloc du groupe donne
 *      { name, weight: weight_du_groupe_dans_le_tier × weight_du_bloc }.
 *  Le plugin ne lit que `phases`/`loot_tables` ; `groups`/`tier_groups` servent
 *  au site pour reconstruire les groupes (partage GitHub inclus).
 */

// Chemin loot_table d'un coffre (lie l'entrée de phase à son contenu).
function chestPath(entry) {
  return 'path/to/' + (entry.label?.trim() || 'Nom_custom');
}

// Noms uniques et lisibles des groupes (clé dans `groups` / `tier_groups`).
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

export function buildPhases(config) {
  if (!config) return { phases: [] };
  const groupsById = new Map((config.groups || []).map((g) => [g.id, g]));
  const phases = config.tiers.map((tier, i) => {
    const blocks = [];
    for (const e of tier.entries) {
      if (e.kind === 'group') {
        const g = groupsById.get(e.groupId);
        if (!g) continue;
        for (const b of g.blocks) {
          blocks.push({ name: qualify(b.name), weight: (e.weight || 0) * (b.weight || 0) });
        }
      } else if (e.kind === 'chest') {
        blocks.push({ name: 'minecraft:chest', loot_table: chestPath(e), weight: e.weight });
      } else {
        blocks.push({ name: qualify(e.name), weight: e.weight });
      }
    }
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

// Objet complet exporté : phases + loot_tables + groups/tier_groups (si groupes).
export function buildExport(config) {
  const out = buildPhases(config);
  const tables = buildLootTables(config);
  if (Object.keys(tables).length > 0) out.loot_tables = tables;

  const groups = config?.groups || [];
  if (groups.length > 0) {
    const nameOf = groupNameMap(config);
    out.groups = {};
    for (const g of groups) {
      out.groups[nameOf.get(g.id)] = g.blocks.map((b) => ({
        name: qualify(b.name),
        weight: b.weight,
      }));
    }
    out.tier_groups = config.tiers.map((t) =>
      t.entries
        .filter((e) => e.kind === 'group' && nameOf.has(e.groupId))
        .map((e) => ({ group: nameOf.get(e.groupId), weight: e.weight }))
    );
  }
  return out;
}

export function configToJson(config) {
  return JSON.stringify(buildExport(config), null, 2);
}

/*
 * Le fichier de « partage » (déposé sur GitHub) utilise EXACTEMENT le même
 * format que le code du plugin (phases + loot_tables en bas), pour rester
 * copier-coller compatible avec le code du dev. Le site sait le relire et
 * reconstruit le nom d'affichage / l'icône depuis le catalogue.
 */
export const configToShareJson = configToJson;
