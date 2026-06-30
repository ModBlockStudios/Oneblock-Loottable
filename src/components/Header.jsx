import { APP_INFO } from '../version.js';

/* En-tête : titre, badge de version (visible) et infos d'édition. */
export default function Header({ edition, dataVersion }) {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <div className="topbar__heading">
          <h1 className="topbar__title">OneBlock Loot Table</h1>
          <a
            className="version-badge"
            href={import.meta.env.BASE_URL + 'CHANGELOG.md'}
            title="Version de l'interface"
          >
            v{APP_INFO.version}
          </a>
        </div>
        <p className="topbar__subtitle">
          Catalogue de l'inventaire créatif — Minecraft {edition} {dataVersion}
          <span className="topbar__build"> · build {APP_INFO.buildDate}</span>
        </p>
      </div>
    </header>
  );
}
