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
