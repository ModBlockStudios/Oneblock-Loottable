import { useCallback, useMemo, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import Toolbar from './components/Toolbar.jsx';
import CatalogTable from './components/CatalogTable.jsx';
import Toast from './components/Toast.jsx';
import { useCatalog } from './lib/useCatalog.js';
import { copyText } from './lib/copy.js';

export default function App() {
  const { loading, error, items, edition, version } = useCatalog();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [toast, setToast] = useState({ message: '', show: false });
  const toastTimer = useRef(null);

  // Filtrage (catégorie + recherche), recalculé seulement si nécessaire.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (category !== 'all' && it.category !== category) return false;
      if (!q) return true;
      return (
        it.name.toLowerCase().includes(q) ||
        it.displayName.toLowerCase().includes(q)
      );
    });
  }, [items, query, category]);

  const handleCopy = useCallback((name) => {
    const id = 'minecraft:' + name;
    copyText(id);
    setToast({ message: 'Copié : ' + id, show: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(
      () => setToast((t) => ({ ...t, show: false })),
      1400
    );
  }, []);

  return (
    <>
      <Header edition={edition} dataVersion={version} />

      <main className="container">
        <Toolbar
          query={query}
          onQuery={setQuery}
          category={category}
          onCategory={setCategory}
          count={filtered.length}
        />

        {loading && <div className="loading">Chargement du catalogue…</div>}
        {error && (
          <div className="loading">Impossible de charger les données ({error}).</div>
        )}
        {!loading && !error && <CatalogTable items={filtered} onCopy={handleCopy} />}
      </main>

      <footer className="footer">
        <p>
          Données :{' '}
          <a href="https://github.com/PrismarineJS/minecraft-data" target="_blank" rel="noopener noreferrer">
            minecraft-data
          </a>{' '}
          &amp;{' '}
          <a href="https://github.com/PrismarineJS/minecraft-assets" target="_blank" rel="noopener noreferrer">
            minecraft-assets
          </a>
          . Minecraft est une marque de Mojang Studios. Projet non affilié.
        </p>
      </footer>

      <Toast message={toast.message} show={toast.show} />
    </>
  );
}
