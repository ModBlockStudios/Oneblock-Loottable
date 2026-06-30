import { tagLabel } from './tags.js';
import { categoryLabel } from './categories.js';

// Minuscule + sans accents, pour une recherche tolérante (é→e, ô→o…).
const norm = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/*
 * Construit un prédicat de recherche à partir de la saisie :
 *   - "#xxx"  → filtre par TAG (sous-catégorie), ex. "#bois", "#food"
 *   - "!xxx"  → filtre par CATÉGORIE, ex. "!item", "!full"
 *   - sinon   → recherche par nom affiché ou identifiant
 *
 * Le matching se fait sur le libellé FR ET la clé technique, et tolère le
 * pluriel (ex. "!items" trouve la catégorie "item").
 */
export function makeFilter(query) {
  const raw = (query || '').trim();
  if (!raw) return () => true;

  const prefix = raw[0];

  if (prefix === '#' || prefix === '!') {
    const term = norm(raw.slice(1).trim());
    if (!term) return () => true; // juste "#" ou "!" : on n'a pas encore tapé

    if (prefix === '#') {
      return (it) => {
        const key = norm(it.tag);
        const candidate = norm(tagLabel(it.tag)) + ' ' + key;
        return candidate.includes(term) || term.includes(key);
      };
    }
    return (it) => {
      const key = norm(it.category);
      const candidate = norm(categoryLabel(it.category)) + ' ' + key;
      return candidate.includes(term) || term.includes(key);
    };
  }

  const term = norm(raw);
  return (it) => norm(it.name).includes(term) || norm(it.displayName).includes(term);
}
