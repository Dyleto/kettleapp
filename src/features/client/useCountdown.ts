import { useCallback, useEffect, useRef, useState } from 'react';

interface UseCountdownOptions {
  onComplete?: () => void;
  /**
   * Si le décompte démarre de lui-même.
   *
   * Il le faisait toujours, et sur un tour cela voulait dire que l'horloge
   * tournait déjà avant que le client n'ait saisi sa kettlebell : on ouvre la
   * séance, on arrive au tour 1 d'un EMOM, et l'on est déjà en retard.
   * Démarrer est une décision — elle appartient à celui qui va faire le
   * travail.
   */
  autoStart?: boolean;
}

/**
 * Les secondes qui restent avant `endAt`, telles qu'elles s'affichent.
 *
 * Lues sur une échéance absolue et non obtenues en soustrayant une seconde
 * par tick : un onglet en arrière-plan voit ses minuteurs ralentis, et le
 * chrono d'un EMOM prenait plusieurs secondes de retard par tour dès que le
 * client verrouillait son téléphone — ce qu'il fait en le posant pour
 * soulever. C'est toute la raison d'être de ce module, et c'est ici que la
 * règle est écrite.
 *
 * Arrondi vers le haut, et c'est une décision des deux côtés. Au départ : le
 * premier tick tombe 250 ms après, soit 59,75 s sur un tour d'une minute, et
 * un arrondi vers le bas afficherait « 0:59 » un quart de seconde après avoir
 * lancé l'horloge. À l'arrivée : il reste « 1 » tant que la dernière seconde
 * n'est pas écoulée, donc la fin ne se déclenche pas en avance.
 *
 * Vit hors du hook pour être vérifiable : aucun test unitaire ne monte de
 * composant, et c'est la seule part de ce module qui décide quelque chose.
 */
export const secondsLeft = (endAt: number, now: number): number =>
  Math.max(0, Math.ceil((endAt - now) / 1000));

/**
 * Un décompte qui survit à l'écran éteint.
 *
 * Le hook ne fait que le câblage : poser l'échéance au premier démarrage,
 * battre, et rendre les commandes. Ce qu'il décide est dans `secondsLeft`.
 */
export function useCountdown(
  seconds: number,
  { onComplete, autoStart = true }: UseCountdownOptions = {}
) {
  const [remaining, setRemaining] = useState(seconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const endAtRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // L'échéance n'est posée qu'une fois le décompte réellement lancé :
    // l'amorcer au montage ferait perdre à une horloge non démarrée les
    // secondes passées à attendre la première touche.
    if (isRunning && endAtRef.current === null) {
      endAtRef.current = Date.now() + seconds * 1000;
    }
    if (!isRunning) return;

    const tick = () => {
      const endAt = endAtRef.current ?? Date.now();
      const left = secondsLeft(endAt, Date.now());
      setRemaining(left);
      if (left === 0) {
        setIsRunning(false);
        onCompleteRef.current?.();
      }
    };

    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [isRunning, seconds]);

  const pause = useCallback(() => setIsRunning(false), []);
  const resume = useCallback(() => {
    endAtRef.current = Date.now() + remaining * 1000;
    setIsRunning(true);
  }, [remaining]);
  const skip = useCallback(() => {
    setIsRunning(false);
    setRemaining(0);
    onCompleteRef.current?.();
  }, []);

  return { remaining, isRunning, pause, resume, skip };
}
