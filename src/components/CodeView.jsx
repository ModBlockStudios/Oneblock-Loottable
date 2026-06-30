/* Vue code : affiche le JSON (read-only) avec un bouton « Copier ». */
export default function CodeView({ json, onCopy }) {
  return (
    <div className="codeview">
      <div className="codeview__bar">
        <span className="codeview__label">Code JSON de la config</span>
        <button type="button" className="btn-primary" onClick={() => onCopy(json)}>
          Copier
        </button>
      </div>
      <pre className="codeview__pre">{json}</pre>
    </div>
  );
}
