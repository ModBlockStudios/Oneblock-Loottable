import { useEffect, useState } from 'react';

/*
 * Champ « block à miner » d'un tiers. Saisie fluide via état local ; la
 * validation (entier, strictement croissant) est appliquée par le hook, donc
 * la valeur affichée se recale sur la valeur normalisée du store.
 */
export default function UnlockInput({ value, min, onChange }) {
  const [local, setLocal] = useState(String(value));

  useEffect(() => setLocal(String(value)), [value]);

  const commit = () => {
    const n = parseInt(local, 10);
    const v = Number.isNaN(n) || n < 0 ? 0 : n;
    // On rejette la saisie brute : la valeur normalisée vient du store.
    // Si le store change, l'effet ci-dessus recale `local` ; sinon `value`
    // (déjà normalisé) est la bonne valeur à réafficher.
    setLocal(String(value));
    onChange(v);
  };

  return (
    <input
      type="number"
      min={min}
      step="1"
      className="unlock-input"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
    />
  );
}
