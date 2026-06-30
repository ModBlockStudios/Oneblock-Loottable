import { useState } from 'react';
import WeightInput from './WeightInput.jsx';
import ChestEditor from './ChestEditor.jsx';

/*
 * Un chest dans un tiers : ligne de résumé (icône 📦, weight, retrait) +
 * éditeur dépliable de son contenu (items/blocs + quantités).
 */
export default function ChestRow({
  chest,
  items,
  onCopy,
  onRemove,
  onSetWeight,
  onAddItem,
  onRemoveItem,
  onSetRange,
}) {
  const [open, setOpen] = useState(true);

  return (
    <>
      <tr className="chest-summary">
        <td className="col-icon">
          <span className="chest-icon" aria-hidden="true">📦</span>
        </td>
        <td className="cell-name">
          <button
            type="button"
            className="chest-toggle"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
          >
            <span className="chest-caret">{open ? '▾' : '▸'}</span> Chest
          </button>
          <span className="chest-sub">{chest.contents.length} item(s)</span>
        </td>
        <td className="cell-id">
          <span className="cat-badge cat-badge--full_block">conteneur</span>
        </td>
        <td className="cell-tag" />
        <td className="col-weight" onClick={(e) => e.stopPropagation()}>
          <WeightInput value={chest.weight} onChange={onSetWeight} />
        </td>
        <td className="col-remove">
          <button type="button" className="remove-btn" title="Retirer ce chest" onClick={onRemove}>
            ×
          </button>
        </td>
      </tr>

      {open && (
        <tr className="chest-editor-row">
          <td colSpan={6}>
            <ChestEditor
              chest={chest}
              items={items}
              onAddItem={onAddItem}
              onRemoveItem={onRemoveItem}
              onSetRange={onSetRange}
              onCopy={onCopy}
            />
          </td>
        </tr>
      )}
    </>
  );
}
