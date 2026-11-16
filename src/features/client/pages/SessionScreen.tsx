import { useLocation, useOutletContext, useNavigate } from 'react-router';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  HStack,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { LuArrowLeft, LuPlay } from 'react-icons/lu';
import {
  CLIENT_CONTENT_MAX_W,
  CLIENT_GRID_MAX_W,
  GuidedSession,
  useClientSessions,
} from '@/features/client';
import {
  BlockExercise,
  PerformedEntry,
  PerformedValues,
  LadderDoneEntry,
  RoundsDoneEntry,
} from '@/shared/types';
import { truncateAtFirstEmpty } from '@/features/client/performedFormat';
import {
  countRecorded,
  writeProgress,
  readProgress,
} from '@/features/client/sessionProgress';
import { buildGuidedSteps } from '@/features/client/guidedSteps';
import { bestLoads, buildRecap, highlightOf } from '@/features/client/recap';
import {
  distinctExerciseCount,
  estimatedMinutes,
  openingTitle,
} from '@/features/client/guided/outline';
import { formatSuggestedDays } from '@/features/client/sessionDates';
import { HomeChip } from '@/features/client/components/home/HomeCards';
import { BlockDetailCard } from '@/features/client/components/detail/BlockDetailCard';
import { InstructionSheet } from '@/features/client/components/detail/InstructionSheet';
import { DeclareSheet } from '@/features/client/components/detail/DeclareSheet';
import { Celebration } from '@/features/client/components/end/Celebration';
import { Loads } from '@/features/client/components/end/Loads';
import { Feeling } from '@/features/client/components/end/Feeling';
import { Week } from '@/features/client/components/end/Week';
import {
  daysDone,
  doneInWeek,
  plannedDays,
  weekStreak,
  weekTarget,
} from '@/features/client/weekRing';
import { CLIENT_ROUTES } from '@/shared/config/routes';
import { EmptyState } from '@/shared/components/EmptyState';
import { ActionButton } from '@/shared/components/ActionButton';
import { hitArea } from '@/shared/components/hitArea';
import { sessionTitle } from '@/features/program/sessionTitle';
import { CoachSays } from '@/features/client/components/CoachSays';

// Ce qui a été réalisé se saisit exercice par exercice pendant la séance,
// puis part d'un coup avec le bilan. La clé est « rang du bloc : rang de
// l'exercice », exactement l'adressage qu'attend l'API. Un exercice dont
// aucune série n'est renseignée n'est pas envoyé du tout : ne rien avoir à
// dire n'est pas une valeur.
/**
 * Les tours bouclés, tels que l'API les attend.
 *
 * Zéro part avec le reste : un client qui n'a bouclé aucun tour l'a vécu, et
 * ne rien envoyer reviendrait à dire qu'il n'a pas fait le bloc.
 */
const toRoundsDone = (rounds?: Record<string, number>): RoundsDoneEntry[] =>
  Object.entries(rounds ?? {}).map(([blockOrder, rounds]) => ({
    blockOrder: Number(blockOrder),
    rounds,
  }));

/** Ce que les échelles bornées ont donné, tel que l'API l'attend. */
const toLadderDone = (
  ladder?: Record<string, { rungs: number; seconds: number }>
): LadderDoneEntry[] =>
  Object.entries(ladder ?? {}).map(([blockOrder, result]) => ({
    blockOrder: Number(blockOrder),
    ...result,
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
    history,
    coach,
  } = useOutletContext<ClientSessionsData>();
  const location = useLocation();
  // « Démarrer » sur l'accueil arrive ici avec `guided: 'start'` : la séance
  // guidée s'ouvre d'emblée, sur son écran d'ouverture, et la fiche attend
  // dessous. Une touche au lieu de trois avant le premier exercice.
  const [guidedEntry] = useState(
    () => (location.state as { guided?: string } | null)?.guided
  );
  // « Reprendre » sur l'accueil arrive avec `guided: 'resume'` : même
  // ouverture d'emblée, mais droit à l'étape gardée.
  const [isGuidedOpen, setIsGuidedOpen] = useState(
    () => guidedEntry === 'start' || guidedEntry === 'resume'
  );
  // La demande est lue une fois puis effacée de l'historique : revenir sur
  // la fiche par « Précédent », ou la recharger, ne doit pas relancer la
  // séance.
  useEffect(() => {
    if ((location.state as { guided?: string } | null)?.guided)
      navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);
  useDocumentTitle(activeSession ? `Séance ${activeSession.order}` : undefined);

  // Terminer une séance se fait en deux temps : « veux-tu noter tes
  // charges ? », puis le bilan. `idle` couvre la lecture, où l'écran ne
  // demande rien.
  //
  // Après une séance menée en mode guidé, l'écran de fin vient d'abord
  // (`celebrate`) ; « Compléter mes charges » y mène à la saisie (`loads`),
  // qui y revient.
  const [flow, setFlow] = useState<
    'idle' | 'celebrate' | 'loads' | 'record' | 'review' | 'week'
  >('idle');
  // D'où l'on vient, lu une fois : l'état de navigation est effacé dès
  // qu'une séance guidée demandée depuis l'accueil s'est ouverte.
  const [cameFrom] = useState(
    () => (location.state as { from?: string } | null)?.from
  );
  const backLabel = cameFrom === 'today' ? "Aujourd'hui" : 'Programme';
  /** La consigne ouverte en feuille, s'il y en a une. */
  const [instruction, setInstruction] = useState<BlockExercise | null>(null);
  /** La feuille « Je l'ai déjà faite ». */
  const [declaring, setDeclaring] = useState(false);
  /** La date que « Je l'ai déjà faite » a choisie, pour le ressenti. */
  const [declaredDate, setDeclaredDate] = useState<string | undefined>();
  /** Le dernier envoi du ressenti n'est pas parti. */
  const [sendFailed, setSendFailed] = useState(false);
  /** La semaine telle que l'envoi l'a laissée, pour son dernier écran. */
  const [week, setWeek] = useState<Omit<
    React.ComponentProps<typeof Week>,
    'onFinish'
  > | null>(null);

  /**
   * La semaine, avant et après la séance qu'on vient d'envoyer.
   *
   * Calculée sur l'historique tel qu'il était à l'envoi, plus cette séance
   * à sa date — celle du jour, ou celle de « Ce n'était pas aujourd'hui ».
   * Relire l'historique une fois rechargé l'aurait comptée deux fois, ou
   * pas du tout selon le moment où il revient.
   */
  const weekAfter = (completedAt?: string) => {
    const when = completedAt ? new Date(`${completedAt}T12:00:00`) : new Date();
    const withThis = [...history, { completedAt: when.toISOString() }];
    const target = weekTarget(sessions);
    return {
      target,
      before: doneInWeek(history),
      after: doneInWeek(withThis),
      streak: weekStreak(withThis, target),
      doneDays: daysDone(withThis),
      plannedDays: plannedDays(sessions),
    };
  };

  // Ce qui a été noté ne vit plus dans la seule mémoire.
  //
  // C'était un `useState` nu : un rechargement, un appel entrant qui tue
  // l'onglet, et quarante minutes de charges disparaissaient. L'application
  // retenait pourtant scrupuleusement à quelle étape on en était. Elle
  // gardait ce qui se retrouve et perdait ce qui ne se retrouve pas.
  const [performed, setPerformed] = useState<Record<string, PerformedValues>>(
    () =>
      activeSession ? (readProgress(activeSession._id)?.performed ?? {}) : {}
  );

  // La saisie appartient à une séance précise : passer à une autre depuis
  // le programme ne doit pas traîner les charges de la précédente dans le
  // bilan. Chacune retrouve les siennes, là où elle les a laissées.
  const [performedFor, setPerformedFor] = useState(activeSession?._id);
  if (activeSession?._id !== performedFor) {
    setPerformedFor(activeSession?._id);
    setPerformed(
      activeSession ? (readProgress(activeSession._id)?.performed ?? {}) : {}
    );
    setFlow('idle');
  }

  /**
   * Le récapitulatif, calculé à l'ouverture du bilan.
   *
   * Il n'existe que si la séance a été menée en mode guidé : sans état
   * enregistré il n'y a rien à constater, et un récapitulatif vide vaudrait
   * moins que pas de récapitulatif.
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
      startedAt: saved.startedAt,
    });
  }, [activeSession, flow, performed]);

  const handlePerformedChange = useCallback(
    (key: string, next: PerformedValues) =>
      setPerformed((prev) => {
        const updated = { ...prev, [key]: next };
        // À la frappe plutôt qu'à la perte du focus : ce qu'on cherche à
        // couvrir, c'est l'application qui disparaît sans prévenir.
        if (activeSession)
          writeProgress(activeSession._id, { performed: updated });
        return updated;
      }),
    [activeSession]
  );

  // Le record de chaque mouvement, pour la feuille de consigne : la série
  // la plus lourde de tout l'historique, comme à la fin d'une séance.
  const records = useMemo(() => bestLoads(history), [history]);

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
          mood="sleep"
          title="Ton programme arrive"
          line={`${coach.opening} prépare tes séances. Tu n'as rien à faire : elles apparaîtront ici.`}
        />
      </Container>
    );
  }

  // La séance demandée n'est pas dans le programme : un lien périmé, ou une
  // séance que le coach a retirée. Le programme, lui, est bien là — la porte
  // au-dessus ne laisse pas monter cet écran sans lui.
  if (!activeSession) {
    return (
      <Container maxW={CLIENT_CONTENT_MAX_W} py={8} px={4}>
        <EmptyState
          mood="oops"
          headingLevel="h1"
          title="Cette séance n'existe plus"
          line={`${coach.opening} l'a peut-être retirée de ton programme.`}
          action={
            <ActionButton
              tone="ghost"
              size="md"
              onClick={() => navigate(CLIENT_ROUTES.program)}
            >
              Voir mon programme
            </ActionButton>
          }
        />
      </Container>
    );
  }

  // Une séance commencée sur ce téléphone : le bouton dit « Reprendre ».
  // La séance guidée pose encore sa question en s'ouvrant d'ici — elle
  // offre « Recommencer depuis le début », que la fiche ne porte pas.
  const saved = readProgress(activeSession._id);
  const started = !!saved && (saved.step > 0 || saved.done.length > 0);
  const hasExercises = activeSession.blocks.some((b) => b.exercises.length > 0);
  const blocks = [...activeSession.blocks].sort((a, b) => a.order - b.order);
  const exerciseCount = distinctExerciseCount(activeSession);
  const days = formatSuggestedDays(activeSession.suggestedDays);
  const note = activeSession.notes?.trim();
  const openGuided = () => setIsGuidedOpen(true);

  const head = (
    <VStack align="stretch" gap="14px">
      <Text
        as="h1"
        fontSize="32px"
        fontWeight="800"
        lineHeight="1.1"
        letterSpacing="-0.01em"
        fontStretch="88%"
      >
        {openingTitle(activeSession)}
      </Text>
      <HStack gap="6px" wrap="wrap">
        {hasExercises && (
          <HomeChip tone="amber">
            ≈&nbsp;{estimatedMinutes(activeSession)}&nbsp;min
          </HomeChip>
        )}
        {days && <HomeChip>Conseillée {days}</HomeChip>}
        <HomeChip tone="outline">
          {blocks.length}&nbsp;bloc{blocks.length > 1 ? 's' : ''} ·{' '}
          {exerciseCount}&nbsp;exercice{exerciseCount > 1 ? 's' : ''}
        </HomeChip>
      </HStack>
      {note && (
        <Box bg="bg.surface" borderRadius="20px 20px 20px 6px" px="14px" py={3}>
          <CoachSays />
          <Text fontSize="15px" lineHeight="1.5" whiteSpace="pre-wrap">
            {note}
          </Text>
        </Box>
      )}
    </VStack>
  );

  // Le pied : « Démarrer » d'abord, « Je l'ai déjà faite » en lien discret —
  // ce n'est pas le chemin normal, et il ne se présente plus comme tel.
  const actions = (
    <VStack align="stretch" gap={1}>
      {hasExercises && (
        <ActionButton size="lg" w="full" onClick={openGuided}>
          <LuPlay size={18} fill="currentColor" aria-hidden />
          {started ? 'Reprendre' : 'Démarrer'}
        </ActionButton>
      )}
      <Box
        as="button"
        alignSelf="center"
        css={hitArea()}
        color="fg.muted"
        fontSize="sm"
        fontWeight="700"
        py={2}
        onClick={() => setDeclaring(true)}
        _hover={{ color: 'fg' }}
      >
        Je l&rsquo;ai déjà faite
      </Box>
    </VStack>
  );

  return (
    <Container
      maxW={{ base: CLIENT_CONTENT_MAX_W, lg: CLIENT_GRID_MAX_W }}
      py={6}
      px={4}
      pb={{ base: '190px', lg: 8 }}
    >
      {/* On revient d'où l'on vient : l'accueil ou le programme. Un vrai
          bouton, atteignable au clavier. */}
      <Box
        as="button"
        aria-label={`Revenir à ${backLabel}`}
        w="fit-content"
        mb={4}
        css={hitArea()}
        onClick={() =>
          navigate(
            cameFrom === 'today' ? CLIENT_ROUTES.today : CLIENT_ROUTES.program
          )
        }
        color="fg.muted"
        _hover={{ color: 'app.primary' }}
        transition="color 0.15s"
      >
        <HStack gap={1.5}>
          <LuArrowLeft size={14} />
          <Text fontSize="sm" fontWeight="medium">
            {backLabel}
          </Text>
        </HStack>
      </Box>

      <Grid
        gap={4}
        templateColumns={{ base: '1fr', lg: '1.5fr 1fr' }}
        templateAreas={{ base: '"head" "blocks"', lg: '"blocks head"' }}
        alignItems="start"
      >
        <VStack
          gridArea="head"
          align="stretch"
          gap={4}
          position={{ lg: 'sticky' }}
          top={{ lg: 6 }}
          bg={{ lg: 'surface.card' }}
          borderRadius={{ lg: 'card' }}
          p={{ lg: '18px' }}
        >
          {head}
          <Box display={{ base: 'none', lg: 'block' }}>{actions}</Box>
        </VStack>
        <VStack gridArea="blocks" align="stretch" gap={3}>
          {blocks.map((block) => (
            <BlockDetailCard
              key={block._id ?? block.order}
              block={block}
              lastPerformance={lastPerformance}
              onOpenExercise={setInstruction}
            />
          ))}
          {blocks.length === 0 && (
            <Text color="fg.muted" textAlign="center" py={6}>
              Aucun bloc dans cette séance.
            </Text>
          )}
        </VStack>
      </Grid>

      {/* Au téléphone, le pied reste collé en bas ; les blocs défilent
          dessous. Ancré au bas de l'écran et non à la barre d'onglets, dont
          la hauteur dépend de la zone sûre du téléphone. */}
      <Box
        display={{ base: 'block', lg: 'none' }}
        position="fixed"
        left={0}
        right={0}
        bottom={0}
        bg="bg.canvas"
        borderTop="1px solid"
        borderColor="line"
        px={4}
        pt={3}
        pb="calc(env(safe-area-inset-bottom, 0px) + 74px)"
        zIndex={20}
      >
        <Box maxW={CLIENT_CONTENT_MAX_W} mx="auto">
          {actions}
        </Box>
      </Box>

      {instruction && (
        <InstructionSheet
          entry={instruction}
          last={lastPerformance?.get(instruction.exercise._id)}
          record={records.get(instruction.exercise._id)}
          onClose={() => setInstruction(null)}
        />
      )}

      {declaring && (
        <DeclareSheet
          onClose={() => setDeclaring(false)}
          onContinue={(date) => {
            setDeclaring(false);
            setDeclaredDate(date);
            setFlow('record');
          }}
        />
      )}

      {isGuidedOpen && (
        <GuidedSession
          session={activeSession}
          resumeSaved={guidedEntry === 'resume'}
          onExit={() => setIsGuidedOpen(false)}
          onFinish={() => {
            setIsGuidedOpen(false);
            // L'écran de fin d'abord : la séance vient d'être menée, elle a
            // de quoi être fêtée. La question des charges ne se pose plus —
            // elles se notent en route, et le reste est un lien.
            setFlow(
              readProgress(activeSession._id)
                ? 'celebrate'
                : countRecorded(performed) > 0
                  ? 'review'
                  : 'record'
            );
          }}
          lastPerformance={lastPerformance}
          performed={performed}
          onPerformedChange={handlePerformedChange}
        />
      )}

      {flow === 'celebrate' && recap && (
        <Celebration
          title={sessionTitle(activeSession.order, activeSession.name)}
          recap={recap}
          highlight={highlightOf(
            activeSession,
            performed,
            history,
            lastPerformance
          )}
          onContinue={() => setFlow('review')}
          onCompleteLoads={() => setFlow('loads')}
        />
      )}

      {flow === 'loads' && (
        <Loads
          session={activeSession}
          performed={performed}
          onPerformedChange={handlePerformedChange}
          lastPerformance={lastPerformance}
          from="end"
          onDone={() => setFlow('celebrate')}
          onBack={() => setFlow('celebrate')}
        />
      )}

      {/* Déclarée faite sans le mode guidé : pas d'écran de fête, les
          charges d'abord, puis le ressenti. */}
      {flow === 'record' && (
        <Loads
          session={activeSession}
          performed={performed}
          onPerformedChange={handlePerformedChange}
          lastPerformance={lastPerformance}
          from="declared"
          onDone={() => setFlow('review')}
          onBack={() => setFlow('idle')}
        />
      )}

      {flow === 'review' && (
        <Feeling
          date={declaredDate}
          isSending={isSubmitting}
          failed={sendFailed}
          onClose={() => {
            setSendFailed(false);
            setFlow('idle');
          }}
          onSubmit={(feedback, notes, completedAt) => {
            setSendFailed(false);
            // L'écran reste jusqu'à la réponse : réussi, on part vers
            // l'accueil ; manqué, il le dit et l'on réessaie d'une touche.
            handleSubmitLog(
              feedback,
              notes,
              completedAt,
              toPerformedEntries(performed),
              toRoundsDone(readProgress(activeSession._id)?.rounds),
              toLadderDone(readProgress(activeSession._id)?.ladder),
              {
                onError: () => setSendFailed(true),
                onSuccess: () => {
                  setWeek(weekAfter(completedAt));
                  setFlow('week');
                },
              }
            );
          }}
        />
      )}

      {flow === 'week' && week && (
        <Week {...week} onFinish={() => navigate(CLIENT_ROUTES.today)} />
      )}
    </Container>
  );
};
export default SessionScreen;
