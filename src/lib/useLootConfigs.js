import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'oneblock-loottable:configs:v1';

// Clé d'un item (name peut être partagé, ex. banner/bed → on ajoute displayName).
export const entryKey = (it) => it.name + '|' + it.displayName;

// Identité d'une entrée de tiers : un item OU un chest (conteneur).
export const entryId = (e) => (e.kind === 'chest' ? 'c:' + e.id : 'i:' + entryKey(e));

function genId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return prefix + '_' + crypto.randomUUID();
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const newTier = () => ({ id: genId('tier'), entries: [] });

// Écart par défaut entre deux paliers « block à miner » pour un nouveau tiers.
const DEFAULT_UNLOCK_GAP = 100;

/*
 * Normalise le seuil « block à miner » (unlockAt) de chaque tiers :
 *  - Tiers 1 (index 0) toujours à 0 ;
 *  - chaque tiers suivant strictement supérieur au précédent (sinon on remonte).
 * Un tiers sans valeur reçoit « précédent + écart par défaut ».
 */
function normalizeUnlocks(tiers) {
  let prev = -1;
  return tiers.map((t, i) => {
    let u;
    if (i === 0) {
      u = 0;
    } else {
      const cur = typeof t.unlockAt === 'number' ? t.unlockAt : prev + DEFAULT_UNLOCK_GAP;
      u = cur > prev ? cur : prev + 1;
    }
    prev = u;
    return t.unlockAt === u ? t : { ...t, unlockAt: u };
  });
}

/*
 * Migration des données persistées :
 *  - vieux format { entries } → enveloppé dans un premier tiers ;
 *  - contenu de chest avec `quantity` (nombre) → plage { min, max }.
 */
function migrateContent(c) {
  if (typeof c.min === 'number' && typeof c.max === 'number') return c;
  const q = typeof c.quantity === 'number' ? c.quantity : 1;
  const { quantity, ...rest } = c;
  return { ...rest, min: q, max: q };
}

function migrateEntry(e) {
  return e.kind === 'chest'
    ? { ...e, label: e.label ?? '', contents: (e.contents || []).map(migrateContent) }
    : e;
}

function migrateConfig(c) {
  const tiers =
    Array.isArray(c.tiers) && c.tiers.length > 0
      ? c.tiers
      : [{ id: genId('tier'), entries: Array.isArray(c.entries) ? c.entries : [] }];
  return {
    id: c.id,
    name: c.name,
    tiers: normalizeUnlocks(
      tiers.map((t) => ({
        id: t.id,
        unlockAt: t.unlockAt,
        entries: (t.entries || []).map(migrateEntry),
      }))
    ),
  };
}

// Classe les entrées de chaque tiers par weight décroissant (du plus grand au
// plus petit). Tri stable : à weight égal, l'ordre d'ajout est conservé.
function sortTiersByWeight(tiers) {
  return tiers.map((t) => ({
    ...t,
    entries: [...t.entries].sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0)),
  }));
}

function sortConfigByWeight(c) {
  return { ...c, tiers: sortTiersByWeight(c.tiers) };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (data && Array.isArray(data.configs)) {
      // Au chargement (reload), on présente déjà les tiers triés par weight.
      return {
        configs: data.configs.map(migrateConfig).map(sortConfigByWeight),
        currentId: data.currentId ?? null,
      };
    }
  } catch (e) {
    /* ignore */
  }
  return { configs: [], currentId: null };
}

/*
 * Gère plusieurs « configs » nommées. Chaque config contient un ou plusieurs
 * « tiers » (tableaux de loot), chacun avec ses entrées { ...item, weight }.
 * Le tout est persisté dans le localStorage.
 */
export function useLootConfigs() {
  const [state, setState] = useState(load);
  const { configs, currentId } = state;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* quota / mode privé : on ignore */
    }
  }, [state]);

  const current = useMemo(
    () => configs.find((c) => c.id === currentId) || null,
    [configs, currentId]
  );

  /* ---------- Configs ---------- */
  const createConfig = useCallback((name) => {
    const trimmed = (name || '').trim();
    if (!trimmed) return;
    const id = genId('cfg');
    setState((s) => ({
      configs: [...s.configs, { id, name: trimmed, tiers: normalizeUnlocks([newTier()]) }],
      currentId: id,
    }));
  }, []);

  const selectConfig = useCallback((id) => setState((s) => ({ ...s, currentId: id })), []);

  // Reclasse les entrées de tous les tiers par weight décroissant. Appelé à
  // l'entrée dans l'onglet Lootable (et au reload via load()) : on ne réordonne
  // pas en direct pendant l'édition pour éviter que les lignes sautent.
  const sortByWeight = useCallback(
    () => setState((s) => ({ ...s, configs: s.configs.map(sortConfigByWeight) })),
    []
  );

  // Renomme une config existante (ignore un nom vide).
  const renameConfig = useCallback((id, name) => {
    const trimmed = (name || '').trim();
    if (!trimmed) return;
    setState((s) => ({
      ...s,
      configs: s.configs.map((c) => (c.id === id ? { ...c, name: trimmed } : c)),
    }));
  }, []);

  const deleteConfig = useCallback((id) => {
    setState((s) => {
      const cfgs = s.configs.filter((c) => c.id !== id);
      const cur = s.currentId === id ? (cfgs[0]?.id ?? null) : s.currentId;
      return { configs: cfgs, currentId: cur };
    });
  }, []);

  // Applique fn() à la liste de tiers de la config courante.
  // On re-normalise toujours les seuils « block à miner » après modification.
  const updateTiers = useCallback((fn) => {
    setState((s) => ({
      ...s,
      configs: s.configs.map((c) =>
        c.id === s.currentId ? { ...c, tiers: normalizeUnlocks(fn(c.tiers)) } : c
      ),
    }));
  }, []);

  // Applique fn() aux entrées d'un tiers donné.
  const updateTierEntries = useCallback(
    (tierId, fn) =>
      updateTiers((tiers) =>
        tiers.map((t) => (t.id === tierId ? { ...t, entries: fn(t.entries) } : t))
      ),
    [updateTiers]
  );

  /* ---------- Tiers ---------- */
  const addTier = useCallback(() => updateTiers((tiers) => [...tiers, newTier()]), [updateTiers]);

  // Définit le seuil « block à miner » d'un tiers (normalisé ensuite : strictement
  // croissant ; le Tiers 1 reste à 0).
  const setTierUnlock = useCallback(
    (tierId, value) =>
      updateTiers((tiers) => tiers.map((t) => (t.id === tierId ? { ...t, unlockAt: value } : t))),
    [updateTiers]
  );

  const duplicateLastTier = useCallback(
    () =>
      updateTiers((tiers) => {
        const last = tiers[tiers.length - 1];
        const entries = last ? last.entries.map((e) => ({ ...e })) : [];
        return [...tiers, { id: genId('tier'), entries }];
      }),
    [updateTiers]
  );

  const deleteTier = useCallback(
    (tierId) => updateTiers((tiers) => (tiers.length > 1 ? tiers.filter((t) => t.id !== tierId) : tiers)),
    [updateTiers]
  );

  const clearTier = useCallback(
    (tierId) => updateTierEntries(tierId, () => []),
    [updateTierEntries]
  );

  /* ---------- Entrées d'un tiers ---------- */
  const addItem = useCallback(
    (tierId, item) =>
      updateTierEntries(tierId, (entries) =>
        entries.some((e) => e.kind !== 'chest' && entryKey(e) === entryKey(item))
          ? entries
          : [
              ...entries,
              {
                kind: 'item',
                name: item.name,
                displayName: item.displayName,
                icon: item.icon,
                category: item.category,
                tag: item.tag,
                stackSize: item.stackSize,
                weight: 1,
              },
            ]
      ),
    [updateTierEntries]
  );

  // Ajoute un chest (conteneur vide) au tiers.
  const addChest = useCallback(
    (tierId) =>
      updateTierEntries(tierId, (entries) => [
        ...entries,
        { kind: 'chest', id: genId('chest'), label: '', weight: 1, contents: [] },
      ]),
    [updateTierEntries]
  );

  // Retire une entrée (item ou chest) du tiers.
  const removeEntry = useCallback(
    (tierId, entry) =>
      updateTierEntries(tierId, (entries) => entries.filter((e) => entryId(e) !== entryId(entry))),
    [updateTierEntries]
  );

  // Modifie le weight d'une entrée (item ou chest).
  const setWeight = useCallback(
    (tierId, entry, weight) =>
      updateTierEntries(tierId, (entries) =>
        entries.map((e) => (entryId(e) === entryId(entry) ? { ...e, weight } : e))
      ),
    [updateTierEntries]
  );

  // Y a-t-il déjà cet item (entrée simple) dans le tiers ? (pour le picker)
  const hasItem = useCallback(
    (tierId, item) => {
      const tier = current?.tiers.find((t) => t.id === tierId);
      return !!tier && tier.entries.some((e) => e.kind !== 'chest' && entryKey(e) === entryKey(item));
    },
    [current]
  );

  /* ---------- Contenu d'un chest ---------- */
  const updateChest = useCallback(
    (tierId, chestId, fn) =>
      updateTierEntries(tierId, (entries) =>
        entries.map((e) =>
          e.kind === 'chest' && e.id === chestId ? { ...e, contents: fn(e.contents) } : e
        )
      ),
    [updateTierEntries]
  );

  const addChestItem = useCallback(
    (tierId, chestId, item) =>
      updateChest(tierId, chestId, (contents) =>
        contents.some((c) => entryKey(c) === entryKey(item))
          ? contents
          : [
              ...contents,
              {
                name: item.name,
                displayName: item.displayName,
                icon: item.icon,
                category: item.category,
                tag: item.tag,
                stackSize: item.stackSize,
                min: 1,
                max: 1,
              },
            ]
      ),
    [updateChest]
  );

  const removeChestItem = useCallback(
    (tierId, chestId, item) =>
      updateChest(tierId, chestId, (contents) =>
        contents.filter((c) => entryKey(c) !== entryKey(item))
      ),
    [updateChest]
  );

  const setChestRange = useCallback(
    (tierId, chestId, item, min, max) =>
      updateChest(tierId, chestId, (contents) =>
        contents.map((c) => (entryKey(c) === entryKey(item) ? { ...c, min, max } : c))
      ),
    [updateChest]
  );

  // Nom personnalisé d'un chest (utilisé pour l'export loot_table: path/to/<nom>).
  const setChestLabel = useCallback(
    (tierId, chestId, label) =>
      updateTierEntries(tierId, (entries) =>
        entries.map((e) => (e.kind === 'chest' && e.id === chestId ? { ...e, label } : e))
      ),
    [updateTierEntries]
  );

  return {
    configs,
    current,
    createConfig,
    selectConfig,
    sortByWeight,
    renameConfig,
    deleteConfig,
    addTier,
    duplicateLastTier,
    deleteTier,
    clearTier,
    setTierUnlock,
    addItem,
    addChest,
    removeEntry,
    setWeight,
    hasItem,
    addChestItem,
    removeChestItem,
    setChestRange,
    setChestLabel,
  };
}
