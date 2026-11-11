import { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
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
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { useProgramWorkshop } from '@/features/program/hooks/useProgramWorkshop';
import { InlineText } from '@/features/program/components/InlineValue';
import { useUpdateProgramSessions } from '@/features/program/hooks/useProgramMutations';
import { ClientProgramTab } from '@/features/coach/components/ClientProgramTab';
import { SessionRail } from '@/features/coach/components/SessionRail';
import { SessionFeedbackStrip } from '@/features/coach/components/SessionFeedbackStrip';
import { ProgramSaveStatus } from '@/features/program/components/ProgramSaveStatus';
import { BackLink } from '@/shared/components/BackLink';
import { Header } from '@/shared/components/Header';
import { TOUCH, hitArea } from '@/shared/components/hitArea';
import { EmptyState } from '@/shared/components/EmptyState';
import { COACH_ROUTES } from '@/shared/config/routes';
import { Session } from '@/shared/types';

const ClientDetails = () => {
  const { clientId, sessionIndex } = useParams();
  const navigate = useNavigate();

  const { data: client, isLoading } = useClientDetails(clientId!);
  const { data: history = [] } = useClientHistory(clientId!);

  // Le nom du client, et non « Séance 1 » : c'est ce qui distingue deux
  // onglets ouverts côte à côte, et c'est le constat qu'on corrige. Pendant le
  // chargement, l'onglet garde le nom du produit plutôt que d'afficher un
  // blanc.
  useDocumentTitle(
    client ? `${client.firstName} ${client.lastName}` : undefined
  );
  const updateProgramMutation = useUpdateProgramSessions(clientId!, {
    silent: true,
  });

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
    saveState,
    savedAt,
    flush,
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

  const sessions = program?.sessions ?? [];

  /**
   * Combien de fois chaque séance a été faite, et quand fut la dernière.
   *
   * « Faite 4 fois » vivait en petit gris à droite du titre de la séance
   * ouverte — donc une séance à la fois. C'est pourtant l'information qui dit
   * si le programme est suivi : le coach a besoin de la lire sur toutes les
   * séances d'un coup, pour voir celles que son client évite.
   */
  const tracking = useMemo(() => {
    const perSession = new Map<string, { count: number; lastAt?: string }>();
    for (const h of history) {
      const current = perSession.get(h.originalSessionId) ?? { count: 0 };
      const when = String(h.completedAt);
      perSession.set(h.originalSessionId, {
        count: current.count + 1,
        lastAt:
          !current.lastAt || when > current.lastAt ? when : current.lastAt,
      });
    }
    return perSession;
  }, [history]);

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
                ? `Journal complet — ${client.unseenCount} séance${client.unseenCount > 1 ? 's' : ''} non vue${client.unseenCount > 1 ? 's' : ''}`
                : 'Journal complet'
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
              Journal complet
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
            onAddSession={addSession}
            onReorder={actions.reorderSessions}
            onRequestDelete={removeSession}
            tracking={tracking}
          />

          <Box flex="1 1 auto" minW={0} maxW={{ base: 'none', md: '980px' }}>
            {/* Les deux vont toujours ensemble — `workshopProps` n'existe
                que s'il y a une séance ouverte — mais TypeScript ne relie pas
                deux valeurs rendues par le même hook : sans le second test, la
                diffusion des propriétés serait refusée. */}
            {activeSession && workshopProps ? (
              <>
                {/* Le rang reste le titre, le nom s'y ajoute — et s'édite là
                    où il se lit, exactement comme le nom libre d'un bloc :
                    « + nom » quand il n'y en a pas, le nom lui-même
                    sinon. */}
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
                  {/* Le compteur est parti dans le rail, où il se lit sur
                      toutes les séances d'un coup. Le répéter ici ne dirait
                      rien de plus sur celle qui est ouverte. */}
                </HStack>

                {!isWide && <SessionFeedbackStrip history={sessionHistory} />}

                <ClientProgramTab
                  key={activeSession._id}
                  {...workshopProps}
                  clientId={clientId!}
                />
              </>
            ) : sessions.length === 0 ? (
              <EmptyState
                title="Ce programme est vide"
                line="Ajoutez une séance pour commencer à le construire."
                action={
                  <Button
                    bg="app.primary"
                    color="bg.canvas"
                    fontWeight="bold"
                    minH="44px"
                    onClick={addSession}
                    _hover={{ bg: 'app.primary.hover' }}
                  >
                    Ajouter une séance
                  </Button>
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
