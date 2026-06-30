/* Libellés (FR) des catégories principales. */
export const CATEGORY_LABEL = {
  full_block: 'Full Block',
  decoration_block: 'Decoration',
  item: 'Item',
};

export function categoryLabel(category) {
  return CATEGORY_LABEL[category] || category;
}
