import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { CompletedSession } from '@/types';
import { getRelativeDate } from '@/features/client';
import { EFFORT_ZONE_COLOR, getEffortLevel } from '@/features/client/constants';
import { formatPerformed } from '@/features/client/performedFormat';
import { EffortTrend } from './EffortTrend';

interface SessionFeedbackStripProps {
  // Already filtered by the calling page on originalSessionId === session._id.
  history: CompletedSession[];
  // 'strip': a banner above the session (narrow screens)
  // 'panel': a context column on the right (from 2xl up)
  variant?: 'strip' | 'panel';
}

interface PerformedLine {
  name: string;
  value: string;
}

// Beyond this it is no longer feedback you read: it is a table you open in
// the full journal.
const MAX_LINES = 4;

/**
 * What the client actually recorded that day, exercise by exercise.
 *
 * The coach wrote "4 × 10" and never learned what had been done: only the
 * client, in their own history, saw their 26 kg. The data already existed in
 * the session's snapshot, it was simply displayed nowhere on this side.
 */
const performedLines = (completed: CompletedSession): PerformedLine[] => {
  const lines: PerformedLine[] = [];

  [...completed.blocks]
    .sort((a, b) => a.order - b.order)
    .forEach((block) => {
      [...block.exercises]
        .sort((a, b) => a.order - b.order)
        .forEach((ex) => {
          const value = formatPerformed(ex.performed);
          if (!value) return;
          const name = ex.exercise?.name;
          lines.push({
            name: typeof name === 'string' ? name : 'Exercice',
            value,
          });
        });
    });

  return lines;
};

const PerformedList = ({ completed }: { completed: CompletedSession }) => {
  const lines = performedLines(completed);
  if (lines.length === 0) return null;

  const shown = lines.slice(0, MAX_LINES);
  const rest = lines.length - shown.length;

  return (
    <VStack align="stretch" gap={1.5} mt={1.5}>
      {/* The name above, the value below: a detailed entry reads "26 kg ×
          12 · 26 kg × 10 · 24 kg × 8", which fits on no shared line. On the
          same line it was the name that gave — and an exercise reduced to
          "G." can no longer be read. */}
      {shown.map((line, i) => (
        <Box key={`${line.name}-${i}`}>
          <Text fontSize="xs" color="fg.muted" lineClamp={1}>
            {line.name}
          </Text>
          <Text fontSize="xs" fontFamily="mono" color="fg" lineClamp={2}>
            {line.value}
          </Text>
        </Box>
      ))}
      {rest > 0 && (
        <Text fontSize="xs" color="fg.muted">
          + {rest} autre{rest > 1 ? 's' : ''}
        </Text>
      )}
    </VStack>
  );
};

export const SessionFeedbackStrip = ({
  history,
  variant = 'strip',
}: SessionFeedbackStripProps) => {
  const recent = [...history].sort(
    (a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  if (variant === 'panel') {
    return (
      <Box
        borderWidth="1px"
        borderColor="whiteAlpha.100"
        borderRadius="lg"
        p={4}
      >
        <Text
          fontSize="xs"
          fontWeight="bold"
          color="fg.muted"
          textTransform="uppercase"
          letterSpacing="wider"
          mb={3}
        >
          Retour du client
        </Text>

        {recent.length === 0 ? (
          <Text fontSize="xs" color="fg.muted">
            Cette séance n'a pas encore été faite.
          </Text>
        ) : (
          <VStack align="stretch" gap={4}>
            {/* The axis stays: it answers "is this drifting?" at a glance.
                The table that accompanied it for a while has gone — too dense
                for what the coach was looking for there. */}
            <EffortTrend history={recent} />

            <VStack align="stretch" gap={3}>
              {recent.slice(0, 3).map((completed) => (
                <Box
                  key={completed._id}
                  borderLeftWidth="2px"
                  borderLeftColor="whiteAlpha.300"
                  pl={3}
                >
                  <Text fontSize="xs" color="fg.muted">
                    {getRelativeDate(completed.completedAt)}
                  </Text>
                  {completed.clientNotes ? (
                    <Text
                      fontSize="xs"
                      color="fg"
                      fontStyle="italic"
                      mt={0.5}
                      whiteSpace="pre-wrap"
                    >
                      "{completed.clientNotes}"
                    </Text>
                  ) : (
                    <Text
                      fontSize="xs"
                      color="fg.muted"
                      fontStyle="italic"
                      mt={0.5}
                    >
                      Aucun commentaire
                    </Text>
                  )}
                  <PerformedList completed={completed} />
                </Box>
              ))}
            </VStack>
          </VStack>
        )}
      </Box>
    );
  }

  if (recent.length === 0) return null;
  const last = recent[0];
  const level = getEffortLevel(last.feedback?.effort);

  return (
    // Neutral, not turquoise. It was the only occurrence of that hue in a
    // grey and red editor — and turquoise is otherwise used to qualify an
    // easy effort rating, which this panel does not say. It already stands
    // out by its position and its background; it does not need to borrow a
    // colour that means something else.
    <Box
      bg="whiteAlpha.50"
      borderLeftWidth="2px"
      borderLeftColor="whiteAlpha.300"
      borderRadius="0 6px 6px 0"
      px={3}
      py={2}
      mb={3}
      fontSize="xs"
      color="fg.muted"
    >
      <HStack gap={2} flexWrap="wrap">
        <Text flexShrink={0}>{getRelativeDate(last.completedAt)} —</Text>
        {level && (
          <Text
            as="span"
            fontWeight="bold"
            color={EFFORT_ZONE_COLOR[level.zone]}
            flexShrink={0}
          >
            {level.label}
          </Text>
        )}
        {last.clientNotes ? (
          <Text as="span" fontStyle="italic" color="fg">
            "{last.clientNotes}"
          </Text>
        ) : (
          <Text as="span" fontStyle="italic">
            Aucun commentaire
          </Text>
        )}
      </HStack>
      <PerformedList completed={last} />
    </Box>
  );
};
