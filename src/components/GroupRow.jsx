import { useState } from 'react';
import WeightInput from './WeightInput.jsx';
import GroupEditor from './GroupEditor.jsx';
import { formatChance } from '../lib/chance.js';

/*
 * Un groupe dans un tiers : ligne de résumé (nom éditable, weight du groupe dans
 * le tiers, chance) + éditeur dépliable de son contenu (blocs + weights internes).
 * `total` = somme des weights EFFECTIFS du tiers (pour la chance).
 */
export default function GroupRow({
  group,
  entry,
  total,
  items,
  onCopy,
  onRemove,
  onSetWeight,
  onRename,
  onAddBlock,
  onRemoveBlock,
  onSetBlockWeight,
  onDelete,
}) {
  const [open, setOpen] = useState(false);

  if (!group) return null; // référence orpheline (groupe supprimé) : rien à afficher

  return (
    <>
      <tr className="chest-summary group-summary">
        <td className="col-icon">
          <span className="chest-icon" aria-hidden="true">🧩</span>
        </td>
        <td className="cell-name">
          <button
            type="button"
            className="chest-toggle"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            title={open ? 'Replier' : 'Déplier'}
          >
            <span className="chest-caret">{open ? '▾' : '▸'}</span> Groupe
          </button>
          <input
            type="text"
            className="chest-name-input"
            placeholder="Nom du groupe"
            value={group.name}
            onChange={(e) => onRename(e.target.value)}
            title="Nom du groupe (réutilisable entre les tiers)"
          />
          <span className="chest-sub">{group.blocks.length} bloc(s)</span>
        </td>
        <td className="cell-id">
          <span className="cat-badge cat-badge--full_block">groupe</span>
        </td>
        <td className="cell-tag" />
        <td className="col-weight" onClick={(e) => e.stopPropagation()}>
          <WeightInput value={entry.weight} onChange={onSetWeight} />
        </td>
        <td className="col-chance cell-chance">{formatChance(entry.weight, total)}</td>
        <td className="col-remove">
          <button type="button" className="remove-btn" title="Retirer ce groupe du tiers" onClick={onRemove}>
            ×
          </button>
        </td>
      </tr>

      {open && (
        <tr className="chest-editor-row">
          <td colSpan={7}>
            <GroupEditor
              group={group}
              items={items}
              onAddBlock={onAddBlock}
              onRemoveBlock={onRemoveBlock}
              onSetBlockWeight={onSetBlockWeight}
              onCopy={onCopy}
              onDelete={onDelete}
            />
          </td>
        </tr>
      )}
    </>
  );
}
