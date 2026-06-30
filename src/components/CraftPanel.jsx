import { TOOL_TYPES, proposalFor, recipeText, availableUnits } from '../lib/crafting.js';
import { TIER_LABEL } from '../lib/mining.js';

/*
 * Panneau de craft d'outils : pour chaque type (pioche/pelle/hache), affiche
 * l'outil actuel et propose de crafter le meilleur palier abordable.
 */
export default function CraftPanel({ tools, inventory, onCraft }) {
  return (
    <div className="craft">
      <div className="craft__head">
        <span className="craft__title">Outils</span>
      </div>

      <ul className="craft__list">
        {TOOL_TYPES.map(({ key, label }) => {
          const current = tools[key];
          const prop = proposalFor(current, inventory);
          return (
            <li key={key} className="craft__row">
              <div className="craft__info">
                <span className="craft__tool">{label}</span>
                <span className={'craft__cur' + (current ? '' : ' craft__cur--none')}>
                  {current ? TIER_LABEL[current] : 'à la main'}
                </span>
              </div>

              {prop ? (
                prop.affordable ? (
                  <button
                    type="button"
                    className="btn-primary craft__btn"
                    onClick={() => onCraft(key, prop.tier)}
                    title={'Recette : ' + recipeText(prop.recipe)}
                  >
                    Crafter {TIER_LABEL[prop.tier]}
                  </button>
                ) : (
                  <span className="craft__goal" title={'Recette : ' + recipeText(prop.recipe)}>
                    {TIER_LABEL[prop.tier]} :{' '}
                    {prop.recipe
                      .map((r) => `${availableUnits(inventory, r.group)}/${r.amount} ${TIER_LABEL[r.group]}`)
                      .join(' · ')}
                  </span>
                )
              ) : (
                <span className="craft__goal">max</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
