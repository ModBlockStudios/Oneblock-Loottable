import { useEffect, useRef, useState } from 'react';
import { iconUrl } from '../lib/icon.js';

/*
 * Scène de minage : on maintient le clic sur le bloc pour le miner. La barre
 * progresse selon `mineMs` ; au bout, on appelle onBreak() (et on enchaîne
 * sur le bloc suivant si le clic est toujours maintenu).
 *
 * `blockId` change à chaque nouveau bloc. La boucle compare ce blockId (via une
 * ref mise à jour au rendu) à celui qu'elle suit : dès qu'il change, elle
 * redémarre le chrono avec le `mineMs` du nouveau bloc. Détection synchrone
 * dans la boucle (et non via un effet passif, qui s'exécute après le paint) :
 * sinon le bloc suivant était cassé avec le temps de minage du précédent, trop
 * vite et sans animation — surtout entre deux blocs de types différents.
 */
export default function MiningStage({ block, blockId, mineMs, onBreak }) {
  const [progress, setProgress] = useState(0);
  const holding = useRef(false);
  const armed = useRef(false); // le chrono compte-t-il pour le bloc courant ?
  const startT = useRef(0);
  const raf = useRef(0);
  const mineRef = useRef(mineMs);
  const onBreakRef = useRef(onBreak);
  const blockIdRef = useRef(blockId);
  const seen = useRef(blockId); // dernier bloc pris en compte par la boucle
  mineRef.current = mineMs;
  onBreakRef.current = onBreak;
  blockIdRef.current = blockId;

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const loop = () => {
    if (!holding.current) return;

    // Un nouveau bloc est arrivé : on redémarre le chrono avec SON temps de
    // minage (mineRef est déjà à jour, il l'est dès le rendu).
    if (blockIdRef.current !== seen.current) {
      seen.current = blockIdRef.current;
      startT.current = performance.now();
      armed.current = true;
      setProgress(0);
    }

    if (armed.current) {
      const ms = mineRef.current;
      const p = ms <= 0 ? 1 : (performance.now() - startT.current) / ms;
      if (p >= 1) {
        // On désarme : plus de comptage tant que blockId n'a pas changé, pour
        // ne pas réutiliser le temps de minage du bloc qui vient de casser.
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
    seen.current = blockIdRef.current;
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
  const iconSrc = iconUrl(block?.icon);
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
