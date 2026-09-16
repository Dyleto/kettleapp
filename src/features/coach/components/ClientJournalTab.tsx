import { CompletedSession } from '@/types';
import { useEffect, useState } from 'react';
import { EFFORT_ZONE_COLOR } from '@/features/client/constants';
import { useMarkHistoryAsViewed } from '@/features/coach/hooks/useMarkHistoryAsViewed';
import { EtatVide } from '@/components/EtatVide';
import {
  CompletedSessionDrawer,
  SessionCalendarFilter,
  dayKey,
  formatDayLabel,
  getEffortSummary,
  getRelativeDate,
} from '@/features/client';
import {
  Box,
  Grid,
  HStack,
  Text,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import { LuChevronRight } from 'react-icons/lu';

interface Props {
  history: CompletedSession[];
  clientId: string;
}

interface JournalEntryProps {
  completed: CompletedSession;
  isUnseen: boolean;
  onOpen: () => void;
}

const JournalEntry = ({ completed, isUnseen, onOpen }: JournalEntryProps) => {
  const effort = getEffortSummary(completed);

  return (
    <Box
      py={3}
      px={2}
      borderRadius="md"
      borderBottom="1px solid"
      borderColor="whiteAlpha.100"
      cursor="pointer"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      _hover={{ bg: 'whiteAlpha.50' }}
      _focusVisible={{
        outlineOffset: '-2px',
      }}
    >
      <HStack justify="space-between" align="baseline">
        <HStack gap={2}>
          <Text fontWeight="bold" fontSize="sm">
            Séance {completed.sessionOrder}
          </Text>
          {/* Doré : le rouge de cette ligne appartient au ressenti. */}
          {isUnseen && (
            <Box w="6px" h="6px" borderRadius="full" bg="app.primary" />
          )}
        </HStack>
        <HStack gap={2}>
          <Text fontSize="xs" color="fg.muted">
            {getRelativeDate(completed.completedAt)}
          </Text>
          {effort && (
            <Text
              fontSize="xs"
              fontWeight="bold"
              color={EFFORT_ZONE_COLOR[effort.zone]}
            >
              {effort.label}
            </Text>
          )}
          <LuChevronRight size={13} color="var(--chakra-colors-fg-muted)" />
        </HStack>
      </HStack>
      {completed.clientNotes ? (
        <Text
          fontSize="sm"
          color="fg"
          fontStyle="italic"
          mt={1.5}
          whiteSpace="pre-wrap"
        >
          "{completed.clientNotes}"
        </Text>
      ) : (
        <Text fontSize="sm" color="fg.muted" fontStyle="italic" mt={1.5}>
          Aucun commentaire laissé par le client.
        </Text>
      )}
    </Box>
  );
};

export const ClientJournalTab = ({ history, clientId }: Props) => {
  const { mutate: markHistoryAsViewed } = useMarkHistoryAsViewed(clientId);
  const [openCompleted, setOpenCompleted] = useState<CompletedSession | null>(
    null
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // À partir de 2xl (1536 px), la colonne de gauche a la place de deux mois.
  // Une régularité se lit sur huit semaines, pas sur quatre.
  const months = useBreakpointValue<1 | 2>({ base: 1, '2xl': 2 }) ?? 1;

  const [initialUnseenIds] = useState<Set<string>>(
    () =>
      new Set(history.filter((c) => c.viewedByCoach !== true).map((c) => c._id))
  );

  useEffect(() => {
    if (initialUnseenIds.size > 0) markHistoryAsViewed();
  }, [initialUnseenIds, markHistoryAsViewed]);

  if (history.length === 0) {
    return (
      <EtatVide
        titre="Aucune séance réalisée"
        phrase="Les séances que votre client termine apparaîtront ici, avec ce qu'il a réellement fait."
      />
    );
  }

  // Le calendrier filtre, il ne remplace pas : sans jour choisi, on lit tout
  // l'historique comme avant.
  const visible = selectedDay
    ? history.filter((c) => dayKey(new Date(c.completedAt)) === selectedDay)
    : history;

  return (
    <>
      <Grid
        templateColumns={{
          base: '1fr',
          // Une colonne plus étroite sur tablette : le mois y tient, et la
          // liste garde de quoi se lire.
          md: '264px 1fr',
          lg: '300px 1fr',
          '2xl': '620px 1fr',
        }}
        gap={{ base: 5, md: 5, lg: 8 }}
        alignItems="start"
      >
        <Box
          minW={0}
          position={{ base: 'static', md: 'sticky' }}
          top={{ md: '80px' }}
        >
          {/* Le même composant que l'historique du client : deux calendriers
              dans la même application doivent se comporter pareil, et c'est
              la version repliée qui est la bonne sur téléphone. */}
          <SessionCalendarFilter
            history={history}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            months={months}
          />
        </Box>

        <VStack align="stretch" gap={0} minW={0}>
          <HStack justify="space-between" align="baseline" pb={2}>
            <Text fontSize="xs" color="fg.muted">
              {selectedDay
                ? formatDayLabel(selectedDay)
                : `${history.length} séance${history.length > 1 ? 's' : ''} au total`}
            </Text>
            {selectedDay && (
              <Box
                as="button"
                fontSize="xs"
                color="app.primary"
                onClick={() => setSelectedDay(null)}
              >
                tout le journal
              </Box>
            )}
          </HStack>

          {visible.map((c) => (
            <JournalEntry
              key={c._id}
              completed={c}
              isUnseen={initialUnseenIds?.has(c._id) ?? false}
              onOpen={() => setOpenCompleted(c)}
            />
          ))}
        </VStack>
      </Grid>

      {openCompleted && (
        <CompletedSessionDrawer
          completed={openCompleted}
          isOpen={!!openCompleted}
          onClose={() => setOpenCompleted(null)}
        />
      )}
    </>
  );
};
