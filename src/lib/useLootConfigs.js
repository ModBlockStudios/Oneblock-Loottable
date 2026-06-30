import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'oneblock-loottable:configs:v1';

// Clé unique d'une entrée (name peut être partagé, ex. banner/bed → on ajoute displayName).
export const entryKey = (it) => it.name + '|' + it.displayName;

function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'cfg_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (data && Array.isArray(data.configs)) return data;
  } catch (e) {
    /* ignore */
  }
  return { configs: [], currentId: null };
}

/*
 * Gère plusieurs « configs » de loot table nommées, chacune avec sa liste
 * d'entrées { ...item, weight }. Persiste le tout dans le localStorage.
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

  const createConfig = useCallback((name) => {
    const trimmed = (name || '').trim();
    if (!trimmed) return;
    const id = genId();
    setState((s) => ({
      configs: [...s.configs, { id, name: trimmed, entries: [] }],
      currentId: id,
    }));
  }, []);

  const selectConfig = useCallback((id) => {
    setState((s) => ({ ...s, currentId: id }));
  }, []);

  const deleteConfig = useCallback((id) => {
    setState((s) => {
      const configs = s.configs.filter((c) => c.id !== id);
      const currentId = s.currentId === id ? (configs[0]?.id ?? null) : s.currentId;
      return { configs, currentId };
    });
  }, []);

  // Met à jour les entrées de la config courante.
  const updateCurrent = useCallback((fn) => {
    setState((s) => ({
      ...s,
      configs: s.configs.map((c) =>
        c.id === s.currentId ? { ...c, entries: fn(c.entries) } : c
      ),
    }));
  }, []);

  const addItem = useCallback(
    (item) => {
      updateCurrent((entries) =>
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
      );
    },
    [updateCurrent]
  );

  const removeItem = useCallback(
    (item) => updateCurrent((entries) => entries.filter((e) => entryKey(e) !== entryKey(item))),
    [updateCurrent]
  );

  const setWeight = useCallback(
    (item, weight) =>
      updateCurrent((entries) =>
        entries.map((e) => (entryKey(e) === entryKey(item) ? { ...e, weight } : e))
      ),
    [updateCurrent]
  );

  const clearCurrent = useCallback(() => updateCurrent(() => []), [updateCurrent]);

  const hasItem = useCallback(
    (item) => !!current && current.entries.some((e) => entryKey(e) === entryKey(item)),
    [current]
  );

  return {
    configs,
    current,
    createConfig,
    selectConfig,
    deleteConfig,
    addItem,
    removeItem,
    setWeight,
    clearCurrent,
    hasItem,
  };
}
