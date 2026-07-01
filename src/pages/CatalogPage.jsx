import { useMemo, useState } from 'react';
import Toolbar from '../components/Toolbar.jsx';
import CatalogTable from '../components/CatalogTable.jsx';
import { tagsPresent } from '../lib/tags.js';
import { makeFilter } from '../lib/search.js';
import { groupWoodSets } from '../lib/wood.js';

/* Page « Table » : catalogue filtrable (référence). */
export default function CatalogPage({ loading, error, items, usage, onCopy }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [tag, setTag] = useState('all');

  const tags = useMemo(() => tagsPresent(items), [items]);

  const filtered = useMemo(() => {
    const match = makeFilter(query); // gère #tag, !catégorie, ou texte libre
    return items.filter((it) => {
      if (category !== 'all' && it.category !== category) return false;
      if (tag !== 'all' && it.tag !== tag) return false;
      return match(it);
    });
  }, [items, query, category, tag]);

  // Regroupement des sets de bois : uniquement en navigation « pure » (sans
  // recherche ni filtre) pour ne pas enfouir un résultat de recherche.
  const grouped = query.trim() === '' && category === 'all' && tag === 'all';
  const rows = useMemo(
    () => (grouped ? groupWoodSets(filtered) : filtered.map((it) => ({ type: 'item', item: it }))),
    [grouped, filtered]
  );

  return (
    <>
      <Toolbar
        query={query}
        onQuery={setQuery}
        category={category}
        onCategory={setCategory}
        tag={tag}
        onTag={setTag}
        tags={tags}
        count={filtered.length}
        items={items}
      />

      {loading && <div className="loading">Chargement du catalogue…</div>}
      {error && <div className="loading">Impossible de charger les données ({error}).</div>}
      {!loading && !error && (
        <CatalogTable rows={rows} usage={usage} onCopy={onCopy} onTagClick={setTag} />
      )}
    </>
  );
}
