/* Barre d'onglets de navigation : Table (catalogue) / Lootable (sélection). */
export default function Tabs({ route, onNavigate, lootCount }) {
  const tabs = [
    { key: 'table', label: 'Table' },
    { key: 'lootable', label: 'Lootable', badge: lootCount },
    { key: 'visualisation', label: 'Visualisation' },
  ];

  return (
    <nav className="tabs" aria-label="Navigation principale">
      <div className="tabs__inner">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={'tab' + (route === t.key ? ' tab--active' : '')}
            onClick={() => onNavigate(t.key)}
            aria-current={route === t.key ? 'page' : undefined}
          >
            {t.label}
            {t.badge > 0 && <span className="tab__badge">{t.badge}</span>}
          </button>
        ))}
      </div>
    </nav>
  );
}
