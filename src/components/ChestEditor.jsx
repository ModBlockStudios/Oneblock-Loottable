import ItemPicker from './ItemPicker.jsx';
import WeightInput from './WeightInput.jsx';
import { entryKey } from '../lib/useLootConfigs.js';

/* Éditeur du contenu d'un chest : picker + tableau (items/blocs avec quantité). */
export default function ChestEditor({ chest, items, onAddItem, onRemoveItem, onSetQuantity, onCopy }) {
  const has = (item) => chest.contents.some((c) => entryKey(c) === entryKey(item));

  return (
    <div className="chest-editor">
      <ItemPicker items={items} onAdd={onAddItem} has={has} />

      {chest.contents.length === 0 ? (
        <div className="tier__empty">Chest vide. Ajoute des items / blocs ci-dessus.</div>
      ) : (
        <div className="table-wrap">
          <table className="catalog">
            <thead>
              <tr>
                <th className="col-icon" />
                <th className="col-name">Nom</th>
                <th className="col-id">Identifiant</th>
                <th className="col-weight">Quantité</th>
                <th className="col-remove" />
              </tr>
            </thead>
            <tbody>
              {chest.contents.map((c) => (
                <tr
                  key={c.name + '|' + c.displayName}
                  title={'Cliquer pour copier : minecraft:' + c.name}
                  onClick={() => onCopy(c.name)}
                >
                  <td className="col-icon">
                    {c.icon ? (
                      <img
                        className="cell-icon"
                        src={import.meta.env.BASE_URL + 'assets/' + c.icon}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="cell-icon cell-icon--missing" />
                    )}
                  </td>
                  <td className="cell-name">{c.displayName}</td>
                  <td className="cell-id">
                    <span className="ns">minecraft:</span>
                    {c.name}
                  </td>
                  <td className="col-weight" onClick={(e) => e.stopPropagation()}>
                    <WeightInput value={c.quantity} onChange={(q) => onSetQuantity(c, q)} />
                  </td>
                  <td className="col-remove">
                    <button
                      type="button"
                      className="remove-btn"
                      title="Retirer du chest"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItem(c);
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
      )}
    </div>
  );
}
