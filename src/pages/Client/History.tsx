import { useOutletContext } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useState } from 'react';
import { Box, Container, Grid, HStack, Text, VStack } from '@chakra-ui/react';
import {
  CLIENT_GRID_MAX_W,
  lifetimeTotal,
  ExerciseProgressions,
  SessionCalendarFilter,
  SessionHistoryCard,
  dayKey,
  formatDayLabel,
  useClientSessions,
} from '@/features/client';

type ClientSessionsData = ReturnType<typeof useClientSessions>;

const History = () => {
  useDocumentTitle('Historique');
  const { history } = useOutletContext<ClientSessionsData>();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // The calendar filters, it does not replace: with no day picked, you read
  // everything.
  const visible = selectedDay
    ? history.filter((c) => dayKey(new Date(c.completedAt)) === selectedDay)
    : history;

  return (
    <Container maxW={CLIENT_GRID_MAX_W} py={8} px={4}>
      <VStack align="stretch" gap={4}>
        <Text as="h1" fontWeight="bold" fontSize="lg">
          Historique
        </Text>

        {history.length === 0 ? (
          <Box py={16} textAlign="center" color="fg.muted" fontSize="sm">
            Aucune séance complétée pour l'instant.
          </Box>
        ) : (
          <Grid
            templateColumns={{
              base: '1fr',
              md: '264px 1fr',
              lg: '300px 1fr',
            }}
            gap={{ base: 5, md: 5, lg: 8 }}
            alignItems="start"
          >
            <Box
              minW={0}
              position={{ base: 'static', md: 'sticky' }}
              top={{ md: '80px' }}
            >
              <VStack align="stretch" gap={6}>
                <SessionCalendarFilter
                  history={history}
                  selectedDay={selectedDay}
                  onSelectDay={setSelectedDay}
                />
                {/* The calendar says at what rhythm, this says in which
                    direction. Both cover the whole history, not the selected
                    day: this is the context column. */}
                <ExerciseProgressions history={history} />
              </VStack>
            </Box>

            <VStack align="stretch" gap={3} minW={0}>
              <HStack justify="space-between" align="baseline">
                <Text fontSize="xs" color="fg.muted">
                  {selectedDay
                    ? formatDayLabel(selectedDay)
                    : lifetimeTotal(history.length)}
                </Text>
                {selectedDay && (
                  <Box
                    as="button"
                    fontSize="xs"
                    color="app.primary"
                    onClick={() => setSelectedDay(null)}
                  >
                    tout l'historique
                  </Box>
                )}
              </HStack>

              <Grid
                templateColumns={{ base: '1fr', xl: 'repeat(2, 1fr)' }}
                gap={4}
                alignItems="start"
              >
                {visible.map((c) => (
                  <SessionHistoryCard key={c._id} completed={c} />
                ))}
              </Grid>
            </VStack>
          </Grid>
        )}
      </VStack>
    </Container>
  );
};

export default History;
