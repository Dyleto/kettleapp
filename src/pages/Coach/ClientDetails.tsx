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

const ClientDetails = () => {
  const { clientId, sessionIndex } = useParams();
  const navigate = useNavigate();

  const { data: client, isLoading } = useClientDetails(clientId!);
  const { data: history = [] } = useClientHistory(clientId!);

  // Le nom du client, pas « Séance 1 » : c'est ce qui distingue deux onglets
  // ouverts côte à côte, et c'est le constat qu'on corrige. Tant qu'il charge,
  // l'onglet garde le nom du produit plutôt que d'afficher un blanc.
  useDocumentTitle(
    client ? `${client.firstName} ${client.lastName}` : undefined
  );
  const { program, initialize, actions } = useProgramEditor(null);
  const updateProgramMutation = useUpdateProgramSessions(clientId!, {
    silent: true,
  });

  // `mutateAsync` est stable, mais la mutation, elle, ne l'est pas : passer
  // l'objet entier au crochet relancerait sa programmation d'envoi à chaque
  // rendu.
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
   * À partir de quelle largeur le retour du client passe en colonne.
   *
   * Le seuil était à 1536 px, ce qui réservait la troisième colonne aux très
   * grands écrans : sur un portable ordinaire, le coach lisait le retour de
   * son client en bandeau au-dessus du programme qu'il commente, donc jamais
   * en même temps que lui.
   *
   * À 1280 px la place existe — le rail fait 220 px, la colonne de retour
   * 300, il reste plus de 700 px pour le programme, soit davantage que les
   * 660 qu'il occupait avant ce changement.
   */
  const isWide = useBreakpointValue({ base: false, xl: true });

  const currentIndex = Math.max(0, (Number(sessionIndex) || 1) - 1);
  const activeSession = program?.sessions[currentIndex] ?? null;

  // Le programme entier est en mémoire : « déjà dans ce programme » et
  // « jamais faite » se calculent sans une seule requête de plus.
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
   * Combien de fois chaque séance a été faite, et quand pour la dernière.
   *
   * « faite 4 fois » vivait en gris minuscule à droite du titre de la séance
   * ouverte — donc une séance à la fois. C'est pourtant l'information qui dit
   * si le programme est suivi : le coach a besoin de la lire sur toutes les
   * séances d'un coup, pour voir celles que son client évite.
   */
  const suivi = useMemo(() => {
    const par = new Map<string, { fois: number; derniere?: string }>();
    for (const h of history) {
      const courant = par.get(h.originalSessionId) ?? { fois: 0 };
      const quand = String(h.completedAt);
      par.set(h.originalSessionId, {
        fois: courant.fois + 1,
        derniere:
          !courant.derniere || quand > courant.derniere ? quand : courant.derniere,
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

  const handleRemoveActiveSession = () => {
    if (!activeSession) return;
    actions.removeSession(activeSession._id);
    navigate(COACH_ROUTES.clientSession(clientId!, 1));
  };

  const handleDuplicateActiveSession = () => {
    if (!activeSession) return;
    actions.duplicateSession(activeSession._id);
    // La copie est insérée juste après l'originale : on l'ouvre aussitôt,
    // c'est elle qu'on vient créer pour l'ajuster.
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
      {/* Mobile : une seule barre. Elle remplace le bandeau générique du
          layout (voir le `handle` de la route) et absorbe l'en-tête de page —
          le nom du client à gauche, son journal et le compte à droite. */}
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
            /* Une taille réelle plutôt qu'une zone invisible : à 34 px de
               large, ses 44 px débordaient de 5 px sur le menu du compte
               juste à côté, et le menu l'emportait — on visait le journal,
               on ouvrait le compte. */
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

      {/* La barre d'onglets mobile est fixée par-dessus la page : sans cette
          réserve, les dernières lignes de l'atelier passent dessous. */}
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
              {/* Le h1 de cet écran est celui de la barre mobile : une seule
                  des deux en-têtes est affichée à la fois, mais toutes deux
                  étaient balisées h1. */}
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

        <Stack
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'stretch', md: 'flex-start' }}
          gap={{ base: 4, md: 6 }}
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
                <HStack justify="space-between" align="baseline" mb={3}>
                  <Heading as="h2" size="md">
                    Séance {activeSession.order}
                  </Heading>
                  {/* Le compte est passé dans le rail, où il se lit sur
                      toutes les séances à la fois. Le répéter ici ne dirait
                      rien de plus sur celle qui est ouverte. */}
                </HStack>

                {!isWide && <SessionFeedbackStrip history={sessionHistory} />}

                <ClientProgramTab
                  key={activeSession._id}
                  session={activeSession}
                  inProgram={inProgram}
                  onRemoveSession={handleRemoveActiveSession}
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
                  onRemoveBlock={(blockId) =>
                    actions.removeBlock(activeSession._id, blockId)
                  }
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
                    actions.removeExercise(activeSession._id, blockId, index)
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
            ) : (
              <EtatVide
                titre="Ce programme est vide"
                phrase="Ajoutez une séance pour commencer à le construire."
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
