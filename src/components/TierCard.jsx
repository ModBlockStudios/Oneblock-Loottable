import { useState } from 'react';
import ItemPicker from './ItemPicker.jsx';
import LootItemRow from './LootItemRow.jsx';
import ChestRow from './ChestRow.jsx';
import GroupRow from './GroupRow.jsx';
import UnlockInput from './UnlockInput.jsx';
import { entryId } from '../lib/useLootConfigs.js';

/* Un « tiers » : seuil de déblocage, sélecteur d'items, chests, groupes et tableau. */
export default function TierCard({
  index,
  tier,
  prevUnlock,
  items,
  blockItems,
  groups,
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
  onCreateGroup,
  onAddGroup,
  onRenameGroup,
  onAddGroupBlock,
  onRemoveGroupBlock,
  onSetGroupBlockWeight,
  onDeleteGroup,
  onClear,
  onDelete,
  has,
  canDelete,
}) {
  const [open, setOpen] = useState(true);
  const [showGroups, setShowGroups] = useState(false);
  const [groupName, setGroupName] = useState('');

  const groupsById = new Map((groups || []).map((g) => [g.id, g]));

  // Poids EFFECTIF d'une entrée (un groupe pèse weight × somme des weights internes).
  const effWeight = (e) => {
    if (e.kind === 'group') {
      const g = groupsById.get(e.groupId);
      const inner = g ? g.blocks.reduce((s, b) => s + (b.weight || 0), 0) : 0;
      return (e.weight || 0) * inner;
    }
    return e.weight || 0;
  };
  const totalWeight = tier.entries.reduce((s, e) => s + effWeight(e), 0);
  const tierGroupIds = new Set(tier.entries.filter((e) => e.kind === 'group').map((e) => e.groupId));

  const submitNewGroup = (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    onCreateGroup(groupName.trim());
    setGroupName('');
    setShowGroups(false);
  };

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
          <button
            type="button"
            className={'btn-ghost' + (showGroups ? ' btn-ghost--active' : '')}
            onClick={() => setShowGroups((v) => !v)}
          >
            🧩 Ajouter un groupe
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

      {showGroups && (
        <div className="group-menu">
          {(groups || []).length > 0 && (
            <div className="group-menu__list">
              <span className="group-menu__label">Réutiliser un groupe :</span>
              {groups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className="btn-ghost"
                  disabled={tierGroupIds.has(g.id)}
                  title={tierGroupIds.has(g.id) ? 'Déjà dans ce tiers' : 'Ajouter à ce tiers'}
                  onClick={() => {
                    onAddGroup(g.id);
                    setShowGroups(false);
                  }}
                >
                  ＋ {g.name || 'Groupe'} ({g.blocks.length})
                </button>
              ))}
            </div>
          )}
          <form className="group-menu__create" onSubmit={submitNewGroup}>
            <input
              type="text"
              className="config-input"
              placeholder="Créer un nouveau groupe…"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={40}
            />
            <button type="submit" className="btn-primary" disabled={!groupName.trim()}>
              Créer
            </button>
          </form>
        </div>
      )}

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
              Aucune entrée. Ajoute des blocs à miner via la recherche, un coffre (items) avec
              « 📦 Ajouter un Chest », ou un groupe de blocs avec « 🧩 Ajouter un groupe ».
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
                    e.kind === 'group' ? (
                      <GroupRow
                        key={entryId(e)}
                        group={groupsById.get(e.groupId)}
                        entry={e}
                        total={totalWeight}
                        items={blockItems}
                        onCopy={onCopy}
                        onRemove={() => onRemoveEntry(e)}
                        onSetWeight={(w) => onSetWeight(e, w)}
                        onRename={(name) => onRenameGroup(e.groupId, name)}
                        onAddBlock={(item) => onAddGroupBlock(e.groupId, item)}
                        onRemoveBlock={(item) => onRemoveGroupBlock(e.groupId, item)}
                        onSetBlockWeight={(item, w) => onSetGroupBlockWeight(e.groupId, item, w)}
                        onDelete={() => onDeleteGroup(e.groupId)}
                      />
                    ) : e.kind === 'chest' ? (
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
