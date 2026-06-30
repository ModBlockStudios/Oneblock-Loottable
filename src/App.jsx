import { useCallback } from 'react';
import Header from './components/Header.jsx';
import Tabs from './components/Tabs.jsx';
import Toast from './components/Toast.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import LootTablePage from './pages/LootTablePage.jsx';
import { useCatalog } from './lib/useCatalog.js';
import { useLootTable } from './lib/useLootTable.js';
import { useHashRoute } from './lib/useHashRoute.js';
import { useToast } from './lib/useToast.js';
import { copyText } from './lib/copy.js';

export default function App() {
  const { loading, error, items, edition, version } = useCatalog();
  const [route, navigate] = useHashRoute('table');
  const loot = useLootTable();
  const { toast, showToast } = useToast();

  const handleCopy = useCallback(
    (name) => {
      const id = 'minecraft:' + name;
      copyText(id);
      showToast('Copié : ' + id);
    },
    [showToast]
  );

  return (
    <>
      <Header edition={edition} dataVersion={version} />
      <Tabs route={route} onNavigate={navigate} lootCount={loot.entries.length} />

      <main className="container">
        {route === 'lootable' ? (
          <LootTablePage loot={loot} onCopy={handleCopy} onNavigate={navigate} />
        ) : (
          <CatalogPage
            loading={loading}
            error={error}
            items={items}
            loot={loot}
            onCopy={handleCopy}
          />
        )}
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
