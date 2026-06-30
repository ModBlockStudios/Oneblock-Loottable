import ItemPicker from './ItemPicker.jsx';
import LootItemRow from './LootItemRow.jsx';
import ChestRow from './ChestRow.jsx';
import { entryId } from '../lib/useLootConfigs.js';

/* Un « tiers » : sélecteur d'items, bouton chest, et tableau (items + chests). */
export default function TierCard({
  index,
  tier,
  items,
  onCopy,
  onAddItem,
  onAddChest,
  onRemoveEntry,
  onSetWeight,
  onAddChestItem,
  onRemoveChestItem,
  onSetChestQuantity,
  onClear,
  onDelete,
  has,
  canDelete,
}) {
  return (
    <section className="tier">
      <div className="tier__head">
        <h2 className="tier__title">Tiers {index + 1}</h2>
        <span className="tier__count">{tier.entries.length} entrée(s)</span>
        <div className="tier__actions">
          <button type="button" className="btn-ghost" onClick={onAddChest}>
            📦 Ajouter un Chest
          </button>
          {tier.entries.length > 0 && (
            <button type="button" className="btn-ghost" onClick={onClear}>
              Vider
            </button>
          )}
          {canDelete && (
            <button type="button" className="btn-ghost" onClick={onDelete}>
              Supprimer ce tiers
            </button>
          )}
        </div>
      </div>

      <ItemPicker items={items} onAdd={onAddItem} has={has} />

      {tier.entries.length === 0 ? (
        <div className="tier__empty">
          Aucune entrée. Ajoute des items via la recherche, ou un chest avec « 📦 Ajouter un Chest ».
        </div>
      ) : (
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
              {tier.entries.map((e) =>
                e.kind === 'chest' ? (
                  <ChestRow
                    key={entryId(e)}
                    chest={e}
                    items={items}
                    onCopy={onCopy}
                    onRemove={() => onRemoveEntry(e)}
                    onSetWeight={(w) => onSetWeight(e, w)}
                    onAddItem={(item) => onAddChestItem(e.id, item)}
                    onRemoveItem={(item) => onRemoveChestItem(e.id, item)}
                    onSetQuantity={(item, q) => onSetChestQuantity(e.id, item, q)}
                  />
                ) : (
                  <LootItemRow
                    key={entryId(e)}
                    item={e}
                    onCopy={onCopy}
                    onRemove={() => onRemoveEntry(e)}
                    onSetWeight={(w) => onSetWeight(e, w)}
                  />
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
