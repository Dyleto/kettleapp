import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { useReplay } from '@/kit';
import type { BlockExercise, PerformedValues, Session } from '@/shared/types';
import type { LastPerformance } from '@/domain/history/lastPerformance';
import { blockMarker, blockTitle } from '@/domain/session/measure';
import { sortByOrder } from '@/domain/session/sets';
import { InstructionSheet } from '@/features/client/sheet/InstructionSheet';
import type { GuidedStep } from './steps';
import { writeProgress, readProgress } from './sessionProgress';
import { blockOutcome, blockSegments, positionLabel } from './outline';
import {
  firstRoundIndex,
  isLastStep,
  nextBlockIndex,
  segmentProgress,
  type GuidedAction,
  type GuidedState,
} from './session';
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
import { PauseSheet } from './scene/PauseSheet';
import { SessionOutline } from './scene/SessionOutline';
import { TimedBlock } from './scene/TimedBlock';

interface GuidedSceneProps {
  session: Session;
  state: GuidedState;
  act: (action: GuidedAction) => void;
  /** L'étape ouverte : `stepOf(state)`, que l'appelant a déjà vérifiée. */
  step: GuidedStep;
  /** Les blocs de la séance, découpés une fois. */
  segments: ReturnType<typeof blockSegments>;
  /** Le bloc où la séance a repris, pour « Reprise au bloc 2 ». */
  resumedBlock: number;
  onExit: () => void;
  lastPerformance?: Map<string, LastPerformance>;
  performed?: Record<string, PerformedValues>;
  onPerformedChange?: (key: string, next: PerformedValues) => void;
}

/**
 * Une étape de la séance guidée, dans son cadre : le haut, la barre des
 * blocs, la scène qui correspond à la forme du bloc, et ce qui se pose
 * par-dessus — une consigne, la pause.
 *
 * Elle vivait au milieu de `GuidedSession`. L'atelier du coach la montre
 * aussi, figée au début du bloc qu'il modifie : « vu par le client ». Deux
 * copies de ce choix de scène auraient fini par ne plus montrer la même
 * chose — le coach aurait relu un écran que son client ne voit pas.
 */
export const GuidedScene = ({
  session,
  state,
  act,
  step,
  segments,
  resumedBlock,
  onExit,
  lastPerformance,
  performed,
  onPerformedChange,
}: GuidedSceneProps) => {
  /** La ligne du haut, où une scène peut poser une puce — le temps d'un
   * AMRAP. Un état et non une référence : la scène doit être rendue de
   * nouveau quand l'emplacement existe. */
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);
  const { steps } = state;

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
  // Ce qui fait une scène : un bloc, un repos entre deux blocs, l'écran
  // « Bloc suivant ». Une série cochée, un tour qui passe ne changent pas
  // de scène : ils n'entrent pas.
  const sceneId =
    leftBlock && state.interlude && step.type !== 'rest'
      ? `next-${state.index}`
      : step.type === 'rest'
        ? `rest-${state.index}`
        : `block-${step.block.order}`;
  const enter = useReplay(sceneId, 'sceneEnter', { initial: true });

  return (
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
        {/* La scène entre ; le haut et la barre restent où ils sont. Le
            cadre est en colonne, et la scène y prenait toute la place :
            celui-ci la prend à sa suite, sans rien changer à sa mise en
            page. */}
        <Box
          flex={1}
          minH={0}
          display="flex"
          flexDirection="column"
          animation={enter}
          _motionReduce={{ animation: 'none' }}
          data-scene={sceneId}
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
        </Box>

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
