import { useCallback, useEffect, useRef, useState } from 'react';

interface UseCountdownOptions {
  onComplete?: () => void;
  /**
   * Whether the countdown starts on its own.
   *
   * It always did, and on a round that meant the clock was already running
   * before the client had picked up the kettlebell: you open the session,
   * land on round 1 of an EMOM, and you are already late. Starting is a
   * decision — it belongs to whoever is about to do the work.
   */
  autoStart?: boolean;
}

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
    // The deadline is only set once the countdown actually runs: priming it
    // on mount would make a clock that has not been started lose the seconds
    // spent waiting for the first tap.
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
