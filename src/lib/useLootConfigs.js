import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchSharedConfigs } from './sharedConfigs.js';
import { qualify } from './ids.js';

const STORAGE_KEY = 'oneblock-loottable:configs:v1';

// Préfixe d'id des configs partagées (chargées depuis GitHub, non persistées).
const SHARED_PREFIX = 'shared:';

// Clé d'un item (name peut être partagé, ex. banner/bed → on ajoute displayName).
export const entryKey = (it) => it.name + '|' + it.displayName;

// Identité d'une entrée de tiers : item, chest (conteneur) ou groupe (réutilisable).
export const entryId = (e) =>
  e.kind === 'chest' ? 'c:' + e.id : e.kind === 'group' ? 'g:' + e.groupId : 'i:' + entryKey(e);

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

// Bibliothèque de groupes réutilisables (blocs + weight interne à chaque bloc).
function migrateGroup(g) {
  return {
    id: g.id || genId('group'),
    name: g.name ?? '',
    blocks: (g.blocks || []).map((b) => ({ ...b, weight: b.weight ?? 1 })),
  };
}

function migrateConfig(c) {
  const tiers =
    Array.isArray(c.tiers) && c.tiers.length > 0
      ? c.tiers
      : [{ id: genId('tier'), entries: Array.isArray(c.entries) ? c.entries : [] }];
  return {
    id: c.id,
    name: c.name,
    groups: Array.isArray(c.groups) ? c.groups.map(migrateGroup) : [],
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

// Réhydrate les champs d'affichage (nom, icône, catégorie…) depuis le catalogue
// à partir du seul identifiant. `src` peut déjà les contenir (ancien format) :
// on les garde alors en repli. `extra` = champs propres à l'entrée/au contenu.
function enrichFields(src, byName, extra) {
  const it = byName && byName.get(src.name);
  return {
    name: src.name,
    displayName: src.displayName ?? it?.displayName ?? src.name,
    icon: src.icon ?? it?.icon ?? null,
    category: src.category ?? it?.category,
    tag: src.tag ?? it?.tag,
    stackSize: src.stackSize ?? it?.stackSize,
    ...extra,
  };
}

function enrichEntry(e, byName) {
  if (e.kind === 'chest') {
    return {
      kind: 'chest',
      id: e.id || genId('chest'),
      label: e.label ?? '',
      weight: e.weight ?? 1,
      contents: (e.contents || []).map((c) =>
        enrichFields(c, byName, { min: c.min ?? 1, max: c.max ?? 1 })
      ),
    };
  }
  return enrichFields(e, byName, { kind: 'item', weight: e.weight ?? 1 });
}

/* ---- Lecture du format plugin (phases + loot_tables) ---- */
const stripNs = (n) => (typeof n === 'string' ? n.replace(/^minecraft:/, '') : n);
const pathToLabel = (p) => (typeof p === 'string' ? p.replace(/^path\/to\//, '') : '');

// Un « block » de phase → entrée interne (item ou coffre), réhydraté du catalogue.
function blockToEntry(block, lootTables, byName) {
  const id = stripNs(block.name);
  if (id === 'chest') {
    const path = block.loot_table || '';
    const contents = (lootTables[path] || []).map((c) =>
      enrichFields({ name: stripNs(c.name) }, byName, { min: c.min ?? 1, max: c.max ?? 1 })
    );
    return { kind: 'chest', id: genId('chest'), label: pathToLabel(path), weight: block.weight ?? 1, contents };
  }
  return enrichFields({ name: id }, byName, { kind: 'item', weight: block.weight ?? 1 });
}

// Format plugin { phases, loot_tables, groups, tier_groups } → { tiers, groups }.
// Les groupes sont reconstruits depuis `groups`/`tier_groups` ; les blocs des
// phases qui proviennent d'un groupe (name @ weight×weight) sont retirés pour ne
// pas être dupliqués en entrées « item ».
function pluginToConfig(data, byName) {
  const phases = Array.isArray(data.phases) ? data.phases : [];
  const lootTables = data.loot_tables && typeof data.loot_tables === 'object' ? data.loot_tables : {};

  const defs = data.groups && typeof data.groups === 'object' ? data.groups : {};
  const groups = [];
  const idByName = new Map();
  for (const [name, blocks] of Object.entries(defs)) {
    const id = genId('group');
    idByName.set(name, id);
    groups.push({
      id,
      name,
      blocks: (Array.isArray(blocks) ? blocks : []).map((b) =>
        enrichFields({ name: stripNs(b.name) }, byName, { weight: b.weight ?? 1 })
      ),
    });
  }
  const groupById = new Map(groups.map((g) => [g.id, g]));
  const tierGroups = Array.isArray(data.tier_groups) ? data.tier_groups : [];

  const tiers = phases.map((ph, i) => {
    const refs = (tierGroups[i] || [])
      .filter((r) => idByName.has(r.group))
      .map((r) => ({ groupId: idByName.get(r.group), weight: r.weight ?? 1 }));

    // Multiset des blocs (name @ poids final) issus des groupes → à soustraire.
    const derived = new Map();
    for (const r of refs) {
      const g = groupById.get(r.groupId);
      if (!g) continue;
      for (const b of g.blocks) {
        const key = qualify(b.name) + '@' + (r.weight || 0) * (b.weight || 0);
        derived.set(key, (derived.get(key) || 0) + 1);
      }
    }

    const entries = [];
    for (const block of ph.blocks || []) {
      const id = stripNs(block.name);
      if (id === 'chest') {
        entries.push(blockToEntry(block, lootTables, byName));
        continue;
      }
      const key = qualify(id) + '@' + (block.weight ?? 0);
      const n = derived.get(key) || 0;
      if (n > 0) {
        derived.set(key, n - 1); // bloc issu d'un groupe : ignoré côté « item »
        continue;
      }
      entries.push(enrichFields({ name: id }, byName, { kind: 'item', weight: block.weight ?? 1 }));
    }
    for (const r of refs) entries.push({ kind: 'group', groupId: r.groupId, weight: r.weight });

    return { id: genId('tier'), unlockAt: i === 0 ? 0 : ph.blockstobreak, entries };
  });

  return { tiers, groups };
}

// Construit une config « partagée » (lecture depuis GitHub) à partir d'un
// fichier { file, data }. L'id est dérivé du nom de fichier (stable) et marqué
// partagé : ces configs ne sont pas persistées dans le localStorage. Les entrées
// (id + weight seulement) sont réhydratées depuis le catalogue `byName`.
function toSharedConfig({ file, data }, byName) {
  const base = file.replace(/\.json$/i, '');
  let tiers;
  let groups = [];
  if (data && Array.isArray(data.phases)) {
    // Format plugin (celui du dev) : phases + loot_tables + groups/tier_groups.
    const res = pluginToConfig(data, byName);
    tiers = res.tiers;
    groups = res.groups;
  } else {
    // Repli : ancien format interne { tiers | entries }.
    const rawTiers = (data && (data.tiers || (data.entries ? [{ entries: data.entries }] : []))) || [];
    tiers = rawTiers.map((t) => ({
      id: t.id || genId('tier'),
      unlockAt: t.unlockAt,
      entries: (t.entries || []).map((e) => enrichEntry(e, byName)),
    }));
    groups = Array.isArray(data?.groups) ? data.groups.map(migrateGroup) : [];
  }
  const config = {
    id: SHARED_PREFIX + base,
    name: (data && data.name) || base,
    groups,
    tiers: normalizeUnlocks(tiers),
  };
  return { ...sortConfigByWeight(config), shared: true, file };
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
export function useLootConfigs(catalogItems) {
  const [state, setState] = useState(load);
  const { configs, currentId } = state;
  const sharedLoadedRef = useRef(false);

  // Persistance : on ne garde QUE les configs perso (non partagées). Les configs
  // partagées viennent de GitHub et sont rechargées à chaque reload.
  useEffect(() => {
    try {
      const localConfigs = configs.filter((c) => !c.shared);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ configs: localConfigs, currentId }));
    } catch (e) {
      /* quota / mode privé : on ignore */
    }
  }, [configs, currentId]);

  // Chargement des configs partagées (GitHub), une seule fois, dès que le
  // catalogue est disponible (nécessaire pour réhydrater nom/icône depuis l'id).
  // Elles sont ajoutées en tête, devant les configs perso.
  useEffect(() => {
    if (sharedLoadedRef.current) return;
    if (!catalogItems || catalogItems.length === 0) return;
    sharedLoadedRef.current = true;
    let cancelled = false;
    const byName = new Map(catalogItems.map((it) => [it.name, it]));
    fetchSharedConfigs(import.meta.env.BASE_URL).then((list) => {
      if (cancelled || list.length === 0) return;
      const shared = list.map((f) => toSharedConfig(f, byName));
      setState((s) => {
        const local = s.configs.filter((c) => !c.shared);
        const merged = [...shared, ...local];
        const currentOk = s.currentId && merged.some((c) => c.id === s.currentId);
        return { configs: merged, currentId: currentOk ? s.currentId : merged[0]?.id ?? null };
      });
    });
    return () => {
      cancelled = true;
    };
  }, [catalogItems]);

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
      configs: [...s.configs, { id, name: trimmed, groups: [], tiers: normalizeUnlocks([newTier()]) }],
      currentId: id,
    }));
  }, []);

  const selectConfig = useCallback((id) => setState((s) => ({ ...s, currentId: id })), []);

  // Reclasse les entrées de tous les tiers par weight décroissant. Appelé à
  // l'entrée dans l'onglet Loot Table (et au reload via load()) : on ne réordonne
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

  // Multiplie par 2 tous les weights de la config courante (items et coffres).
  const doubleWeights = useCallback(
    () =>
      updateTiers((tiers) =>
        tiers.map((t) => ({
          ...t,
          entries: t.entries.map((e) => ({ ...e, weight: (e.weight || 0) * 2 })),
        }))
      ),
    [updateTiers]
  );

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

  /* ---------- Groupes réutilisables (bibliothèque de la config) ---------- */
  // Applique fn(config) à la config courante.
  const updateCurrent = useCallback((fn) => {
    setState((s) => ({
      ...s,
      configs: s.configs.map((c) => (c.id === s.currentId ? fn(c) : c)),
    }));
  }, []);

  const groupRef = (groupId) => ({ kind: 'group', groupId, weight: 1 });

  // Crée un groupe (nommé) et l'ajoute au tiers courant.
  const createGroupInTier = useCallback(
    (tierId, name) => {
      const id = genId('group');
      updateCurrent((c) => ({
        ...c,
        groups: [...(c.groups || []), { id, name: (name || '').trim() || 'Groupe', blocks: [] }],
        tiers: c.tiers.map((t) =>
          t.id === tierId ? { ...t, entries: [...t.entries, groupRef(id)] } : t
        ),
      }));
    },
    [updateCurrent]
  );

  // Ajoute une référence à un groupe existant au tiers (une seule fois par tiers).
  const addGroupToTier = useCallback(
    (tierId, groupId) =>
      updateCurrent((c) => ({
        ...c,
        tiers: c.tiers.map((t) =>
          t.id === tierId && !t.entries.some((e) => e.kind === 'group' && e.groupId === groupId)
            ? { ...t, entries: [...t.entries, groupRef(groupId)] }
            : t
        ),
      })),
    [updateCurrent]
  );

  const renameGroup = useCallback(
    (groupId, name) =>
      updateCurrent((c) => ({
        ...c,
        groups: (c.groups || []).map((g) => (g.id === groupId ? { ...g, name } : g)),
      })),
    [updateCurrent]
  );

  // Supprime un groupe de la bibliothèque ET toutes ses références dans les tiers.
  const deleteGroup = useCallback(
    (groupId) =>
      updateCurrent((c) => ({
        ...c,
        groups: (c.groups || []).filter((g) => g.id !== groupId),
        tiers: c.tiers.map((t) => ({
          ...t,
          entries: t.entries.filter((e) => !(e.kind === 'group' && e.groupId === groupId)),
        })),
      })),
    [updateCurrent]
  );

  const updateGroupBlocks = useCallback(
    (groupId, fn) =>
      updateCurrent((c) => ({
        ...c,
        groups: (c.groups || []).map((g) => (g.id === groupId ? { ...g, blocks: fn(g.blocks) } : g)),
      })),
    [updateCurrent]
  );

  // Ajoute un bloc au groupe (weight interne 1). Uniquement des blocs.
  const addGroupBlock = useCallback(
    (groupId, item) =>
      updateGroupBlocks(groupId, (blocks) =>
        blocks.some((b) => entryKey(b) === entryKey(item))
          ? blocks
          : [
              ...blocks,
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
    [updateGroupBlocks]
  );

  const removeGroupBlock = useCallback(
    (groupId, item) =>
      updateGroupBlocks(groupId, (blocks) => blocks.filter((b) => entryKey(b) !== entryKey(item))),
    [updateGroupBlocks]
  );

  const setGroupBlockWeight = useCallback(
    (groupId, item, weight) =>
      updateGroupBlocks(groupId, (blocks) =>
        blocks.map((b) => (entryKey(b) === entryKey(item) ? { ...b, weight } : b))
      ),
    [updateGroupBlocks]
  );

  // Cet item est-il déjà dans le groupe ? (pour le picker de l'éditeur de groupe)
  const hasGroupBlock = useCallback(
    (groupId, item) => {
      const g = current?.groups?.find((x) => x.id === groupId);
      return !!g && g.blocks.some((b) => entryKey(b) === entryKey(item));
    },
    [current]
  );

  return {
    configs,
    current,
    createConfig,
    selectConfig,
    sortByWeight,
    renameConfig,
    doubleWeights,
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
    createGroupInTier,
    addGroupToTier,
    renameGroup,
    deleteGroup,
    addGroupBlock,
    removeGroupBlock,
    setGroupBlockWeight,
    hasGroupBlock,
  };
}
