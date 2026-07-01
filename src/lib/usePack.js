import { useCallback, useEffect, useState } from 'react';
import { parsePack } from './pack.js';
import { loadPack, savePack, clearPack } from './packStore.js';

/*
 * Gère le pack Bedrock importé (un seul, persistant). Au montage, on recharge le
 * pack précédemment lié depuis IndexedDB. `importPack` analyse un zip et le lie
 * (remplace l'éventuel pack existant) ; `removePack` le retire.
 */
export function usePack() {
  const [pack, setPack] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    loadPack()
      .then((p) => {
        if (alive && p) setPack(p);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const importPack = useCallback(async (file) => {
    setStatus('loading');
    setError(null);
    try {
      const parsed = await parsePack(file);
      if (parsed.count === 0) throw new Error('aucun bloc/item custom trouvé dans ce pack');
      setPack(parsed);
      setStatus('idle');
      try {
        await savePack(parsed);
      } catch (e) {
        /* stockage indisponible : on garde le pack en mémoire pour la session */
      }
    } catch (e) {
      setError(e.message || 'lecture impossible');
      setStatus('error');
    }
  }, []);

  const removePack = useCallback(async () => {
    setPack(null);
    setError(null);
    setStatus('idle');
    try {
      await clearPack();
    } catch (e) {
      /* ignore */
    }
  }, []);

  return { pack, status, error, importPack, removePack };
}
