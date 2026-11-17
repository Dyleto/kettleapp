import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { LuCheck } from 'react-icons/lu';
import type { PerformedValues } from '@/shared/types';
import type { LastPerformance } from '@/domain/history/lastPerformance';
import { formatDuration } from '@/shared/utils/duration';
import { playCue } from '@/shared/feedback/sound';
import { buzz } from '@/shared/feedback/haptics';
import { ActionButton, Sheet } from '@/kit';
import { useCoachVoice } from '@/features/client/common/coach';
import type { GuidedStep } from '@/features/client/guided/steps';
import { useBlockClock } from '@/features/client/guided/useBlockClock';
import { readAmrap, type AmrapReading } from '@/features/client/guided/amrap';
import { firstGesture } from '@/features/client/guided/outline';
import {
  doneBefore,
  movementReached,
  movementsDone,
} from '@/features/client/guided/chipper';
import type {
  GuidedAction,
  GuidedState,
} from '@/features/client/guided/session';
import { Countdown } from './Countdown';
import { LimitChip } from './LimitChip';
import { ListScene } from './ListScene';

/** Ce qu'un chipper borné a donné : mouvements faits, temps au chrono. */
export interface ChipperResult {
  movements: number;
  seconds: number;
}

interface ChipperBlockProps {
  step: Extract<GuidedStep, { type: 'block' }>;
  state: GuidedState;
  act: (action: GuidedAction) => void;
  /** Le chrono part au montage : le décompte de l'ouverture vient de
   * tomber, ou ce bloc a déjà été lancé. */
  armed: boolean;
  onArm: () => void;
  onResult: (result: ChipperResult) => void;
  /** Où poser la puce du temps : la ligne du haut de la scène. */
  headerSlot: HTMLElement | null;
  lastPerformance?: Map<string, LastPerformance>;
  performed?: Record<string, PerformedValues>;
  onPerformedChange?: (key: string, next: PerformedValues) => void;
  nextBlock?: string;
}

/**
 * Un chipper ou un TimeCap borné : la liste qu'on écoule, et la limite qui
 * tombe.
 *
 * Le coach réglait une limite que l'écran ignorait : la liste se cochait
 * comme un bloc classique, sans chrono, et rien ne disait ni le temps ni où
 * l'on en était quand il était écoulé. La liste reste celle des séries — un
 * mouvement en grand, le bloc dessous — et le chrono vit autour d'elle :
 * « Lancer », la puce du temps qui descend, trois bips, puis la feuille
 * « Temps écoulé ».
 *
 * Deux fins, deux résultats. La liste écoulée avant la limite : le chrono
 * s'arrête à la dernière série, et c'est son temps. La limite d'abord : la
 * feuille propose le mouvement en cours, à confirmer, et le temps est la
 * limite.
 */
export const ChipperBlock = ({
  step,
  state,
  act,
  armed,
  onArm,
  onResult,
  headerSlot,
  lastPerformance,
  performed,
  onPerformedChange,
  nextBlock,
}: ChipperBlockProps) => {
  const limit = (step.block.durationMinutes ?? 0) * 60;
  const [launching, setLaunching] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  /** La liste s'est écoulée : le chrono reste arrêté sur son temps. */
  const [ended, setEnded] = useState(false);
  const [reading, setReading] = useState<AmrapReading>(() =>
    readAmrap(limit, 0)
  );
  const previousRef = useRef(reading);
  /** Le temps écoulé au dernier battement, en millisecondes. */
  const elapsedRef = useRef(0);

  const clock = useBlockClock({
    initialOffset: 0,
    armed,
    onBeat: (elapsed) => {
      elapsedRef.current = elapsed;
      const next = readAmrap(limit, elapsed);
      const previous = previousRef.current;
      previousRef.current = next;
      setReading(next);
      if (next.finished) {
        playCue('go');
        buzz('go');
        clock.stop();
        // Un repos en cours n'a plus de sens : la limite l'emporte.
        act({ type: 'endRest' });
        setTimeUp(true);
        return;
      }
      if (next.seconds !== previous.seconds && next.seconds <= 3) {
        playCue('tick');
        buzz('tick');
      }
    },
  });

  const start = () => {
    const first = readAmrap(limit, 0);
    previousRef.current = first;
    elapsedRef.current = 0;
    setReading(first);
    setLaunching(false);
    clock.start(0);
    onArm();
  };

  const listEnd = (done: string[]) => {
    if (!clock.running) return;
    clock.stop();
    setEnded(true);
    onResult({
      movements: movementsDone(step.sets, done),
      seconds: Math.floor(elapsedRef.current / 1000),
    });
  };

  const chip = (
    <LimitChip seconds={reading.seconds} live={clock.running || ended} />
  );
  const gesture = firstGesture(step.block, state.done);

  return (
    <>
      {headerSlot && createPortal(chip, headerSlot)}
      <ListScene
        step={step}
        state={state}
        act={act}
        lastPerformance={lastPerformance}
        performed={performed}
        onPerformedChange={onPerformedChange}
        nextBlock={nextBlock}
        capped={{
          waiting: !clock.running && !ended && !timeUp,
          onLaunch: () => setLaunching(true),
          onListEnd: listEnd,
          limitLabel: `limite ${formatDuration(limit)}`,
          chip,
        }}
      />

      {launching && (
        <Countdown
          title={gesture.title}
          detail={gesture.detail}
          onDone={start}
        />
      )}

      {timeUp && (
        <TimeUpSheet
          step={step}
          done={state.done}
          onConfirm={(movement) => {
            act({
              type: 'setDone',
              done: doneBefore(step.sets, state.done, movement),
            });
            onResult({ movements: movement - 1, seconds: limit });
            setTimeUp(false);
            setEnded(true);
            act({ type: 'next' });
          }}
        />
      )}
    </>
  );
};

/**
 * « Temps écoulé » : où la limite est tombée.
 *
 * Le mouvement en cours est proposé — le premier qui n'est pas coché — et se
 * corrige d'une touche : on oublie de toucher « Fait » au dernier burpee,
 * pas de savoir où l'on en était. Pas de « Passer » : la feuille pose une
 * question qui doit recevoir sa réponse, c'est elle que le coach lira.
 */
const TimeUpSheet = ({
  step,
  done,
  onConfirm,
}: {
  step: Extract<GuidedStep, { type: 'block' }>;
  done: readonly string[];
  onConfirm: (movement: number) => void;
}) => {
  const coach = useCoachVoice();
  const [movement, setMovement] = useState(() =>
    movementReached(step.sets, done)
  );
  // Un mouvement par ligne, dans l'ordre : son nom suffit, la dose est sur
  // la scène dessous.
  const movements = step.sets.filter(
    (set, i, all) =>
      all.findIndex((other) => other.exerciseOrder === set.exerciseOrder) === i
  );

  return (
    <Sheet label="Temps écoulé">
      <Text as="h2" fontSize="24px" fontWeight="750" lineHeight="1.08">
        Temps écoulé
      </Text>
      <Text color="fg.muted">
        Où t’es-tu arrêté&nbsp;? {coach.opening} verra le mouvement atteint et
        le temps.
      </Text>
      <VStack
        role="radiogroup"
        aria-label="Le mouvement atteint"
        align="stretch"
        gap={1.5}
      >
        {movements.map((set, i) => {
          const rank = i + 1;
          const picked = rank === movement;
          return (
            <HStack
              as="button"
              key={set.key}
              role="radio"
              aria-checked={picked}
              minH="48px"
              px={4}
              gap={3}
              borderRadius="lg"
              textAlign="left"
              bg={picked ? 'app.primary.bg' : 'bg.canvas'}
              color={rank < movement ? 'fg.muted' : 'fg'}
              boxShadow={
                picked ? 'inset 0 0 0 2px {colors.app.primary}' : undefined
              }
              onClick={() => setMovement(rank)}
            >
              <Box w="18px" flexShrink={0} color="session.rest">
                {rank < movement && <LuCheck size={18} />}
              </Box>
              <Text fontWeight="bold" flex={1} minW={0} lineClamp={1}>
                {set.name}
              </Text>
            </HStack>
          );
        })}
      </VStack>
      <Text textAlign="center" fontWeight="bold" data-reached>
        Mouvement {movement} sur {movements.length} · en cours
      </Text>
      <ActionButton size="xl" w="full" onClick={() => onConfirm(movement)}>
        Valider
      </ActionButton>
    </Sheet>
  );
};
