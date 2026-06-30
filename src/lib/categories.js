/* Libellés (FR) des catégories principales. */
export const CATEGORY_LABEL = {
  full_block: 'Full Block',
  decoration_block: 'Decoration',
  item: 'Item',
};

export const CATEGORY_ORDER = ['full_block', 'decoration_block', 'item'];

export function categoryLabel(category) {
  return CATEGORY_LABEL[category] || category;
}
