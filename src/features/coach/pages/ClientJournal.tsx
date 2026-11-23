import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Avatar,
  Box,
  chakra,
  Grid,
  Heading,
  HStack,
  Portal,
  Spinner,
  Text,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import { LuArrowLeft } from 'react-icons/lu';
import type {
  CompletedSession,
  FeedbackTag,
  InboxItem,
  Session,
} from '@/shared/types';
import { useAuth } from '@/shared/contexts/useAuth';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { useClientDetails } from '@/features/coach/hooks/useClientDetails';
import { useClientHistory } from '@/features/coach/hooks/useClientHistory';
import { useReadOnOpen } from '@/features/coach/hooks/useReadOnOpen';
import { HISTORY_PAGE_SIZE } from '@/features/coach/coach.service';
import { ClientTabs } from '@/features/coach/components/ClientTabs';
import { JournalSummary } from '@/features/coach/journal/JournalSummary';
import { JournalList } from '@/features/coach/journal/JournalList';
import { JournalDetail } from '@/features/coach/journal/JournalDetail';
import { useSheetDismiss } from '@/features/workshop';
import { COACH_ROUTES } from '@/shared/config/routes';
import { Header } from '@/shared/components/Header';
import {
  ActionButton,
  BackLink,
  EmptyState,
  hitArea,
  LoadFailure,
  MonthCalendar,
  Sheet,
  LoadingShapes,
} from '@/kit';
import { isUnavailable } from '@/shared/utils/queryState';
import {
  calendarBounds,
  calendarMarks,
  latestByDay,
  withTag,
} from '@/domain/history/journal';
import { detailDate, previousPassage } from '@/domain/history/journalDetail';
import { concernedExercise } from '@/domain/inbox/concerned';
import { TAG_NOUN } from '@/domain/history/pulse';
import { weekTarget } from '@/domain/week/ring';
import { clientLabel } from '@/domain/inbox/feed';
import { sessionName } from '@/domain/session/name';

/**
 * Les ressentis d'un client : le second volet de sa fiche, à côté de son
 * programme.
 *
 * L'ancien « journal » : une liste et un calendrier qui la filtrait, sous un
 * titre qui changeait de nom selon l'écran. La maquette y pose un résumé —
 * cinq points, une phrase, le rythme, les étiquettes —, un calendrier dont
 * chaque pastille ouvre sa séance, et la bascule « Programme / Ressentis »
 * qui dit où l'on est.
 *
 * Une séance devient lue quand le coach l'ouvre, et plus quand il ouvre
 * l'écran (voir `useReadOnOpen`).
 */
const ClientJournal = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const clientQuery = useClientDetails(clientId!);
  const { data: client, isLoading } = clientQuery;
  useDocumentTitle(
    client ? `Ressentis de ${client.firstName ?? 'ton client'}` : undefined
  );
  const { data: history = [], isLoading: isHistoryLoading } = useClientHistory(
    clientId!
  );
  const readOnOpen = useReadOnOpen(clientId!);
  const [tag, setTag] = useState<FeedbackTag | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const coachId = useAuth().user?.coachId;
  // Le panneau tient à côté de la liste à partir de 1 280 px ; en dessous,
  // la séance monte en feuille, comme dans « À lire ».
  const wide = useBreakpointValue({ base: false, xl: true }) ?? false;
  useSheetDismiss(!!openId && !wide, () => setOpenId(null));

  const marks = useMemo(() => calendarMarks(history), [history]);
  const byDay = useMemo(() => latestByDay(history), [history]);
  const bounds = useMemo(() => calendarBounds(history), [history]);

  if (isLoading) {
    // Les formes de l'écran plutôt qu'une roue seule au milieu d'une page
    // vide : la maquette des états, et la même règle partout (LoadingShapes).
    return (
      <Box
        px={{ base: 4, md: 8 }}
        pt={{ base: 4, md: 6 }}
        pb={8}
        maxW={'760px'}
      >
        <LoadingShapes layout="column" />
      </Box>
    );
  }

  if (isUnavailable(clientQuery)) {
    return (
      <LoadFailure
        query={clientQuery}
        line="Ce que ton client a fait n'a pas bougé. Vérifie ta connexion, puis réessaie."
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

  if (!client) return null;

  const name = clientLabel(client);
  const open = (completed: CompletedSession) => {
    setOpenId(completed._id);
    readOnOpen(completed);
  };
  const opened = history.find((c) => c._id === openId) ?? null;
  const visible = withTag(history, tag);
  // La pièce de « À lire » attend une séance, son client et le passage
  // d'avant : le champ de réponse et l'exercice dont parle la séance s'en
  // servent tels quels.
  const item: InboxItem | null = opened && {
    client: {
      _id: client._id,
      firstName: client.firstName,
      lastName: client.lastName,
      picture: client.picture,
    },
    completed: opened,
    previous: previousPassage(opened, history),
  };
  const adjust = (session: Session) =>
    item &&
    navigate(
      COACH_ROUTES.clientSession(
        clientId!,
        session.order,
        concernedExercise(item)
      )
    );
  const detail = item && (
    <JournalDetail
      key={item.completed._id}
      item={item}
      coachId={coachId}
      sessions={client.program.sessions}
      onAdjust={adjust}
    />
  );

  return (
    <>
      {/* Sur téléphone, une seule barre : le retour et le nom du client, au
          lieu du bandeau générique (voir le `handle` de la route). */}
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
          <chakra.button
            type="button"
            aria-label="Retour à la liste des clients"
            onClick={() => navigate(COACH_ROUTES.clients)}
            color="fg.muted"
            flexShrink={0}
            p={2}
            css={hitArea(44)}
          >
            <LuArrowLeft size={18} />
          </chakra.button>
          <Heading as="h1" size="sm" flex={1} minW={0} lineClamp={1}>
            {name}
          </Heading>
          <Header />
        </HStack>
      </Box>

      <Box
        maxW={{ base: 'full', md: '6xl', xl: '7xl' }}
        mx="auto"
        px={{ base: 4, md: 8 }}
        pt={{ base: 4, md: 7 }}
        pb={{ base: 'calc(env(safe-area-inset-bottom, 0px) + 86px)', md: 8 }}
      >
        <VStack
          align="stretch"
          gap={2}
          mb={5}
          display={{ base: 'none', md: 'flex' }}
        >
          <BackLink
            label="Clients"
            onClick={() => navigate(COACH_ROUTES.clients)}
          />
          <HStack gap={3} align="center">
            <Avatar.Root size="lg">
              <Avatar.Fallback name={name} />
              {client.picture && <Avatar.Image alt="" src={client.picture} />}
            </Avatar.Root>
            {/* Le h1 est celui de la barre du téléphone : un seul des deux
                en-têtes s'affiche à la fois. */}
            <Heading as="p" size="2xl" fontWeight="800" flex={1} minW={0}>
              {name}
            </Heading>
            <ClientTabs clientId={clientId!} current="journal" />
          </HStack>
        </VStack>
        <Box display={{ base: 'block', md: 'none' }} mb={3}>
          <ClientTabs clientId={clientId!} current="journal" />
        </Box>

        {isHistoryLoading ? (
          <Spinner size="lg" />
        ) : history.length === 0 ? (
          <EmptyState
            mood="sleep"
            title={`${client.firstName ?? 'Ton client'} n'a encore rien fait`}
            line="Sa première séance terminée apparaîtra ici, avec ses charges et son ressenti."
          />
        ) : (
          <Grid
            templateColumns={{
              base: 'minmax(0, 1fr)',
              md: 'minmax(0, 1fr) minmax(0, 1.1fr)',
              xl: 'minmax(0, 1fr) minmax(0, 1.1fr) 380px',
            }}
            gap="16px"
            alignItems="start"
          >
            <VStack align="stretch" gap="16px">
              <JournalSummary
                history={history}
                target={weekTarget(client.program.sessions)}
                complete={history.length < HISTORY_PAGE_SIZE}
                sharesHealthData={client.sharesHealthData}
                firstName={client.firstName}
                tag={tag}
                onTag={setTag}
              />
              <MonthCalendar
                marks={marks}
                first={bounds.first}
                last={bounds.last}
                start={bounds.start}
                onPick={(day) => {
                  const completed = byDay.get(day);
                  if (completed) open(completed);
                }}
              />
            </VStack>
            <VStack align="stretch" gap="8px">
              {tag && (
                <HStack justify="space-between" gap={3} px="4px">
                  <Text fontSize="sm" color="fg.muted">
                    {visible.length} séance{visible.length > 1 ? 's' : ''} avec
                    « {TAG_NOUN[tag]} »
                  </Text>
                  <chakra.button
                    type="button"
                    fontSize="sm"
                    fontWeight="600"
                    color="app.primary"
                    onClick={() => setTag(null)}
                    css={hitArea(44)}
                  >
                    Tout afficher
                  </chakra.button>
                </HStack>
              )}
              <JournalList history={visible} openId={openId} onOpen={open} />
            </VStack>
            {wide && (
              <Box
                as="aside"
                aria-label="Séance ouverte"
                position="sticky"
                top="24px"
                maxH="calc(100dvh - 48px)"
                overflowY="auto"
                bg="bg.surface"
                borderRadius="18px"
                p="20px"
              >
                {detail ?? (
                  <Text color="fg.muted" fontSize="sm">
                    Ouvre une séance : elle s’affiche ici, avec ce que{' '}
                    {client.firstName ?? 'ton client'} en a dit, et ta réponse.
                  </Text>
                )}
              </Box>
            )}
          </Grid>
        )}
      </Box>

      {!wide && item && (
        <Portal>
          <Sheet
            label={`${item.completed.sessionName || sessionName({ order: item.completed.sessionOrder, name: item.completed.sessionName })} · ${detailDate(item.completed.completedAt)}`}
            onDismiss={() => setOpenId(null)}
          >
            {detail}
          </Sheet>
        </Portal>
      )}
    </>
  );
};

export default ClientJournal;
