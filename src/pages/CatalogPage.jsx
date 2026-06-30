import { useMemo, useState } from 'react';
import Toolbar from '../components/Toolbar.jsx';
import CatalogTable from '../components/CatalogTable.jsx';
import { tagsPresent } from '../lib/tags.js';

/* Page « Table » : catalogue filtrable (référence). */
export default function CatalogPage({ loading, error, items, onCopy }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [tag, setTag] = useState('all');

  const tags = useMemo(() => tagsPresent(items), [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (category !== 'all' && it.category !== category) return false;
      if (tag !== 'all' && it.tag !== tag) return false;
      if (!q) return true;
      return (
        it.name.toLowerCase().includes(q) || it.displayName.toLowerCase().includes(q)
      );
    });
  }, [items, query, category, tag]);

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
      />

      {loading && <div className="loading">Chargement du catalogue…</div>}
      {error && <div className="loading">Impossible de charger les données ({error}).</div>}
      {!loading && !error && (
        <CatalogTable items={filtered} onCopy={onCopy} onTagClick={setTag} />
      )}
    </>
  );
}
