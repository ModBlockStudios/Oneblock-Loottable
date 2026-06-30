import { useEffect, useRef, useState } from 'react';

/*
 * Scène de minage : on maintient le clic sur le bloc pour le miner. La barre
 * progresse selon `mineMs` ; au bout, on appelle onBreak() (et on enchaîne
 * sur le bloc suivant si le clic est toujours maintenu).
 *
 * `blockId` change à chaque nouveau bloc : c'est lui qui (ré)arme le chrono.
 * Sans ce garde-fou, la boucle continuait avec le `mineMs` du bloc précédent
 * (ref pas encore rafraîchie) et cassait le bloc suivant trop vite, sans
 * animation de cassage.
 */
export default function MiningStage({ block, blockId, mineMs, onBreak }) {
  const [progress, setProgress] = useState(0);
  const holding = useRef(false);
  const armed = useRef(false); // le chrono compte-t-il pour le bloc courant ?
  const startT = useRef(0);
  const raf = useRef(0);
  const mineRef = useRef(mineMs);
  const onBreakRef = useRef(onBreak);
  mineRef.current = mineMs;
  onBreakRef.current = onBreak;

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // Nouveau bloc arrivé : si le clic est maintenu, on redémarre le chrono avec
  // le `mineMs` du nouveau bloc (désormais à jour après le re-render).
  useEffect(() => {
    if (holding.current) {
      startT.current = performance.now();
      armed.current = true;
      setProgress(0);
    }
  }, [blockId]);

  const loop = () => {
    if (!holding.current) return;
    if (armed.current) {
      const ms = mineRef.current;
      const elapsed = performance.now() - startT.current;
      const p = ms <= 0 ? 1 : elapsed / ms;
      if (p >= 1) {
        // On désarme : on attend le prochain bloc (blockId) avant de recompter,
        // pour ne pas réutiliser le temps de minage du bloc qui vient de casser.
        armed.current = false;
        setProgress(0);
        onBreakRef.current();
      } else {
        setProgress(p);
      }
    }
    raf.current = requestAnimationFrame(loop);
  };

  const start = (e) => {
    e.preventDefault();
    if (holding.current || !block) return;
    holding.current = true;
    armed.current = true;
    startT.current = performance.now();
    raf.current = requestAnimationFrame(loop);
  };

  const stop = () => {
    if (!holding.current) return;
    holding.current = false;
    armed.current = false;
    cancelAnimationFrame(raf.current);
    setProgress(0);
  };

  const isChest = block?.kind === 'chest';
  const iconSrc = block?.icon ? import.meta.env.BASE_URL + 'assets/' + block.icon : null;
  const label = isChest ? block.label?.trim() || 'Chest' : block?.displayName;

  return (
    <div className="stage">
      <button
        type="button"
        className={'stage__block' + (progress > 0 ? ' stage__block--mining' : '')}
        onPointerDown={start}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        disabled={!block}
        title="Maintiens le clic pour miner"
      >
        {block ? (
          isChest ? (
            <span className="stage__emoji" aria-hidden="true">📦</span>
          ) : iconSrc ? (
            <img className="stage__icon" src={iconSrc} alt="" draggable="false" />
          ) : (
            <span className="stage__emoji" aria-hidden="true">⬛</span>
          )
        ) : (
          <span className="stage__emoji" aria-hidden="true">∅</span>
        )}
        {/* Remplissage « cassage » qui monte selon la progression */}
        <span className="stage__crack" style={{ height: progress * 100 + '%' }} aria-hidden="true" />
      </button>

      <div className="stage__progress">
        <div className="stage__progress-fill" style={{ width: progress * 100 + '%' }} />
      </div>

      <div className="stage__label">{block ? label : 'Aucun bloc'}</div>
      <div className="stage__hint">{progress > 0 ? Math.round(progress * 100) + ' %' : 'Maintiens le clic pour miner'}</div>
    </div>
  );
}
