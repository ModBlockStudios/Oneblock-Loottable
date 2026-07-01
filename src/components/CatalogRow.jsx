import { memo, useState } from 'react';
import { tagLabel } from '../lib/tags.js';
import { categoryLabel } from '../lib/categories.js';
import { formatMineTime } from '../lib/mining.js';

/* Une ligne du catalogue. Clic sur la ligne = copie de l'identifiant Bedrock. */
function CatalogRow({ item, usedIn, nested, onCopy, onTagClick }) {
  const [broken, setBroken] = useState(false);
  const iconSrc = item.icon ? import.meta.env.BASE_URL + 'assets/' + item.icon : null;

  // Info-bulle « Utilisé » : compteur + liste des configs qui l'utilisent.
  const names = usedIn || [];
  const used = names.length;
  const usedTitle =
    used > 0
      ? used + ' config(s) Loot Table\n' + names.map((n) => 'Used in ' + n).join('\n')
      : 'Non utilisé';

  return (
    <tr
      className={nested ? 'row-nested' : undefined}
      title={'Cliquer pour copier : minecraft:' + item.name}
      onClick={() => onCopy(item.name)}
    >
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
          {categoryLabel(item.category)}
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
      <td className="col-mine cell-mine" title="Temps de minage à la main">
        {formatMineTime(item.mining)}
      </td>
      <td className="col-stack cell-stack">{item.stackSize}</td>
      <td className="col-used cell-used" title={usedTitle}>
        {used > 0 ? <span className="used-badge">{used}</span> : <span className="used-zero">—</span>}
      </td>
    </tr>
  );
}

export default memo(CatalogRow);
