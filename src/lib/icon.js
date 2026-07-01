/*
 * Construit l'URL d'affichage d'une icône. Les items du catalogue vanilla
 * référencent un fichier généré (`assets/…`) ; les items d'un pack importé
 * portent une data URL (`data:image/png;base64,…`) utilisée telle quelle.
 */
export function iconUrl(icon) {
  if (!icon) return null;
  if (icon.startsWith('data:')) return icon;
  return import.meta.env.BASE_URL + 'assets/' + icon;
}
