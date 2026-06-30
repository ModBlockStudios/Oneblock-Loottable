import { useEffect, useMemo, useState } from 'react';
import ConfigBar from '../components/ConfigBar.jsx';
import TierCard from '../components/TierCard.jsx';
import CodeView from '../components/CodeView.jsx';
import { configToJson } from '../lib/exportCode.js';

/*
 * Page « Lootable » : on choisit une config, qui contient un ou plusieurs
 * tiers. Chaque tiers a son propre tableau (items + chests). Un bouton « Code »
 * bascule sur la vue JSON (read-only) de la config courante.
 */
export default function LootTablePage({ items, configs, onCopy, onCopyText }) {
  const { current } = configs;
  const [codeView, setCodeView] = useState(false);

  // À l'entrée dans l'onglet, on reclasse les tiers par weight décroissant.
  // (Pas de réordonnancement en direct pendant l'édition.)
  const { sortByWeight } = configs;
  useEffect(() => {
    sortByWeight();
  }, [sortByWeight]);

  const json = useMemo(() => (current ? configToJson(current) : ''), [current]);
  // Dans un tiers on ne mine que des BLOCS ; les items sont réservés aux coffres.
  const blockItems = useMemo(() => items.filter((it) => it.category !== 'item'), [items]);

  return (
    <>
      <ConfigBar
        configs={configs.configs}
        current={current}
        onSelect={configs.selectConfig}
        onCreate={configs.createConfig}
        onDelete={configs.deleteConfig}
        codeView={codeView}
        onToggleCode={() => setCodeView((v) => !v)}
      />

      {!current ? (
        <div className="loot-empty">
          <p className="loot-empty__title">Aucune config sélectionnée.</p>
          <p className="loot-empty__hint">
            Crée une config (donne-lui un nom ci-dessus) pour commencer.
          </p>
        </div>
      ) : codeView ? (
        <CodeView json={json} onCopy={onCopyText} />
      ) : (
        <>
          {current.tiers.map((tier, i) => (
            <TierCard
              key={tier.id}
              index={i}
              tier={tier}
              prevUnlock={i > 0 ? current.tiers[i - 1].unlockAt : 0}
              items={items}
              blockItems={blockItems}
              onCopy={onCopy}
              onAddItem={(item) => configs.addItem(tier.id, item)}
              onAddChest={() => configs.addChest(tier.id)}
              onRemoveEntry={(entry) => configs.removeEntry(tier.id, entry)}
              onSetWeight={(entry, w) => configs.setWeight(tier.id, entry, w)}
              onSetUnlock={(value) => configs.setTierUnlock(tier.id, value)}
              onAddChestItem={(chestId, item) => configs.addChestItem(tier.id, chestId, item)}
              onRemoveChestItem={(chestId, item) => configs.removeChestItem(tier.id, chestId, item)}
              onSetChestRange={(chestId, item, lo, hi) => configs.setChestRange(tier.id, chestId, item, lo, hi)}
              onSetChestLabel={(chestId, label) => configs.setChestLabel(tier.id, chestId, label)}
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
