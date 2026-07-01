/* Libellés (FR) des sous-catégories, dans un ordre logique d'affichage. */
export const TAG_LABEL = {
  // Items
  food: 'Nourriture',
  armor: 'Armure',
  weapon: 'Arme',
  tool: 'Outil',
  potion: 'Potion',
  spawn_egg: "Œuf d'apparition",
  music_disc: 'Disque',
  transport: 'Transport',
  dye: 'Teinture',
  material: 'Matériau',
  // Blocs
  ore: 'Minerai',
  wood: 'Bois',
  plant: 'Plante',
  colored: 'Coloré',
  redstone: 'Redstone',
  light: 'Lumière',
  utility: 'Utilitaire',
  building: 'Construction',
  // Pack importé
  custom: 'Custom',
};

export const TAG_ORDER = Object.keys(TAG_LABEL);

export function tagLabel(tag) {
  return TAG_LABEL[tag] || tag;
}

/* Renvoie les tags présents dans les données, triés selon TAG_ORDER. */
export function tagsPresent(items) {
  const set = new Set(items.map((it) => it.tag).filter(Boolean));
  return TAG_ORDER.filter((t) => set.has(t));
}
