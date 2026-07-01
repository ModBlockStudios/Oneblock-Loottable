import { useEffect, useRef, useState } from 'react';
import CatalogRow from './CatalogRow.jsx';

const BATCH = 150; // lignes ajoutées par lot (scroll infini)

/*
 * Tableau du catalogue avec rendu incrémental : on n'affiche qu'un sous-ensemble
 * des lignes, étendu quand la sentinelle entre dans le viewport.
 */
export default function CatalogTable({ items, usage, onCopy, onTagClick }) {
  const [visible, setVisible] = useState(BATCH);
  const sentinelRef = useRef(null);

  // Réinitialise le rendu quand la liste filtrée change.
  useEffect(() => {
    setVisible(BATCH);
  }, [items]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible((v) => (v < items.length ? v + BATCH : v));
        }
      },
      { rootMargin: '700px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [items.length]);

  if (items.length === 0) {
    return <div className="empty">Aucun résultat pour cette recherche.</div>;
  }

  return (
    <>
      <div className="table-wrap">
        <table className="catalog">
          <thead>
            <tr>
              <th className="col-icon" />
              <th className="col-name">Nom</th>
              <th className="col-id">Identifiant</th>
              <th className="col-cat">Catégorie</th>
              <th className="col-tag">Tag</th>
              <th className="col-mine">Minage</th>
              <th className="col-stack">Pile</th>
              <th className="col-used" title="Nombre de configs lootable qui l'utilisent">
                Utilisé
              </th>
            </tr>
          </thead>
          <tbody>
            {items.slice(0, visible).map((it) => (
              <CatalogRow
                key={it.name + '|' + it.displayName}
                item={it}
                used={usage ? usage.get(it.name + '|' + it.displayName) || 0 : 0}
                onCopy={onCopy}
                onTagClick={onTagClick}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div ref={sentinelRef} className="sentinel" />
    </>
  );
}
