import { useEffect, useRef, useState } from 'react';
import { useScenePaused } from './PauseContext';

interface BlockClockOptions {
  /**
   * Le temps déjà écoulé, en millisecondes, si l'horloge part au montage :
   * reprendre un EMOM au tour 4 part du début du tour 4.
   */
  initialOffset: number;
  /** L'horloge part au montage : le décompte de l'ouverture vient de
   * tomber, ou le bloc a déjà été lancé. */
  armed: boolean;
  /** Chaque battement, avec le temps écoulé depuis l'origine. */
  onBeat: (elapsed: number) => void;
}

/**
 * L'horloge d'un bloc : une origine, un gel, un battement.
 *
 * Partagée par les blocs que l'horloge mène — EMOM, Tabata, On-Off — et par
 * l'AMRAP, qu'elle borne. Ce qu'elle garde, c'est l'instant où le bloc
 * aurait commencé, et non un compteur : un onglet en arrière-plan bat une
 * fois par minute, un compteur y prendrait des minutes de retard, alors
 * que l'heure, relue au battement suivant, dit le temps réel. Ce que le
 * temps veut dire — un tour, une phase, la fin — appartient à l'appelant.
 *
 * Une pause de la scène décale l'origine d'exactement sa durée : elle ne
 * coûte rien au bloc, et ne lui offre rien non plus. `Date.now()` n'est lu
 * que dans les effets et les gestes, jamais au rendu.
 */
export function useBlockClock({
  initialOffset,
  armed,
  onBeat,
}: BlockClockOptions) {
  const paused = useScenePaused();
  const [running, setRunning] = useState(armed);
  const startOffsetRef = useRef(initialOffset);
  /** L'instant où le bloc aurait commencé ; posé au départ. */
  const originRef = useRef<number | null>(null);
  /** L'instant où la scène s'est figée, tant qu'elle l'est. */
  const frozenAtRef = useRef<number | null>(null);
  const onBeatRef = useRef(onBeat);
  useEffect(() => {
    onBeatRef.current = onBeat;
  });

  const ticking = running && !paused;
  useEffect(() => {
    if (!ticking) return;
    const now = Date.now();
    if (originRef.current === null) {
      originRef.current = now - startOffsetRef.current;
    } else if (frozenAtRef.current !== null) {
      originRef.current += now - frozenAtRef.current;
    }
    frozenAtRef.current = null;
    const beat = () => {
      if (originRef.current !== null)
        onBeatRef.current(Date.now() - originRef.current);
    };
    const first = setTimeout(beat, 0);
    const interval = setInterval(beat, 250);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
      frozenAtRef.current = Date.now();
    };
  }, [ticking]);

  return {
    running,
    /** Part, `offset` millisecondes après l'origine : le geste « Lancer ». */
    start: (offset: number) => {
      originRef.current = Date.now() - offset;
      frozenAtRef.current = null;
      setRunning(true);
    },
    /** Se recaler, horloge en marche : l'origine recule ou avance. */
    rebase: (offset: number) => {
      originRef.current = Date.now() - offset;
    },
    stop: () => setRunning(false),
  };
}
