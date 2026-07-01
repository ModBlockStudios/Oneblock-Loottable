/*
 * Regroupement des « sets de bois » (Dark Oak, etc.) dans le catalogue.
 * Un set n'est regroupé que s'il possède un bloc <prefix>_leaves (feuilles) :
 * l'idée est qu'en Loot Table, donner les feuilles suffit — le joueur récupère
 * un sapling, fait pousser un arbre et obtient tout le reste du set.
 */

// Préfixes de sets de bois (les plus spécifiques d'abord, par prudence).
export const WOOD_PREFIXES = [
  'dark_oak',
  'pale_oak',
  'oak',
  'spruce',
  'birch',
  'jungle',
  'acacia',
  'mangrove',
  'cherry',
  'bamboo',
  'crimson',
  'warped',
];

// Préfixe de set de bois d'un identifiant, ou null.
export function woodPrefixOf(name) {
  for (const p of WOOD_PREFIXES) {
    if (name === p || name.startsWith(p + '_')) return p;
  }
  return null;
}

// « dark_oak » -> « Dark Oak »
export function prettyWood(prefix) {
  return prefix
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/*
 * Transforme une liste d'items en « lignes » d'affichage : soit un item seul
 * ({ type:'item', item }), soit un groupe de bois ({ type:'group', prefix,
 * label, leaves, members }) représenté par ses feuilles. Les membres restent
 * dans l'ordre du catalogue ; le groupe est émis à la position du 1er membre.
 */
export function groupWoodSets(items) {
  const members = new Map();
  for (const it of items) {
    const p = woodPrefixOf(it.name);
    if (!p) continue;
    if (!members.has(p)) members.set(p, []);
    members.get(p).push(it);
  }
  // Feuilles représentant chaque set (null si absentes → pas de regroupement).
  const leavesOf = new Map();
  for (const [p, list] of members) {
    leavesOf.set(p, list.find((m) => m.name === p + '_leaves') || null);
  }

  const rows = [];
  const emitted = new Set();
  for (const it of items) {
    const p = woodPrefixOf(it.name);
    const leaves = p ? leavesOf.get(p) : null;
    const groupable = p && leaves && members.get(p).length > 1;
    if (groupable) {
      if (!emitted.has(p)) {
        emitted.add(p);
        rows.push({ type: 'group', prefix: p, label: prettyWood(p), leaves, members: members.get(p) });
      }
      // membre masqué (visible au déroulé)
    } else {
      rows.push({ type: 'item', item: it });
    }
  }
  return rows;
}
