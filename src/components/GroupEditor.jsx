import ItemPicker from './ItemPicker.jsx';
import WeightInput from './WeightInput.jsx';
import PercentInput from './PercentInput.jsx';
import { entryKey } from '../lib/useLootConfigs.js';
import { qualify, idParts } from '../lib/ids.js';
import { iconUrl } from '../lib/icon.js';

/*
 * Éditeur du contenu d'un groupe réutilisable : picker (blocs uniquement) +
 * tableau des blocs avec leur weight interne (et la chance interne au groupe).
 * Le contenu est partagé entre tous les tiers qui référencent ce groupe.
 */
export default function GroupEditor({
  group,
  items,
  onAddBlock,
  onRemoveBlock,
  onSetBlockWeight,
  onCopy,
  onDelete,
}) {
  const has = (item) => group.blocks.some((b) => entryKey(b) === entryKey(item));
  const total = group.blocks.reduce((s, b) => s + (b.weight || 0), 0);

  return (
    <div className="chest-editor">
      <p className="group-note">
        🧩 Groupe partagé entre les tiers : modifier ses blocs met à jour tous les tiers qui
        l'utilisent.
        <button type="button" className="btn-ghost group-delete" onClick={onDelete}>
          Supprimer le groupe
        </button>
      </p>

      <ItemPicker
        items={items}
        onAdd={onAddBlock}
        has={has}
        placeholder="Ajouter un bloc au groupe…  nom, #tag (ex #bois) ou !catégorie (ex !full)"
      />

      {group.blocks.length === 0 ? (
        <div className="tier__empty">Groupe vide. Ajoute des blocs ci-dessus.</div>
      ) : (
        <div className="table-wrap">
          <table className="catalog">
            <thead>
              <tr>
                <th className="col-icon" />
                <th className="col-name">Nom</th>
                <th className="col-id">Identifiant</th>
                <th className="col-weight">Weight</th>
                <th className="col-chance" title="Chance à l'intérieur du groupe">Chance</th>
                <th className="col-remove" />
              </tr>
            </thead>
            <tbody>
              {group.blocks.map((b) => (
                <tr
                  key={entryKey(b)}
                  title={'Cliquer pour copier : ' + qualify(b.name)}
                  onClick={() => onCopy(b.name)}
                >
                  <td className="col-icon">
                    {b.icon ? (
                      <img className="cell-icon" src={iconUrl(b.icon)} alt="" loading="lazy" decoding="async" />
                    ) : (
                      <span className="cell-icon cell-icon--missing" />
                    )}
                  </td>
                  <td className="cell-name">{b.displayName}</td>
                  <td className="cell-id">
                    <span className="ns">{idParts(b.name).ns}:</span>
                    {idParts(b.name).local}
                  </td>
                  <td className="col-weight" onClick={(e) => e.stopPropagation()}>
                    <WeightInput value={b.weight} onChange={(w) => onSetBlockWeight(b, w)} />
                  </td>
                  <td className="col-chance">
                    <PercentInput weight={b.weight} total={total} onChange={(w) => onSetBlockWeight(b, w)} />
                  </td>
                  <td className="col-remove">
                    <button
                      type="button"
                      className="remove-btn"
                      title="Retirer du groupe"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveBlock(b);
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
    </div>
  );
}
