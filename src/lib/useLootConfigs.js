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
  return e.kind === 'chest' ? { ...e, contents: (e.contents || []).map(migrateContent) } : e;
}

function migrateConfig(c) {
  const tiers =
    Array.isArray(c.tiers) && c.tiers.length > 0
      ? c.tiers
      : [{ id: genId('tier'), entries: Array.isArray(c.entries) ? c.entries : [] }];
  return {
    id: c.id,
    name: c.name,
    tiers: tiers.map((t) => ({ id: t.id, entries: (t.entries || []).map(migrateEntry) })),
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (data && Array.isArray(data.configs)) {
      return { configs: data.configs.map(migrateConfig), currentId: data.currentId ?? null };
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
      configs: [...s.configs, { id, name: trimmed, tiers: [newTier()] }],
      currentId: id,
    }));
  }, []);

  const selectConfig = useCallback((id) => setState((s) => ({ ...s, currentId: id })), []);

  const deleteConfig = useCallback((id) => {
    setState((s) => {
      const cfgs = s.configs.filter((c) => c.id !== id);
      const cur = s.currentId === id ? (cfgs[0]?.id ?? null) : s.currentId;
      return { configs: cfgs, currentId: cur };
    });
  }, []);

  // Applique fn() à la liste de tiers de la config courante.
  const updateTiers = useCallback((fn) => {
    setState((s) => ({
      ...s,
      configs: s.configs.map((c) => (c.id === s.currentId ? { ...c, tiers: fn(c.tiers) } : c)),
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
        { kind: 'chest', id: genId('chest'), weight: 1, contents: [] },
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

  return {
    configs,
    current,
    createConfig,
    selectConfig,
    deleteConfig,
    addTier,
    duplicateLastTier,
    deleteTier,
    clearTier,
    addItem,
    addChest,
    removeEntry,
    setWeight,
    hasItem,
    addChestItem,
    removeChestItem,
    setChestRange,
  };
}
