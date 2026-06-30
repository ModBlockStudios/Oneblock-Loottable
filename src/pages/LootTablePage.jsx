import ConfigBar from '../components/ConfigBar.jsx';
import TierCard from '../components/TierCard.jsx';

/*
 * Page « Lootable » : on choisit une config, qui contient un ou plusieurs
 * tiers. Chaque tiers a son propre tableau (items + weights). En bas, on peut
 * ajouter un tiers vierge ou dupliquer le dernier.
 */
export default function LootTablePage({ items, configs, onCopy }) {
  const { current } = configs;

  return (
    <>
      <ConfigBar
        configs={configs.configs}
        current={current}
        onSelect={configs.selectConfig}
        onCreate={configs.createConfig}
        onDelete={configs.deleteConfig}
      />

      {!current ? (
        <div className="loot-empty">
          <p className="loot-empty__title">Aucune config sélectionnée.</p>
          <p className="loot-empty__hint">
            Crée une config (donne-lui un nom ci-dessus) pour commencer.
          </p>
        </div>
      ) : (
        <>
          {current.tiers.map((tier, i) => (
            <TierCard
              key={tier.id}
              index={i}
              tier={tier}
              items={items}
              onCopy={onCopy}
              onAdd={(item) => configs.addItem(tier.id, item)}
              onRemove={(item) => configs.removeItem(tier.id, item)}
              onSetWeight={(item, w) => configs.setWeight(tier.id, item, w)}
              onClear={() => configs.clearTier(tier.id)}
              onDelete={() => configs.deleteTier(tier.id)}
              has={(item) => configs.hasItem(tier.id, item)}
              canDelete={current.tiers.length > 1}
            />
          ))}

          <div className="tier-controls">
            <button type="button" className="btn-primary" onClick={configs.addTier}>
              + Ajouter un tiers
            </button>
            <button type="button" className="btn-ghost" onClick={configs.duplicateLastTier}>
              Dupliquer le dernier tiers
            </button>
          </div>
        </>
      )}
    </>
  );
}
