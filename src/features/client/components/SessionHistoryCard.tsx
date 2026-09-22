import { Card } from '@/components/Card';
import { CompletedSession } from '@/types';
import {
  getCompletedSessionBlockTypes,
  getEffortSummary,
  getRelativeDate,
} from '@/features/client';
import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { LuChevronRight } from 'react-icons/lu';
import { useState } from 'react';
import { CompletedSessionDrawer } from './CompletedSessionDrawer';
import { EFFORT_ZONE_COLOR } from '@/features/client/constants';
import { sessionTitle } from '@/features/program/sessionTitle';

interface SessionHistoryCardProps {
  completed: CompletedSession;
  showUnseenIndicator?: boolean;
  /**
   * `journal` on the history: the exact date, and the comment if there is one
   * — you came to read. `accueil` on the day's page: the date in relative
   * form, because there you answer "when was that", and no comment, because
   * you are only passing through.
   *
   * The rest does not change, and that is the point: home used to render its
   * own card, with no chevron and no action label, next to a card that had
   * one. Two neighbouring cards that do not follow the same convention turn
   * the missing arrow into a sign — when it meant nothing.
   */
  variant?: 'journal' | 'accueil';
}

export const SessionHistoryCard = ({
  completed,
  showUnseenIndicator = false,
  variant = 'journal',
}: SessionHistoryCardProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const completedDate =
    variant === 'accueil'
      ? getRelativeDate(completed.completedAt)
      : new Intl.DateTimeFormat('fr-FR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }).format(new Date(completed.completedAt));

  // A word the client and the coach read the same way, instead of a number
  // neither can interpret.
  const effort = getEffortSummary(completed);

  return (
    <Card
      accentColor="app.primary"
      hoverEffect="border"
      withGlow={false}
      onClick={() => setIsDrawerOpen(true)}
      p={4}
    >
      <VStack align="stretch" gap={2}>
        <HStack justify="space-between" align="center">
          <HStack gap={2}>
            <Text fontSize="sm" fontWeight="bold">
              {sessionTitle(completed.sessionOrder, completed.sessionName)}
            </Text>
            {showUnseenIndicator && (
              <Box
                px={2}
                py={0.5}
                borderRadius="full"
                bg="session.work/16"
                color="session.work.fg"
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Nouveau
              </Box>
            )}
          </HStack>
          {effort && (
            <Text
              fontSize="xs"
              fontWeight="bold"
              color={EFFORT_ZONE_COLOR[effort.zone]}
            >
              {effort.label}
            </Text>
          )}
        </HStack>

        <Text fontSize="xs" color="fg.muted">
          {completedDate} · {getCompletedSessionBlockTypes(completed)}
        </Text>

        {variant === 'journal' && completed.clientNotes && (
          <Text fontSize="xs" color="fg.muted" fontStyle="italic" lineClamp={2}>
            "{completed.clientNotes}"
          </Text>
        )}

        <HStack gap={1} color="app.primary" justify="flex-end">
          <Text fontSize="xs" fontWeight="medium">
            Voir le détail
          </Text>
          <LuChevronRight size={13} color="var(--chakra-colors-app-primary)" />
        </HStack>
      </VStack>

      <CompletedSessionDrawer
        completed={completed}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        editable
      />
    </Card>
  );
};
