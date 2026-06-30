/* Journal des drops obtenus pendant la simulation (le plus récent en haut). */
export default function DropsList({ drops }) {
  const total = drops.reduce((s, d) => s + d.count, 0);

  return (
    <div className="drops">
      <div className="drops__head">
        <span className="drops__title">Drops</span>
        <span className="drops__total">{total.toLocaleString('fr-FR')} obtenu(s)</span>
      </div>

      {drops.length === 0 ? (
        <div className="drops__empty">Mine des blocs pour voir les drops ici.</div>
      ) : (
        <ul className="drops__list">
          {drops.map((d) => (
            <li key={d.key} className="drops__item">
              {d.icon ? (
                <img
                  className="drops__icon"
                  src={import.meta.env.BASE_URL + 'assets/' + d.icon}
                  alt=""
                  loading="lazy"
                />
              ) : (
                <span className="drops__icon drops__icon--missing" />
              )}
              <span className="drops__name">{d.displayName}</span>
              <span className="drops__count">×{d.count.toLocaleString('fr-FR')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
