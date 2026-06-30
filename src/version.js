/* ------------------------------------------------------------------ *
 * Source unique de vérité pour la version de l'interface.
 *
 * À METTRE À JOUR à chaque modification notable :
 *   - `version`   : numéro SemVer (MAJEUR.MINEUR.CORRECTIF)
 *   - `buildDate` : date de build (AAAA-MM-JJ)
 *
 * Affiché dans l'en-tête pour vérifier d'un coup d'œil si la version en
 * ligne est à jour. (Vite hashe déjà les bundles : pas de cache obsolète.)
 * ------------------------------------------------------------------ */
export const APP_INFO = {
  version: '3.5.0',
  buildDate: '2026-06-30',
};
