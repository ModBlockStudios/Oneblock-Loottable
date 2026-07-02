import { useEffect, useState } from 'react';
import { weightForPercent } from '../lib/chance.js';

// Affichage du % courant (1 décimale max, sans zéros superflus).
function fmt(pct) {
  if (!Number.isFinite(pct)) return '—';
  return String(Math.round(pct * 10) / 10);
}

/*
 * Champ « Chance (%) » éditable, lié au weight : éditer le % recalcule le weight
 * de l'entrée pour atteindre ce %, en laissant les autres entrées inchangées.
 * `total` = somme des weights du tiers (ou du groupe). onChange(newWeight).
 */
export default function PercentInput({ weight, total, onChange }) {
  const pct = total > 0 ? (weight / total) * 100 : 0;
  const [local, setLocal] = useState(fmt(pct));

  useEffect(() => {
    setLocal(fmt(pct));
  }, [pct]);

  const commit = () => {
    const p = parseFloat(String(local).replace(',', '.'));
    if (Number.isNaN(p)) {
      setLocal(fmt(pct));
      return;
    }
    onChange(weightForPercent(p, total, weight));
  };

  if (!(total > 0)) return <span className="cell-chance">—</span>;

  return (
    <span className="percent-cell" onClick={(e) => e.stopPropagation()}>
      <input
        type="number"
        min="0"
        max="100"
        step="any"
        className="weight-input percent-input"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
      />
      <span className="percent-suffix">%</span>
    </span>
  );
}
