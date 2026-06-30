import { useEffect, useState } from 'react';
import { APP_INFO } from '../version.js';

/*
 * Charge le catalogue généré (public/data/items.json).
 * Renvoie l'état de chargement, les données et d'éventuelles erreurs.
 */
export function useCatalog() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    items: [],
    edition: '',
    version: '',
  });

  useEffect(() => {
    let alive = true;
    const url =
      import.meta.env.BASE_URL + 'data/items.json?v=' + APP_INFO.version;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then((data) => {
        if (!alive) return;
        setState({
          loading: false,
          error: null,
          items: data.items || [],
          edition: data.edition || '',
          version: data.version || '',
        });
      })
      .catch((err) => {
        if (!alive) return;
        setState((s) => ({ ...s, loading: false, error: err.message }));
      });

    return () => {
      alive = false;
    };
  }, []);

  return state;
}
