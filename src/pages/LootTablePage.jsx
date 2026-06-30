import ConfigBar from '../components/ConfigBar.jsx';
import ItemPicker from '../components/ItemPicker.jsx';
import WeightInput from '../components/WeightInput.jsx';
import { tagLabel } from '../lib/tags.js';

/*
 * Page « Lootable » : on choisit une config, on y ajoute des items via le
 * sélecteur intégré, et on règle le « weight » de chaque entrée.
 */
export default function LootTablePage({ items, configs, onCopy }) {
  const { current } = configs;

  return (
    <>
      <ConfigBar
        configs={configs.configs}
        current={current}
        onSelect={configs.selectConfig}
        onCreate={configs.createConfig}
        onDelete={configs.deleteConfig}
      />

      {!current ? (
        <div className="loot-empty">
          <p className="loot-empty__title">Aucune config sélectionnée.</p>
          <p className="loot-empty__hint">
            Crée une config (donne-lui un nom ci-dessus) pour commencer à ajouter des items.
          </p>
        </div>
      ) : (
        <>
          <ItemPicker items={items} onAdd={configs.addItem} has={configs.hasItem} />

          {current.entries.length === 0 ? (
            <div className="loot-empty">
              <p className="loot-empty__title">« {current.name} » est vide.</p>
              <p className="loot-empty__hint">
                Utilise la recherche ci-dessus pour ajouter des items à cette config.
              </p>
            </div>
          ) : (
            <>
              <div className="loot-bar">
                <span className="loot-bar__count">
                  {current.entries.length} entrée(s) dans « {current.name} »
                </span>
                <button type="button" className="btn-ghost" onClick={configs.clearCurrent}>
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
                      <th className="col-weight">Weight</th>
                      <th className="col-remove" />
                    </tr>
                  </thead>
                  <tbody>
                    {current.entries.map((it) => (
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
                        <td className="col-weight" onClick={(e) => e.stopPropagation()}>
                          <WeightInput
                            value={it.weight}
                            onChange={(w) => configs.setWeight(it, w)}
                          />
                        </td>
                        <td className="col-remove">
                          <button
                            type="button"
                            className="remove-btn"
                            title="Retirer de la config"
                            onClick={(e) => {
                              e.stopPropagation();
                              configs.removeItem(it);
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
          )}
        </>
      )}
    </>
  );
}
