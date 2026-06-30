import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'oneblock-loottable:configs:v1';

// Clé unique d'une entrée (name peut être partagé, ex. banner/bed → on ajoute displayName).
export const entryKey = (it) => it.name + '|' + it.displayName;

function genId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return prefix + '_' + crypto.randomUUID();
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const newTier = () => ({ id: genId('tier'), entries: [] });

// Migration : une config peut être au vieux format { entries } → on l'enveloppe
// dans un premier tiers. On garantit toujours au moins un tiers.
function migrateConfig(c) {
  if (Array.isArray(c.tiers) && c.tiers.length > 0) return c;
  const entries = Array.isArray(c.entries) ? c.entries : [];
  return { id: c.id, name: c.name, tiers: [{ id: genId('tier'), entries }] };
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
        entries.some((e) => entryKey(e) === entryKey(item))
          ? entries
          : [
              ...entries,
              {
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

  const removeItem = useCallback(
    (tierId, item) =>
      updateTierEntries(tierId, (entries) => entries.filter((e) => entryKey(e) !== entryKey(item))),
    [updateTierEntries]
  );

  const setWeight = useCallback(
    (tierId, item, weight) =>
      updateTierEntries(tierId, (entries) =>
        entries.map((e) => (entryKey(e) === entryKey(item) ? { ...e, weight } : e))
      ),
    [updateTierEntries]
  );

  const hasItem = useCallback(
    (tierId, item) => {
      const tier = current?.tiers.find((t) => t.id === tierId);
      return !!tier && tier.entries.some((e) => entryKey(e) === entryKey(item));
    },
    [current]
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
    removeItem,
    setWeight,
    hasItem,
  };
}
