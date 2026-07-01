import { useState } from 'react';
import ItemPicker from './ItemPicker.jsx';
import LootItemRow from './LootItemRow.jsx';
import ChestRow from './ChestRow.jsx';
import UnlockInput from './UnlockInput.jsx';
import { entryId } from '../lib/useLootConfigs.js';

/* Un « tiers » : seuil de déblocage, sélecteur d'items, chests et tableau. */
export default function TierCard({
  index,
  tier,
  prevUnlock,
  items,
  blockItems,
  onCopy,
  onAddItem,
  onAddChest,
  onRemoveEntry,
  onSetWeight,
  onSetUnlock,
  onAddChestItem,
  onRemoveChestItem,
  onSetChestRange,
  onSetChestLabel,
  onClear,
  onDelete,
  has,
  canDelete,
}) {
  // Somme des weights du tiers : base du calcul du % de chance de chaque entrée.
  const totalWeight = tier.entries.reduce((s, e) => s + (e.weight || 0), 0);

  // Repli du tiers : ouvert par défaut (contrairement aux coffres).
  const [open, setOpen] = useState(true);

  return (
    <section className="tier">
      <div className="tier__head">
        <button
          type="button"
          className="tier__toggle"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          title={open ? 'Replier ce tiers' : 'Déplier ce tiers'}
        >
          <span className="tier__caret">{open ? '▾' : '▸'}</span>
          <h2 className="tier__title">Tiers {index + 1}</h2>
        </button>
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

      {open && (
      <>
      <div className="tier__unlock">
        <span className="tier__unlock-label">🪨 Block à miner pour débloquer&nbsp;:</span>
        {index === 0 ? (
          <span className="tier__unlock-fixed">0 <em>(tiers de base)</em></span>
        ) : (
          <>
            <UnlockInput value={tier.unlockAt} min={prevUnlock + 1} onChange={onSetUnlock} />
            <span className="tier__unlock-hint">doit être &gt; {prevUnlock}</span>
          </>
        )}
      </div>

      <ItemPicker
        items={blockItems}
        onAdd={onAddItem}
        has={has}
        placeholder="Ajouter un bloc…  nom, #tag (ex #bois) ou !catégorie (ex !full)"
      />

      {tier.entries.length === 0 ? (
        <div className="tier__empty">
          Aucune entrée. Ajoute des blocs à miner via la recherche, ou un coffre
          (items) avec « 📦 Ajouter un Chest ».
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
                <th className="col-chance" title="Chance de tirage dans ce tiers">Chance</th>
                <th className="col-remove" />
              </tr>
            </thead>
            <tbody>
              {tier.entries.map((e) =>
                e.kind === 'chest' ? (
                  <ChestRow
                    key={entryId(e)}
                    chest={e}
                    total={totalWeight}
                    items={items}
                    onCopy={onCopy}
                    onRemove={() => onRemoveEntry(e)}
                    onSetWeight={(w) => onSetWeight(e, w)}
                    onSetLabel={(label) => onSetChestLabel(e.id, label)}
                    onAddItem={(item) => onAddChestItem(e.id, item)}
                    onRemoveItem={(item) => onRemoveChestItem(e.id, item)}
                    onSetRange={(item, lo, hi) => onSetChestRange(e.id, item, lo, hi)}
                  />
                ) : (
                  <LootItemRow
                    key={entryId(e)}
                    item={e}
                    total={totalWeight}
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
      </>
      )}
    </section>
  );
}
