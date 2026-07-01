/*
 * Qualifie un identifiant Bedrock : les items vanilla sont stockés sans espace
 * de noms (« stone ») et prennent « minecraft: » ; les items d'un pack custom
 * ont déjà leur espace de noms (« mb_ob:cloud_block ») et restent tels quels.
 */
export function qualify(id) {
  return id.includes(':') ? id : 'minecraft:' + id;
}

// Sépare un id qualifié en espace de noms + nom local (pour l'affichage).
export function idParts(id) {
  const full = qualify(id);
  const i = full.indexOf(':');
  return { ns: full.slice(0, i), local: full.slice(i + 1) };
}
