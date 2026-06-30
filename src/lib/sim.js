/* Helpers du simulateur OneBlock (tirage pondéré, progression de tiers). */

// Tire une entrée au hasard selon les weights.
export function pickWeighted(entries) {
  const valid = (entries || []).filter((e) => (e.weight ?? 1) > 0);
  if (valid.length === 0) return null;
  const total = valid.reduce((s, e) => s + (e.weight ?? 1), 0);
  let r = Math.random() * total;
  for (const e of valid) {
    r -= e.weight ?? 1;
    if (r < 0) return e;
  }
  return valid[valid.length - 1];
}

// Index du tiers courant selon le nombre de blocs minés (seuils croissants).
export function tierIndexFor(tiers, blocksMined) {
  let idx = 0;
  for (let i = 0; i < tiers.length; i++) {
    if ((tiers[i].unlockAt ?? 0) <= blocksMined) idx = i;
    else break;
  }
  return idx;
}

// Entier aléatoire dans [min, max].
export function rollRange(min, max) {
  const a = Math.min(min, max);
  const b = Math.max(min, max);
  return a + Math.floor(Math.random() * (b - a + 1));
}

// Tire le contenu d'un coffre (chaque item : quantité aléatoire dans [min,max]).
export function rollChest(chest) {
  return (chest.contents || [])
    .map((c) => ({
      name: c.name,
      displayName: c.displayName,
      icon: c.icon,
      count: rollRange(c.min ?? 1, c.max ?? 1),
    }))
    .filter((d) => d.count > 0);
}
