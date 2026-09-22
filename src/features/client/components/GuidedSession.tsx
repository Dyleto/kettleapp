import { BlockExercise, PerformedValues, Session, SessionBlock } from '@/types';
import {
  buildGuidedSteps,
  roundDose,
  type GuidedSet,
  type GuidedStep,
} from '../guidedSteps';
import { useCountdown } from '../useCountdown';
import { BlockCard } from '@/features/program/components/BlockCard';
import {
  BLOCK_ACCENT_COLOR,
  blockDefinesOwnMetrics,
  blockHasClock,
  getBlockAccent,
  prescribedSetLabels,
  restBetweenSetsOf,
} from '@/features/program/constants';
import { PerformedFields } from './PerformedFields';
import {
  formatLastPerformance,
  LastPerformance,
  performedKey,
} from '../lastPerformance';
import { Box, HStack, Button, Input, VStack, Text } from '@chakra-ui/react';
import VideoPlayer from '@/components/VideoPlayer';
import { hitArea } from '@/components/hitArea';
import { formatCountdown } from '@/utils/formatters';
import { formatDuration } from '@/utils/duration';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuCheck, LuInfo, LuTimer, LuX } from 'react-icons/lu';
import { countRecorded, writeProgress, readProgress } from '../sessionProgress';

interface GuidedSessionProps {
  session: Session;
  onExit: () => void;
  onFinish: () => void;
  lastPerformance?: Map<string, LastPerformance>;
  /**
   * What has already been recorded, and the means to add to it — the same
   * state as the wrap-up form. From the field: "a shame you cannot record
   * loads while you go." So you record where you are, and the wrap-up finds
   * what was entered instead of asking for it again.
   */
  performed?: Record<string, PerformedValues>;
  onPerformedChange?: (key: string, next: PerformedValues) => void;
}

interface TimerProps {
  duration: number;
  /**
   * Provided when the clock leads — an imposed rest, a timed round: it moves
   * on by itself, that is the format. Absent when it merely accompanies: a
   * timed set stops and waits, because nobody wants to watch the page change
   * under them while they finish their last rep.
   */
  onComplete?: () => void;
  couleur: string;
  /** The track under the gauge — darker on a light background. */
  track?: string;
  /** What reads to the left of the time: the block and the round, "Repos"… */
  title?: React.ReactNode;
  holdLabel?: string;
  /**
   * Smaller when it sits above a list: in an AMRAP the clock matters, but the
   * list of movements is what you came to read.
   */
  compact?: boolean;
  /**
   * `false` makes the clock wait for a tap.
   *
   * A rest starts on its own — it was triggered by the gesture that ended the
   * set. A round does not: the client has to pick up the bell first.
   */
  autoStart?: boolean;
  /** Called on the very first start, never on a resume. */
  onStart?: () => void;
}

// This is the only screen used while training, the one where losing your
// place is least affordable: an incoming call, or a screen locked too long,
// must not send you back to step 1 of a session that has forty.
//
// The position joins the loads in a single durable record — see
// `sessionProgress`. They used to be separate, filed in two memories with
// different lifetimes: the app kept what can be found again and lost what
// cannot.
const readSavedIndex = (sessionId: string): number =>
  readProgress(sessionId)?.step ?? 0;

const writeSavedIndex = (sessionId: string, index: number) =>
  writeProgress(sessionId, { step: index });

/**
 * The time, and the gauge draining.
 *
 * The countdown used to live in a ring. Two things condemned it. A length
 * reads faster than an angle out of the corner of your eye — and that is
 * exactly the use: a glance between two reps, the phone on the floor. And the
 * ring spoke a language the screen used nowhere else, while session progress
 * is already a bar, at the top. The screen now has a single vocabulary.
 *
 * What the ring did well is kept: between two seconds the figure does not
 * move, and a stopwatch you cannot tell is running is worse than no stopwatch
 * at all. The gauge flows over one second. When paused, no transition — a
 * pause must be visible at once, not slide on for another second.
 */
/**
 * A phone lying flat.
 *
 * We do not target "landscape" on its own: a tablet on its side has 800 px of
 * height and needs nothing. Height is what is missing, not width — 390 px on
 * an iPhone, of which guided mode's chrome took 186, nearly half the screen
 * for three bars and two buttons.
 */
const PAYSAGE = '@media (orientation: landscape) and (max-height: 520px)';

const Timer = ({
  duration,
  onComplete,
  couleur,
  track = 'whiteAlpha.200',
  title,
  holdLabel,
  compact = false,
  autoStart = true,
  onStart,
}: TimerProps) => {
  const { remaining, isRunning, pause, resume } = useCountdown(duration, {
    onComplete,
    autoStart,
  });
  const isDone = remaining === 0;
  // Never started, as opposed to started and paused: the two look alike on a
  // stopped clock but do not say the same thing, and what has to be said
  // first is « this is waiting for you ».
  const [started, setStarted] = useState(autoStart);

  useEffect(() => {
    if (remaining > 0 && remaining <= 3) {
      navigator.vibrate?.(150);
    }
  }, [remaining]);

  // A countdown that does not hand over by itself announces once, plainly:
  // nobody is looking at the screen at that moment.
  useEffect(() => {
    if (isDone && !onComplete) {
      navigator.vibrate?.([120, 80, 120]);
    }
  }, [isDone, onComplete]);

  const lu = formatCountdown(remaining);
  const part =
    duration > 0 ? Math.max(0, Math.min(1, remaining / duration)) : 0;

  return (
    <Box
      as="button"
      w="full"
      textAlign="left"
      onClick={
        isDone
          ? undefined
          : () => {
              if (isRunning) return pause();
              if (!started) {
                setStarted(true);
                onStart?.();
              }
              resume();
            }
      }
      cursor={isDone ? 'default' : 'pointer'}
      // The remaining time is part of the name: without it, someone who
      // cannot see the screen may pause without ever knowing where they are.
      aria-label={
        isDone
          ? 'Temps écoulé'
          : !started
            ? `Lancer le décompte — ${lu}`
            : `${isRunning ? 'Mettre en pause' : 'Reprendre le décompte'} — ${lu} restant`
      }
    >
      <HStack justify="space-between" align="flex-end" gap={3}>
        {/* The hint sits under the title rather than under the gauge: the
            left column is shorter than the figure on the right, so it costs
            no height at all. Adding a line below cost 20 px, which is what a
            phone lying flat does not have. */}
        <Box minW={0}>
          {title}
          {!isDone && !isRunning && (
            <Text fontSize="2xs" color={couleur} opacity={0.75} mt={1}>
              {started ? 'Toucher pour reprendre' : 'Toucher pour lancer'}
            </Text>
          )}
        </Box>
        <Text
          fontSize={compact ? '40px' : '72px'}
          fontWeight="800"
          lineHeight="0.85"
          letterSpacing={compact ? '-1px' : '-3px'}
          fontVariantNumeric="tabular-nums"
          color={couleur}
          opacity={isRunning || isDone ? 1 : 0.5}
          flexShrink={0}
        >
          {lu}
        </Text>
      </HStack>

      <Box
        mt={compact ? 2 : 3}
        h={compact ? '6px' : '10px'}
        borderRadius="full"
        bg={track}
        overflow="hidden"
      >
        <Box
          h="100%"
          borderRadius="full"
          bg={couleur}
          style={{
            width: `${part * 100}%`,
            transition: isRunning ? 'width 1s linear' : 'none',
          }}
        />
      </Box>

      {isDone && holdLabel ? (
        <Text fontSize="sm" color={couleur} opacity={0.75} mt={2}>
          {holdLabel}
        </Text>
      ) : null}
    </Box>
  );
};

/**
 * The steps grouped by block, in order.
 *
 * Thirty two-pixel dashes cannot be read: you know neither where you are nor
 * how much is left. Three segments — warm-up, EMOM, AMRAP — read at a glance,
 * and the client reasons in blocks, not in pages.
 *
 * Each segment's width follows its step count: a twelve-page EMOM is wider
 * than a two-page warm-up. Equal segments would lie about what is left.
 */
/**
 * What a step weighs in the bar: the time it asks for.
 *
 * It used to weigh pages, and it lied by a factor of ten. Measured on the
 * test session: the twelve-minute AMRAP got 24 px, the EMOM 239 — the bar
 * announced the session was 85 % done by the end of the EMOM, when in lived
 * time the two blocks are even. A client looking at it after the EMOM thought
 * they had finished.
 *
 * The coach gives the duration where it is part of the format: a round's
 * interval, an AMRAP's length. We take it as given. Elsewhere — a set, a rung
 * — they do not give it, and we count one minute per set. That is an
 * approximation, and a deliberate one: an EMOM interval IS a minute, and a
 * set with its rest is worth about as much. It is infinitely better than
 * counting how many times someone taps "Suivant".
 */
const weightOf = (step: GuidedStep): number => {
  if (step.type === 'rest') return step.duration / 60;
  if (step.type === 'round')
    return (step.workSeconds ?? 60) / 60 + (step.restSeconds ?? 0) / 60;
  // A loop carries its duration; a list, its sets.
  if (step.shape === 'loop')
    return Math.max(1, step.block.durationMinutes ?? step.sets.length);
  return Math.max(1, step.sets.length);
};

const decouperEnBlocs = (steps: GuidedStep[]) => {
  const blockRuns: {
    label: string;
    start: number;
    /** Number of steps — what makes the fill advance. */
    size: number;
    /** What the block represents — what makes the segment's width. */
    weight: number;
  }[] = [];
  steps.forEach((step, i) => {
    const dernier = blockRuns[blockRuns.length - 1];
    if (dernier && dernier.label === step.blockLabel) {
      dernier.size += 1;
      dernier.weight += weightOf(step);
      return;
    }
    blockRuns.push({
      label: step.blockLabel,
      start: i,
      size: 1,
      weight: weightOf(step),
    });
  });
  return blockRuns;
};

/**
 * A countdown offered rather than imposed.
 *
 * The page-by-page flow gave a full-screen stopwatch to every timed set and
 * every rest. It is that staging the field feedback refused — "not 7 reps
 * back squat, then 120 s rest, then 6 reps" — not the stopwatch itself, which
 * was useful. Removing it along with the screen would throw out the useful
 * thing with its bad presentation.
 *
 * So it lives under the line that prescribes it: "2 min" for the work,
 * "45 s rest" for what follows. You start it when you get there, and it turns
 * back into a button once done — because three sets remain.
 */
const OnDemandTimer = ({
  duration,
  label,
  couleur,
}: {
  duration: number;
  label: string;
  couleur: string;
}) => {
  const [isCurrent, setEnCours] = useState(false);

  if (isCurrent)
    return (
      <Box pl={4} py={1}>
        <Timer
          duration={duration}
          couleur={couleur}
          onComplete={() => {
            // Nobody is looking at the screen at that moment: we say it to
            // the wrist. `Timer` only does so itself without `onComplete`.
            navigator.vibrate?.([120, 80, 120]);
            setEnCours(false);
          }}
          compact
        />
      </Box>
    );

  return (
    <Box pl={4}>
      <Box
        as="button"
        onClick={() => setEnCours(true)}
        aria-label={`Lancer le décompte — ${label}`}
        minH="44px"
        display="flex"
        alignItems="center"
        fontSize="xs"
        color={couleur}
        fontWeight="bold"
        _hover={{ opacity: 0.8 }}
      >
        <HStack gap={1.5}>
          <LuTimer size={13} />
          <Text as="span">{label}</Text>
        </HStack>
      </Box>
    </Box>
  );
};

/**
 * One round, with its clock.
 *
 * Three things the page-by-page flow could not say, and which are all you
 * need in the middle of an EMOM:
 *
 *   — which round you are in (ten identical screens did not say),
 *   — how much of the minute is left (the clock was missing from the one
 *     format defined by it),
 *   — what is left to do in this round (you only saw one movement).
 *
 * Tabata and On-Off additionally impose their rest: the clock then chains
 * work and rest by itself. On an EMOM the rest is whatever is left of the
 * interval — it has no page, because it has no duration of its own.
 */
const Round = ({
  step,
  onDone,
  lastPerformance,
  onOuvrirDetail,
  armed,
  onArm,
}: {
  step: Extract<GuidedStep, { type: 'round' }>;
  /** The round is over: we move on. */
  onDone: () => void;
  lastPerformance?: Map<string, LastPerformance>;
  onOuvrirDetail: (ex: BlockExercise) => void;
  /**
   * Whether this block's clock has already been started.
   *
   * The first start is a decision, the chaining is the format. Asking for a
   * tap on every round would destroy an EMOM — "every minute on the minute"
   * means the minutes follow each other, not that you restart them. So the
   * tap is asked once per block, and the rounds then run as written.
   */
  armed: boolean;
  onArm: () => void;
}) => {
  const [phase, setPhase] = useState<'travail' | 'rest'>('travail');
  const resting = phase === 'rest';
  const duration = resting ? step.restSeconds : step.workSeconds;

  // Work done, we move to the rest if one is imposed — otherwise the round
  // is over and the next starts, which is the definition of the format.
  const finDePhase = () => {
    if (!resting && step.restSeconds) {
      setPhase('rest');
      return;
    }
    navigator.vibrate?.([120, 80, 120]);
    onDone();
  };

  return (
    <VStack
      flex={1}
      align="stretch"
      gap={4}
      px={5}
      py={2}
      overflowY="auto"
      // Lying flat, these gutters are worth 16 px each out of 360 px of
      // height. The targets keep their 44 px — we do not shrink what gets
      // touched with sweaty hands — it is the empty space that gives.
      css={{ [PAYSAGE]: { gap: '10px', paddingTop: 0, paddingBottom: 0 } }}
    >
      {duration ? (
        <Timer
          // The key carries the phase as well as the round: without it, the
          // rest countdown would resume where the work one stopped.
          key={`${step.round}-${phase}`}
          duration={duration}
          autoStart={armed}
          onStart={onArm}
          couleur={resting ? 'session.rest' : 'fg'}
          onComplete={finDePhase}
          title={
            <VStack align="start" gap={0.5}>
              <Text
                fontSize="xs"
                letterSpacing="2px"
                textTransform="uppercase"
                fontWeight="800"
                color={resting ? 'session.rest' : 'session.work'}
              >
                {resting ? 'Repos' : step.blockLabel}
              </Text>
              {/* The landmark that was missing. Without it, an EMOM's ten rounds
              displayed identically and nothing said which one you were
              living. */}
              <Text fontSize="lg" fontWeight="800" lineHeight="1.1">
                Tour {step.round}&nbsp;/&nbsp;{step.rounds}
              </Text>
            </VStack>
          }
        />
      ) : (
        <VStack align="start" gap={0.5}>
          <Text
            fontSize="xs"
            letterSpacing="2px"
            textTransform="uppercase"
            fontWeight="800"
            color={resting ? 'session.rest' : 'session.work'}
          >
            {resting ? 'Repos' : step.blockLabel}
          </Text>
          {/* The landmark that was missing. Without it, an EMOM's ten rounds
              displayed identically and nothing said which one you were
              living. */}
          <Text fontSize="lg" fontWeight="800" lineHeight="1.1">
            Tour {step.round}&nbsp;/&nbsp;{step.rounds}
          </Text>
        </VStack>
      )}

      {/* What there is to do in this round — all of it, not one movement at
          a time. During an imposed rest the list stays: it is what you
          reread to get ready for the next round. */}
      <VStack align="stretch" gap={0} opacity={resting ? 0.6 : 1}>
        {step.exercises.map((ex, i) => {
          const aDuDetail =
            !!ex.note?.trim() ||
            !!ex.exercise.description?.trim() ||
            !!ex.exercise.videoUrl?.trim();
          const last = formatLastPerformance(
            lastPerformance?.get(ex.exercise._id)
          );
          return (
            <Box
              key={`${ex.order}-${ex.exercise._id}`}
              borderTopWidth={i === 0 ? 0 : '1px'}
              borderColor="whiteAlpha.100"
              py={3}
            >
              <HStack justify="space-between" align="baseline" gap={3}>
                {aDuDetail ? (
                  <Box
                    as="button"
                    textAlign="left"
                    minW={0}
                    aria-label={`Voir la consigne — ${ex.exercise.name}`}
                    onClick={() => onOuvrirDetail(ex)}
                    css={hitArea(44)}
                  >
                    <HStack gap={1.5} align="center">
                      <Text fontSize="lg" fontWeight="bold">
                        {ex.exercise.name}
                      </Text>
                      <Box color="app.primary" flexShrink={0}>
                        <LuInfo size={15} />
                      </Box>
                    </HStack>
                  </Box>
                ) : (
                  <Text fontSize="lg" fontWeight="bold" minW={0}>
                    {ex.exercise.name}
                  </Text>
                )}
                <Text
                  fontSize="xl"
                  fontWeight="800"
                  fontFamily="mono"
                  flexShrink={0}
                >
                  {roundDose(step.block, ex) || '—'}
                </Text>
              </HStack>
              {last && (
                <Text fontSize="xs" color="fg.muted">
                  la dernière fois&nbsp;: {last}
                </Text>
              )}
            </Box>
          );
        })}
      </VStack>

      {/* On the last round only: elsewhere the counter already says rounds
          remain, and announcing "next: round 4" teaches nothing. */}
      {step.nextLabel && (
        <Text fontSize="xs" color="fg.muted" textAlign="center">
          dernier tour — nextUp&nbsp;: {step.nextLabel}
        </Text>
      )}
    </VStack>
  );
};

/**
 * The rest between two sets, laid inside the list.
 *
 * It used to be a full-screen panel: tick "Fait", and the block you were
 * reading vanished behind a wall of teal. From the field: "not pleasant to
 * suddenly get a full-page REST". It is also the same mistake the page-by-
 * page flow made everywhere else — staging a wait as an event.
 *
 * A rest is not an event. It is a gap between two sets, and it belongs where
 * that gap is: between the set just ticked and the one coming. The list
 * stays readable throughout — you can see what is left, reread the next
 * movement's dose, correct a load — which is exactly what people do while
 * they wait.
 */
const RestStrip = ({
  duration,
  nextUp,
  onDone,
}: {
  duration: number;
  nextUp: string;
  onDone: () => void;
}) => (
  <HStack
    gap={3}
    px={4}
    py={2.5}
    my={1}
    minH="56px"
    borderRadius="lg"
    bg="session.rest/15"
    borderLeftWidth="3px"
    borderLeftColor="session.rest"
  >
    <Box flex={1} minW={0}>
      <Timer
        duration={duration}
        compact
        couleur="session.rest"
        track="blackAlpha.400"
        onComplete={onDone}
        title={
          <Text
            fontSize="2xs"
            letterSpacing="2px"
            textTransform="uppercase"
            fontWeight="800"
            color="session.rest"
          >
            Repos
            {nextUp ? (
              <Text
                as="span"
                color="fg.muted"
                letterSpacing="normal"
                textTransform="none"
                fontWeight="normal"
              >
                {' '}
                · ensuite {nextUp}
              </Text>
            ) : null}
          </Text>
        }
      />
    </Box>
    {/* Skipping stays one tap away, and keeps its 44 px: it is the gesture of
        someone already back on the bar. */}
    <Box
      as="button"
      onClick={onDone}
      flexShrink={0}
      alignSelf="center"
      color="session.rest"
      fontSize="sm"
      fontWeight="bold"
      css={hitArea(44)}
      _hover={{ color: 'fg' }}
    >
      Passer
    </Box>
  </HStack>
);

/**
 * A block you tick off, set by set.
 *
 * This was guided mode's broken half: the prescription card, with input
 * fields stuck onto it. Nothing could be ticked, nothing advanced. Measured
 * on a seven-rung pyramid: one 14 px line and 511 px of black. A sheet of
 * paper did better — you could cross things out on it.
 *
 * Exactly one set is "current". It is the only one written large, and the
 * only one carrying a field: hierarchy comes from state, not from an
 * arbitrary typographic choice, and the list becomes readable again because
 * a form no longer cuts it at every line.
 */
const BlockList = ({
  block,
  sets,
  done,
  current,
  performed,
  onPerformedChange,
  lastPerformance,
  onOuvrirDetail,
  rest,
  onRestDone,
  onUndo,
}: {
  block: SessionBlock;
  sets: GuidedSet[];
  done: Set<string>;
  current: GuidedSet | undefined;
  performed?: Record<string, PerformedValues>;
  onPerformedChange?: (key: string, next: PerformedValues) => void;
  lastPerformance?: Map<string, LastPerformance>;
  onOuvrirDetail: (ex: BlockExercise) => void;
  /** The rest under way, and the set it follows. */
  rest: { afterKey: string; duration: number; nextUp: string } | null;
  onRestDone: () => void;
  /** Untick a set: it goes back to being something to do. */
  onUndo: (key: string) => void;
}) => {
  /**
   * The ticked set currently reopened, if any.
   *
   * One at a time: reopening two would put two editable loads on screen and
   * bring back the very thing the list was rewritten to remove — a form at
   * every line.
   */
  const [opened, setOpened] = useState<string | null>(null);

  /** Whether this movement has anything to show beyond its dose. */
  const aDuDetailDe = (e: GuidedSet) =>
    !!e.exercise.note?.trim() ||
    !!e.exercise.exercise.description?.trim() ||
    !!e.exercise.exercise.videoUrl?.trim();
  /**
   * The set's rank within its exercise, when there is more than one.
   *
   * A pyramid does not do series: it climbs and comes back down rungs, and
   * that is the word the coach uses in the editor.
   */
  const rankOf = (e: GuidedSet) =>
    e.total > 1
      ? `${blockDefinesOwnMetrics(block.type) ? 'palier' : 'série'} ${e.rank} / ${e.total}`
      : '';

  /** What was recorded on this precise set. */
  const valueOfSet = (e: GuidedSet) =>
    performed?.[performedKey(e.blockOrder, e.exerciseOrder)]?.sets?.[
      e.rank - 1
    ];

  const write = (e: GuidedSet, champ: 'weight' | 'reps', brut: string) => {
    if (!onPerformedChange) return;
    const key = performedKey(e.blockOrder, e.exerciseOrder);
    const sets = [...(performed?.[key]?.sets ?? [])];
    while (sets.length < e.rank) sets.push({});
    const count =
      brut.trim() === '' ? undefined : Number(brut.replace(',', '.'));
    sets[e.rank - 1] = {
      ...sets[e.rank - 1],
      [champ]: Number.isFinite(count) ? count : undefined,
    };
    onPerformedChange(key, { sets });
  };

  return (
    <VStack align="stretch" gap={1} flex={1} px={5} py={2} overflowY="auto">
      {sets.map((e) => {
        const fait = done.has(e.key);
        const isCurrent = current?.key === e.key;
        const value = valueOfSet(e);
        const rank = rankOf(e);
        // The rest belongs to the set it follows, so it is drawn right after
        // it — the gap is where the gap is.
        const restHere =
          rest && rest.afterKey === e.key ? (
            <RestStrip
              key={`rest-${e.key}`}
              duration={rest.duration}
              nextUp={rest.nextUp}
              onDone={onRestDone}
            />
          ) : null;

        if (isCurrent) {
          const last = formatLastPerformance(
            lastPerformance?.get(e.exercise.exercise._id)
          );
          const aDuDetail =
            !!e.exercise.note?.trim() ||
            !!e.exercise.exercise.description?.trim() ||
            !!e.exercise.exercise.videoUrl?.trim();
          return (
            <Fragment key={e.key}>
              <Box
                bg="surface.card"
                borderWidth="1px"
                borderColor="app.primary"
                borderRadius="xl"
                p={4}
                my={1}
              >
                <VStack align="stretch" gap={3}>
                  <HStack justify="space-between" align="baseline" gap={3}>
                    {aDuDetail ? (
                      <Box
                        as="button"
                        textAlign="left"
                        minW={0}
                        aria-label={`Voir la consigne — ${e.name}`}
                        onClick={() => onOuvrirDetail(e.exercise)}
                        css={hitArea(44)}
                      >
                        <HStack gap={1.5} align="center">
                          <Text fontSize="xl" fontWeight="800">
                            {e.name}
                          </Text>
                          <Box color="app.primary" flexShrink={0}>
                            <LuInfo size={15} />
                          </Box>
                        </HStack>
                      </Box>
                    ) : (
                      <Text fontSize="xl" fontWeight="800" minW={0}>
                        {e.name}
                      </Text>
                    )}
                    <Text
                      fontSize="2xl"
                      fontWeight="800"
                      fontFamily="mono"
                      flexShrink={0}
                    >
                      {e.dose || '\u2014'}
                    </Text>
                  </HStack>

                  {(rank || onPerformedChange) && (
                    <HStack justify="space-between" align="center" gap={3}>
                      <Text fontSize="sm" color="fg.muted">
                        {rank}
                      </Text>
                      {onPerformedChange && (
                        <HStack gap={2}>
                          <Text fontSize="sm" color="fg.muted">
                            Fait à
                          </Text>
                          <Input
                            aria-label={`Poids utilisé, en kilos — ${e.name} ${rank}`}
                            inputMode="decimal"
                            value={value?.weight ?? ''}
                            onChange={(ev) =>
                              write(e, 'weight', ev.target.value)
                            }
                            w="76px"
                            minH="44px"
                            textAlign="center"
                            fontFamily="mono"
                            fontWeight="bold"
                            placeholder="—"
                          />
                          <Text fontSize="sm" color="fg.muted">
                            kg
                          </Text>
                        </HStack>
                      )}
                    </HStack>
                  )}

                  {/* A set whose dose is a duration needs timing. The automatic
                    rest covers the rest, not the work: replacing the
                    prescription card with the sets quietly removed the timer
                    from "2 min of skipping rope". Offered, never imposed —
                    you start it when you get there. */}
                  {e.exercise.duration ? (
                    <Box ml={-4}>
                      <OnDemandTimer
                        duration={e.exercise.duration}
                        label={formatDuration(e.exercise.duration)}
                        couleur="app.primary"
                      />
                    </Box>
                  ) : null}

                  <HStack justify="space-between" align="center" gap={3}>
                    {last ? (
                      <Text fontSize="xs" color="fg.muted">
                        la dernière fois&nbsp;: {last}
                      </Text>
                    ) : (
                      <Box />
                    )}
                    {/* What "Fait" triggers: without this line, the full-screen
                      rest arrives as a surprise. */}
                    {e.restAfter && (
                      <HStack gap={1.5} color="session.rest" flexShrink={0}>
                        <LuTimer size={13} />
                        <Text fontSize="xs" fontWeight="bold">
                          puis {formatDuration(e.restAfter)} de repos
                        </Text>
                      </HStack>
                    )}
                  </HStack>
                </VStack>
              </Box>
              {restHere}
            </Fragment>
          );
        }

        // A ticked set reopens: you reread it, you fix its load, you do it
        // again. It used to be a dead line — and the three things people
        // actually want from it have nothing to do with the cursor, so they
        // happen in place rather than by moving it.
        if (fait && opened === e.key) {
          return (
            <Fragment key={e.key}>
              <VStack
                align="stretch"
                gap={2.5}
                bg="surface.card"
                borderWidth="1px"
                borderColor="session.rest"
                borderRadius="xl"
                px={4}
                py={3}
                my={1}
              >
                <HStack gap={3}>
                  <Box color="session.rest" flexShrink={0}>
                    <LuCheck size={16} strokeWidth={3} />
                  </Box>
                  <Text fontSize="md" fontWeight="bold" minW={0} lineClamp={1}>
                    {e.name}
                  </Text>
                  {rank && (
                    <Text fontSize="sm" color="fg.muted" flexShrink={0}>
                      · {rank}
                    </Text>
                  )}
                  <Box flex={1} />
                  <Text
                    fontSize="sm"
                    color="fg.muted"
                    fontFamily="mono"
                    flexShrink={0}
                  >
                    {e.dose}
                  </Text>
                </HStack>

                <HStack justify="space-between" align="center" gap={3}>
                  {onPerformedChange ? (
                    <HStack gap={2}>
                      <Text fontSize="sm" color="fg.muted">
                        Fait à
                      </Text>
                      <Input
                        aria-label={`Corriger le poids, en kilos — ${e.name} ${rank}`}
                        inputMode="decimal"
                        value={value?.weight ?? ''}
                        onChange={(ev) => write(e, 'weight', ev.target.value)}
                        w="76px"
                        minH="44px"
                        textAlign="center"
                        fontFamily="mono"
                        fontWeight="bold"
                        placeholder="—"
                      />
                      <Text fontSize="sm" color="fg.muted">
                        kg
                      </Text>
                    </HStack>
                  ) : (
                    <Box />
                  )}
                  {/* Undoing is not correcting: someone who fixes a typo does
                      not want the set back in front of them, and someone who
                      redoes it does. Two gestures, two buttons. */}
                  <Box
                    as="button"
                    onClick={() => onUndo(e.key)}
                    color="app.primary"
                    fontSize="sm"
                    fontWeight="bold"
                    flexShrink={0}
                    css={hitArea(44)}
                  >
                    Refaire
                  </Box>
                </HStack>

                <HStack justify="space-between" align="center" gap={3}>
                  {aDuDetailDe(e) ? (
                    <Box
                      as="button"
                      onClick={() => onOuvrirDetail(e.exercise)}
                      color="app.primary"
                      fontSize="sm"
                      css={hitArea(32)}
                    >
                      Revoir le mouvement
                    </Box>
                  ) : (
                    <Box />
                  )}
                  <Box
                    as="button"
                    onClick={() => setOpened(null)}
                    color="fg.muted"
                    fontSize="sm"
                    css={hitArea(32)}
                  >
                    Fermer
                  </Box>
                </HStack>
              </VStack>
              {restHere}
            </Fragment>
          );
        }

        return (
          <Fragment key={e.key}>
            <HStack
              gap={3}
              minH="44px"
              px={4}
              py={2}
              opacity={fait ? 1 : 0.75}
              {...(fait
                ? {
                    as: 'button' as const,
                    w: 'full',
                    textAlign: 'left' as const,
                    'aria-expanded': false,
                    'aria-label': `Rouvrir ${e.name} ${rank}`,
                    onClick: () => setOpened(e.key),
                    _hover: { bg: 'whiteAlpha.50' },
                    borderRadius: 'lg',
                  }
                : {})}
            >
              <Box
                color={fait ? 'session.rest' : 'whiteAlpha.400'}
                flexShrink={0}
              >
                {fait ? (
                  <LuCheck size={16} strokeWidth={3} />
                ) : (
                  <Box
                    w="16px"
                    h="16px"
                    borderRadius="full"
                    borderWidth="1.5px"
                    borderColor="whiteAlpha.400"
                  />
                )}
              </Box>
              {/* The name may be truncated, the rank may not: the rank is what
                says where you are, and "Fentes marchées · série…" teaches nothing. */}
              <Text fontSize="sm" color="fg.muted" minW={0} lineClamp={1}>
                {e.name}
              </Text>
              {rank && (
                <Text
                  fontSize="sm"
                  color="fg.muted"
                  opacity={0.7}
                  flexShrink={0}
                >
                  · {rank}
                </Text>
              )}
              <Box flex={1} />
              {/* On what remains, the rest gives the block's rhythm: you can see
                the squats are on 1 min and the lunges on 45 s without having
                to get there. On what is done it teaches nothing any more —
                the load takes its place. */}
              {fait ? (
                <Text
                  fontSize="sm"
                  color="fg.muted"
                  fontFamily="mono"
                  flexShrink={0}
                >
                  {value?.weight != null ? `${value.weight} kg` : e.dose}
                </Text>
              ) : (
                <>
                  {e.restAfter && (
                    <Text
                      fontSize="2xs"
                      color="fg.muted"
                      opacity={0.7}
                      flexShrink={0}
                    >
                      {formatDuration(e.restAfter)}
                    </Text>
                  )}
                  <Text
                    fontSize="sm"
                    color="fg.muted"
                    fontFamily="mono"
                    flexShrink={0}
                    minW="62px"
                    textAlign="right"
                  >
                    {e.dose}
                  </Text>
                </>
              )}
            </HStack>
            {restHere}
          </Fragment>
        );
      })}
    </VStack>
  );
};

export const GuidedSession = ({
  session,
  onExit,
  onFinish,
  lastPerformance,
  performed,
  onPerformedChange,
}: GuidedSessionProps) => {
  const [steps] = useState(() => buildGuidedSteps(session));
  // Blocks do not change during the session: we split them once.
  const [blockRuns] = useState(() => decouperEnBlocs(steps));
  const [savedIndex] = useState(() =>
    Math.min(readSavedIndex(session._id), Math.max(0, steps.length - 1))
  );
  const [index, setIndex] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  // The coach's instruction is written for this precise moment — mid-effort,
  // hands busy. It was nonetheless the session's only content unreachable
  // from the full screen: you had to leave it, and so lose your place, to go
  // and read it.
  //
  // A round carries several movements: what opens is no longer "the screen's
  // instruction", it is that of a named movement.
  const [detail, setDetail] = useState<BlockExercise | null>(null);
  // Offered, never imposed: a client who genuinely wants to start over must
  // not find themselves trapped in the middle of the previous attempt.
  /**
   * Has this session already been started?
   *
   * The position is not enough to say: on a list block, ticking sets does not
   * advance the step. Someone who ticks four warm-up lines then closes the
   * app has very much started, and showing them the intro screen again would
   * be telling them they did nothing.
   */
  // The start time, set once and for all: it is what lets us say, at the
  // end, how long the session actually took.
  useEffect(() => {
    if (readProgress(session._id)?.startedAt === undefined) {
      writeProgress(session._id, { startedAt: Date.now() });
    }
  }, [session._id]);

  const [alreadyStarted] = useState(() => {
    const saved = readProgress(session._id);
    return (saved?.step ?? 0) > 0 || (saved?.done.length ?? 0) > 0;
  });
  const [showResume, setShowResume] = useState(() => alreadyStarted);
  /**
   * The intro screen only appears at the start.
   *
   * Resuming a session you began means you know what you are doing: we do not
   * repeat the briefing to someone coming back from their twelfth set.
   */
  const [showIntro, setShowOuverture] = useState(() => !alreadyStarted);

  /** What awaits the client: a preview of the blocks, and the total to do. */
  const blockPreview = useMemo(
    () =>
      steps.reduce<
        { start: number; label: string; couleur: string; detail: string }[]
      >((acc, step, i) => {
        if (step.type === 'rest') return acc;
        const dernier = acc[acc.length - 1];
        if (dernier?.label === step.blockLabel) return acc;
        acc.push({
          start: i,
          label: step.blockLabel,
          couleur: BLOCK_ACCENT_COLOR[getBlockAccent(step.block.type)],
          detail:
            step.type === 'round'
              ? `${step.rounds} tours`
              : step.shape === 'loop'
                ? `${step.block.durationMinutes ?? '?'} min`
                : `${step.sets.length} exercices`,
        });
        return acc;
      }, []),
    [steps]
  );

  const totalSets = useMemo(
    () =>
      steps.reduce(
        (n, step) =>
          n +
          (step.type === 'round'
            ? 1
            : step.type === 'block'
              ? step.sets.length
              : 0),
        0
      ),
    [steps]
  );
  // Read once, on opening: it is the previous state we announce.
  const [notesGardees] = useState(() =>
    countRecorded(readProgress(session._id)?.performed ?? {})
  );

  /**
   * The sets already done, independent of the position.
   *
   * Scrolling back to read the previous movement's instruction must undo
   * nothing: where you are and what you have done are two things, and it is
   * for failing to distinguish them that nothing could be ticked.
   */
  const [done, setDone] = useState<string[]>(
    () => readProgress(session._id)?.done ?? []
  );
  const doneKeys = useMemo(() => new Set(done), [done]);
  // The rest triggered by "Fait": it has no step of its own, it belongs to
  // the set that has just ended.
  const [rest, setRest] = useState<{
    afterKey: string;
    duration: number;
    nextUp: string;
  } | null>(null);

  /**
   * The block whose clock has been started, if any.
   *
   * It lives here and not in `Round` because a round is remounted at every
   * phase change: the flag has to outlive it, or the second round would ask
   * for a tap again. Leaving the block clears it — coming back to an EMOM
   * ten minutes later, the clock waits for you again.
   */
  const [armedBlock, setArmedBlock] = useState<number | null>(null);

  /**
   * Rounds completed, by block.
   *
   * An AMRAP is not ticked off, it is counted — and that count is the
   * session's score. The coach in the test data asks for it in prose, in a
   * free note ("Rythme régulier, viser 5-6 tours"), for want of a field to
   * hold it.
   */
  const [rounds, setRounds] = useState<Record<string, number>>(
    () => readProgress(session._id)?.rounds ?? {}
  );

  const countOneRound = (blockOrder: number, delta: number) => {
    const key = String(blockOrder);
    const next = {
      ...rounds,
      // Never below zero: you correct a slip of the finger, you do not go
      // negative.
      [key]: Math.max(0, (rounds[key] ?? 0) + delta),
    };
    setRounds(next);
    writeProgress(session._id, { rounds: next });
    if (delta > 0) navigator.vibrate?.(40);
  };

  const step = steps[index];
  const isLast = index === steps.length - 1;

  // The first one not done: we do not force the order, we suggest it.
  const sets = step?.type === 'block' ? step.sets : [];
  const current = sets.find((e) => !doneKeys.has(e.key));
  const blockFinished = sets.length > 0 && !current;
  const doneInBlock = sets.filter((e) => doneKeys.has(e.key)).length;
  // An AMRAP does not end by ticking: the client decides to stop, or the
  // clock does. The primary button counts, the secondary one exits.
  const isLoop = step?.type === 'block' && step.shape === 'loop';

  const markDone = () => {
    if (!current) return;
    const next = [...done, current.key];
    setDone(next);
    writeProgress(session._id, { done: next });
    navigator.vibrate?.(40);

    // The last set of a list block leaves nothing to do.
    //
    // The block stayed there, every line ticked, waiting for a tap on « Bloc
    // suivant » that said nothing the screen did not already say. A dead end
    // between two blocks, and one more gesture in the middle of a session.
    // Ticking the last set IS moving on.
    //
    // Only when there is somewhere to go. On the last block of the session,
    // « Terminer » stays a deliberate act: finishing a session is a decision,
    // not a side effect of a checkbox.
    if (next.length === sets.length && !isLast) {
      goNext();
      return;
    }

    // The prescribed rest starts by itself: it is the gesture the client
    // would make anyway, and forgetting it costs the next set.
    if (current.restAfter) {
      const after = sets[sets.indexOf(current) + 1];
      setRest({
        afterKey: current.key,
        duration: current.restAfter,
        nextUp: after ? `${after.name} · ${after.dose}` : '',
      });
    }
  };

  /**
   * A set goes back to being something to do.
   *
   * The cursor follows on its own: it is the first set not done, so unticking
   * one that comes before it brings it back to the front. Nothing else has to
   * move — which is the whole benefit of a state that is not an index.
   *
   * The load stays. Redoing a set is not forgetting what you lifted on it,
   * and it gets overwritten the moment something else is entered.
   */
  const undoSet = (key: string) => {
    const next = done.filter((k) => k !== key);
    setDone(next);
    writeProgress(session._id, { done: next });
    // A rest that belonged to the set just untaken no longer means anything.
    if (rest?.afterKey === key) setRest(null);
  };

  const goTo = (next: number) => {
    // Leaving the block disarms its clock: coming back to an EMOM after the
    // next block, or ten minutes later, it waits for you again rather than
    // running while you look for the bell.
    const arrivee = steps[next];
    const bloc =
      arrivee && arrivee.type !== 'rest' ? arrivee.block.order : null;
    if (bloc !== armedBlock) setArmedBlock(null);
    setIndex(next);
    setDetail(null);
    writeSavedIndex(session._id, next);
  };

  const goNext = () => {
    if (isLast) {
      // We do not erase here: the wrap-up that follows feeds on what has
      // just been recorded. The record goes when the session goes to the
      // server.
      onFinish();
      return;
    }
    goTo(index + 1);
  };

  const goPrev = () => goTo(Math.max(0, index - 1));

  // We always ask. At the first step there is nothing to lose, but you have
  // just entered a full screen: leaving it wordlessly on a slipped finger
  // means the session you thought you had started is no longer there.
  const handleExitClick = () => setShowExitConfirm(true);

  // Leaving erases nothing any more. Stepping out to answer the phone, or
  // because a finger slipped, must not cost the session: you find your place
  // and your loads on coming back. To start from scratch, the resume screen
  // offers "Recommencer depuis le début".
  const confirmExit = () => onExit();

  // The full screen sat on top of the page without neutralising it: four tab
  // presses were enough to leave it, you landed in the tab bar and on the
  // session buttons underneath, and a screen reader still announced the whole
  // page. `inert` removes focus, pointer and accessibility tree in one go
  // from everything that is not the guided session.
  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    root.setAttribute('inert', '');
    return () => root.removeAttribute('inert');
  }, []);

  // … which forces the session itself out of `#root`, without which it would
  // neutralise itself along with the rest.
  const overlay = (node: React.ReactNode) => createPortal(node, document.body);

  // Keeps the screen awake for the whole guided session: without it the
  // screen goes dark between two exercises and has to be unlocked with damp
  // hands.
  useEffect(() => {
    if (!('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const requestLock = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) {
          lock.release().catch(() => {});
          return;
        }
        sentinel = lock;
      } catch {
        // Refused or unavailable (not the active screen, permissions…): so be it.
      }
    };

    requestLock();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !sentinel) {
        requestLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      sentinel?.release().catch(() => {});
    };
  }, []);

  if (steps.length === 0) {
    return overlay(
      <Box
        role="dialog"
        aria-modal="true"
        aria-label="Aucun exercice à suivre"
        position="fixed"
        inset={0}
        zIndex={50}
        bg="bg.canvas"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="safe center"
        overflowY="auto"
        py={6}
        px={8}
        gap={4}
        textAlign="center"
      >
        <Text fontSize="lg" fontWeight="bold">
          Aucun exercice à suivre
        </Text>
        <Text fontSize="sm" color="fg.muted">
          Cette séance n'a pas d'exercices définis.
        </Text>
        <Button
          bg="app.primary"
          color="bg.canvas"
          fontWeight="bold"
          onClick={onExit}
        >
          Retour
        </Button>
      </Box>
    );
  }

  // The intro screen.
  //
  // The note the coach wrote for that particular session was unreachable from
  // guided mode: if they wrote "today we keep 2 reps in reserve on
  // everything", the client could not read it back mid-effort. So it opens
  // the run — you read the briefing at the moment it serves, before starting.
  //
  // It is also the only place that reminds you a human wrote this session. No
  // generic fitness app can say as much, and guided mode used it nowhere.
  if (showIntro) {
    return overlay(
      <Box
        role="dialog"
        aria-modal="true"
        aria-label="Avant de commencer"
        position="fixed"
        inset={0}
        zIndex={50}
        bg="bg.canvas"
        display="flex"
        flexDirection="column"
      >
        <HStack justify="flex-end" p={4}>
          <Button
            variant="ghost"
            size="sm"
            minH="44px"
            onClick={onExit}
            color="fg.muted"
          >
            Quitter
          </Button>
        </HStack>

        {/* `flex: 1` without `min-height: 0` never shrinks below its
            content: on a screen lying flat, the body pushed "Commencer" off
            the screen — the button existed, showed in the tree, and could not
            be touched. `safe center` centres while there is room and falls
            back to the top when there is not, instead of cutting on both
            sides. */}
        <VStack
          flex={1}
          minH={0}
          overflowY="auto"
          justifyContent="safe center"
          align="stretch"
          gap={7}
          px={7}
          pb={6}
        >
          <VStack align="start" gap={1.5}>
            <Text
              fontSize="xs"
              fontWeight="800"
              letterSpacing="2px"
              color="fg.muted"
            >
              SÉANCE {session.order}
            </Text>
            {session.name?.trim() && (
              <Text fontSize="3xl" fontWeight="800" lineHeight="1.15">
                {session.name.trim()}
              </Text>
            )}
            {/* What awaits the client, before they commit. No screen said it:
                you started without knowing whether it was ten minutes or
                forty. */}
            <Text fontSize="sm" color="fg.muted">
              {session.blocks.length} bloc
              {session.blocks.length > 1 ? 's' : ''} · {totalSets} exercice
              {totalSets > 1 ? 's' : ''}
            </Text>
          </VStack>

          {session.notes?.trim() && (
            <Box
              bg="surface.card"
              borderLeftWidth="3px"
              borderLeftColor="app.primary"
              borderRadius="lg"
              p={4}
            >
              <Text fontSize="xs" color="fg.muted" mb={2}>
                Ton coach te dit&nbsp;:
              </Text>
              <Text fontSize="lg" lineHeight="1.5" whiteSpace="pre-wrap">
                {session.notes}
              </Text>
            </Box>
          )}

          <VStack align="stretch" gap={2.5}>
            {blockPreview.map((b) => (
              <HStack key={b.start} gap={3}>
                <Box
                  w="10px"
                  h="10px"
                  borderRadius="sm"
                  bg={b.couleur}
                  flexShrink={0}
                />
                <Text fontSize="sm" flex={1} minW={0} lineClamp={1}>
                  {b.label}
                </Text>
                <Text
                  fontSize="xs"
                  color="fg.muted"
                  fontFamily="mono"
                  flexShrink={0}
                >
                  {b.detail}
                </Text>
              </HStack>
            ))}
          </VStack>
        </VStack>

        <Box p={4}>
          <Button
            w="full"
            minH="56px"
            bg="app.primary"
            color="bg.canvas"
            fontWeight="bold"
            fontSize="lg"
            _hover={{ bg: 'app.primary.hover' }}
            onClick={() => setShowOuverture(false)}
          >
            Commencer
          </Button>
        </Box>
      </Box>
    );
  }

  if (showResume) {
    return overlay(
      <Box
        role="dialog"
        aria-modal="true"
        aria-label="Reprendre où tu en étais ?"
        position="fixed"
        inset={0}
        zIndex={50}
        bg="bg.canvas"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="safe center"
        overflowY="auto"
        py={6}
        px={8}
        gap={6}
        textAlign="center"
      >
        <Text fontSize="lg" fontWeight="bold">
          Reprendre où tu en étais&nbsp;?
        </Text>
        <Text fontSize="sm" color="fg.muted">
          Tu t'étais arrêté à l'étape {savedIndex + 1} sur {steps.length}.
          {/* Say it explicitly: someone who recorded their loads then closed
              the app has no way of knowing what awaits, and "Recommencer"
              becomes a gamble. */}
          {notesGardees > 0 &&
            ` Tes charges sur ${notesGardees} exercice${
              notesGardees > 1 ? 's' : ''
            } sont gardées.`}
        </Text>
        <VStack gap={2} w="full" maxW="280px">
          <Button
            w="full"
            bg="app.primary"
            color="bg.canvas"
            fontWeight="bold"
            onClick={() => {
              setIndex(savedIndex);
              setShowResume(false);
            }}
          >
            Reprendre
          </Button>
          <Button
            w="full"
            variant="ghost"
            color="fg.muted"
            onClick={() => {
              // Everything that says "where I am" goes back to zero: the
              // step, the ticked sets, the counted rounds.
              //
              // Resetting the step alone was not enough — and on a list block
              // it did nothing at all, since such a block is a single step:
              // you "restarted" a chipper while keeping its three movements
              // ticked. It is a leftover from a time when the step was the
              // only notion of position; since then, the sets carry it.
              //
              // The loads, however, stay. Erasing what someone lifted because
              // they are taking the session from the top would be exactly the
              // loss we had just fixed — and they get overwritten as you go.
              writeProgress(session._id, { step: 0, done: [], rounds: {} });
              setDone([]);
              setRounds({});
              setIndex(0);
              setShowResume(false);
            }}
          >
            Recommencer depuis le début
          </Button>
        </VStack>
      </Box>
    );
  }

  if (showExitConfirm) {
    return overlay(
      <Box
        role="dialog"
        aria-modal="true"
        aria-label="Quitter le mode guidé ?"
        position="fixed"
        inset={0}
        zIndex={50}
        bg="bg.canvas"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="safe center"
        overflowY="auto"
        py={6}
        px={8}
        gap={6}
        textAlign="center"
      >
        <Text fontSize="lg" fontWeight="bold">
          Quitter le mode guidé ?
        </Text>
        <Text fontSize="sm" color="fg.muted">
          {/* This message announced a loss that no longer happens — and
              which, when it did, was worse than it let on: the loads went
              with it. */}
          {index > 0
            ? 'Tu retrouveras ta séance là où tu la laisses, charges comprises.'
            : "Tu n'as pas encore commencé — tu retrouveras la séance telle quelle."}
        </Text>
        <VStack gap={2} w="full" maxW="280px">
          <Button
            w="full"
            bg="app.primary"
            color="bg.canvas"
            fontWeight="bold"
            onClick={confirmExit}
          >
            Quitter
          </Button>
          <Button
            w="full"
            variant="ghost"
            color="fg.muted"
            onClick={() => setShowExitConfirm(false)}
          >
            Continuer la séance
          </Button>
        </VStack>
      </Box>
    );
  }

  const isRest = step.type === 'rest';

  // Written once, mounted in two places depending on orientation — never
  // both at once. Two identical buttons in the tree would tell a screen
  // reader there are two exits.
  const boutonQuitter = (
    <Button
      variant="ghost"
      size="sm"
      minH="44px"
      onClick={handleExitClick}
      color={isRest ? 'bg.canvas' : 'fg.muted'}
    >
      Quitter
    </Button>
  );

  return overlay(
    <Box
      role="dialog"
      aria-modal="true"
      aria-label="Séance guidée"
      position="fixed"
      inset={0}
      zIndex={50}
      bg={{ base: isRest ? 'session.rest' : 'bg.canvas', md: 'blackAlpha.800' }}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent={{ base: 'stretch', md: 'center' }}
      // An iPhone lying flat is 844 px wide: it crosses the `md` threshold
      // and used to get the desktop layout — a floating 560 px card on a
      // dimmed background, 90 % as tall as a screen that has little height to
      // begin with. The threshold looks at width; here height decides.
      css={{
        [PAYSAGE]: { justifyContent: 'stretch', background: 'transparent' },
      }}
    >
      <Box
        w="full"
        maxW={{ base: 'full', md: '560px' }}
        h={{ base: 'full', md: '90vh' }}
        maxH={{ base: 'full', md: '720px' }}
        css={{
          [PAYSAGE]: {
            maxWidth: '100%',
            height: '100%',
            maxHeight: '100%',
            borderRadius: 0,
            boxShadow: 'none',
          },
        }}
        bg={isRest ? 'session.rest' : 'bg.canvas'}
        borderRadius={{ base: 0, md: '2xl' }}
        boxShadow={{ md: '0 24px 64px rgba(0,0,0,0.5)' }}
        display="flex"
        flexDirection="column"
        overflow="hidden"
        position="relative"
      >
        {/* In portrait, "Quitter" has its own line: that is the approved
            mock-up, and it does not change. Lying flat, that line costs 76 px
            out of 390 — a fifth of the screen for one word — so the button
            joins the progress bar, which has width to spare. Only one of the
            two is mounted at a time: the other is removed from the tree, not
            merely hidden. */}
        <HStack
          justify="flex-end"
          p={4}
          css={{ [PAYSAGE]: { display: 'none' } }}
        >
          {boutonQuitter}
        </HStack>

        <HStack gap={3} px={5} pt={2} align="center">
          <HStack
            gap={1.5}
            flex={1}
            role="progressbar"
            aria-label="Avancement de la séance"
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-valuenow={index + 1}
            aria-valuetext={`Étape ${index + 1} sur ${steps.length} — ${step.blockLabel}`}
          >
            {blockRuns.map((block) => {
              const isCurrent =
                index >= block.start && index < block.start + block.size;
              // How much of this block is behind you, between 0 and 1.
              //
              // The step count is no longer enough: a list block makes only
              // one, so the fill jumped from nothing to everything while you
              // tick seven sets inside it. When the current block has sets,
              // they are what speak.
              const part =
                isCurrent && sets.length > 0
                  ? doneInBlock / sets.length
                  : Math.max(0, Math.min(block.size, index - block.start)) /
                    block.size;
              return (
                <Box
                  key={`${block.label}-${block.start}`}
                  flex={block.weight}
                  // Proportional, but never to the point of vanishing: a
                  // two-page warm-up in a thirty-five-page session would
                  // shrink to a dot.
                  minW="20px"
                  h="4px"
                  borderRadius="full"
                  // The current block's track is slightly lighter: at a
                  // block's first step the fill is zero and nothing else
                  // would say where you are.
                  bg={
                    isRest
                      ? isCurrent
                        ? 'bg.canvas/40'
                        : 'bg.canvas/20'
                      : isCurrent
                        ? 'whiteAlpha.400'
                        : 'whiteAlpha.200'
                  }
                  overflow="hidden"
                >
                  <Box
                    h="100%"
                    borderRadius="full"
                    w={`${part * 100}%`}
                    bg={
                      isRest
                        ? 'bg.canvas'
                        : isCurrent
                          ? 'app.primary'
                          : 'session.rest'
                    }
                    transition="width 0.25s"
                  />
                </Box>
              );
            })}
          </HStack>
          <Text
            fontSize="xs"
            fontFamily="mono"
            flexShrink={0}
            color={isRest ? 'bg.canvas' : 'fg.muted'}
            opacity={isRest ? 0.75 : 1}
            aria-hidden="true"
          >
            {index + 1} / {steps.length}
          </Text>
          <Box
            display="none"
            flexShrink={0}
            mt={-1}
            css={{ [PAYSAGE]: { display: 'block' } }}
          >
            {boutonQuitter}
          </Box>
        </HStack>

        {step.type === 'block' && step.shape === 'list' ? (
          <>
            <VStack align="stretch" gap={0.5} px={5} pt={4} pb={1}>
              <Text
                fontSize="xs"
                letterSpacing="2px"
                textTransform="uppercase"
                fontWeight="800"
                color="session.work"
              >
                {step.blockLabel}
                {step.block.label ? ` · ${step.block.label}` : ''}
              </Text>
              <HStack justify="space-between" align="center" gap={3}>
                <Text fontSize="sm" color="fg.muted">
                  {doneInBlock} sur {step.sets.length} faits dans ce bloc
                </Text>
                {/* The way past.
                    "Suivant" carried it without saying so, and replacing it
                    with "Fait" removed it unnoticed: you were stuck on a
                    warm-up until its two lines were ticked. A client skips a
                    movement, changes their mind, arrives late — they must be
                    able to move on.

                    Discreet and away from the primary gesture: it is an
                    emergency exit, not an invitation. */}
                <Box
                  as="button"
                  onClick={goNext}
                  color="fg.muted"
                  fontSize="sm"
                  flexShrink={0}
                  css={hitArea(44)}
                  _hover={{ color: 'fg' }}
                >
                  {/* On the last block, "skip" means nothing: there is nothing
                      after. But the exit must exist all the same — it was
                      hidden there, and you had to tick a pyramid's seven
                      rungs to earn the right to finish. */}
                  {isLast ? 'Terminer la séance' : 'Passer ce bloc'}
                </Box>
              </HStack>
            </VStack>
            <BlockList
              block={step.block}
              sets={step.sets}
              done={doneKeys}
              current={current}
              performed={performed}
              onPerformedChange={onPerformedChange}
              lastPerformance={lastPerformance}
              onOuvrirDetail={setDetail}
              rest={rest}
              onRestDone={() => setRest(null)}
              onUndo={undoSet}
            />
          </>
        ) : step.type === 'block' ? (
          /*
           * A whole block, read at once.
           *
           * This is the card from the session sheet — the one the client
           * reads before starting — laid down here unchanged. One rendering
           * for both screens: what they memorised while preparing, they find
           * again during. Instructions and videos already unfold there, line
           * by line, which the full screen could only do for the one exercise
           * on display.
           */
          <VStack
            flex={1}
            align="stretch"
            gap={5}
            px={5}
            py={2}
            overflowY="auto"
          >
            {/* The exit, here too.
                On a loop the primary button counts rounds: nothing else would
                end the session without this. The third place where a primary
                gesture changing meaning took with it the one it replaced. */}
            {step.shape === 'loop' && (
              <HStack justify="flex-end">
                <Box
                  as="button"
                  onClick={goNext}
                  color="fg.muted"
                  fontSize="sm"
                  css={hitArea(44)}
                  _hover={{ color: 'fg' }}
                >
                  {isLast ? 'Terminer la séance' : 'Passer ce bloc'}
                </Box>
              </HStack>
            )}
            {/* A timed block's clock: in an AMRAP it is what says when to
                stop. Smaller than in full screen — you came to read the list,
                not the clock. */}
            {blockHasClock(step.block.type) && step.block.durationMinutes ? (
              <Timer
                key={index}
                duration={step.block.durationMinutes * 60}
                couleur="fg"
                holdLabel="Temps écoulé"
                // Not the block's name: the card just below already carries
                // it, and the screen said it twice. What was missing is what
                // the clock measures — an AMRAP stops at zero.
                title={
                  <Text
                    fontSize="xs"
                    letterSpacing="2px"
                    textTransform="uppercase"
                    fontWeight="800"
                    color="fg.muted"
                  >
                    Temps restant
                  </Text>
                }
                compact
              />
            ) : null}
            {/* The round counter.
                This is the session's score, and it had no place at all:
                neither on screen nor in the model. The client kept it in
                their head or on a notepad. Large, under the clock, and next
                to the button that raises it — you tap it out of breath. */}
            {step.shape === 'loop' && (
              <HStack justify="space-between" align="center" gap={4}>
                <HStack align="baseline" gap={2}>
                  <Text
                    fontSize="54px"
                    fontWeight="800"
                    lineHeight="1"
                    color="app.primary"
                    fontVariantNumeric="tabular-nums"
                  >
                    {rounds[String(step.block.order)] ?? 0}
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    tour{(rounds[String(step.block.order)] ?? 0) > 1 ? 's' : ''}
                    &nbsp;bouclé
                    {(rounds[String(step.block.order)] ?? 0) > 1 ? 's' : ''}
                  </Text>
                </HStack>
                {/* Counting back down must stay possible — a finger slips, and
                    losing a round you did is worse than counting one too
                    many. Discreet: it is not the gesture you repeat. */}
                {(rounds[String(step.block.order)] ?? 0) > 0 && (
                  <Box
                    as="button"
                    aria-label="Retirer un tour"
                    onClick={() => countOneRound(step.block.order, -1)}
                    color="fg.muted"
                    fontSize="sm"
                    css={hitArea(44)}
                    _hover={{ color: 'fg' }}
                  >
                    − 1
                  </Box>
                )}
              </HStack>
            )}
            <BlockCard
              block={step.block}
              renderExerciseExtra={({ blockOrder, exerciseOrder }) => {
                const prescribed = step.block.exercises.find(
                  (e) => e.order === exerciseOrder
                );
                if (!prescribed) return null;
                const key = performedKey(blockOrder, exerciseOrder);
                const rest = restBetweenSetsOf(step.block, prescribed);
                return (
                  <>
                    {performed && onPerformedChange && (
                      <PerformedFields
                        value={performed[key] ?? { sets: [] }}
                        onChange={(next) => onPerformedChange(key, next)}
                        setLabels={prescribedSetLabels(step.block, prescribed)}
                        isTimed={prescribed.duration !== undefined}
                      />
                    )}
                    {/* The timed work first, the rest after: that is the order in
                        which they are lived. */}
                    {prescribed.duration ? (
                      <OnDemandTimer
                        duration={prescribed.duration}
                        label={formatDuration(prescribed.duration)}
                        couleur="app.primary"
                      />
                    ) : null}
                    {rest ? (
                      <OnDemandTimer
                        duration={rest}
                        label={`rest ${formatDuration(rest)}`}
                        couleur="session.rest"
                      />
                    ) : null}
                  </>
                );
              }}
            />
          </VStack>
        ) : step.type === 'round' ? (
          <Round
            step={step}
            onDone={goNext}
            lastPerformance={lastPerformance}
            onOuvrirDetail={setDetail}
            armed={armedBlock === step.block.order}
            onArm={() => setArmedBlock(step.block.order)}
          />
        ) : (
          <VStack
            flex={1}
            justify="center"
            align="center"
            gap={6}
            px={8}
            textAlign="center"
          >
            <Timer
              key={index}
              duration={step.duration}
              couleur="bg.canvas"
              // The background here is the rest colour: a light track would
              // disappear on it. This is the only screen where the gauge
              // inverts.
              track="blackAlpha.400"
              onComplete={goNext}
              title={
                <Text
                  fontSize="xs"
                  letterSpacing="2px"
                  textTransform="uppercase"
                  fontWeight="800"
                  color="bg.canvas"
                >
                  Repos
                </Text>
              }
            />
            {step.nextExerciseName && (
              <Text fontSize="sm" color="bg.canvas" opacity={0.75}>
                Ensuite : {step.nextExerciseName}
              </Text>
            )}
          </VStack>
        )}

        {detail && (
          <Box
            position="absolute"
            inset={0}
            bg="bg.canvas"
            zIndex={1}
            overflowY="auto"
            p={5}
          >
            <HStack justify="space-between" align="flex-start" mb={4}>
              <Text fontSize="xl" fontWeight="800" maxW="20ch">
                {detail.exercise.name}
              </Text>
              <Box
                as="button"
                aria-label="Revenir à la séance"
                onClick={() => setDetail(null)}
                color="fg.muted"
                flexShrink={0}
                css={hitArea(44)}
              >
                <LuX size={20} />
              </Box>
            </HStack>

            {/* What the coach wrote for this session comes first, recognisable
                by the amber bar. The movement's technique, which comes from
                the library, stays as plain text below. */}
            {detail.note?.trim() && (
              <Box
                p={3}
                bg="whiteAlpha.50"
                borderRadius="md"
                borderLeft="2px solid"
                borderLeftColor="app.primary.border"
                mb={4}
              >
                <Text
                  fontSize="2xs"
                  color="fg.muted"
                  fontWeight="bold"
                  letterSpacing="wide"
                  textTransform="uppercase"
                  mb={1}
                >
                  Consigne du coach
                </Text>
                <Text fontSize="sm" color="fg" whiteSpace="pre-wrap">
                  {detail.note}
                </Text>
              </Box>
            )}
            {detail.exercise.description?.trim() && (
              <>
                {detail.note?.trim() && (
                  <Text
                    fontSize="2xs"
                    color="fg.muted"
                    fontWeight="bold"
                    letterSpacing="wide"
                    textTransform="uppercase"
                    mb={1}
                  >
                    Le mouvement
                  </Text>
                )}
                <Text
                  fontSize="sm"
                  color={detail.note?.trim() ? 'fg.muted' : 'fg'}
                  whiteSpace="pre-wrap"
                  mb={4}
                >
                  {detail.exercise.description}
                </Text>
              </>
            )}
            {detail.exercise.videoUrl?.trim() && (
              <VideoPlayer url={detail.exercise.videoUrl} />
            )}
          </Box>
        )}

        {/* The targets keep their 52 px — we do not shrink what gets
            touched with sweaty hands. It is the margin that gives, not the
            button. */}
        <HStack p={4} gap={3} css={{ [PAYSAGE]: { padding: '8px 12px' } }}>
          {/* An outline, like the one on "J'ai terminé cette séance". Grey
              text with no frame, next to a solid amber "Suivant" twice as
              wide, reads as "unavailable": the contrast was compliant, the
              hierarchy lied. Secondary and unavailable must stay two distinct
              things — so the button carries its frame, and only truly fades
              on the first step, where it really is disabled. */}
          <Button
            variant="outline"
            borderColor={isRest ? 'blackAlpha.400' : 'whiteAlpha.300'}
            onClick={goPrev}
            disabled={index === 0}
            flexShrink={0}
            minH="52px"
            color={isRest ? 'bg.canvas' : 'fg'}
          >
            Précédent
          </Button>
          {/* A single primary button, always in the same place, and the
              block's shape says what it does: "Fait" while a set remains to
              tick, then move on. The client never has to choose where to
              press. */}
          <Button
            flex={1}
            minH="52px"
            bg={isRest ? 'bg.canvas' : 'app.primary'}
            color={isRest ? 'fg' : 'bg.canvas'}
            _hover={{ bg: isRest ? 'bg.canvas' : 'app.primary.hover' }}
            onClick={
              isLoop && step.type === 'block'
                ? () => countOneRound(step.block.order, 1)
                : current
                  ? markDone
                  : goNext
            }
          >
            {isLoop
              ? '+1 tour'
              : current
                ? 'Fait'
                : isLast
                  ? 'Terminer'
                  : blockFinished
                    ? 'Bloc suivant'
                    : step.type === 'rest'
                      ? 'Passer'
                      : 'Suivant'}
          </Button>
        </HStack>
      </Box>
    </Box>
  );
};
