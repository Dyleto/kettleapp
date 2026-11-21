import { useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import {
  Box,
  Container,
  Grid,
  HStack,
  Text,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import { LuFlame } from 'react-icons/lu';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { CLIENT_GRID_MAX_W } from '@/features/client/shell/layout';
import {
  CompletedDetail,
  CompletedSheet,
} from '@/features/client/progress/CompletedDetail';
import { CorrectFlow } from '@/features/client/progress/CorrectFlow';
import { useCoachVoice } from '@/features/client/common/coach';
import { DaySheet, SessionList } from '@/features/client/progress/SessionList';
import {
  MovementList,
  MovementSheet,
  Records,
} from '@/features/client/progress/Movements';
import { useClientSessions } from '@/features/client/common/useClientSessions';
import { weekStreak, weekTarget } from '@/domain/week/ring';
import { movementsOf, recordCards } from '@/domain/history/movements';
import {
  calendarBounds,
  calendarMarks,
  sessionsByDay,
} from '@/domain/history/journal';
import type { CompletedSession } from '@/shared/types';
import { ActionButton, Chip, EmptyState, MonthCalendar } from '@/kit';
import { CLIENT_ROUTES } from '@/shared/config/routes';

type ClientSessionsData = ReturnType<typeof useClientSessions>;

/**
 * Progrès : l'ancien « Historique », tourné vers l'avant.
 *
 * En tête, ce qui donne envie de revenir — les records, puis la courbe de
 * chaque mouvement —, et seulement ensuite le mois et la liste des séances.
 * L'ancien écran ouvrait sur un calendrier et des cartes de séance, et
 * rangeait « 20 → 24 → 26 kg » dans une colonne étroite sous le calendrier :
 * la seule chose qui disait au client qu'il progressait était la dernière
 * qu'il lisait.
 *
 * Tout se calcule depuis l'historique déjà chargé : aucune requête de plus.
 */
const History = () => {
  useDocumentTitle('Progrès');
  const navigate = useNavigate();
  const { history, sessions } = useOutletContext<ClientSessionsData>();
  const [movementId, setMovementId] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [correcting, setCorrecting] = useState(false);
  const coach = useCoachVoice();
  // Le détail tient à côté du mois et de la liste à partir de 1 280 px ;
  // en dessous, il monte en feuille — comme le journal du coach.
  const wide = useBreakpointValue({ base: false, xl: true }) ?? false;

  const movements = useMemo(() => movementsOf(history), [history]);
  const records = useMemo(() => recordCards(history), [history]);
  const byDay = useMemo(() => sessionsByDay(history), [history]);
  const marks = useMemo(() => calendarMarks(history), [history]);
  const bounds = useMemo(() => calendarBounds(history), [history]);
  const recent = useMemo(
    () =>
      [...history].sort(
        (a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt)
      ),
    [history]
  );
  const streak = weekStreak(history, weekTarget(sessions));
  const movement = movements.find((m) => m.exerciseId === movementId) ?? null;
  // Relu dans l'historique à chaque rendu : une correction enregistrée
  // se voit sans refermer la séance.
  const opened = history.find((c) => c._id === openedId) ?? null;
  const open = (completed: CompletedSession) => {
    setDay(null);
    setCorrecting(false);
    setOpenedId(completed._id);
  };
  const count = history.length;

  return (
    <Container maxW={{ base: CLIENT_GRID_MAX_W, xl: '7xl' }} py={6} px={4}>
      <VStack align="stretch" gap="16px">
        <HStack gap="12px" wrap="wrap">
          <Text
            as="h1"
            fontWeight="800"
            fontSize={{ base: '26px', md: '32px' }}
          >
            Progrès
          </Text>
          {count > 0 && (
            <Chip>
              {count} séance{count > 1 ? 's' : ''}
            </Chip>
          )}
          {/* Les semaines tenues, comme sur l'accueil : à deux et plus. */}
          {streak >= 2 && (
            <Box ml="auto" aria-label={`${streak} semaines d’affilée`}>
              <Chip tone="amber">
                <LuFlame size={14} aria-hidden />
                {streak}&nbsp;sem.
              </Chip>
            </Box>
          )}
        </HStack>

        {count === 0 ? (
          <EmptyState
            mood="hello"
            title="Rien à montrer encore"
            line="Ta première séance apparaîtra ici, avec tes charges et tes records."
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
        ) : (
          <Grid
            templateColumns={{
              base: '1fr',
              md: 'repeat(2, minmax(0, 1fr))',
              xl: 'repeat(2, minmax(0, 1fr)) 360px',
            }}
            gap={{ base: '16px', md: '24px' }}
            alignItems="start"
          >
            <VStack align="stretch" gap="16px" minW={0}>
              <Records records={records} onOpen={setMovementId} />
              <MovementList movements={movements} onOpen={setMovementId} />
            </VStack>

            <VStack align="stretch" gap="16px" minW={0}>
              {/* Toujours là, plus derrière « Filtrer par date » : une
                  pastille ouvre sa séance, et un jour à deux séances ouvre
                  la liste des deux. */}
              <MonthCalendar
                marks={marks}
                first={bounds.first}
                last={bounds.last}
                start={bounds.start}
                onPick={(picked) => {
                  const ofDay = byDay.get(picked) ?? [];
                  if (ofDay.length === 1) open(ofDay[0]);
                  else if (ofDay.length > 1) setDay(picked);
                }}
              />
              <SessionList
                history={recent}
                sessions={sessions}
                openId={wide ? openedId : null}
                onOpen={open}
              />
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
                {opened ? (
                  <CompletedDetail
                    completed={opened}
                    history={history}
                    viewer="self"
                    onCorrect={() => setCorrecting(true)}
                  />
                ) : (
                  <Text color="fg.muted" fontSize="sm">
                    Ouvre une séance : elle s’affiche ici, avec tes charges et
                    ce que {coach.inline} t’a répondu.
                  </Text>
                )}
              </Box>
            )}
          </Grid>
        )}
      </VStack>

      {movement && (
        <MovementSheet
          movement={movement}
          onClose={() => setMovementId(null)}
        />
      )}
      {day && (
        <DaySheet
          day={day}
          history={byDay.get(day) ?? []}
          sessions={sessions}
          onOpen={open}
          onClose={() => setDay(null)}
        />
      )}
      {opened && !wide && !correcting && (
        <CompletedSheet
          completed={opened}
          history={history}
          viewer="self"
          onCorrect={() => setCorrecting(true)}
          onClose={() => setOpenedId(null)}
        />
      )}
      {/* La feuille se retire le temps de corriger, et revient sur la
          séance corrigée : les écrans de la fin de séance passent sous
          elle. */}
      {opened && correcting && (
        <CorrectFlow completed={opened} onClose={() => setCorrecting(false)} />
      )}
    </Container>
  );
};

export default History;
