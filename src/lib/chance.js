/*
 * Chance de tirage d'une entrée dans un tiers = weight / somme des weights.
 * Purement indicatif (plus lisible qu'un weight brut), mis à jour en direct.
 */
export function formatChance(weight, total) {
  if (!total || total <= 0) return '—';
  const pct = (weight / total) * 100;
  return pct.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' %';
}
