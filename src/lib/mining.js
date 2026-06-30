/* Helpers de minage (temps à la main), partagés Table + simulateur. */

// Texte d'affichage du temps de minage à la main.
export function formatMineTime(mining) {
  if (!mining) return '—'; // item : pas de minage
  if (mining.time === null || mining.time === undefined) return 'incassable';
  if (mining.time === 0) return 'instant';
  return mining.time.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' s';
}

// Durée de minage à la main en millisecondes (null = incassable).
export function mineTimeMs(mining) {
  if (!mining || mining.time === null || mining.time === undefined) return null;
  return mining.time * 1000;
}

/* ---------- Outils ---------- */
// Progression linéaire des outils (du moins bon au meilleur).
// Le cuivre (Copper Age) s'intercale entre pierre et fer : plus rapide que la
// pierre et même niveau de récolte que le fer (il peut donc miner le diamant).
// L'or n'est PAS dans cette chaîne : c'est un sidegrade (très rapide mais
// niveau de récolte 0, comme le bois), géré à part (cf. crafting.js).
export const TIER_ORDER = ['wood', 'stone', 'copper', 'iron', 'diamond', 'netherite'];
export const TOOL_SPEED = { wood: 2, stone: 4, copper: 5, gold: 12, iron: 6, diamond: 8, netherite: 9 };
export const TOOL_LEVEL = { wood: 0, stone: 1, copper: 2, gold: 0, iron: 2, diamond: 3, netherite: 4 };
export const TIER_LABEL = {
  wood: 'Bois',
  stone: 'Pierre',
  copper: 'Cuivre',
  gold: 'Or',
  iron: 'Fer',
  diamond: 'Diamant',
  netherite: 'Netherite',
};

// L'outil possédé (du bon type) permet-il de récolter le bloc (drop) ?
export function canHarvestWith(mining, tools) {
  if (!mining) return false;
  if (!mining.requiresTool) return true; // cassable à la main
  const tier = mining.tool && mining.tool !== 'none' ? tools[mining.tool] : null;
  return !!tier && TOOL_LEVEL[tier] >= (mining.minLevel ?? 0);
}

/*
 * Temps de minage (ms) en tenant compte des outils possédés
 * (`tools` = { pickaxe, shovel, axe } -> palier ou null).
 *   - vitesse ×= multiplicateur de l'outil du bon type ;
 *   - facteur 1.5 si récoltable, sinon 5 (lent, sans drop).
 */
export function mineTimeWithTools(mining, tools) {
  if (!mining || mining.hardness == null || mining.hardness < 0 || mining.time === null) return null;
  if (mining.hardness === 0) return 0;
  const tier = mining.tool && mining.tool !== 'none' ? tools[mining.tool] : null;
  const mult = tier ? TOOL_SPEED[tier] : 1;
  const factor = canHarvestWith(mining, tools) ? 1.5 : 5;
  return Math.round((mining.hardness * factor) / mult * 1000); // ms
}
