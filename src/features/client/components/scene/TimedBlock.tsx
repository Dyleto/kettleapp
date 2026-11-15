import { useEffect, useRef, useState } from 'react';
import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { LuChevronLeft, LuChevronRight, LuPlay } from 'react-icons/lu';
import type { BlockExercise } from '@/shared/types';
import { ActionButton } from '@/shared/components/ActionButton';
import { blockSupportsRepsOnly } from '@/features/program/constants';
import type { GuidedStep } from '../../guidedSteps';
import type { LastPerformance } from '../../lastPerformance';
import { playCue } from '../../sound';
import { useSoundSetting } from '../../useSoundSetting';
import { useScenePaused } from '../../guided/PauseContext';
import { useBlockClock } from '../../guided/useBlockClock';
import {
  clockFace,
  readClock,
  roundStart,
  type ClockReading,
  type TimedPlan,
} from '../../guided/clock';
import { blockTitle } from '../../guided/outline';
import { LANDSCAPE } from '../guided/media';
import { Countdown } from './Countdown';
import { Dots } from './Dots';
import { ExerciseLines } from './ExerciseLines';
import { Ring } from './Ring';

type RoundStep = Extract<GuidedStep, { type: 'round' }>;

interface TimedBlockProps {
  step: RoundStep;
  /**
   * L'horloge part dès le montage : le décompte de l'ouverture vient de
   * tomber, ou ce bloc a déjà été lancé.
   */
  armed: boolean;
  /**
   * Le premier départ. Le parent en a besoin pour la reprise : une pause sur
   * une horloge qui tourne se referme par un décompte, pas d'un coup.
   */
  onArm: () => void;
  /** Le tour a changé : l'horloge l'a fait passer, ou un geste. */
  onRound: (round: number) => void;
  /** Le dernier tour est tombé. */
  onFinish: () => void;
  /** Un toucher sur l'écran, horloge en marche. */
  onPause: () => void;
  /**
   * Revenir au bloc d'avant, tant que l'horloge attend ; absent au premier
   * écran. Pendant l'effort, aucun lien : on n'a rien à toucher.
   */
  onPrevious?: () => void;
  /** Le bloc suivant, « AMRAP 12 · 12 min » ; `null` au dernier bloc. */
  nextBlock: string | null;
  lastPerformance?: Map<string, LastPerformance>;
  onOpenDetail: (exercise: BlockExercise) => void;
}

const planOf = (step: RoundStep): TimedPlan => ({
  work: step.workSeconds ?? 60,
  rest: step.restSeconds ?? 0,
  rounds: step.rounds,
});

/** Au-delà, les points d'un tour ne tiennent plus sur un téléphone. */
const MAX_DOTS = 12;
/** Un balayage, et non un doigt qui bouge en touchant l'écran. */
const SWIPE = 50;
/** Ce qui reste un toucher : le pouce bouge toujours un peu. */
const TAP = 10;

const CORAL = 'var(--chakra-colors-session-work-fg)';
const AMBER = 'var(--chakra-colors-app-primary)';

const plural = (n: number, word: string) =>
  `${n}\u00A0${word}${n > 1 ? 's' : ''}`;

/**
 * Un bloc mené par l'horloge : EMOM, Every, Tabata, On-Off.
 *
 * Le temps est au centre, lisible à deux mètres, et l'écran ne demande rien
 * pendant l'effort : le seul bouton, « Lancer », disparaît au départ, et
 * toucher l'écran met en pause. Une seule horloge pour tout le bloc — voir
 * `clock.ts` — et c'est le tour qu'elle lit qui fait avancer la séance, pas
 * l'inverse : un téléphone resté verrouillé trois tours retrouve le bon.
 *
 * Monté avec l'ordre du bloc pour clé : il survit aux tours, son horloge
 * avec lui, et quitter le bloc la remet en attente.
 */
export const TimedBlock = ({
  step,
  armed,
  onArm,
  onRound,
  onFinish,
  onPause,
  onPrevious,
  nextBlock,
  lastPerformance,
  onOpenDetail,
}: TimedBlockProps) => {
  const plan = planOf(step);
  const paused = useScenePaused();
  const [sound] = useSoundSetting();
  const [launching, setLaunching] = useState(false);
  const [reading, setReading] = useState<ClockReading>(() =>
    readClock(plan, roundStart(plan, step.round))
  );
  /** La lecture précédente : les bips naissent de ce qui change. */
  const previousRef = useRef(reading);

  const clock = useBlockClock({
    initialOffset: roundStart(plan, step.round),
    armed,
    // Le battement. Il relit l'heure : un téléphone resté verrouillé trois
    // tours retrouve le bon, et la séance avance avec lui.
    onBeat: (elapsed) => {
      const next = readClock(plan, elapsed);
      const previous = previousRef.current;
      previousRef.current = next;
      setReading(next);
      if (next.finished) {
        playCue('go');
        navigator.vibrate?.([120, 80, 120]);
        clock.stop();
        onFinish();
        return;
      }
      if (next.round !== previous.round || next.phase !== previous.phase) {
        playCue('go');
        navigator.vibrate?.([120, 80, 120]);
      } else if (next.remaining !== previous.remaining && next.remaining <= 3) {
        playCue('tick');
        navigator.vibrate?.(150);
      }
      if (next.round !== previous.round) onRound(next.round);
    },
  });
  const running = clock.running;

  const start = () => {
    const offset = roundStart(plan, step.round);
    const first = readClock(plan, offset);
    previousRef.current = first;
    setReading(first);
    setLaunching(false);
    clock.start(offset);
    onArm();
  };

  // Se recaler d'un tour : après une interruption, l'horloge et le client ne
  // sont plus d'accord, et c'est le client qui sait. Le tour visé repart du
  // début ; au-delà du dernier, rien — finir un bloc d'un balayage
  // malheureux coûterait plus que de passer par la pause.
  const shift = (delta: number) => {
    const from = running ? reading.round : step.round;
    const target = Math.min(plan.rounds, Math.max(1, from + delta));
    if (target === from) return;
    const offset = roundStart(plan, target);
    const fresh = readClock(plan, offset);
    if (running) clock.rebase(offset);
    previousRef.current = fresh;
    setReading(fresh);
    onRound(target);
  };
  const shiftRef = useRef(shift);
  useEffect(() => {
    shiftRef.current = shift;
  });

  // Les flèches du clavier : sur une tablette posée avec un clavier, ou pour
  // qui ne balaie pas.
  useEffect(() => {
    if (paused || launching) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') shiftRef.current(1);
      if (event.key === 'ArrowLeft') shiftRef.current(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [paused, launching]);

  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const onPointerUp = (event: React.PointerEvent) => {
    const from = touchRef.current;
    touchRef.current = null;
    if (!from) return;
    // Un bouton de la scène — une consigne, une flèche — garde son geste.
    if ((event.target as HTMLElement).closest('button')) return;
    const dx = event.clientX - from.x;
    const dy = event.clientY - from.y;
    if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy) * 1.5) {
      shift(dx < 0 ? 1 : -1);
      return;
    }
    if (running && Math.abs(dx) < TAP && Math.abs(dy) < TAP) onPause();
  };

  const shown = running
    ? reading
    : readClock(plan, roundStart(plan, step.round));
  const workRest = blockSupportsRepsOnly(step.block.type);
  const resting = running && shown.phase === 'rest';
  const hot = running && !shown.finished && shown.remaining <= 3;
  const face = clockFace(shown, workRest);
  const roundLine = `Tour ${shown.round} sur ${plan.rounds}`;
  const upcoming =
    shown.phase === 'work' && plan.rest > 0
      ? 'Repos'
      : shown.round < plan.rounds
        ? `Tour ${shown.round + 1}`
        : 'Fin du bloc';
  const hotLine = `${upcoming} dans ${plural(shown.remaining, 'seconde')}`;
  const nextLine = `Ensuite · ${nextBlock ?? 'fin de la séance'}`;
  const timerLabel = running
    ? `${workRest ? (resting ? 'Repos, ' : 'Effort, ') : ''}${
        workRest ? roundLine.toLowerCase() : roundLine
      } — ${plural(shown.remaining, 'seconde')} restante${
        shown.remaining > 1 ? 's' : ''
      }`
    : `${roundLine} — ${face}, pas encore lancé`;
  const only = step.exercises.length === 1 ? step.exercises[0] : undefined;

  const track = (
    <RoundTrack
      round={shown.round}
      rounds={plan.rounds}
      running={running}
      onShift={shift}
    />
  );

  const lines = (
    <ExerciseLines
      exercises={step.exercises}
      lastPerformance={lastPerformance}
      running={running}
      onOpenDetail={onOpenDetail}
    />
  );

  return (
    <VStack
      flex={1}
      minH={0}
      align="stretch"
      gap={0}
      position="relative"
      // Le balayage horizontal est à nous ; le défilement vertical de la
      // liste reste au navigateur.
      css={{ touchAction: 'pan-y' }}
      onPointerDown={(event) => {
        touchRef.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        touchRef.current = null;
      }}
    >
      {/* Le fond change avec la phase, d'un bord à l'autre de la scène, en
          haut compris : posé derrière elle plutôt que porté par elle, il
          n'a pas à connaître la mise en page du parent. */}
      {workRest && running && (
        <Box
          position="absolute"
          inset="-200px 0 0 0"
          zIndex={-1}
          bg={resting ? 'session.restBg' : 'session.effortBg'}
          data-phase={resting ? 'rest' : 'work'}
          transition="background-color 0.5s"
          _motionReduce={{ transition: 'none' }}
          aria-hidden
        />
      )}

      {workRest ? (
        <VStack
          flex={1}
          minH={0}
          overflowY="auto"
          justify="center"
          gap={3}
          px={5}
          py={2}
          textAlign="center"
          css={{ [LANDSCAPE]: { gap: '4px' } }}
        >
          <Text
            fontSize="13px"
            fontWeight="800"
            letterSpacing="0.14em"
            textTransform="uppercase"
            color={resting ? 'session.rest.fg' : 'app.primary.fg'}
          >
            {resting ? 'Repos' : 'Effort'}
          </Text>
          <Box role="timer" aria-label={timerLabel}>
            <Text
              fontFamily="heading"
              fontSize="270px"
              fontWeight="800"
              fontStretch="76%"
              lineHeight="0.9"
              letterSpacing="-0.02em"
              fontVariantNumeric="tabular-nums"
              color={hot ? CORAL : resting ? 'session.rest.fg' : 'fg'}
              opacity={running ? 1 : 0.5}
              animation={hot ? 'clockPulse 1s ease-in-out infinite' : undefined}
              _motionReduce={{ animation: 'none' }}
              css={{ [LANDSCAPE]: { fontSize: '150px' } }}
            >
              {face}
            </Text>
          </Box>
          <VStack gap={1.5}>
            {resting ? (
              <Text fontFamily="heading" fontSize="40px" fontWeight="800">
                Souffle
              </Text>
            ) : only ? (
              <Text
                fontFamily="heading"
                fontSize={only.exercise.name.length > 14 ? '32px' : '40px'}
                fontWeight="800"
                lineHeight="1.15"
              >
                {only.exercise.name}
              </Text>
            ) : null}
            <Text color={hot ? CORAL : 'whiteAlpha.700'} fontWeight="600">
              {hot
                ? hotLine
                : resting
                  ? shown.round < plan.rounds
                    ? `Ensuite · ${
                        only ? `${only.exercise.name}, ` : ''
                      }tour ${shown.round + 1} sur ${plan.rounds}`
                    : nextLine
                  : roundLine}
            </Text>
          </VStack>
          {!only && !resting && lines}
        </VStack>
      ) : (
        <Box
          flex={1}
          minH={0}
          overflowY="auto"
          px={5}
          py={2}
          display="flex"
          flexDirection="column"
          justifyContent="center"
          gap={5}
          css={{
            [LANDSCAPE]: {
              flexDirection: 'row',
              alignItems: 'center',
              gap: '20px',
              paddingTop: 0,
              paddingBottom: 0,
            },
          }}
        >
          <Box
            role="timer"
            aria-label={timerLabel}
            alignSelf="center"
            borderRadius="full"
            animation={hot ? 'clockPulse 1s ease-in-out infinite' : undefined}
            _motionReduce={{ animation: 'none' }}
          >
            <Ring
              part={shown.length > 0 ? shown.remaining / shown.length : 0}
              size={step.exercises.length > 4 ? 220 : 300}
              landscapeSize={230}
              color={hot ? CORAL : AMBER}
            >
              <Text
                fontFamily="heading"
                fontSize={step.exercises.length > 4 ? '80px' : '108px'}
                fontWeight="800"
                fontStretch="76%"
                lineHeight="0.9"
                letterSpacing="-0.02em"
                fontVariantNumeric="tabular-nums"
                color={hot ? CORAL : 'fg'}
                css={{ [LANDSCAPE]: { fontSize: '82px' } }}
              >
                {face}
              </Text>
              <Text fontWeight="600" color={hot ? CORAL : 'fg.muted'}>
                {hot ? hotLine : roundLine}
              </Text>
            </Ring>
          </Box>
          <VStack
            align="stretch"
            gap={4}
            minW={0}
            css={{ [LANDSCAPE]: { gap: '8px' } }}
          >
            {/* Le nom du bloc est dans le haut de la scène ; il ne se
                répète ici que téléphone couché, où ce haut disparaît. */}
            <Text
              display="none"
              css={{ [LANDSCAPE]: { display: 'block' } }}
              fontSize="xs"
              letterSpacing="2px"
              textTransform="uppercase"
              fontWeight="800"
              color="session.work"
            >
              {step.blockLabel}
              {step.block.label ? ` · ${step.block.label}` : ''}
            </Text>
            {track}
            {lines}
          </VStack>
        </Box>
      )}

      {/* Le pied : « Lancer » tant que rien ne tourne, puis plus aucun
          bouton — on n'a rien à toucher pendant l'effort. */}
      <Box
        px={4}
        pt={2}
        pb={3}
        minH="52px"
        css={{ [LANDSCAPE]: { padding: '6px 12px' } }}
      >
        {!running ? (
          <VStack
            align="stretch"
            gap={0}
            // Couché, le lien passe à côté du bouton plutôt que dessous : la
            // hauteur manque, la largeur non.
            css={{
              [LANDSCAPE]: {
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: '16px',
              },
            }}
          >
            <ActionButton
              size="xl"
              w="full"
              onClick={() => setLaunching(true)}
              css={{ [LANDSCAPE]: { minHeight: '52px', flex: 1 } }}
            >
              <LuPlay size={20} />
              Lancer
            </ActionButton>
            {onPrevious && (
              <Box
                as="button"
                alignSelf="flex-start"
                minH="44px"
                display="inline-flex"
                alignItems="center"
                fontSize="13px"
                fontWeight="bold"
                color="fg.muted"
                onClick={onPrevious}
                flexShrink={0}
                _hover={{ color: 'fg' }}
              >
                Bloc précédent
              </Box>
            )}
          </VStack>
        ) : workRest ? (
          <HStack justify="center">{track}</HStack>
        ) : (
          <Text
            textAlign="center"
            fontSize="sm"
            color="fg.muted"
            minH="44px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {hot && sound ? 'Trois bips, puis un long' : nextLine}
          </Text>
        )}
      </Box>

      {launching && (
        <Countdown
          title={blockTitle(step.block)}
          detail={roundLine}
          onDone={start}
        />
      )}
    </VStack>
  );
};

/**
 * Où l'on en est dans le bloc, avec de quoi se recaler.
 *
 * Les flèches sont l'autre chemin du balayage : un geste qu'on trace du
 * doigt n'est pas à la portée de tout le monde — un lecteur d'écran ne
 * balaie pas l'application, il parcourt ses boutons. Discrètes, puisque le
 * format ne demande aucun geste pendant l'effort.
 */
const RoundTrack = ({
  round,
  rounds,
  running,
  onShift,
}: {
  round: number;
  rounds: number;
  running: boolean;
  onShift: (delta: number) => void;
}) => (
  <HStack justify="center" gap={1}>
    <TrackArrow
      label="Tour précédent"
      hidden={round <= 1}
      onClick={() => onShift(-1)}
    >
      <LuChevronLeft size={18} />
    </TrackArrow>
    {rounds <= MAX_DOTS ? (
      <Dots
        marks={Array.from({ length: rounds }, (_, i) =>
          i < round - 1 ? 'done' : i === round - 1 && running ? 'now' : 'todo'
        )}
      />
    ) : (
      // Plus de douze tours : des points ne tiendraient pas, une barre dit
      // la même chose.
      <Box
        flex={1}
        maxW="240px"
        h="6px"
        borderRadius="3px"
        bg="bg.surface"
        overflow="hidden"
        aria-hidden
      >
        <Box
          h="100%"
          w={`${((round - 1) / rounds) * 100}%`}
          bg="session.rest"
          borderRadius="3px"
        />
      </Box>
    )}
    <TrackArrow
      label="Tour suivant"
      hidden={round >= rounds}
      onClick={() => onShift(1)}
    >
      <LuChevronRight size={18} />
    </TrackArrow>
  </HStack>
);

const TrackArrow = ({
  label,
  hidden,
  onClick,
  children,
}: {
  label: string;
  hidden: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <Box
    as="button"
    aria-label={label}
    aria-hidden={hidden || undefined}
    tabIndex={hidden ? -1 : undefined}
    visibility={hidden ? 'hidden' : 'visible'}
    w="44px"
    h="44px"
    display="grid"
    placeItems="center"
    flexShrink={0}
    color="fg.muted"
    onClick={onClick}
    _hover={{ color: 'fg' }}
  >
    {children}
  </Box>
);
