import { tagLabel } from '../lib/tags.js';
import SearchField from './SearchField.jsx';

/* Barre d'outils : recherche, filtres de catégorie, filtre de tag, compteur. */

export const FILTERS = [
  { key: 'all', label: 'Tout' },
  { key: 'full_block', label: 'Full Block' },
  { key: 'decoration_block', label: 'Decoration Block' },
  { key: 'item', label: 'Item' },
];

export default function Toolbar({
  query,
  onQuery,
  category,
  onCategory,
  tag,
  onTag,
  tags,
  count,
  items,
}) {
  return (
    <section className="toolbar" aria-label="Filtres">
      <div className="toolbar__search">
        <SearchField
          value={query}
          onChange={onQuery}
          placeholder="Rechercher…  #tag (ex #bois)  ·  !catégorie (ex !item)  ·  ou un nom"
          items={items}
        />
        <p className="toolbar__hint">
          <span className="kbd">#</span> tag · <span className="kbd">!</span> catégorie ·
          sinon nom / identifiant
        </p>
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

      <label className="tag-select">
        <span className="tag-select__label">Tag</span>
        <select value={tag} onChange={(e) => onTag(e.target.value)} aria-label="Filtrer par sous-catégorie">
          <option value="all">Tous</option>
          {tags.map((t) => (
            <option key={t} value={t}>
              {tagLabel(t)}
            </option>
          ))}
        </select>
      </label>

      <div className="toolbar__count">{count.toLocaleString('fr-FR')} résultat(s)</div>
    </section>
  );
}
