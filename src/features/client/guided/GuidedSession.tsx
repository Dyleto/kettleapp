import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { BlockExercise, PerformedValues, Session } from '@/shared/types';
import type { LastPerformance } from '@/domain/history/lastPerformance';
import { blockMarker, blockTitle } from '@/domain/session/measure';
import { sortByOrder } from '@/domain/session/sets';
import { useBackDismiss } from '@/shared/hooks/useBackDismiss';
import { InstructionSheet } from '@/features/client/sheet/InstructionSheet';
import { buildGuidedSteps } from './steps';
import { readProgress, writeProgress } from './sessionProgress';
import {
  blockOutcome,
  blockSegments,
  firstGesture,
  positionLabel,
} from './outline';
import {
  firstRoundIndex,
  initialGuidedState,
  isLastStep,
  nextBlockIndex,
  segmentProgress,
  stepOf,
} from './session';
import { useGuidedSession } from './useGuidedSession';
import { guidedKey } from './keys';
import { useInertRoot, useSoundUnlock, useWakeLock } from './screen';
import { PauseContext } from './PauseContext';
import { SceneShell } from './SceneShell';
import { AmrapBlock } from './scene/AmrapBlock';
import { ChipperBlock } from './scene/ChipperBlock';
import { isCappedList } from './chipper';
import { BetweenBlocks } from './scene/BetweenBlocks';
import { Countdown } from './scene/Countdown';
import { LadderBlock } from './scene/LadderBlock';
import { ListScene } from './scene/ListScene';
import { NextBlock } from './scene/NextBlock';
import { NoSteps } from './scene/NoSteps';
import { Opening } from './scene/Opening';
import { PauseSheet } from './scene/PauseSheet';
import { SessionOutline } from './scene/SessionOutline';
import { TimedBlock } from './scene/TimedBlock';

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
 * bloc dans sa scène. Il reste ici ce qui les relie : la phase (ouverture,
 * décompte, scène), l'écran tenu allumé et inerte autour, le retour et
 * Échap, et la pause par-dessus.
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
  /** La ligne du haut, où une scène peut poser une puce — le temps d'un
   * AMRAP. Un état et non une référence : la scène doit être rendue de
   * nouveau quand l'emplacement existe. */
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);

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

  // Un repos n'a pas de bloc à lui : il porte le titre du bloc qu'il
  // termine.
  const titled = steps
    .slice(0, state.index + 1)
    .reverse()
    .find((candidate) => candidate.type !== 'rest');
  const title = titled ? blockTitle(titled.block) : step.blockLabel;
  const position =
    step.type === 'rest'
      ? 'Repos'
      : positionLabel(
          session,
          step.block,
          state.done,
          step.type === 'round'
            ? {
                rank:
                  step.rounds === null
                    ? (state.liveRound ?? step.round)
                    : step.round,
                total: step.rounds,
              }
            : undefined
        );
  const { current: segmentIndex, parts } = segmentProgress(state, segments);
  const onPrevious =
    state.index > 0 ? () => act({ type: 'previous' }) : undefined;
  const openDetail = (exercise: BlockExercise) =>
    act({ type: 'openDetail', exercise });
  // Le bloc qu'on vient de quitter, tant que l'écran « Bloc suivant » en
  // parle.
  const leftBlock = state.interlude
    ? session.blocks.find((block) => block.order === state.interlude?.fromBlock)
    : undefined;
  const rank = `Bloc ${segmentIndex + 1} sur ${segments.length}`;
  const outline = <SessionOutline session={session} current={segmentIndex} />;

  return overlay(
    <PauseContext.Provider value={state.pause !== 'closed'}>
      <SceneShell
        rank={rank}
        title={title}
        parts={parts}
        current={segmentIndex}
        valuetext={`${position} — ${step.blockLabel}`}
        onPause={() => act({ type: 'pause' })}
        onHeaderSlot={setHeaderSlot}
        notice={state.resumed ? `Reprise au bloc ${resumedBlock}` : undefined}
        quietHeading={!!leftBlock}
      >
        {leftBlock && state.interlude && step.type !== 'rest' ? (
          <NextBlock
            key={state.index}
            outcome={blockOutcome(
              session,
              leftBlock,
              state.interlude.ending,
              state.done,
              state.rounds[String(leftBlock.order)] ?? 0
            )}
            rank={rank}
            block={step.block}
            lastPerformance={lastPerformance}
            onDone={() => act({ type: 'interludeDone' })}
          />
        ) : step.type === 'block' && step.block.type === 'ladder' ? (
          // L'échelle a sa propre scène : ses paliers se cochent entiers, un
          // par geste, et ne passent jamais par la liste.
          <LadderBlock
            key={step.block.order}
            step={step}
            done={state.done}
            onDoneChange={(done) => act({ type: 'setDone', done })}
            onResult={(result) =>
              writeProgress(session._id, {
                ladder: {
                  ...(readProgress(session._id)?.ladder ?? {}),
                  [String(step.block.order)]: result,
                },
              })
            }
            onFinish={() => act({ type: 'next' })}
            isLastBlock={isLastStep(state)}
            armed={state.armedBlock === step.block.order}
            onArm={() => act({ type: 'arm', blockOrder: step.block.order })}
            onPrevious={onPrevious}
            headerSlot={headerSlot}
            lastPerformance={lastPerformance}
            onOpenDetail={openDetail}
          />
        ) : step.type === 'block' &&
          step.shape === 'list' &&
          isCappedList(step.block) ? (
          <ChipperBlock
            key={step.block.order}
            step={step}
            state={state}
            act={act}
            armed={state.armedBlock === step.block.order}
            onArm={() => act({ type: 'arm', blockOrder: step.block.order })}
            onResult={(result) =>
              writeProgress(session._id, {
                chipper: {
                  ...(readProgress(session._id)?.chipper ?? {}),
                  [String(step.block.order)]: result,
                },
              })
            }
            headerSlot={headerSlot}
            lastPerformance={lastPerformance}
            performed={performed}
            onPerformedChange={onPerformedChange}
            nextBlock={blockAfter(session, step.block.order)}
            outline={outline}
          />
        ) : step.type === 'block' && step.shape === 'list' ? (
          <ListScene
            step={step}
            state={state}
            act={act}
            nextBlock={blockAfter(session, step.block.order)}
            outline={outline}
            lastPerformance={lastPerformance}
            performed={performed}
            onPerformedChange={onPerformedChange}
          />
        ) : step.type === 'block' ? (
          <AmrapBlock
            key={step.block.order}
            step={step}
            armed={state.armedBlock === step.block.order}
            onArm={() => act({ type: 'arm', blockOrder: step.block.order })}
            rounds={state.rounds[String(step.block.order)] ?? 0}
            onRoundsChange={(next) =>
              act({
                type: 'countRound',
                blockOrder: step.block.order,
                delta: next - (state.rounds[String(step.block.order)] ?? 0),
              })
            }
            onDone={() => act({ type: 'next' })}
            onPrevious={onPrevious}
            headerSlot={headerSlot}
            lastPerformance={lastPerformance}
            onOpenDetail={openDetail}
          />
        ) : step.type === 'round' ? (
          <TimedBlock
            key={step.block.order}
            step={step}
            armed={state.armedBlock === step.block.order}
            onArm={() => act({ type: 'arm', blockOrder: step.block.order })}
            onRound={(round) =>
              act({ type: 'round', blockOrder: step.block.order, round })
            }
            onFinish={() =>
              act({ type: 'finishTimedBlock', blockOrder: step.block.order })
            }
            onPause={() => act({ type: 'pause' })}
            onPrevious={
              firstRoundIndex(state, step.block.order) > 0
                ? () =>
                    act({
                      type: 'goTo',
                      index: firstRoundIndex(state, step.block.order) - 1,
                    })
                : undefined
            }
            nextBlock={nextBlockLine(session, step.block.order)}
            lastPerformance={lastPerformance}
            onOpenDetail={openDetail}
          />
        ) : (
          <BetweenBlocks
            key={state.index}
            step={step}
            nextBlock={
              titled ? blockAfter(session, titled.block.order) : undefined
            }
            onDone={() => act({ type: 'next' })}
          />
        )}

        {/* La consigne du coach est écrite pour ce moment précis — en plein
            effort, les mains occupées. Elle s'ouvrait en plein écran par
            dessus la scène ; c'est maintenant la feuille de la fiche, qu'on
            referme d'un geste en gardant la séance sous les yeux. */}
        {state.detail && (
          <InstructionSheet
            entry={state.detail}
            last={lastPerformance?.get(state.detail.exercise._id)}
            onClose={() => act({ type: 'closeDetail' })}
          />
        )}
      </SceneShell>

      {state.pause === 'resuming' && step.type !== 'rest' ? (
        <Countdown
          title={title}
          detail={position}
          onDone={() => act({ type: 'resumed' })}
        />
      ) : (
        state.pause === 'open' && (
          <PauseSheet
            position={position}
            onResume={() => act({ type: 'resume' })}
            // Quitter n'efface rien. Sortir pour répondre au téléphone, ou
            // parce qu'un doigt a glissé, ne doit pas coûter la séance.
            onLeave={onExit}
            onSkipBlock={
              nextBlockIndex(state) === -1
                ? undefined
                : () => act({ type: 'skipBlock' })
            }
            onFinish={() => act({ type: 'finishNow' })}
            onEndBlock={
              step.type === 'round' && step.rounds === null
                ? () => act({ type: 'endBlock' })
                : undefined
            }
          />
        )
      )}
    </PauseContext.Provider>
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

/** Le nom du bloc qui suit celui-ci, ou `undefined` au dernier. */
const blockAfter = (
  session: Session,
  blockOrder: number
): string | undefined => {
  const next = sortByOrder(session.blocks).find(
    (block) => block.order > blockOrder
  );
  return next ? blockTitle(next) : undefined;
};

/** Ce qu'annonce le pied d'un bloc chronométré : « AMRAP 12 · 12 min ». */
const nextBlockLine = (session: Session, blockOrder: number): string | null => {
  const next = sortByOrder(session.blocks).find(
    (block) => block.order > blockOrder
  );
  return next ? `${blockTitle(next)} · ${blockMarker(next)}` : null;
};
