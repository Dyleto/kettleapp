import { useOutletContext, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Container,
  HStack,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { LuArrowLeft } from 'react-icons/lu';
import {
  CLIENT_CONTENT_MAX_W,
  CompleteSessionModal,
  GuidedSession,
  SessionRecap,
  RecordPerformed,
  SessionDetail,
  SuggestedDays,
  getSessionSummary,
  useClientSessions,
} from '@/features/client';
import { PerformedEntry, PerformedValues, RoundsDoneEntry } from '@/types';
import { truncateAtFirstEmpty } from '@/features/client/performedFormat';
import {
  countRecorded,
  writeProgress,
  readProgress,
} from '@/features/client/sessionProgress';
import { buildGuidedSteps } from '@/features/client/guidedSteps';
import { buildRecap } from '@/features/client/recap';
import { CLIENT_ROUTES } from '@/config/routes';
import { EmptyState } from '@/components/EmptyState';
import { hitArea } from '@/components/hitArea';
import { sessionTitle } from '@/features/program/sessionTitle';

// What was performed is entered exercise by exercise during the session,
// then leaves all at once with the wrap-up. The key is "block order :
// exercise order", exactly the addressing the API expects. An exercise
// without a single filled-in set is not sent at all: nothing to say is not a
// value.
/**
 * Rounds completed, as the API expects them.
 *
 * Zero goes with the rest: a client who completed no round lived that, and
 * sending nothing would amount to saying they did not do the block.
 */
const toRoundsDone = (tours?: Record<string, number>): RoundsDoneEntry[] =>
  Object.entries(tours ?? {}).map(([blockOrder, rounds]) => ({
    blockOrder: Number(blockOrder),
    rounds,
  }));

const toPerformedEntries = (
  performed: Record<string, PerformedValues>
): PerformedEntry[] =>
  Object.entries(performed)
    .map(([key, value]) => {
      const [blockOrder, exerciseOrder] = key.split(':').map(Number);
      return {
        blockOrder,
        exerciseOrder,
        sets: truncateAtFirstEmpty(value.sets ?? []),
      };
    })
    .filter((entry) => entry.sets.length > 0);

type ClientSessionsData = ReturnType<typeof useClientSessions>;

const SessionScreen = () => {
  const navigate = useNavigate();
  const {
    sessions,
    activeSession,
    handleSubmitLog,
    isLoading,
    isSubmitting,
    lastPerformance,
  } = useOutletContext<ClientSessionsData>();
  const [isGuidedOpen, setIsGuidedOpen] = useState(false);
  useDocumentTitle(activeSession ? `Séance ${activeSession.order}` : undefined);

  // Finishing a session happens in two steps: "do you want to record your
  // loads?", then the wrap-up. `idle` covers reading, where the screen asks
  // nothing.
  const [flow, setFlow] = useState<'idle' | 'record' | 'review'>('idle');

  // What has been recorded no longer lives in memory alone.
  //
  // It was a bare `useState`: one reload, one incoming call killing the tab,
  // and forty minutes of loads were gone. The app nonetheless scrupulously
  // remembered which step you were on. It kept what can be found again and
  // lost what cannot.
  const [performed, setPerformed] = useState<Record<string, PerformedValues>>(
    () =>
      activeSession ? (readProgress(activeSession._id)?.performed ?? {}) : {}
  );

  // Input belongs to one precise session: moving to another from the
  // programme must not drag the previous one's loads into the wrap-up. Each
  // finds its own, where it left them.
  const [performedFor, setPerformedFor] = useState(activeSession?._id);
  if (activeSession?._id !== performedFor) {
    setPerformedFor(activeSession?._id);
    setPerformed(
      activeSession ? (readProgress(activeSession._id)?.performed ?? {}) : {}
    );
    setFlow('idle');
  }

  /**
   * The recap, computed as the wrap-up opens.
   *
   * It only exists if the session was run in guided mode: with no saved
   * state there is nothing to state, and an empty recap would be worth less
   * than no recap.
   */
  const recap = useMemo(() => {
    if (!activeSession || flow === 'idle') return undefined;
    const saved = readProgress(activeSession._id);
    if (!saved || (saved.done.length === 0 && saved.startedAt === undefined))
      return undefined;
    return buildRecap({
      session: activeSession,
      steps: buildGuidedSteps(activeSession),
      step: saved.step,
      performed,
      done: saved.done,
      rounds: saved.rounds,
      lastPerformance,
      startedAt: saved.startedAt,
    });
  }, [activeSession, flow, performed, lastPerformance]);

  const handlePerformedChange = useCallback(
    (key: string, next: PerformedValues) =>
      setPerformed((prev) => {
        const suivant = { ...prev, [key]: next };
        // On keystroke rather than on blur: what we want to cover is the app
        // disappearing without warning.
        if (activeSession)
          writeProgress(activeSession._id, { performed: suivant });
        return suivant;
      }),
    [activeSession]
  );

  if (isLoading) {
    return (
      <Container maxW={CLIENT_CONTENT_MAX_W} py={8} px={4}>
        <VStack align="stretch" gap={4}>
          <Skeleton h="20px" w="120px" borderRadius="md" />
          <Skeleton h="80px" borderRadius="lg" />
          <Skeleton h="200px" borderRadius="lg" />
        </VStack>
      </Container>
    );
  }

  if (sessions.length === 0) {
    return (
      <Container maxW={CLIENT_CONTENT_MAX_W} py={8} px={4}>
        <EmptyState
          title="Pas encore de programme"
          line="Ton coach n'a pas encore ajouté de séances. Reviens bientôt."
        />
      </Container>
    );
  }

  if (!activeSession) {
    return (
      <Container maxW={CLIENT_CONTENT_MAX_W} py={8} px={4}>
        <Box
          p={8}
          textAlign="center"
          bg="whiteAlpha.50"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="whiteAlpha.100"
        >
          <Text fontSize="lg" fontWeight="bold" mb={1}>
            Séance introuvable
          </Text>
          <Text color="fg.muted" fontSize="sm" mb={4}>
            Cette séance n'existe plus dans ton programme.
          </Text>
          <Button
            variant="outline"
            borderColor="whiteAlpha.200"
            onClick={() => navigate(CLIENT_ROUTES.program)}
          >
            Voir le programme
          </Button>
        </Box>
      </Container>
    );
  }

  // "Séance choisie" said "you got here by choosing" — information that
  // interests nobody, the client knowing they clicked. It nonetheless took
  // the place, the shape and the colour of a session status, and so
  // prevented reading what the session itself has to say.
  //
  // "À faire" is a state, not an alert. Red says "problem" everywhere else in
  // the app — it stays with effort and with error.
  const pillLabel = 'À faire';
  const pillColor = 'app.primary';
  const pillTextColor = 'app.primary';
  const hasExercises = activeSession.blocks.some((b) => b.exercises.length > 0);
  const summary =
    activeSession.blocks.length === 0
      ? 'Aucun bloc'
      : getSessionSummary(activeSession);

  return (
    <Container
      maxW={CLIENT_CONTENT_MAX_W}
      py={8}
      px={4}
      pb={{ base: '220px', md: 8 }}
    >
      <VStack align="stretch" gap={1} mb={4}>
        {/* You go back where you came from nine times out of ten: home.
            The programme stays one tab away. A real button, not a clickable
            HStack: it has to be reachable from the keyboard. */}
        <Box
          as="button"
          aria-label="Revenir à Aujourd'hui"
          w="fit-content"
          css={hitArea()}
          onClick={() => navigate(CLIENT_ROUTES.today)}
          color="fg.muted"
          _hover={{ color: 'app.primary' }}
          transition="color 0.15s"
        >
          <HStack gap={1.5}>
            <LuArrowLeft size={13} />
            <Text fontSize="xs" fontWeight="medium">
              Aujourd'hui
            </Text>
          </HStack>
        </Box>
        <HStack justify="space-between" align="center">
          <Text as="h1" fontSize="xl" fontWeight="bold">
            {sessionTitle(activeSession.order, activeSession.name)}
          </Text>
          <Box
            px={2}
            py={0.5}
            borderRadius="full"
            bg={`${pillColor}/16`}
            fontSize="xs"
            fontWeight="bold"
            color={pillTextColor}
            textTransform="uppercase"
            letterSpacing="wider"
          >
            {pillLabel}
          </Box>
        </HStack>
        {/* The day reminder, where you decide whether to start: the
            programme said it, the card did not. With its caption — you
            arrive here from home without necessarily having gone through the
            programme, and two bare chips would read "you did it Monday and
            Thursday". `wrap` because a session can carry seven. */}
        <HStack justify="space-between" align="center" gap={3} wrap="wrap">
          <Text fontSize="xs" color="fg.muted">
            {summary}
          </Text>
          <SuggestedDays days={activeSession.suggestedDays} withLabel />
        </HStack>
      </VStack>

      {/* In read mode a session is read: no empty field under every
          exercise before it has even been started. Input comes at the end, in
          RecordPerformed — but what was used last time shows right now,
          because that is where it is needed. */}
      <SessionDetail
        session={activeSession}
        lastPerformance={lastPerformance}
      />

      <VStack
        align="stretch"
        gap={2}
        mt={5}
        position={{ base: 'fixed', md: 'static' }}
        // Anchored to the bottom of the screen rather than at 70 px: the tab
        // bar is not exactly 70 px — it depends on the phone's safe area —
        // and the gap let a thread of page through between the two. The
        // background now runs down behind the bar.
        bottom={{ base: 0, md: 'auto' }}
        left={{ base: 0, md: 'auto' }}
        right={{ base: 0, md: 'auto' }}
        bg={{ base: 'bg.canvas', md: 'transparent' }}
        p={{ base: 4, md: 0 }}
        pb={{
          base: 'calc(env(safe-area-inset-bottom, 0px) + 78px)',
          md: 0,
        }}
        borderTop={{ base: '1px solid', md: 'none' }}
        borderColor="whiteAlpha.100"
        zIndex={20}
      >
        {hasExercises && (
          <Button
            w="full"
            bg="app.primary"
            color="bg.canvas"
            fontWeight="bold"
            size="lg"
            onClick={() => setIsGuidedOpen(true)}
            _hover={{ bg: 'app.primary.hover' }}
          >
            Démarrer la séance
          </Button>
        )}
        <Button
          w="full"
          variant="outline"
          borderColor="whiteAlpha.200"
          color="fg"
          size="lg"
          onClick={() => setFlow('record')}
          _hover={{ bg: 'whiteAlpha.50' }}
        >
          J'ai terminé cette séance
        </Button>
      </VStack>

      {isGuidedOpen && (
        <GuidedSession
          session={activeSession}
          onExit={() => setIsGuidedOpen(false)}
          onFinish={() => {
            setIsGuidedOpen(false);
            // Anyone who recorded during the session has already answered
            // the question: asking it again at the end, in front of fields
            // they have just filled in, is asking the same thing twice. The
            // wrap-up tells them so.
            setFlow(countRecorded(performed) > 0 ? 'review' : 'record');
          }}
          lastPerformance={lastPerformance}
          performed={performed}
          onPerformedChange={handlePerformedChange}
        />
      )}

      {/* Remounted on every opening: the question starts from scratch
          rather than reopening on the already-unfolded input. */}
      <RecordPerformed
        key={flow === 'record' ? 'record-open' : 'record-closed'}
        session={activeSession}
        isOpen={flow === 'record'}
        performed={performed}
        onPerformedChange={handlePerformedChange}
        lastPerformance={lastPerformance}
        onCancel={() => setFlow('idle')}
        onContinue={() => setFlow('review')}
      />

      <CompleteSessionModal
        isOpen={flow === 'review'}
        onClose={() => setFlow('idle')}
        recap={
          recap && (
            <SessionRecap
              recap={recap}
              title={sessionTitle(activeSession.order, activeSession.name)}
            />
          )
        }
        chargesDejaNotees={countRecorded(performed) > 0}
        onSubmit={(feedback, notes, completedAt) => {
          handleSubmitLog(
            feedback,
            notes,
            completedAt,
            toPerformedEntries(performed),
            toRoundsDone(readProgress(activeSession._id)?.rounds)
          );
          setFlow('idle');
        }}
        isLoading={isSubmitting}
      />
    </Container>
  );
};
export default SessionScreen;
