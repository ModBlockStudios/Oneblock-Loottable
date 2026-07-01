import { useEffect, useMemo, useRef, useState } from 'react';
import CatalogRow from './CatalogRow.jsx';
import { iconUrl } from '../lib/icon.js';

const BATCH = 150; // lignes ajoutées par lot (scroll infini)

/*
 * Tableau du catalogue avec rendu incrémental. `rows` est une liste de lignes :
 * item seul ({ type:'item' }) ou groupe de bois ({ type:'group' }) repliable et
 * représenté par ses feuilles. On aplatit en insérant les membres des groupes
 * dépliés, puis on n'affiche qu'un sous-ensemble étendu au scroll.
 */
export default function CatalogTable({ rows, usage, onCopy, onTagClick }) {
  const [visible, setVisible] = useState(BATCH);
  const [expanded, setExpanded] = useState(() => new Set());
  const sentinelRef = useRef(null);

  // Réinitialise rendu + replis quand la liste (filtre) change.
  useEffect(() => {
    setVisible(BATCH);
    setExpanded(new Set());
  }, [rows]);

  const display = useMemo(() => {
    const out = [];
    for (const r of rows) {
      if (r.type === 'group') {
        out.push(r);
        if (expanded.has(r.prefix)) for (const m of r.members) out.push({ type: 'member', item: m });
      } else {
        out.push(r);
      }
    }
    return out;
  }, [rows, expanded]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible((v) => (v < display.length ? v + BATCH : v));
        }
      },
      { rootMargin: '700px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [display.length]);

  const toggle = (prefix) =>
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(prefix)) n.delete(prefix);
      else n.add(prefix);
      return n;
    });

  const usedFor = (it) => (usage ? usage.get(it.name + '|' + it.displayName) : undefined);

  if (rows.length === 0) {
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
              <th className="col-used" title="Nombre de configs Loot Table qui l'utilisent">
                Utilisé
              </th>
            </tr>
          </thead>
          <tbody>
            {display.slice(0, visible).map((r) => {
              if (r.type === 'group') {
                const isOpen = expanded.has(r.prefix);
                const iconSrc = iconUrl(r.leaves.icon);
                return (
                  <tr
                    key={'g:' + r.prefix}
                    className="wood-group"
                    onClick={() => toggle(r.prefix)}
                    aria-expanded={isOpen}
                    title={isOpen ? 'Replier le set' : 'Dérouler le set'}
                  >
                    <td className="col-icon">
                      {iconSrc ? (
                        <img className="cell-icon" src={iconSrc} alt="" loading="lazy" decoding="async" />
                      ) : (
                        <span className="cell-icon cell-icon--missing" />
                      )}
                    </td>
                    <td className="cell-name">
                      <span className="wood-group__caret">{isOpen ? '▾' : '▸'}</span> {r.label}
                    </td>
                    <td className="cell-id" colSpan={6}>
                      <span className="wood-group__badge">set de bois · {r.members.length} blocs</span>
                    </td>
                  </tr>
                );
              }
              return (
                <CatalogRow
                  key={r.item.name + '|' + r.item.displayName}
                  item={r.item}
                  usedIn={usedFor(r.item)}
                  nested={r.type === 'member'}
                  onCopy={onCopy}
                  onTagClick={onTagClick}
                />
              );
            })}
          </tbody>
        </table>
      </div>
      <div ref={sentinelRef} className="sentinel" />
    </>
  );
}
