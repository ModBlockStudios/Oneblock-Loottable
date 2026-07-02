import { entryKey } from './useLootConfigs.js';

/*
 * Renvoie, par item (clé name|displayName), la LISTE des noms de configs
 * Loot Table qui l'utilisent (tiers + contenus des coffres). Un item présent
 * plusieurs fois dans une même config n'apparaît qu'une fois pour cette config.
 * Le nombre d'utilisations = longueur de la liste. Sert à la colonne « Utilisé »
 * du catalogue (badge + info-bulle listant les configs).
 */
export function computeUsage(configs) {
  const map = new Map();

  for (const cfg of configs || []) {
    const groupsById = new Map((cfg.groups || []).map((g) => [g.id, g]));
    // Items distincts présents dans CETTE config : entrées de tiers, contenus des
    // coffres, ET blocs des groupes référencés par un tiers.
    const seen = new Set();
    for (const tier of cfg.tiers || []) {
      for (const entry of tier.entries || []) {
        if (entry.kind === 'chest') {
          for (const c of entry.contents || []) seen.add(entryKey(c));
        } else if (entry.kind === 'group') {
          const g = groupsById.get(entry.groupId);
          if (g) for (const b of g.blocks) seen.add(entryKey(b));
        } else {
          seen.add(entryKey(entry));
        }
      }
    }
    for (const k of seen) {
      const arr = map.get(k);
      if (arr) arr.push(cfg.name);
      else map.set(k, [cfg.name]);
    }
  }
  return map;
}
