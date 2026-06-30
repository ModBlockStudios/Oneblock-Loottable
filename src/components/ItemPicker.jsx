import { useMemo, useState } from 'react';
import { makeFilter } from '../lib/search.js';

const MAX_RESULTS = 40;

/*
 * Sélecteur d'items intégré à la page Lootable : on cherche dans le catalogue
 * et on ajoute à la config courante, sans changer de page.
 * Supporte la même syntaxe que la Table : #tag, !catégorie, ou texte libre.
 */
export default function ItemPicker({ items, onAdd, has }) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const match = makeFilter(query);
    const out = [];
    for (const it of items) {
      if (match(it)) {
        out.push(it);
        if (out.length >= MAX_RESULTS) break;
      }
    }
    return out;
  }, [items, query]);

  return (
    <div className="picker">
      <input
        type="search"
        className="search-input"
        placeholder="Ajouter un item…  nom, #tag (ex #bois) ou !catégorie (ex !item)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
        spellCheck="false"
      />

      {query.trim() && (
        <div className="picker__results">
          {results.length === 0 && <div className="picker__empty">Aucun item trouvé.</div>}
          {results.map((it) => {
            const added = has(it);
            return (
              <button
                key={it.name + '|' + it.displayName}
                type="button"
                className={'picker__item' + (added ? ' picker__item--added' : '')}
                onClick={() => onAdd(it)}
                disabled={added}
                title={added ? 'Déjà ajouté' : 'Ajouter ' + it.displayName}
              >
                {it.icon ? (
                  <img
                    className="picker__icon"
                    src={import.meta.env.BASE_URL + 'assets/' + it.icon}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <span className="picker__icon picker__icon--missing" />
                )}
                <span className="picker__name">{it.displayName}</span>
                <span className="picker__id">minecraft:{it.name}</span>
                <span className="picker__action">{added ? '✓' : '+'}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
