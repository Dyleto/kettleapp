import { BlockExercise, PerformedValues, Session } from '@/shared/types';
import { buildGuidedSteps } from '../guidedSteps';
import { BlockCard } from '@/features/program/components/BlockCard';
import {
  BLOCK_ACCENT_COLOR,
  blockHasClock,
  getBlockAccent,
  prescribedSetLabels,
  restBetweenSetsOf,
} from '@/features/program/constants';
import { PerformedFields } from './PerformedFields';
import { LastPerformance, performedKey } from '../lastPerformance';
import { Box, HStack, Button, VStack, Text } from '@chakra-ui/react';
import VideoPlayer from '@/shared/components/VideoPlayer';
import { hitArea } from '@/shared/components/hitArea';
import { formatDuration } from '@/shared/utils/duration';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuX } from 'react-icons/lu';
import { countRecorded, writeProgress, readProgress } from '../sessionProgress';
import { PAYSAGE } from './guided/media';
import { Timer, OnDemandTimer } from './guided/Timer';
import { Round } from './guided/Round';
import { BlockList } from './guided/BlockList';
import {
  readSavedIndex,
  writeSavedIndex,
  splitIntoBlockRuns,
} from './guided/progress';

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
  const [blockRuns] = useState(() => splitIntoBlockRuns(steps));
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
