import { useState } from 'react';

/* Barre de gestion des configs : sélection, création, suppression. */
export default function ConfigBar({ configs, current, onSelect, onCreate, onDelete }) {
  const [name, setName] = useState('');

  const submit = (e) => {
    e.preventDefault();
    onCreate(name);
    setName('');
  };

  return (
    <div className="configbar">
      <div className="configbar__left">
        {configs.length > 0 && (
          <label className="config-select">
            <span className="config-select__label">Config</span>
            <select
              value={current ? current.id : ''}
              onChange={(e) => onSelect(e.target.value)}
              aria-label="Choisir une config"
            >
              {configs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.entries.length})
                </option>
              ))}
            </select>
          </label>
        )}
        {current && (
          <button
            type="button"
            className="btn-ghost"
            title="Supprimer cette config"
            onClick={() => onDelete(current.id)}
          >
            Supprimer
          </button>
        )}
      </div>

      <form className="configbar__create" onSubmit={submit}>
        <input
          type="text"
          className="config-input"
          placeholder="Nom de la nouvelle config…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
        />
        <button type="submit" className="btn-primary" disabled={!name.trim()}>
          Créer
        </button>
      </form>
    </div>
  );
}
