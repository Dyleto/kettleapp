import { useCallback, useEffect, useRef, useState } from 'react';
import { playCue } from '@/features/client/sound/sound';
import { writeProgress } from './sessionProgress';
import {
  guidedTransition,
  type GuidedAction,
  type GuidedSignal,
  type GuidedState,
} from './session';

/**
 * L'état de la séance guidée, et le seul endroit où ses transitions touchent
 * le monde.
 *
 * Pourquoi pas `useReducer` : un réducteur ne doit rien faire d'autre que
 * rendre un état, et une transition d'ici a des suites — écrire sur
 * l'appareil, vibrer, sonner, rendre la main. Les jouer dans un effet après
 * le rendu, c'était les perdre quand deux actions tombent dans le même tour
 * (une horloge qui rattrape plusieurs tours d'un coup) : React n'aurait
 * rendu, et donc rejoué, que la dernière. Ici chaque action est appliquée à
 * l'état courant, que tient une référence, et ses suites partent aussitôt,
 * dans l'ordre — comme quand chaque geste les écrivait à la main.
 */
export const useGuidedSession = (
  sessionId: string,
  init: () => GuidedState,
  onFinish: () => void
): [GuidedState, (action: GuidedAction) => void] => {
  const [state, setState] = useState(init);
  const current = useRef(state);
  // La dernière main à rendre : l'écran de la séance peut la renouveler à
  // chaque rendu sans que l'action change d'identité.
  const finishRef = useRef(onFinish);
  useEffect(() => {
    finishRef.current = onFinish;
  }, [onFinish]);

  const act = useCallback(
    (action: GuidedAction) => {
      const {
        state: next,
        persist,
        signals,
      } = guidedTransition(current.current, action);
      current.current = next;
      setState(next);
      if (Object.keys(persist).length > 0) writeProgress(sessionId, persist);
      signals.forEach((signal) => applySignal(signal, finishRef.current));
    },
    [sessionId]
  );

  return [state, act];
};

const applySignal = (signal: GuidedSignal, onFinish: () => void) => {
  switch (signal) {
    case 'vibrate':
      navigator.vibrate?.(40);
      return;
    case 'blockEnd':
      playCue('blockEnd');
      return;
    case 'sessionEnd':
      playCue('sessionEnd');
      return;
    case 'finish':
      onFinish();
      return;
  }
};
