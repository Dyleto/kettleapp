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
import { EtatVide } from '@/components/EtatVide';
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

  // La semaine ne vit nulle part en base : on la recompose à chaque rendu à
  // partir du programme et de l'historique déjà chargés.
  const weekDays = useMemo(
    () => buildWeekPlan(sessions, history),
    [sessions, history]
  );

  // « La prochaine » devient « Aujourd'hui » quand c'est le jour que le coach
  // a conseillé pour cette séance : la même carte, une raison en plus.
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
        {/* Le titre nomme l'écran, pas celui qui le regarde.
            « Bonjour Corentin » en `h1` faisait que la navigation par titres
            — le premier outil d'exploration d'un lecteur d'écran — annonçait
            une salutation là où elle devait annoncer un endroit. La
            salutation reste, en texte simple, au-dessus. */}
        <VStack align="start" gap={0}>
          <Text fontSize="sm" color="fg.muted">
            Bonjour {user?.firstName},
          </Text>
          <Text as="h1" fontSize="xl" fontWeight="bold">
            Aujourd&rsquo;hui
          </Text>
        </VStack>

        {/* Où en est la semaine, avant ce qu'il reste à faire : c'est le
            contexte dans lequel se lit la séance du jour. */}
        {(history.length > 0 ||
          weekDays.some((d) => d.suggested.length > 0)) && (
          <WeekStrip
            days={weekDays}
            onOpenCompleted={openDrawer}
            onOpenSession={openSession}
          />
        )}

        {totalCount === 0 ? (
          <EtatVide
            titre="Pas encore de programme"
            phrase="Ton coach n'a pas encore ajouté de séances. Reviens bientôt."
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
                {/* « À FAIRE MAINTENANT » était un ordre, et un ordre que
                    Kettle n'est pas en état de donner : le programme est un
                    cycle, donc cette carte désigne toujours quelque chose — y
                    compris un dimanche à 23 h, et y compris juste après une
                    séance qu'on vient de finir. « La prochaine » dit où l'on
                    en est dans le programme, ce qui est vrai à toute heure.

                    Le jour conseillé, l'app sait quelque chose de plus, et
                    c'est là seulement qu'elle se permet de parler du moment. */}
                {isSuggestedToday ? "Aujourd'hui" : 'La prochaine'}
              </Text>
              {/* La carte est le bouton. On clique instinctivement sur la
                  séance elle-même ; garder à côté un bouton qui mène au même
                  endroit ajoutait une cible sans ajouter un choix. */}
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
                    {/* La pastille ne paraît que le jour conseillé. Le reste
                        du temps elle disait « À faire » à quarante pixels
                        d'une étiquette qui disait « À faire maintenant » :
                        deux fois le même mot, dont aucun n'apprenait rien.
                        « Conseillée » ajoute le coach à la lecture. */}
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
              {/* La même carte que le journal, dans sa variante d'accueil :
                  une seule définition, donc une seule convention. */}
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
