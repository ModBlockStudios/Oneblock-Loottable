import { useState } from 'react';

/* Barre de gestion des configs : sélection, création, renommage, suppression, vue code. */
export default function ConfigBar({
  configs,
  current,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  codeView,
  onToggleCode,
}) {
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const submit = (e) => {
    e.preventDefault();
    onCreate(name);
    setName('');
  };

  const startRename = () => {
    setDraft(current.name);
    setEditing(true);
  };

  const commitRename = (e) => {
    e.preventDefault();
    onRename(current.id, draft);
    setEditing(false);
  };

  return (
    <div className="configbar">
      <div className="configbar__left">
        {editing && current ? (
          <form className="config-rename" onSubmit={commitRename}>
            <input
              type="text"
              className="config-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
              maxLength={40}
              aria-label="Nouveau nom de la config"
              autoFocus
            />
            <button type="submit" className="btn-primary" disabled={!draft.trim()}>
              Valider
            </button>
            <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>
              Annuler
            </button>
          </form>
        ) : (
          <>
            {configs.length > 0 && (
              <label className="config-select">
                <span className="config-select__label">Config</span>
                <select
                  value={current ? current.id : ''}
                  onChange={(e) => onSelect(e.target.value)}
                  aria-label="Choisir une config"
                >
                  {configs.map((c) => {
                    const total = c.tiers.reduce((n, t) => n + t.entries.length, 0);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.tiers.length} tiers, {total} items
                      </option>
                    );
                  })}
                </select>
              </label>
            )}
            {current && (
              <button
                type="button"
                className="btn-ghost"
                title="Renommer cette config"
                onClick={startRename}
              >
                Renommer
              </button>
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
          </>
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
        {current && (
          <button
            type="button"
            className={'btn-ghost' + (codeView ? ' btn-ghost--active' : '')}
            onClick={onToggleCode}
            title="Afficher le code JSON de cette config"
          >
            {codeView ? '← Éditeur' : '{ } Code'}
          </button>
        )}
      </form>
    </div>
  );
}
