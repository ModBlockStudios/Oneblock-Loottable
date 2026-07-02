import { useEffect, useState } from 'react';

// Normalise un weight : nombre >= 0 (décimales autorisées, ex. via l'édition du
// %), arrondi à 3 décimales ; saisie invalide → 1.
function norm(str) {
  const n = parseFloat(String(str).replace(',', '.'));
  if (Number.isNaN(n)) return 1;
  return Math.round(Math.max(0, n) * 1000) / 1000;
}

/*
 * Champ « weight » éditable. État local pour une saisie fluide ; on normalise à
 * la sortie. Les décimales sont autorisées (les groupes / l'édition du % en
 * produisent).
 */
export default function WeightInput({ value, onChange }) {
  const [local, setLocal] = useState(String(value));

  useEffect(() => {
    setLocal(String(value));
  }, [value]);

  const commit = () => {
    const v = norm(local);
    setLocal(String(v));
    onChange(v);
  };

  return (
    <input
      type="number"
      min="0"
      step="any"
      className="weight-input"
      value={local}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        const v = e.target.value;
        setLocal(v);
        const n = parseFloat(v.replace(',', '.'));
        if (!Number.isNaN(n) && n >= 0) onChange(Math.round(n * 1000) / 1000);
      }}
      onBlur={commit}
    />
  );
}
