/*
 * Chance de tirage d'une entrée dans un tiers = weight / somme des weights.
 * Purement indicatif (plus lisible qu'un weight brut), mis à jour en direct.
 */
export function formatChance(weight, total) {
  if (!total || total <= 0) return '—';
  const pct = (weight / total) * 100;
  return pct.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' %';
}

/*
 * Weight à donner à une entrée pour qu'elle atteigne `percent` % dans le tiers,
 * en gardant les autres entrées inchangées. Colonnes Weight ↔ Chance liées.
 *   w = p × autres / (1 − p)   avec autres = total − weight_actuel
 */
export function weightForPercent(percent, total, currentWeight) {
  const others = Math.max(0, (total || 0) - (currentWeight || 0));
  let p = (Number(percent) || 0) / 100;
  if (others <= 0) return currentWeight > 0 ? currentWeight : 1; // seule entrée : 100 %
  if (p <= 0) return 0; // 0 % → weight 0
  if (p >= 1) p = 0.9999; // ~100 % impossible tant qu'il reste d'autres entrées
  return Math.round((p * others) / (1 - p) * 1000) / 1000;
}
