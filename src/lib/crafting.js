import { TIER_ORDER, TIER_LABEL } from './mining.js';

/*
 * Craft d'outils à partir des ressources minées (l'inventaire = les drops).
 * Recette simplifiée : 2 planches (manche) + 3 matériaux du palier (tête).
 * Un « _block » vaut 9 unités. Le craft est NON consommateur en v1
 * (avoir les ressources suffit ; l'outil obtenu est permanent).
 */

export { TIER_LABEL };

export const TOOL_TYPES = [
  { key: 'pickaxe', label: 'Pioche' },
  { key: 'shovel', label: 'Pelle' },
  { key: 'axe', label: 'Hache' },
];

// Unités d'un groupe de matériaux fournies par un item donné (par son id Bedrock).
function unitsFor(name, group) {
  switch (group) {
    case 'wood':
      if (/_planks$/.test(name)) return 1;
      if (/(_log$|_wood$|_stem$|_hyphae$)/.test(name) || /^stripped_/.test(name)) return 4;
      return 0;
    case 'stone':
      return /^(cobblestone|cobbled_deepslate|blackstone|stone|deepslate)$/.test(name) ? 1 : 0;
    case 'copper':
      if (/^(copper_block|raw_copper_block)$/.test(name)) return 9;
      return /^(copper_ingot|raw_copper|copper_ore|deepslate_copper_ore)$/.test(name) ? 1 : 0;
    case 'iron':
      if (/^(iron_block|raw_iron_block)$/.test(name)) return 9;
      return /^(iron_ingot|raw_iron|iron_ore|deepslate_iron_ore)$/.test(name) ? 1 : 0;
    case 'diamond':
      if (name === 'diamond_block') return 9;
      return /^(diamond|diamond_ore|deepslate_diamond_ore)$/.test(name) ? 1 : 0;
    case 'netherite':
      if (name === 'netherite_block') return 9;
      return name === 'netherite_ingot' ? 1 : 0;
    default:
      return 0;
  }
}

export function availableUnits(inventory, group) {
  let u = 0;
  for (const d of inventory) u += unitsFor(d.name, group) * d.count;
  return u;
}

export function recipeFor(tier) {
  if (tier === 'wood') return [{ group: 'wood', amount: 5 }];
  return [
    { group: 'wood', amount: 2 },
    { group: tier, amount: 3 },
  ];
}

export function canCraft(recipe, inventory) {
  return recipe.every((r) => availableUnits(inventory, r.group) >= r.amount);
}

// Meilleur palier qu'on peut crafter au-dessus du palier actuel ; sinon le
// palier suivant (objectif) marqué non abordable. null si déjà au max.
export function proposalFor(currentTier, inventory) {
  const cur = currentTier ? TIER_ORDER.indexOf(currentTier) : -1;
  for (let i = TIER_ORDER.length - 1; i > cur; i--) {
    const tier = TIER_ORDER[i];
    if (canCraft(recipeFor(tier), inventory)) return { tier, affordable: true, recipe: recipeFor(tier) };
  }
  if (cur + 1 < TIER_ORDER.length) {
    const tier = TIER_ORDER[cur + 1];
    return { tier, affordable: false, recipe: recipeFor(tier) };
  }
  return null;
}

export function recipeText(recipe) {
  return recipe.map((r) => `${r.amount} ${TIER_LABEL[r.group]}`).join(' + ');
}

// Item « de base » (1 unité) de chaque groupe, pour rendre la monnaie.
export const BASE_ITEM = {
  wood: 'oak_planks',
  stone: 'cobblestone',
  copper: 'copper_ingot',
  iron: 'iron_ingot',
  diamond: 'diamond',
  netherite: 'netherite_ingot',
};

// Consomme `amount` unités d'un groupe depuis l'inventaire (petits items
// d'abord). Casser un item multi-unités (log=4, bloc=9) rend la monnaie en
// item de base. `baseItem` = entrée { name, displayName, icon } ou null.
function consumeGroup(inventory, group, amount, baseItem) {
  let need = amount;
  let change = 0;
  const out = inventory.map((d) => ({ ...d }));
  const order = out
    .map((d, i) => ({ i, u: unitsFor(d.name, group) }))
    .filter((x) => x.u > 0)
    .sort((a, b) => a.u - b.u);

  for (const { i, u } of order) {
    if (need <= 0) break;
    const d = out[i];
    const takeCount = u === 1 ? Math.min(d.count, need) : Math.min(d.count, Math.ceil(need / u));
    d.count -= takeCount;
    const got = takeCount * u;
    need -= got;
    if (need < 0) {
      change += -need;
      need = 0;
    }
  }

  let result = out.filter((d) => d.count > 0);
  if (change > 0 && baseItem) {
    const key = baseItem.name + '|' + baseItem.displayName;
    const ex = result.find((d) => d.key === key);
    if (ex) ex.count += change;
    else result = [{ key, ...baseItem, count: change }, ...result];
  }
  return result;
}

// Consomme toute une recette ; `baseItems` = map group -> { name, displayName, icon }.
export function consumeMaterials(inventory, recipe, baseItems) {
  let inv = inventory;
  for (const r of recipe) inv = consumeGroup(inv, r.group, r.amount, baseItems[r.group]);
  return inv;
}
