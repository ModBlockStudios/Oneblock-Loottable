import { useEffect, useState } from 'react';

/*
 * Champ « weight » éditable. État local pour permettre une saisie fluide
 * (y compris vide temporairement) ; on normalise (entier >= 1) à la sortie.
 */
export default function WeightInput({ value, onChange }) {
  const [local, setLocal] = useState(String(value));

  useEffect(() => {
    setLocal(String(value));
  }, [value]);

  const commit = () => {
    const n = parseInt(local, 10);
    const v = Number.isNaN(n) || n < 1 ? 1 : n;
    setLocal(String(v));
    onChange(v);
  };

  return (
    <input
      type="number"
      min="1"
      step="1"
      className="weight-input"
      value={local}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        const v = e.target.value;
        setLocal(v);
        const n = parseInt(v, 10);
        if (!Number.isNaN(n) && n >= 1) onChange(n);
      }}
      onBlur={commit}
    />
  );
}
