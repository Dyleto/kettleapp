import { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Heading,
  HStack,
  Spinner,
  Stack,
  Text,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import { LuArrowLeft, LuBookOpen } from 'react-icons/lu';
import { useClientDetails } from '@/features/coach/hooks/useClientDetails';
import { useClientHistory } from '@/features/coach/hooks/useClientHistory';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useProgramEditor } from '@/features/program/hooks/useProgramEditor';
import { useProgramAutoSave } from '@/features/program/hooks/useProgramAutoSave';
import { annulable } from '@/components/annulable';
import { InlineText } from '@/features/program/components/InlineValue';
import { getBlockLabel } from '@/features/program/constants';
import { useUpdateProgramSessions } from '@/features/program/hooks/useProgramMutations';
import { ClientProgramTab } from '@/features/coach/components/ClientProgramTab';
import { SessionRail } from '@/features/coach/components/SessionRail';
import { SessionFeedbackStrip } from '@/features/coach/components/SessionFeedbackStrip';
import { ProgramSaveStatus } from '@/features/program/components/ProgramSaveStatus';
import { BackLink } from '@/components/BackLink';
import { Header } from '@/components/Header';
import { TACTILE, hitArea } from '@/components/hitArea';
import { EtatVide } from '@/components/EtatVide';
import { COACH_ROUTES } from '@/config/routes';
import { Exercise, Session } from '@/types';

/**
 * "Avec ses 3 exercices.", "Avec son exercice.", or nothing at all.
 *
 * Plurals are not a matter of an "s" glued on the end: "Avec ses 1 bloc" is
 * not something you say, and that is what the short form produced.
 */
const compteRendu = (combien: number, nom: string): string | undefined => {
  if (combien === 0) return undefined;
  if (combien === 1) return `Avec son ${nom}.`;
  return `Avec ses ${combien} ${nom}s.`;
};

const ClientDetails = () => {
  const { clientId, sessionIndex } = useParams();
  const navigate = useNavigate();

  const { data: client, isLoading } = useClientDetails(clientId!);
  const { data: history = [] } = useClientHistory(clientId!);

  // The client's name, not "Séance 1": that is what distinguishes two tabs
  // open side by side, and it is the finding being fixed. While it loads, the
  // tab keeps the product name rather than showing a blank.
  useDocumentTitle(
    client ? `${client.firstName} ${client.lastName}` : undefined
  );
  const { program, initialize, actions } = useProgramEditor(null);
  const updateProgramMutation = useUpdateProgramSessions(clientId!, {
    silent: true,
  });

  // `mutateAsync` is stable, but the mutation is not: passing the whole
  // object to the hook would restart its send scheduling on every render.
  const { mutateAsync } = updateProgramMutation;
  const save = useCallback(
    (sessions: Session[]) => mutateAsync(sessions),
    [mutateAsync]
  );

  const {
    state: saveState,
    savedAt,
    flush,
  } = useProgramAutoSave({
    program,
    serverProgram: client?.program,
    initialize,
    save,
  });

  /**
   * From what width the client's feedback becomes a column.
   *
   * The threshold was 1536 px, which reserved the third column for very large
   * screens: on an ordinary laptop the coach read their client's feedback as
   * a banner above the programme it comments on, and so never at the same
   * time as it.
   *
   * At 1280 px the room exists — the rail is 220 px, the feedback column 300,
   * leaving over 700 px for the programme, which is more than the 660 it
   * occupied before this change.
   */
  const isWide = useBreakpointValue({ base: false, xl: true });

  const currentIndex = Math.max(0, (Number(sessionIndex) || 1) - 1);
  const sessions = program?.sessions ?? [];
  const activeSession = sessions[currentIndex] ?? null;

  // The whole programme is in memory: "already in this programme" and "never
  // done" are computed without a single extra request.
  const inProgram = useMemo<Exercise[]>(() => {
    const byId = new Map<string, Exercise>();
    program?.sessions.forEach((s) =>
      s.blocks.forEach((b) =>
        b.exercises.forEach((ex) => byId.set(ex.exercise._id, ex.exercise))
      )
    );
    return [...byId.values()].sort((a, b) =>
      a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
    );
  }, [program]);

  /**
   * How many times each session was done, and when the last was.
   *
   * "faite 4 fois" lived in tiny grey to the right of the open session's
   * title — so one session at a time. Yet that is the information that says
   * whether the programme is being followed: the coach needs to read it
   * across every session at once, to see the ones their client avoids.
   */
  const suivi = useMemo(() => {
    const par = new Map<string, { fois: number; derniere?: string }>();
    for (const h of history) {
      const courant = par.get(h.originalSessionId) ?? { fois: 0 };
      const quand = String(h.completedAt);
      par.set(h.originalSessionId, {
        fois: courant.fois + 1,
        derniere:
          !courant.derniere || quand > courant.derniere
            ? quand
            : courant.derniere,
      });
    }
    return par;
  }, [history]);

  const handleSelectSession = (index: number) => {
    navigate(COACH_ROUTES.clientSession(clientId!, index + 1));
  };

  const handleAddSession = () => {
    actions.addSession();
    navigate(
      COACH_ROUTES.clientSession(clientId!, (program?.sessions.length ?? 0) + 1)
    );
  };

  /**
   * Delete the open session, with the means to put it back.
   *
   * It is the biggest possible loss in one gesture — a session takes all its
   * blocks with it — and that is precisely why the safety net beats the
   * question: the question gets a reflex "yes" after the third time, while
   * the banner waits eight seconds asking nothing.
   *
   * Undoing also brings the coach back to it. Cancelling means returning
   * where you were, not merely recovering what you had lost.
   */
  const handleRemoveActiveSession = () => {
    if (!activeSession) return;
    const index = currentIndex;
    const supprimee = activeSession;
    const combien = supprimee.blocks.length;

    actions.removeSession(supprimee._id);
    navigate(COACH_ROUTES.clientSession(clientId!, 1));

    annulable({
      titre: `Séance ${supprimee.order} supprimée`,
      description: compteRendu(combien, 'bloc'),
      annuler: () => {
        actions.insertSession(index, supprimee);
        navigate(COACH_ROUTES.clientSession(clientId!, index + 1));
      },
    });
  };

  /**
   * Delete a block, with the means to put it back.
   *
   * It had a confirmation, and that goes with this safety net: keeping both
   * would mean asking a question AND offering a recovery, that is two
   * gestures for one possible mistake. A block leaves whole, with its
   * exercises — the banner says so, and "Annuler" puts it back in its place.
   */
  const supprimerBloc = (blockId: string) => {
    const index = activeSession?.blocks.findIndex((b) => b._id === blockId);
    const bloc =
      index !== undefined && index >= 0
        ? activeSession?.blocks[index]
        : undefined;
    if (!activeSession || !bloc || index === undefined) return;

    actions.removeBlock(activeSession._id, blockId);
    annulable({
      titre: `Bloc ${getBlockLabel(bloc.type)} supprimé`,
      description: compteRendu(bloc.exercises.length, 'exercice'),
      annuler: () => actions.insertBlock(activeSession._id, index, bloc),
    });
  };

  /**
   * Remove an exercise, with the means to put it back.
   *
   * It is the editor's most frequent gesture, and the only one that asked
   * nothing: a ✕ in the gutter, next to "change the unit". A confirmation on
   * every removal would be unbearable; a banner that stays eight seconds
   * costs nothing to someone who did not make a mistake.
   */
  const retirerExercice = (blockId: string, index: number) => {
    const bloc = activeSession?.blocks.find((b) => b._id === blockId);
    const retire = bloc?.exercises[index];
    if (!activeSession || !retire) return;

    actions.removeExercise(activeSession._id, blockId, index);
    annulable({
      titre: `${retire.exercise.name} retiré`,
      description: `De ${getBlockLabel(bloc.type)}.`,
      annuler: () =>
        actions.insertExercise(activeSession._id, blockId, index, retire),
    });
  };

  const handleDuplicateActiveSession = () => {
    if (!activeSession) return;
    actions.duplicateSession(activeSession._id);
    // The copy is inserted right after the original: we open it at once, it
    // is what has just been created in order to be adjusted.
    navigate(COACH_ROUTES.clientSession(clientId!, currentIndex + 2));
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="60vh"
      >
        <Spinner size="xl" />
      </Box>
    );
  }

  if (!client || !program) return null;

  const sessionCount = program.sessions.length;
  const sessionHistory = activeSession
    ? history.filter((h) => h.originalSessionId === activeSession._id)
    : [];

  const clientName = `${client.firstName} ${client.lastName}`;

  return (
    <>
      {/* Mobile: one bar only. It replaces the layout's generic banner
          (see the route's `handle`) and absorbs the page header — the
          client's name on the left, their journal and the account on the
          right. */}
      <Box
        as="header"
        display={{ base: 'block', md: 'none' }}
        position="sticky"
        top={0}
        zIndex={3}
        bg="bg.canvas"
        borderBottomWidth="1px"
        borderColor="whiteAlpha.100"
      >
        <HStack gap={1} align="center" px={2} py={1}>
          <Box
            as="button"
            aria-label="Retour à la liste des clients"
            onClick={() => navigate(COACH_ROUTES.clients)}
            color="fg.muted"
            flexShrink={0}
            p={2}
            css={hitArea(44)}
          >
            <LuArrowLeft size={18} />
          </Box>
          <Heading as="h1" size="sm" flex={1} minW={0} lineClamp={1}>
            {clientName}
          </Heading>
          <Box
            as="button"
            aria-label={
              client.unseenCount > 0
                ? `Journal complet — ${client.unseenCount} séance${client.unseenCount > 1 ? 's' : ''} non vue${client.unseenCount > 1 ? 's' : ''}`
                : 'Journal complet'
            }
            onClick={() => navigate(COACH_ROUTES.clientJournal(clientId!))}
            color="fg.muted"
            flexShrink={0}
            /* A real size rather than an invisible zone: at 34 px wide,
               its 44 px overflowed 5 px onto the account menu right beside
               it, and the menu won — you aimed at the journal and opened the
               account. */
            boxSize="44px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            position="relative"
          >
            <LuBookOpen size={18} />
            {client.unseenCount > 0 && (
              <Box
                position="absolute"
                top="4px"
                right="4px"
                w="7px"
                h="7px"
                borderRadius="full"
                bg="app.primary"
              />
            )}
          </Box>
          <Header />
        </HStack>
      </Box>

      {/* The mobile tab bar is fixed over the page: without this reserve,
          the editor's last rows go underneath. */}
      <Box
        w="100%"
        px={{ base: 4, md: 8 }}
        pt={{ base: 4, md: 6 }}
        pb={{ base: 'calc(env(safe-area-inset-bottom, 0px) + 86px)', md: 6 }}
      >
        <VStack
          align="stretch"
          gap={1}
          mb={5}
          display={{ base: 'none', md: 'flex' }}
        >
          <BackLink
            label="Clients"
            onClick={() => navigate(COACH_ROUTES.clients)}
          />
          <HStack gap={3} align="center">
            <Avatar.Root size="md">
              <Avatar.Fallback
                name={`${client.firstName} ${client.lastName}`}
              />
              <Avatar.Image alt="" src={client.picture} />
            </Avatar.Root>
            <VStack align="start" gap={0} flex={1} minW={0}>
              {/* This screen's h1 is the mobile bar's: only one of the two
                  headers shows at a time, but both were marked up as h1. */}
              <Heading as="p" size="lg" fontWeight="bold">
                {client.firstName} {client.lastName}
              </Heading>
              <Text fontSize="sm" color="fg.muted">
                {sessionCount} séance{sessionCount > 1 ? 's' : ''}
                {client.unseenCount > 0 &&
                  ` · ${client.unseenCount} non vue${client.unseenCount > 1 ? 's' : ''}`}
              </Text>
            </VStack>
            <Button
              size="sm"
              variant="outline"
              flexShrink={0}
              css={{ [TACTILE]: { minHeight: '44px' } }}
              onClick={() => navigate(COACH_ROUTES.clientJournal(clientId!))}
            >
              Journal complet
            </Button>
          </HStack>
        </VStack>

        {/* The rail becomes a column at `lg`, not at `md`: see
            `SessionRail`. The layout has to follow the same threshold,
            otherwise the horizontal strip would end up beside the editor
            instead of above it. */}
        <Stack
          direction={{ base: 'column', lg: 'row' }}
          align={{ base: 'stretch', lg: 'flex-start' }}
          gap={{ base: 4, lg: 6 }}
        >
          <SessionRail
            sessions={program.sessions}
            activeIndex={currentIndex}
            onSelect={handleSelectSession}
            onAddSession={handleAddSession}
            onReorder={actions.reorderSessions}
            suivi={suivi}
          />

          <Box flex="1 1 auto" minW={0} maxW={{ base: 'none', md: '980px' }}>
            {activeSession ? (
              <>
                {/* The rank stays the title, the name adds to it — and is
                    edited where it is read, exactly like a block's free name:
                    "+ nom" when there is none, the name itself otherwise. */}
                <HStack
                  justify="flex-start"
                  align="baseline"
                  gap={2}
                  rowGap={1}
                  wrap="wrap"
                  mb={3}
                  className="group"
                >
                  <Heading as="h2" size="md" flexShrink={0}>
                    Séance {activeSession.order}
                  </Heading>
                  <InlineText
                    value={activeSession.name}
                    onChange={(name) =>
                      actions.updateSessionName(activeSession._id, name)
                    }
                    addLabel="+ nom"
                    ariaLabel={`Nom de la séance ${activeSession.order}`}
                    fontSize="sm"
                    width="220px"
                  />
                  {/* The count moved into the rail, where it reads across
                      every session at once. Repeating it here would say
                      nothing more about the open one. */}
                </HStack>

                {!isWide && <SessionFeedbackStrip history={sessionHistory} />}

                <ClientProgramTab
                  key={activeSession._id}
                  session={activeSession}
                  inProgram={inProgram}
                  onRemoveSession={handleRemoveActiveSession}
                  clientId={clientId!}
                  onDuplicateSession={handleDuplicateActiveSession}
                  onUpdateSessionDays={(days) =>
                    actions.updateSessionDays(activeSession._id, days)
                  }
                  onUpdateSessionNotes={(notes) =>
                    actions.updateSessionNotes(activeSession._id, notes)
                  }
                  onAddBlock={(type) =>
                    actions.addBlock(activeSession._id, type)
                  }
                  onRemoveBlock={(blockId) => supprimerBloc(blockId)}
                  onUpdateBlock={(blockId, updates) =>
                    actions.updateBlock(activeSession._id, blockId, updates)
                  }
                  onReorderBlocks={(orderedIds) =>
                    actions.reorderBlocks(activeSession._id, orderedIds)
                  }
                  onAddExercise={(blockId, exercise) =>
                    actions.addExercise(activeSession._id, blockId, exercise)
                  }
                  onRemoveExercise={(blockId, index) =>
                    retirerExercice(blockId, index)
                  }
                  onUpdateExercise={(blockId, index, updates) =>
                    actions.updateExercise(
                      activeSession._id,
                      blockId,
                      index,
                      updates
                    )
                  }
                />
              </>
            ) : sessions.length === 0 ? (
              <EtatVide
                titre="Ce programme est vide"
                phrase="Ajoutez une séance pour commencer à le construire."
                action={
                  <Button
                    bg="app.primary"
                    color="bg.canvas"
                    fontWeight="bold"
                    minH="44px"
                    onClick={handleAddSession}
                    _hover={{ bg: 'app.primary.hover' }}
                  >
                    Ajouter une séance
                  </Button>
                }
              />
            ) : (
              /*
               * The programme is not empty: it is this session that does not
               * exist.
               *
               * Both states said "Ce programme est vide", with a rail full of
               * S1…S5 beside it. That is false and it is alarming: a coach
               * who lands on it believes they have lost their client's work.
               * You get here through a bookmarked address that has aged,
               * through a shared link, or by deleting the last session while
               * standing on it.
               */
              <EtatVide
                titre={`La séance ${currentIndex + 1} n'existe pas`}
                phrase={`Ce programme en compte ${sessions.length}. Elle a peut-être été supprimée, ou l'adresse a vieilli.`}
                action={
                  <Button
                    bg="app.primary"
                    color="bg.canvas"
                    fontWeight="bold"
                    minH="44px"
                    onClick={() => handleSelectSession(0)}
                    _hover={{ bg: 'app.primary.hover' }}
                  >
                    Aller à la séance 1
                  </Button>
                }
              />
            )}
          </Box>

          {isWide && activeSession && (
            <Box w={{ xl: '300px', '2xl': '320px' }} flexShrink={0}>
              <SessionFeedbackStrip history={sessionHistory} variant="panel" />
            </Box>
          )}
        </Stack>

        <ProgramSaveStatus
          state={saveState}
          savedAt={savedAt}
          onRetry={flush}
        />
      </Box>
    </>
  );
};

export default ClientDetails;
