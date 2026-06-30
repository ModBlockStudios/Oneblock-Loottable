import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'oneblock-loottable:selection';

// Clé unique d'une entrée (name peut être partagé, ex. banner/bed → on ajoute displayName).
export const lootKey = (it) => it.name + '|' + it.displayName;

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/*
 * Gère la sélection de la loot table (liste d'items choisis depuis le catalogue),
 * persistée dans le localStorage pour survivre aux rechargements.
 */
export function useLootTable() {
  const [entries, setEntries] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      /* quota / mode privé : on ignore */
    }
  }, [entries]);

  const has = useCallback(
    (item) => entries.some((e) => lootKey(e) === lootKey(item)),
    [entries]
  );

  const add = useCallback((item) => {
    setEntries((cur) =>
      cur.some((e) => lootKey(e) === lootKey(item))
        ? cur
        : [
            ...cur,
            {
              name: item.name,
              displayName: item.displayName,
              icon: item.icon,
              category: item.category,
              tag: item.tag,
              stackSize: item.stackSize,
            },
          ]
    );
  }, []);

  const remove = useCallback((item) => {
    setEntries((cur) => cur.filter((e) => lootKey(e) !== lootKey(item)));
  }, []);

  const toggle = useCallback((item) => {
    setEntries((cur) =>
      cur.some((e) => lootKey(e) === lootKey(item))
        ? cur.filter((e) => lootKey(e) !== lootKey(item))
        : [...cur, { ...item }]
    );
  }, []);

  const clear = useCallback(() => setEntries([]), []);

  return { entries, has, add, remove, toggle, clear };
}
