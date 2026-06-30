import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MiningStage from '../components/MiningStage.jsx';
import DropsList from '../components/DropsList.jsx';
import CraftPanel from '../components/CraftPanel.jsx';
import { pickWeighted, tierIndexFor, rollChest } from '../lib/sim.js';
import { mineTimeWithTools, canHarvestWith } from '../lib/mining.js';
import { recipeFor, consumeMaterials, BASE_ITEM } from '../lib/crafting.js';

const NO_TOOLS = { pickaxe: null, shovel: null, axe: null };

/*
 * Page « Visualisation » : simulateur OneBlock. On choisit une config, on mine
 * le bloc au centre (clic maintenu, timings Minecraft à la main). À chaque
 * cassage : drop ajouté, bloc suivant tiré selon les weights ; la progression
 * du nombre de blocs minés fait avancer de tiers (via blockstobreak).
 */
export default function VisualisationPage({ items, configs }) {
  const list = configs.configs;
  const [cfgId, setCfgId] = useState(() => configs.current?.id ?? list[0]?.id ?? null);
  const config = list.find((c) => c.id === cfgId) || null;

  const [blocksMined, setBlocksMined] = useState(0);
  const [drops, setDrops] = useState([]);
  const [currentBlock, setCurrentBlock] = useState(null);
  const [tools, setTools] = useState(NO_TOOLS);

  // Refs pour la boucle de minage (évite les closures périmées).
  const blocksMinedRef = useRef(0);
  const currentBlockRef = useRef(null);
  const configRef = useRef(config);
  const toolsRef = useRef(tools);
  blocksMinedRef.current = blocksMined;
  currentBlockRef.current = currentBlock;
  configRef.current = config;
  toolsRef.current = tools;

  // Temps de minage à la main, par identifiant Bedrock.
  const miningByName = useMemo(() => {
    const m = new Map();
    for (const it of items) if (!m.has(it.name)) m.set(it.name, it.mining || null);
    return m;
  }, [items]);

  // Items « de base » (pour rendre la monnaie au craft), depuis le catalogue.
  const baseItems = useMemo(() => {
    const byName = new Map();
    for (const it of items) if (!byName.has(it.name)) byName.set(it.name, it);
    const out = {};
    for (const [group, name] of Object.entries(BASE_ITEM)) {
      const it = byName.get(name);
      if (it) out[group] = { name: it.name, displayName: it.displayName, icon: it.icon };
    }
    return out;
  }, [items]);

  const reset = useCallback(() => {
    const tiers = configRef.current?.tiers || [];
    const next = tiers[0] ? pickWeighted(tiers[0].entries) : null;
    blocksMinedRef.current = 0;
    currentBlockRef.current = next;
    setBlocksMined(0);
    setDrops([]);
    setCurrentBlock(next);
    setTools(NO_TOOLS);
  }, []);

  // (Ré)initialise quand on change de config.
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfgId, reset]);

  const tierIndex = config ? tierIndexFor(config.tiers, blocksMined) : 0;
  const nextThreshold = config?.tiers?.[tierIndex + 1]?.unlockAt ?? null;

  const mineMs = useMemo(() => {
    if (!currentBlock) return 0;
    if (currentBlock.kind === 'chest') return (miningByName.get('chest')?.time ?? 3.75) * 1000;
    const mining = miningByName.get(currentBlock.name);
    const ms = mineTimeWithTools(mining, tools);
    return ms == null ? 1000 : ms; // incassable/inconnu → repli 1 s
  }, [currentBlock, miningByName, tools]);

  const craft = useCallback(
    (toolType, tier) => {
      setDrops((prev) => consumeMaterials(prev, recipeFor(tier), baseItems));
      setTools((t) => ({ ...t, [toolType]: tier }));
    },
    [baseItems]
  );

  const addDrops = useCallback((arr) => {
    setDrops((prev) => {
      const next = [...prev];
      for (const d of arr) {
        const key = d.name + '|' + d.displayName;
        const i = next.findIndex((x) => x.key === key);
        if (i >= 0) {
          const updated = { ...next[i], count: next[i].count + d.count };
          next.splice(i, 1);
          next.unshift(updated);
        } else {
          next.unshift({ key, name: d.name, displayName: d.displayName, icon: d.icon, count: d.count });
        }
      }
      return next;
    });
  }, []);

  const handleBreak = useCallback(() => {
    const block = currentBlockRef.current;
    if (!block) return;
    if (block.kind === 'chest') {
      addDrops(rollChest(block));
    } else {
      // On ne récupère le drop que si l'outil possédé permet la récolte.
      const mining = miningByName.get(block.name);
      if (canHarvestWith(mining, toolsRef.current)) {
        addDrops([{ name: block.name, displayName: block.displayName, icon: block.icon, count: 1 }]);
      }
    }

    const newCount = blocksMinedRef.current + 1;
    blocksMinedRef.current = newCount;
    setBlocksMined(newCount);

    const tiers = configRef.current.tiers;
    const idx = tierIndexFor(tiers, newCount);
    const next = pickWeighted(tiers[idx].entries);
    currentBlockRef.current = next;
    setCurrentBlock(next);
  }, [addDrops, miningByName]);

  if (list.length === 0) {
    return (
      <div className="loot-empty">
        <p className="loot-empty__title">Aucune config.</p>
        <p className="loot-empty__hint">
          Crée une config dans l'onglet Lootable, ajoute des blocs, puis reviens ici.
        </p>
      </div>
    );
  }

  return (
    <div className="viz">
      <div className="viz__bar">
        <label className="config-select">
          <span className="config-select__label">Config</span>
          <select value={cfgId ?? ''} onChange={(e) => setCfgId(e.target.value)} aria-label="Choisir une config">
            {list.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn-ghost" onClick={reset}>
          Réinitialiser
        </button>
      </div>

      <div className="viz__main">
        <div className="viz__center">
          <div className="viz__stats">
            <span className="viz__tier">Tiers {tierIndex + 1}</span>
            <span className="viz__mined">{blocksMined.toLocaleString('fr-FR')} blocs minés</span>
            {nextThreshold != null ? (
              <span className="viz__next">
                Prochain tiers à {nextThreshold} ({Math.max(0, nextThreshold - blocksMined)} restants)
              </span>
            ) : (
              <span className="viz__next">Dernier tiers</span>
            )}
          </div>

          {currentBlock ? (
            <MiningStage block={currentBlock} mineMs={mineMs} onBreak={handleBreak} />
          ) : (
            <div className="loot-empty">
              <p className="loot-empty__title">Ce tiers n'a aucun bloc.</p>
              <p className="loot-empty__hint">Ajoute des blocs au tiers dans l'onglet Lootable.</p>
            </div>
          )}
        </div>

        <aside className="viz__side">
          <CraftPanel tools={tools} inventory={drops} onCraft={craft} />
          <DropsList drops={drops} />
        </aside>
      </div>
    </div>
  );
}
