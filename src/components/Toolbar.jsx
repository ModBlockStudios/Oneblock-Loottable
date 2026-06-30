/* Barre d'outils : recherche, filtres de catégorie et compteur de résultats. */

export const FILTERS = [
  { key: 'all', label: 'Tout' },
  { key: 'full_block', label: 'Full Block' },
  { key: 'decoration_block', label: 'Decoration Block' },
  { key: 'item', label: 'Item' },
];

export default function Toolbar({ query, onQuery, category, onCategory, count }) {
  return (
    <section className="toolbar" aria-label="Filtres">
      <div className="toolbar__search">
        <input
          type="search"
          className="search-input"
          placeholder="Rechercher… (ex : diamond, stone, spawn_egg)"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          autoComplete="off"
          spellCheck="false"
        />
      </div>

      <div className="toolbar__filters" role="group" aria-label="Catégorie">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={'chip' + (category === f.key ? ' chip--active' : '')}
            onClick={() => onCategory(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="toolbar__count">
        {count.toLocaleString('fr-FR')} résultat(s)
      </div>
    </section>
  );
}
