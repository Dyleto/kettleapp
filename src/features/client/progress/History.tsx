import { useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { Box, Container, Grid, HStack, Text, VStack } from '@chakra-ui/react';
import { LuFlame } from 'react-icons/lu';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { CLIENT_GRID_MAX_W } from '@/features/client/shell/layout';
import { lifetimeTotal } from '@/features/client/progress/counts';
import { SessionCalendarFilter } from '@/features/client/progress/SessionCalendarFilter';
import { SessionHistoryCard } from '@/features/client/progress/SessionHistoryCard';
import {
  MovementList,
  MovementSheet,
  Records,
} from '@/features/client/progress/Movements';
import { useClientSessions } from '@/features/client/common/useClientSessions';
import { dayKey, formatDayLabel } from '@/domain/week/dates';
import { weekStreak, weekTarget } from '@/domain/week/ring';
import { movementsOf, recordCards } from '@/domain/history/movements';
import { ActionButton, Chip, EmptyState, Eyebrow } from '@/kit';
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
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [movementId, setMovementId] = useState<string | null>(null);

  const movements = useMemo(() => movementsOf(history), [history]);
  const records = useMemo(() => recordCards(history), [history]);
  const streak = weekStreak(history, weekTarget(sessions));
  const opened = movements.find((m) => m.exerciseId === movementId) ?? null;

  // Le calendrier filtre, il ne remplace pas : sans jour choisi, on lit
  // tout.
  const visible = selectedDay
    ? history.filter((c) => dayKey(new Date(c.completedAt)) === selectedDay)
    : history;
  const count = history.length;

  return (
    <Container maxW={CLIENT_GRID_MAX_W} py={6} px={4}>
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
            templateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}
            gap={{ base: '16px', md: '24px' }}
            alignItems="start"
          >
            <VStack align="stretch" gap="16px" minW={0}>
              <Records records={records} onOpen={setMovementId} />
              <MovementList movements={movements} onOpen={setMovementId} />
            </VStack>

            <VStack align="stretch" gap="16px" minW={0}>
              <SessionCalendarFilter
                history={history}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
              />
              <VStack align="stretch" gap="8px">
                <HStack justify="space-between" align="baseline">
                  <Eyebrow>Tes séances</Eyebrow>
                  <Text fontSize="xs" color="fg.muted">
                    {selectedDay
                      ? formatDayLabel(selectedDay)
                      : lifetimeTotal(count)}
                  </Text>
                </HStack>
                {selectedDay && (
                  <Box
                    as="button"
                    alignSelf="start"
                    fontSize="xs"
                    color="app.primary"
                    onClick={() => setSelectedDay(null)}
                  >
                    tout l'historique
                  </Box>
                )}
                {visible.map((c) => (
                  <SessionHistoryCard key={c._id} completed={c} />
                ))}
              </VStack>
            </VStack>
          </Grid>
        )}
      </VStack>

      {opened && (
        <MovementSheet movement={opened} onClose={() => setMovementId(null)} />
      )}
    </Container>
  );
};

export default History;
