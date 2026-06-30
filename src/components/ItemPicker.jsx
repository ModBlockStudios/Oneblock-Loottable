import { useMemo, useState } from 'react';
import { makeFilter } from '../lib/search.js';
import SearchField from './SearchField.jsx';

const MAX_RESULTS = 40;

const norm = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

// Pertinence d'un item pour une recherche texte : exact < préfixe < contient.
function relevance(it, q) {
  const n = norm(it.name);
  const dn = norm(it.displayName);
  if (n === q || dn === q) return 0;
  if (n.startsWith(q) || dn.startsWith(q)) return 1;
  return 2;
}

/*
 * Sélecteur d'items intégré à la page Lootable : on cherche dans le catalogue
 * et on ajoute à la config courante, sans changer de page.
 * Supporte la même syntaxe que la Table : #tag, !catégorie, ou texte libre.
 */
export default function ItemPicker({
  items,
  onAdd,
  has,
  placeholder = 'Ajouter un item…  nom, #tag (ex #bois) ou !catégorie (ex !item)',
}) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const raw = query.trim();
    if (!raw) return [];
    const match = makeFilter(query);
    const all = items.filter(match);
    // Recherches #tag / !catégorie : ordre catalogue. Texte libre : par pertinence
    // (sinon un match exact comme « Stone » pouvait être coupé par le plafond).
    if (raw[0] === '#' || raw[0] === '!') return all.slice(0, MAX_RESULTS);
    const q = norm(raw);
    return all
      .map((it) => ({ it, r: relevance(it, q) }))
      .sort((a, b) => a.r - b.r || a.it.displayName.localeCompare(b.it.displayName))
      .slice(0, MAX_RESULTS)
      .map((x) => x.it);
  }, [items, query]);

  return (
    <div className="picker">
      <SearchField value={query} onChange={setQuery} placeholder={placeholder} items={items} />

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
