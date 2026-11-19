import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PerformedValues, Session } from '@/shared/types';
import type { LastPerformance } from '@/domain/history/lastPerformance';
import { useBackDismiss } from '@/shared/hooks/useBackDismiss';
import { buildGuidedSteps } from './steps';
import { readProgress, writeProgress } from './sessionProgress';
import { blockSegments, firstGesture } from './outline';
import { initialGuidedState, segmentProgress, stepOf } from './session';
import { useGuidedSession } from './useGuidedSession';
import { guidedKey } from './keys';
import { useInertRoot, useSoundUnlock, useWakeLock } from './screen';
import { GuidedScene } from './GuidedScene';
import { Countdown } from './scene/Countdown';
import { NoSteps } from './scene/NoSteps';
import { Opening } from './scene/Opening';

interface GuidedSessionProps {
  session: Session;
  onExit: () => void;
  onFinish: () => void;
  lastPerformance?: Map<string, LastPerformance>;
  /** Ce qui a déjà été noté, et de quoi y ajouter : voir `ListScene`. */
  performed?: Record<string, PerformedValues>;
  onPerformedChange?: (key: string, next: PerformedValues) => void;
}

/** Combien de temps le haut dit « Reprise au bloc 2 » : de quoi le lire en
 * reprenant sa kettlebell, pas assez pour qu'il gêne la série. */
const RESUME_NOTICE = 3_000;

/**
 * La séance guidée : l'écran qu'on a devant soi en s'entraînant.
 *
 * Trois principes dont tout le reste découle :
 *
 *   — un seul bouton principal, toujours au même endroit, et c'est la forme
 *     du bloc qui dit ce qu'il fait ;
 *   — où l'on est et ce qu'on a fait sont deux états distincts, ce qui est
 *     la raison pour laquelle on peut enfin cocher ;
 *   — une sortie existe à chaque écran, parce qu'un geste principal qui
 *     change de sens a déjà emporté celui qu'il remplaçait, trois fois.
 *
 * Ce composant ne décide plus rien : il faisait 1 523 lignes et quatorze
 * états. L'état et ses transitions vivent dans `session.ts`, testés sans
 * écran ; le cadre, le haut et la barre dans `SceneShell` ; chaque forme de
 * bloc dans sa scène, que `GuidedScene` choisit — l'atelier du coach la
 * montre aussi. Il reste ici ce qui les relie : la phase (ouverture,
 * décompte, scène), l'écran tenu allumé et inerte autour, le retour et
 * Échap.
 */
export const GuidedSession = ({
  session,
  onExit,
  onFinish,
  lastPerformance,
  performed,
  onPerformedChange,
}: GuidedSessionProps) => {
  const [state, act] = useGuidedSession(
    session._id,
    () =>
      initialGuidedState(buildGuidedSteps(session), readProgress(session._id)),
    onFinish
  );
  const { steps } = state;
  // Les blocs ne changent pas pendant la séance : on les découpe une fois.
  const [segments] = useState(() => blockSegments(steps));
  // Le bloc où la séance reprend, lu une fois : avancer pendant les trois
  // secondes du bandeau ne doit pas le faire changer de numéro.
  const [resumedBlock] = useState(
    () => segmentProgress(state, segments).current + 1
  );

  useSoundUnlock();
  useInertRoot();
  useWakeLock();

  // L'heure de départ, posée une fois pour toutes : c'est elle qui dit, à la
  // fin, combien de temps la séance a duré. Elle se pose quand l'ouverture
  // est franchie, pas quand elle s'affiche : posée au montage, elle faisait
  // d'un simple coup d'œil une séance commencée, dont la durée courait déjà.
  const pastOpening = state.phase !== 'opening' && state.phase !== 'empty';
  useEffect(() => {
    if (!pastOpening) return;
    if (readProgress(session._id)?.startedAt === undefined) {
      writeProgress(session._id, { startedAt: Date.now() });
    }
  }, [session._id, pastOpening]);

  // Le bandeau de reprise se retire de lui-même ; la séance, elle, ne
  // bouge pas.
  useEffect(() => {
    if (!state.resumed) return;
    const timer = setTimeout(
      () => act({ type: 'dismissResume' }),
      RESUME_NOTICE
    );
    return () => clearTimeout(timer);
  }, [state.resumed, act]);

  // Le retour du téléphone et Échap ouvrent la pause : ils ne quittent
  // jamais directement. Sur Android, retour est le geste d'annulation
  // universel, et rien ne lui répondait ici — il quittait la page, donc la
  // séance, sans un mot. Une fois la pause ouverte, le même geste la
  // referme ; depuis l'ouverture, il revient à la fiche.
  const sceneActive = state.phase === 'scene';
  useBackDismiss(state.phase === 'opening', onExit);
  useBackDismiss(sceneActive && state.pause === 'closed', () =>
    act({ type: 'pause' })
  );
  useBackDismiss(sceneActive && state.pause !== 'closed', () =>
    act({ type: 'closePause' })
  );
  useEffect(() => {
    if (!sceneActive) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        act({ type: 'escape' });
        return;
      }
      const intent = guidedKey(event, event.target as HTMLElement | null);
      // Une feuille par-dessus — la pause, une consigne, une fin de bloc —
      // et la scène dessous ne répond plus : Espace validait la série
      // cachée derrière la pause.
      if (!intent || overlayOpen()) return;
      // Pendant un décompte, les flèches ne déplacent rien derrière lui :
      // on ne change pas de tour pendant qu'on se met en place.
      if (
        (intent === 'previous' || intent === 'next') &&
        document.querySelector('[data-guided-countdown]')
      )
        return;
      event.preventDefault();
      if (intent === 'pause') act({ type: 'pause' });
      else pressMarked(intent);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sceneActive, act]);

  // La séance se pose hors de `#root`, que `useInertRoot` neutralise.
  const overlay = (node: React.ReactNode) => createPortal(node, document.body);

  if (state.phase === 'empty') return overlay(<NoSteps onExit={onExit} />);

  // L'ouverture, puis trois secondes pour poser le téléphone. Rien de la
  // scène n'est monté pendant ce temps : aucune horloge ne peut tourner
  // derrière un décompte.
  if (state.phase === 'opening') {
    return overlay(
      <Opening
        session={session}
        onClose={onExit}
        onStart={() => act({ type: 'start' })}
      />
    );
  }

  const step = stepOf(state);
  // Impossible tant qu'il y a des étapes et que l'index y reste ; le dire
  // vaut mieux qu'une assertion qui ferait planter la séance.
  if (!step) return overlay(<NoSteps onExit={onExit} />);

  if (state.phase === 'counting' && step.type !== 'rest') {
    const gesture = firstGesture(step.block, state.done);
    return overlay(
      <Countdown
        title={gesture.title}
        detail={gesture.detail}
        onDone={() => act({ type: 'countdownDone' })}
      />
    );
  }

  return overlay(
    <GuidedScene
      session={session}
      state={state}
      act={act}
      step={step}
      segments={segments}
      resumedBlock={resumedBlock}
      onExit={onExit}
      lastPerformance={lastPerformance}
      performed={performed}
      onPerformedChange={onPerformedChange}
    />
  );
};

/** Une feuille est ouverte par-dessus la séance : la pause, une consigne,
 * la fin d'un bloc. La séance elle-même est le seul autre dialogue. */
const overlayOpen = (): boolean =>
  document.querySelector(
    '[role="dialog"][aria-modal="true"]:not([aria-label="Séance guidée"])'
  ) !== null;

/**
 * Touche la commande que la scène a marquée pour ce raccourci.
 *
 * La dernière visible : un décompte qui se pose par-dessus la scène vient
 * après elle dans la page, et c'est lui qu'Espace doit franchir. Une
 * commande cachée ou désactivée ne compte pas — la flèche « Tour
 * précédent » existe au premier tour, invisible.
 */
const pressMarked = (intent: 'primary' | 'previous' | 'next') => {
  const marked = Array.from(
    document.querySelectorAll<HTMLElement>(`[data-guided-${intent}]`)
  ).filter(
    (el) =>
      // `getClientRects` et non `offsetParent`, qui vaut toujours `null`
      // pour un élément fixe — le décompte l'est, et Espace retouchait
      // « Lancer » derrière lui au lieu de le franchir.
      el.getClientRects().length > 0 &&
      getComputedStyle(el).visibility !== 'hidden' &&
      !el.hasAttribute('disabled') &&
      el.getAttribute('aria-disabled') !== 'true'
  );
  marked.at(-1)?.click();
};
