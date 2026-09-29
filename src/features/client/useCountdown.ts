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
 * Un décompte qui survit à l'écran éteint.
 *
 * Il compte à partir d'une échéance absolue et non en soustrayant une seconde
 * par tick : un onglet en arrière-plan voit ses minuteurs ralentis, et le
 * chrono d'un EMOM prenait plusieurs secondes de retard par tour dès que le
 * client verrouillait son téléphone — ce qu'il fait en le posant pour
 * soulever.
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
      const secondsLeft = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemaining(secondsLeft);
      if (secondsLeft === 0) {
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
