import { tagLabel } from '../lib/tags.js';

/* Page « Lootable » : tableau des items sélectionnés depuis le catalogue. */
export default function LootTablePage({ loot, onCopy, onNavigate }) {
  const { entries } = loot;

  if (entries.length === 0) {
    return (
      <div className="loot-empty">
        <p className="loot-empty__title">La lootable est vide.</p>
        <p className="loot-empty__hint">
          Va dans l'onglet{' '}
          <button type="button" className="link-btn" onClick={() => onNavigate('table')}>
            Table
          </button>{' '}
          et clique sur le bouton <span className="kbd">+</span> d'un item pour l'ajouter ici.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="loot-bar">
        <span className="loot-bar__count">{entries.length} entrée(s)</span>
        <button type="button" className="btn-ghost" onClick={loot.clear}>
          Tout vider
        </button>
      </div>

      <div className="table-wrap">
        <table className="catalog">
          <thead>
            <tr>
              <th className="col-icon" />
              <th className="col-name">Nom</th>
              <th className="col-id">Identifiant</th>
              <th className="col-tag">Tag</th>
              <th className="col-stack">Pile</th>
              <th className="col-remove" />
            </tr>
          </thead>
          <tbody>
            {entries.map((it) => (
              <tr
                key={it.name + '|' + it.displayName}
                title={'Cliquer pour copier : minecraft:' + it.name}
                onClick={() => onCopy(it.name)}
              >
                <td className="col-icon">
                  {it.icon ? (
                    <img
                      className="cell-icon"
                      src={import.meta.env.BASE_URL + 'assets/' + it.icon}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="cell-icon cell-icon--missing" />
                  )}
                </td>
                <td className="cell-name">{it.displayName}</td>
                <td className="cell-id">
                  <span className="ns">minecraft:</span>
                  {it.name}
                </td>
                <td className="cell-tag">
                  <span className="tag-badge tag-badge--static">{tagLabel(it.tag)}</span>
                </td>
                <td className="col-stack cell-stack">{it.stackSize}</td>
                <td className="col-remove">
                  <button
                    type="button"
                    className="remove-btn"
                    title="Retirer de la lootable"
                    onClick={(e) => {
                      e.stopPropagation();
                      loot.remove(it);
                    }}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
