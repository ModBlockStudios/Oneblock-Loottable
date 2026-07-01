import { entryKey } from './useLootConfigs.js';

/*
 * Compte, par item (clé name|displayName), le nombre de CONFIGS lootable qui
 * l'utilisent. Un item présent plusieurs fois dans une même config (plusieurs
 * tiers, ou dans un coffre) ne compte que pour 1 pour cette config.
 * Sert à afficher une colonne « Utilisé » dans le catalogue.
 */
export function computeUsage(configs) {
  const map = new Map();

  for (const cfg of configs || []) {
    // Items distincts présents dans CETTE config (tiers + contenus des coffres).
    const seen = new Set();
    for (const tier of cfg.tiers || []) {
      for (const entry of tier.entries || []) {
        if (entry.kind === 'chest') {
          for (const c of entry.contents || []) seen.add(entryKey(c));
        } else {
          seen.add(entryKey(entry));
        }
      }
    }
    for (const k of seen) map.set(k, (map.get(k) || 0) + 1);
  }
  return map;
}
