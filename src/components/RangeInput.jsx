import { useEffect, useState } from 'react';

/*
 * Plage de quantité « min – max » (entiers ≥ 1). Saisie fluide via état local,
 * normalisation à la sortie (max ≥ min).
 */
export default function RangeInput({ min, max, onChange }) {
  const [lo, setLo] = useState(String(min));
  const [hi, setHi] = useState(String(max));

  useEffect(() => setLo(String(min)), [min]);
  useEffect(() => setHi(String(max)), [max]);

  const toInt = (s) => {
    const n = parseInt(s, 10);
    return Number.isNaN(n) || n < 1 ? 1 : n;
  };

  const commit = () => {
    const a = toInt(lo);
    const b = Math.max(a, toInt(hi)); // max ≥ min
    setLo(String(a));
    setHi(String(b));
    onChange(a, b);
  };

  // Mise à jour live (sans forcer max ≥ min pendant la frappe).
  const live = (loStr, hiStr) => {
    const a = parseInt(loStr, 10);
    const b = parseInt(hiStr, 10);
    if (!Number.isNaN(a) && a >= 1 && !Number.isNaN(b) && b >= 1) onChange(a, b);
  };

  return (
    <div className="range-input" onClick={(e) => e.stopPropagation()}>
      <input
        type="number"
        min="1"
        step="1"
        className="weight-input range-input__field"
        value={lo}
        aria-label="Quantité minimale"
        onChange={(e) => {
          setLo(e.target.value);
          live(e.target.value, hi);
        }}
        onBlur={commit}
      />
      <span className="range-input__sep">–</span>
      <input
        type="number"
        min="1"
        step="1"
        className="weight-input range-input__field"
        value={hi}
        aria-label="Quantité maximale"
        onChange={(e) => {
          setHi(e.target.value);
          live(lo, e.target.value);
        }}
        onBlur={commit}
      />
    </div>
  );
}
