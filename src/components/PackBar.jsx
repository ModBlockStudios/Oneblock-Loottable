import { useRef, useState } from 'react';

/*
 * Barre d'import d'un pack Bedrock (.zip) dans l'onglet Table. Cliquer ou
 * déposer un zip le lie ; ses blocs/items custom rejoignent alors le catalogue.
 */
export default function PackBar({ pack, status, error, onImport, onRemove }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const pick = (files) => {
    const zip = [...files].find((f) => /\.zip$/i.test(f.name));
    if (zip) onImport(zip);
  };

  return (
    <div className="packbar">
      {pack ? (
        <div className="packbar__linked">
          <span className="packbar__badge">📦 Pack lié</span>
          <span className="packbar__name">{pack.name}</span>
          <span className="packbar__count">
            {pack.count} entrée{pack.count > 1 ? 's' : ''} custom
          </span>
          <span className="packbar__spacer" />
          <button type="button" className="btn-ghost" onClick={() => inputRef.current?.click()}>
            Remplacer
          </button>
          <button type="button" className="btn-ghost" onClick={onRemove}>
            Retirer
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={'packbar__drop' + (drag ? ' packbar__drop--drag' : '')}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            pick(e.dataTransfer.files);
          }}
        >
          {status === 'loading'
            ? 'Lecture du pack…'
            : '📦 Importer un pack Bedrock (.zip) — clique ou dépose le zip ici'}
        </button>
      )}

      {error && <span className="packbar__error">Import impossible : {error}</span>}

      <input
        ref={inputRef}
        type="file"
        accept=".zip,application/zip"
        hidden
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
