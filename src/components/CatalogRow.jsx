import { memo, useState } from 'react';
import { tagLabel } from '../lib/tags.js';

const CATEGORY_LABEL = {
  full_block: 'Full Block',
  decoration_block: 'Decoration',
  item: 'Item',
};

/* Une ligne du catalogue. Clic sur la ligne = copie de l'identifiant Bedrock. */
function CatalogRow({ item, onCopy, onTagClick }) {
  const [broken, setBroken] = useState(false);
  const iconSrc = item.icon ? import.meta.env.BASE_URL + 'assets/' + item.icon : null;

  return (
    <tr title={'Cliquer pour copier : minecraft:' + item.name} onClick={() => onCopy(item.name)}>
      <td className="col-icon">
        {iconSrc && !broken ? (
          <img
            className="cell-icon"
            src={iconSrc}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setBroken(true)}
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
      <td className="cell-cat">
        <span className={'cat-badge cat-badge--' + item.category}>
          {CATEGORY_LABEL[item.category] || item.category}
        </span>
      </td>
      <td className="cell-tag">
        <button
          type="button"
          className="tag-badge"
          title={'Filtrer : ' + tagLabel(item.tag)}
          onClick={(e) => {
            e.stopPropagation();
            onTagClick(item.tag);
          }}
        >
          {tagLabel(item.tag)}
        </button>
      </td>
      <td className="col-stack cell-stack">{item.stackSize}</td>
    </tr>
  );
}

export default memo(CatalogRow);
