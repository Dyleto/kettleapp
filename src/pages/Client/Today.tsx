import { useOutletContext, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { CompletedSession, Session } from '@/types';
import {
  CLIENT_CONTENT_MAX_W,
  CompletedSessionDrawer,
  getSessionBlockTypes,
  getSessionSummary,
  SessionHistoryCard,
  useClientSessions,
  WeekStrip,
} from '@/features/client';
import { buildWeekPlan } from '@/features/client/weekPlan';
import { mondayIndex } from '@/features/client/sessionDates';
import {
  Box,
  Container,
  HStack,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { LuArrowRight } from 'react-icons/lu';
import { CLIENT_ROUTES } from '@/config/routes';
import { EmptyState } from '@/components/EmptyState';
import { sessionTitle } from '@/features/program/sessionTitle';

type ClientSessionsData = ReturnType<typeof useClientSessions>;

const Today = () => {
  useDocumentTitle('Aujourd’hui');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sessions, nextSession, history, isLoading } =
    useOutletContext<ClientSessionsData>();

  const totalCount = sessions.length;
  const recentSessions = history.slice(0, 3);

  // The week lives nowhere in the database: we recompose it on every render
  // from the programme and the history already loaded.
  const weekDays = useMemo(
    () => buildWeekPlan(sessions, history),
    [sessions, history]
  );

  // "La prochaine" becomes "Aujourd'hui" when this is the day the coach
  // suggested for that session: the same card, one more reason.
  const isSuggestedToday =
    !!nextSession &&
    (nextSession.suggestedDays ?? []).includes(mondayIndex(new Date()));

  const [selectedCompleted, setSelectedCompleted] =
    useState<CompletedSession | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = (completed: CompletedSession) => {
    setSelectedCompleted(completed);
    setIsDrawerOpen(true);
  };

  const openSession = (session: Session) => {
    navigate(CLIENT_ROUTES.sessionById(session._id));
  };

  if (isLoading) {
    return (
      <Container maxW={CLIENT_CONTENT_MAX_W} py={8} px={4}>
        <VStack align="stretch" gap={6}>
          <Skeleton h="24px" w="160px" borderRadius="md" />
          <Skeleton h="140px" borderRadius="xl" />
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW={CLIENT_CONTENT_MAX_W} py={8} px={4}>
      <VStack gap={6} align="stretch">
        {/* The heading names the screen, not whoever is looking at it.
            "Bonjour Corentin" as an `h1` meant that heading navigation — a
            screen reader's first exploration tool — announced a greeting
            where it should announce a place. The greeting stays, as plain
            text, above. */}
        <VStack align="start" gap={0}>
          <Text fontSize="sm" color="fg.muted">
            Bonjour {user?.firstName},
          </Text>
          <Text as="h1" fontSize="xl" fontWeight="bold">
            Aujourd&rsquo;hui
          </Text>
        </VStack>

        {/* Where the week stands, before what is left to do: it is the
            context in which the day's session reads. */}
        {(history.length > 0 ||
          weekDays.some((d) => d.suggested.length > 0)) && (
          <WeekStrip
            days={weekDays}
            onOpenCompleted={openDrawer}
            onOpenSession={openSession}
          />
        )}

        {totalCount === 0 ? (
          <EmptyState
            title="Pas encore de programme"
            line="Ton coach n'a pas encore ajouté de séances. Reviens bientôt."
          />
        ) : (
          nextSession && (
            <VStack align="stretch" gap={2}>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="fg.muted"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                {/* "À FAIRE MAINTENANT" was an order, and an order Kettle is
                    in no position to give: the programme is a cycle, so this
                    card always points at something — including a Sunday at
                    11 pm, and including right after a session just finished.
                    "La prochaine" says where you are in the programme, which
                    is true at any hour.

                    On the suggested day the app knows something more, and
                    only there does it allow itself to speak of timing. */}
                {isSuggestedToday ? "Aujourd'hui" : 'La prochaine'}
              </Text>
              {/* The card is the button. People instinctively click the
                  session itself; keeping a button beside it that leads to the
                  same place added a target without adding a choice. */}
              <Box
                as="button"
                w="full"
                textAlign="left"
                p={4}
                borderRadius="xl"
                borderWidth="1px"
                borderColor="app.primary"
                bg="whiteAlpha.50"
                aria-label={`Voir la séance ${nextSession.order}`}
                onClick={() =>
                  navigate(CLIENT_ROUTES.sessionById(nextSession._id))
                }
                _hover={{ bg: 'app.primary/12' }}
                transition="background-color 0.15s"
              >
                <VStack align="stretch" gap={1.5}>
                  <HStack justify="space-between" align="center">
                    <Text fontWeight="bold" fontSize="sm">
                      {sessionTitle(nextSession.order, nextSession.name)}
                    </Text>
                    {/* The chip only appears on the suggested day. The rest of
                        the time it said "À faire" forty pixels from a label
                        that said "À faire maintenant": the same word twice,
                        neither of which taught anything. "Conseillée" adds
                        the coach to the reading. */}
                    {isSuggestedToday && (
                      <Box
                        px={2}
                        py={0.5}
                        borderRadius="full"
                        bg="app.primary/16"
                        fontSize="xs"
                        fontWeight="bold"
                        color="app.primary"
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        Conseillée
                      </Box>
                    )}
                  </HStack>
                  <Text fontSize="xs" color="fg.muted">
                    {getSessionSummary(nextSession)}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {getSessionBlockTypes(nextSession)}
                  </Text>
                  <HStack gap={1.5} color="app.primary" pt={1}>
                    <Text fontSize="xs" fontWeight="bold">
                      Voir la séance
                    </Text>
                    <LuArrowRight size={13} />
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          )
        )}

        {recentSessions.length > 0 && (
          <VStack align="stretch" gap={2}>
            <Text
              fontSize="xs"
              fontWeight="bold"
              color="fg.muted"
              textTransform="uppercase"
              letterSpacing="wider"
            >
              Séances récentes
            </Text>
            <VStack align="stretch" gap={2}>
              {/* The same card as the journal, in its home variant: one
                  definition, and so one convention. */}
              {recentSessions.map((completed) => (
                <SessionHistoryCard
                  key={completed._id}
                  completed={completed}
                  variant="accueil"
                />
              ))}
            </VStack>
          </VStack>
        )}
      </VStack>

      {selectedCompleted && (
        <CompletedSessionDrawer
          completed={selectedCompleted}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          editable
        />
      )}
    </Container>
  );
};

export default Today;
