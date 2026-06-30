/* Vue code : affiche le JSON (read-only) avec « Copier » et « Télécharger ». */
export default function CodeView({ json, fileName, onCopy, onDownload }) {
  return (
    <div className="codeview">
      <div className="codeview__bar">
        <span className="codeview__label">Code JSON de la config</span>
        <div className="codeview__actions">
          <button type="button" className="btn-ghost" onClick={onDownload} title={'Télécharger ' + fileName}>
            ⬇ Télécharger
          </button>
          <button type="button" className="btn-primary" onClick={() => onCopy(json)}>
            Copier
          </button>
        </div>
      </div>
      <pre className="codeview__pre">{json}</pre>
    </div>
  );
}
