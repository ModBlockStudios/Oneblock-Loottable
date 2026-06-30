import { useEffect, useState, useCallback } from 'react';

/*
 * Routage minimal par hash (#/table, #/lootable).
 * Compatible GitHub Pages (pas de config serveur) + bouton retour navigateur.
 */
export function useHashRoute(defaultRoute) {
  const parse = () => window.location.hash.replace(/^#\/?/, '') || defaultRoute;
  const [route, setRoute] = useState(parse);

  useEffect(() => {
    const onHash = () => setRoute(parse());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = useCallback((r) => {
    window.location.hash = '/' + r;
  }, []);

  return [route, navigate];
}
