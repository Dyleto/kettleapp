import { useCallback, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
  Avatar,
  Box,
  Button,
  Heading,
  HStack,
  Stack,
  Text,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import {
  LuArrowLeft,
  LuBookOpen,
  LuEllipsis,
  LuLayoutGrid,
  LuPlus,
} from 'react-icons/lu';
import { useClientDetails } from '@/features/coach/hooks/useClientDetails';
import { useClientHistory } from '@/features/coach/hooks/useClientHistory';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import {
  useProgramWorkshop,
  useUpdateProgramSessions,
  ProgramSaveStatus,
  SaveStatus,
} from '@/features/workshop';
import { ClientProgramTab } from '@/features/coach/components/ClientProgramTab';
import { useSessionMenu } from '@/features/coach/hooks/useSessionMenu';
import { ImportTemplateDialog } from '@/features/coach/components/ImportTemplateDialog';
import { useImportTemplate } from '@/features/template';
import { toaster } from '@/shared/components/ui/toasterInstance';
import { useSessionSheets } from '@/features/coach/hooks/useSessionSheets';
import { SessionRail } from '@/features/coach/components/SessionRail';
import { SessionSheet } from '@/features/coach/components/SessionSheet';
import {
  PassagesSheet,
  SessionFeedbackPanel,
} from '@/features/coach/components/SessionPassages';
import { SessionPulse } from '@/features/coach/components/SessionPulse';
import { SessionPreview } from '@/features/coach/preview/SessionPreview';
import { sessionPulse } from '@/domain/history/pulse';
import { exerciseTraces } from '@/domain/history/exerciseTrace';
import { blockScores } from '@/domain/history/blockScore';
import { sessionName } from '@/domain/session/name';
import {
  ActionButton,
  BackLink,
  EmptyState,
  hitArea,
  LoadFailure,
  PillButton,
  TOUCH,
  LoadingShapes,
  ZoneFailure,
} from '@/kit';
import { Header } from '@/shared/components/Header';
import { COACH_ROUTES } from '@/shared/config/routes';
import { isUnavailable } from '@/shared/utils/queryState';
import { Exercise, Session } from '@/shared/types';
import { ExerciseSheet } from '@/features/exercise';

/** Un historique absent, toujours le même : `?? []` en ferait un nouveau à
 * chaque rendu, et chaque calcul qui en dépend repartirait. */
const NO_HISTORY: never[] = [];

const ClientDetails = () => {
  const { clientId, sessionIndex } = useParams();
  const navigate = useNavigate();
  // L'exercice à mettre en vue en arrivant, quand « Ajuster » en désigne un.
  const focusExerciseId = useSearchParams()[0].get('exercise') ?? undefined;

  const clientQuery = useClientDetails(clientId!);
  const { data: client, isLoading } = clientQuery;
  const historyQuery = useClientHistory(clientId!);
  const history = historyQuery.data ?? NO_HISTORY;
  // L'historique qui ne répond pas n'est pas un historique vide : le rail
  // aurait dit « jamais faite » sous chaque séance, et la colonne des
  // ressentis qu'il n'y en a aucun. Le programme, lui, reste éditable.
  const historyDown = isUnavailable(historyQuery);

  // Le nom du client, et non « Séance 1 » : c'est ce qui distingue deux
  // onglets ouverts côte à côte, et c'est le constat qu'on corrige. Pendant le
  // chargement, l'onglet garde le nom du produit plutôt que d'afficher un
  // blanc.
  useDocumentTitle(
    client ? `${client.firstName} ${client.lastName}` : undefined
  );
  const updateProgramMutation = useUpdateProgramSessions(clientId!);

  // `mutateAsync` est stable, mais la mutation ne l'est pas : passer
  // l'objet entier au hook relancerait sa programmation d'envoi à chaque
  // rendu.
  const { mutateAsync } = updateProgramMutation;
  const save = useCallback(
    (sessions: Session[]) => mutateAsync(sessions),
    [mutateAsync]
  );

  const goToSession = useCallback(
    (index: number) => navigate(COACH_ROUTES.clientSession(clientId!, index)),
    [navigate, clientId]
  );

  // L'atelier, partagé avec l'écran des modèles de programme : son état, son
  // enregistrement et ses huit gestes avec leurs filets d'annulation. Ne
  // reste ici que ce qui est propre à un client.
  const {
    program,
    actions,
    activeSession,
    currentIndex,
    workshopProps,
    addSession,
    removeSession,
    duplicateSession,
    moveSession,
    renameSession,
    saveState,
    savedAt,
    flush,
    replaceProgram,
  } = useProgramWorkshop({
    serverProgram: client?.program,
    save,
    sessionIndex,
    goToSession,
  });

  /**
   * À partir de quelle largeur le ressenti du client devient une colonne.
   *
   * Le seuil était à 1536 px, ce qui réservait la troisième colonne aux très
   * grands écrans : sur un portable ordinaire, le coach lisait le ressenti de
   * son client en bandeau au-dessus du programme qu'il commente, donc jamais
   * en même temps que lui.
   *
   * À 1280 px la place existe — le rail fait 220 px, la colonne de ressenti
   * 300, il reste plus de 700 px pour le programme, soit davantage que les
   * 660 qu'il occupait avant ce changement.
   */
  const isWide = useBreakpointValue({ base: false, xl: true });
  // La fiche d'un exercice, à la place de l'aperçu (maquette) : à partir de
  // 1 280 px, la colonne de droite la porte, et l'atelier reste lisible à
  // côté. En dessous, un tiroir la pose par-dessus, comme avant.
  const [asideExercise, setAsideExercise] = useState<Exercise | null>(null);
  // Sur téléphone, la séance ouverte se règle dans une feuille, ouverte par
  // le « ⋯ » de la barre du haut ; `focusName` quand elle vient d'être
  // créée, pour lui donner un nom tout de suite.
  const isPhone = useBreakpointValue({ base: true, md: false });
  // Les passages de la séance, en feuille, là où aucune colonne ne les tient.
  const [passagesOpen, setPassagesOpen] = useState(false);
  // La colonne de droite montre l'aperçu « vu par le client » ou les
  // ressentis ; l'aperçu d'abord, comme la maquette. Il suit le bloc que le
  // coach touche — le premier tant qu'il n'en a touché aucun.
  const [asideView, setAsideView] = useState<'preview' | 'feedback'>('preview');
  const [previewBlockId, setPreviewBlockId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const importTemplate = useImportTemplate();
  const [sessionSheet, setSessionSheet] = useState<{
    focusName: boolean;
  } | null>(null);

  const sessions = program?.sessions ?? [];

  // Le menu d'une séance, pour le « ⋯ » de l'en-tête comme pour le clic
  // droit sur le rail. Renommer une autre séance que celle qu'on lit l'ouvre
  // d'abord : le nom s'écrit là où il se lit.
  const { openCopy, openSaveAsTemplate, sheets } = useSessionSheets({
    sessions,
    clientId: clientId!,
    clientFirstName: client?.firstName,
  });
  const { actionsFor } = useSessionMenu({
    onCopy: openCopy,
    onSaveAsTemplate: openSaveAsTemplate,
    onRename: (sessionId) => {
      renameSession(sessionId);
      const index = sessions.findIndex((s) => s._id === sessionId);
      if (index >= 0) goToSession(index + 1);
    },
    onDuplicate: duplicateSession,
    onRemove: removeSession,
    sessions: sessions,
    onMove: moveSession,
  });

  if (isLoading) {
    // Les formes de l'écran plutôt qu'une roue seule au milieu d'une page
    // vide : la maquette des états, et la même règle partout (LoadingShapes).
    return (
      <Box px={{ base: 4, md: 8 }} pt={{ base: 4, md: 6 }} pb={8}>
        <LoadingShapes layout="workshop" />
      </Box>
    );
  }

  // Une page blanche répondait ici à tout ce qui n'était pas un succès : la
  // panne de réseau comme l'adresse d'un client qui n'existe plus.
  if (isUnavailable(clientQuery)) {
    return (
      <LoadFailure
        query={clientQuery}
        line="Le programme de ton client n'a pas bougé. Vérifie ta connexion, puis réessaie."
        missing={{
          title: 'Ce client est introuvable',
          line: "Le lien a peut-être vieilli, ou ce client n'est plus rattaché à toi.",
          action: (
            <ActionButton
              tone="ghost"
              size="md"
              onClick={() => navigate(COACH_ROUTES.clients)}
            >
              Voir mes clients
            </ActionButton>
          ),
        }}
      />
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
      {/* Mobile : une seule barre. Elle remplace le bandeau générique de
          la mise en page (voir le `handle` de la route) et absorbe l'en-tête
          de page — le nom du client à gauche, son journal et le compte à
          droite. */}
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
                ? `Ressentis — ${client.unseenCount} séance${client.unseenCount > 1 ? 's' : ''} non vue${client.unseenCount > 1 ? 's' : ''}`
                : 'Ressentis'
            }
            onClick={() => navigate(COACH_ROUTES.clientJournal(clientId!))}
            color="fg.muted"
            flexShrink={0}
            /* Une vraie taille plutôt qu'une zone invisible : à 34 px de
                           large, ses 44 px débordaient de 5 px sur le menu du compte juste
                           à côté, et le menu l'emportait — on visait le journal et on
                           ouvrait le compte. */
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
          {/* Le « ⋯ » de la séance ouverte : sur téléphone, son en-tête
              s'efface, et ce qu'il réglait passe dans une feuille. */}
          {activeSession && (
            <Box
              as="button"
              aria-label={`Menu de la séance ${activeSession.order}`}
              onClick={() => setSessionSheet({ focusName: false })}
              color="fg.muted"
              flexShrink={0}
              boxSize="44px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <LuEllipsis size={20} />
            </Box>
          )}
          <Header />
        </HStack>
      </Box>

      {/* La barre d'onglets mobile est fixée par-dessus la page : sans
          cette réserve, les dernières lignes de l'éditeur passent
          dessous. */}
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
              {/* Le h1 de cet écran est celui de la barre mobile : un seul
                  des deux en-têtes s'affiche à la fois, mais tous deux étaient
                  balisés h1. */}
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
              css={{ [TOUCH]: { minHeight: '44px' } }}
              onClick={() => navigate(COACH_ROUTES.clientJournal(clientId!))}
            >
              Ressentis
            </Button>
          </HStack>
        </VStack>

        {/* Le rail devient une colonne à `lg`, pas à `md` : voir
            `SessionRail`. La mise en page doit suivre le même seuil, sans
            quoi la bande horizontale se retrouverait à côté de l'éditeur au
            lieu d'être au-dessus. */}
        <Stack
          direction={{ base: 'column', lg: 'row' }}
          align={{ base: 'stretch', lg: 'flex-start' }}
          gap={{ base: 4, lg: 6 }}
        >
          <SessionRail
            sessions={program.sessions}
            activeIndex={currentIndex}
            onSelect={(index) => goToSession(index + 1)}
            onImport={() => setImportOpen(true)}
            onAddSession={() => {
              // Sur téléphone, le nom d'une séance neuve s'écrit dans sa
              // feuille : son titre y est caché.
              if (isPhone) {
                addSession({ rename: false });
                setSessionSheet({ focusName: true });
              } else addSession();
            }}
            onReorder={actions.reorderSessions}
            history={historyDown ? undefined : history}
            menuFor={(session) => actionsFor(session)}
          />

          <Box flex="1 1 auto" minW={0} maxW={{ base: 'none', md: '980px' }}>
            {/* Les deux vont toujours ensemble — `workshopProps` n'existe
                que s'il y a une séance ouverte — mais TypeScript ne relie pas
                deux valeurs rendues par le même hook : sans le second test, la
                diffusion des propriétés serait refusée. */}
            {activeSession && workshopProps ? (
              <>
                <ClientProgramTab
                  key={activeSession._id}
                  {...workshopProps}
                  menuActions={actionsFor(activeSession, { rename: false })}
                  sessionSheetOnPhone
                  saveStatus={
                    <SaveStatus
                      state={saveState}
                      savedAt={savedAt}
                      onRetry={flush}
                    />
                  }
                  traces={exerciseTraces(activeSession, history)}
                  scores={blockScores(activeSession, history)}
                  onFocusBlock={setPreviewBlockId}
                  pulse={
                    <SessionPulse
                      pulse={sessionPulse(history, activeSession._id)}
                      compact={!!isPhone}
                      onOpen={isWide ? undefined : () => setPassagesOpen(true)}
                      openLabel={`Ressentis de la séance ${activeSession.order}`}
                    />
                  }
                  focusExerciseId={focusExerciseId}
                  onOpenExerciseSheet={isWide ? setAsideExercise : undefined}
                />
              </>
            ) : sessions.length === 0 ? (
              // Le premier écran d'un nouveau client, que la maquette accueille
              // par le personnage, son prénom et les deux façons de commencer.
              // « Ce programme est vide » disait un manque ; celui-ci dit par
              // où partir.
              <EmptyState
                mood="hello"
                title={`Le programme de ${client.firstName ?? 'ton client'} est vide`}
                line="Écris sa première séance, ou pars d’un de tes modèles."
                action={
                  <HStack gap="10px" wrap="wrap" justify="center">
                    <ActionButton size="md" onClick={() => addSession()}>
                      <LuPlus size={18} aria-hidden />
                      Ajouter une séance
                    </ActionButton>
                    <ActionButton
                      tone="ghost"
                      size="md"
                      onClick={() => setImportOpen(true)}
                    >
                      <LuLayoutGrid size={18} aria-hidden />
                      Partir d’un modèle
                    </ActionButton>
                  </HStack>
                }
              />
            ) : (
              /*
               * Le programme n'est pas vide : c'est cette séance qui n'existe
               * pas.
               *
               * Les deux états disaient « Ce programme est vide », avec un
               * rail plein de S1…S5 à côté. C'est faux et c'est alarmant : un
               * coach qui tombe dessus croit avoir perdu le travail de son
               * client. On y arrive par une adresse mise en favori qui a
               * vieilli, par un lien partagé, ou en supprimant la dernière
               * séance alors qu'on est dessus.
               */
              <EmptyState
                title={`La séance ${currentIndex + 1} n'existe pas`}
                line={`Ce programme en compte ${sessions.length}. Elle a peut-être été supprimée, ou l'adresse a vieilli.`}
                action={
                  <Button
                    bg="app.primary"
                    color="bg.canvas"
                    fontWeight="bold"
                    minH="44px"
                    onClick={() => goToSession(1)}
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
              {asideExercise ? (
                <Box
                  as="aside"
                  aria-label={`Fiche de ${asideExercise.name}`}
                  // Une couche pour la ligne ouverte : travailler dans la
                  // fiche n'est pas cliquer à côté de la ligne.
                  data-layer
                  bg="bg.surface"
                  borderRadius="20px"
                  p="20px"
                  position="sticky"
                  top={6}
                >
                  <ExerciseSheet
                    exercise={asideExercise}
                    onClose={() => setAsideExercise(null)}
                    doneLabel="Retour au programme"
                  />
                </Box>
              ) : (
                <VStack align="stretch" gap="14px" position="sticky" top={6}>
                  {/* En haut, pour ne pas sauter d'une vue à l'autre : sous
                      l'aperçu, la bascule changeait de place en changeant
                      de vue. */}
                  <HStack justify="center" gap="6px">
                    <PillButton
                      pressed={asideView === 'preview'}
                      onClick={() => setAsideView('preview')}
                    >
                      Aperçu
                    </PillButton>
                    <PillButton
                      pressed={asideView === 'feedback'}
                      onClick={() => setAsideView('feedback')}
                    >
                      Ressentis
                    </PillButton>
                  </HStack>
                  {asideView === 'preview' ? (
                    <SessionPreview
                      session={activeSession}
                      blockId={previewBlockId}
                      viewer={client.firstName ?? 'le client'}
                    />
                  ) : historyDown ? (
                    <ZoneFailure
                      line="Ses ressentis n’ont pas pu se charger. Son programme, lui, est là."
                      onRetry={() => void historyQuery.refetch()}
                      isRetrying={historyQuery.isRefetching}
                    />
                  ) : (
                    <SessionFeedbackPanel history={sessionHistory} />
                  )}
                </VStack>
              )}
            </Box>
          )}
        </Stack>

        {sheets}

        {importOpen && (
          <ImportTemplateDialog
            clientFirstName={client.firstName}
            currentCount={program.sessions.length}
            onClose={() => setImportOpen(false)}
            onImport={async (template) => {
              const who = client.firstName ?? 'ton client';
              try {
                await replaceProgram(() =>
                  importTemplate.mutateAsync({
                    clientId: clientId!,
                    templateId: template._id,
                  })
                );
              } catch {
                // Rien n'est parti, ou le serveur a refusé : dans les deux
                // cas l'import n'a pas eu lieu, et c'est ce qui compte.
                toaster.create({
                  type: 'error',
                  title: 'Le modèle n’a pas été importé',
                  description: `Le programme de ${who} n’a pas bougé. Réessaie dans un instant.`,
                });
                return;
              }
              setImportOpen(false);
              // Le programme importé n'a peut-être pas autant de séances que
              // l'adresse en désignait : on l'ouvre au début.
              goToSession(1);
              toaster.create({
                type: 'success',
                title: `« ${template.name} » importé chez ${who}`,
              });
            }}
          />
        )}

        {passagesOpen && activeSession && !isWide && (
          <PassagesSheet
            title={`Ressentis · ${sessionName(activeSession)}`}
            pulse={sessionPulse(history, activeSession._id)}
            history={sessionHistory}
            clientFirstName={client.firstName}
            onJournal={() => navigate(COACH_ROUTES.clientJournal(clientId!))}
            onClose={() => setPassagesOpen(false)}
          />
        )}

        {sessionSheet && activeSession && workshopProps && (
          <SessionSheet
            // Une autre séance ouverte sous la feuille — une copie, une
            // séance neuve — en remet le nom à jour.
            key={activeSession._id}
            session={activeSession}
            onRename={workshopProps.onUpdateSessionName}
            onDays={workshopProps.onUpdateSessionDays}
            onNotes={workshopProps.onUpdateSessionNotes}
            actions={actionsFor(activeSession, { rename: false })}
            clientFirstName={client.firstName}
            focusName={sessionSheet.focusName}
            onClose={() => setSessionSheet(null)}
          />
        )}

        {/* Sur téléphone, où l'en-tête cède sa place ; et sans séance
            ouverte, où il n'y a pas d'en-tête pour dire l'état. */}
        <ProgramSaveStatus
          state={saveState}
          savedAt={savedAt}
          onRetry={flush}
          phoneOnly={!!activeSession}
        />
      </Box>
    </>
  );
};

export default ClientDetails;
