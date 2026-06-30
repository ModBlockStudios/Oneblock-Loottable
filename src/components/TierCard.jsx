import ItemPicker from './ItemPicker.jsx';
import WeightInput from './WeightInput.jsx';
import { tagLabel } from '../lib/tags.js';

/* Un « tiers » : son propre sélecteur d'items et son tableau (avec weights). */
export default function TierCard({
  index,
  tier,
  items,
  onCopy,
  onAdd,
  onRemove,
  onSetWeight,
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

      <ItemPicker items={items} onAdd={onAdd} has={has} />

      {tier.entries.length === 0 ? (
        <div className="tier__empty">
          Aucun item. Ajoute-en via la recherche ci-dessus (nom, #tag ou !catégorie).
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
              {tier.entries.map((it) => (
                <tr
                  key={it.name + '|' + it.displayName}
                  title={'Cliquer pour copier : minecraft:' + it.name}
                  onClick={() => onCopy(it.name)}
                >
                  <td className="col-icon">
                    {it.icon ? (
                      <img
                        className="cell-icon"
                        src={import.meta.env.BASE_URL + 'assets/' + it.icon}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="cell-icon cell-icon--missing" />
                    )}
                  </td>
                  <td className="cell-name">{it.displayName}</td>
                  <td className="cell-id">
                    <span className="ns">minecraft:</span>
                    {it.name}
                  </td>
                  <td className="cell-tag">
                    <span className="tag-badge tag-badge--static">{tagLabel(it.tag)}</span>
                  </td>
                  <td className="col-weight" onClick={(e) => e.stopPropagation()}>
                    <WeightInput value={it.weight} onChange={(w) => onSetWeight(it, w)} />
                  </td>
                  <td className="col-remove">
                    <button
                      type="button"
                      className="remove-btn"
                      title="Retirer de ce tiers"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(it);
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
    </section>
  );
}
