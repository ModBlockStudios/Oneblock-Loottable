import WeightInput from './WeightInput.jsx';
import { tagLabel } from '../lib/tags.js';

/* Ligne d'un item simple dans un tiers (icône, nom, id, tag, weight, retrait). */
export default function LootItemRow({ item, onCopy, onRemove, onSetWeight }) {
  return (
    <tr title={'Cliquer pour copier : minecraft:' + item.name} onClick={() => onCopy(item.name)}>
      <td className="col-icon">
        {item.icon ? (
          <img
            className="cell-icon"
            src={import.meta.env.BASE_URL + 'assets/' + item.icon}
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
        <span className="ns">minecraft:</span>
        {item.name}
      </td>
      <td className="cell-tag">
        <span className="tag-badge tag-badge--static">{tagLabel(item.tag)}</span>
      </td>
      <td className="col-weight" onClick={(e) => e.stopPropagation()}>
        <WeightInput value={item.weight} onChange={onSetWeight} />
      </td>
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
