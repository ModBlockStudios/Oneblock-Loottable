import WeightInput from './WeightInput.jsx';
import { tagLabel } from '../lib/tags.js';
import { formatChance } from '../lib/chance.js';
import { iconUrl } from '../lib/icon.js';
import { qualify, idParts } from '../lib/ids.js';

/* Ligne d'un item simple dans un tiers (icône, nom, id, tag, weight, chance, retrait). */
export default function LootItemRow({ item, total, onCopy, onRemove, onSetWeight }) {
  const { ns, local } = idParts(item.name);
  return (
    <tr title={'Cliquer pour copier : ' + qualify(item.name)} onClick={() => onCopy(item.name)}>
      <td className="col-icon">
        {item.icon ? (
          <img
            className="cell-icon"
            src={iconUrl(item.icon)}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="cell-icon cell-icon--missing" />
        )}
      </td>
      <td className="cell-name">{item.displayName}</td>
      <td className="cell-id">
        <span className="ns">{ns}:</span>
        {local}
      </td>
      <td className="cell-tag">
        <span className="tag-badge tag-badge--static">{tagLabel(item.tag)}</span>
      </td>
      <td className="col-weight" onClick={(e) => e.stopPropagation()}>
        <WeightInput value={item.weight} onChange={onSetWeight} />
      </td>
      <td className="col-chance cell-chance">{formatChance(item.weight, total)}</td>
      <td className="col-remove">
        <button
          type="button"
          className="remove-btn"
          title="Retirer de ce tiers"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          ×
        </button>
      </td>
    </tr>
  );
}
