import { Box, HStack, Text, VStack, Wrap } from '@chakra-ui/react';
import { getRelativeDate } from '@/features/client';
import { CompletedSession, FeedbackTag } from '@/types';
import {
  EFFORT_LEVELS,
  EFFORT_ZONE_COLOR,
  FEEDBACK_TAG_LABELS,
  getEffortLevel,
} from '@/features/client/constants';

interface EffortTrendProps {
  /** Already filtered to a single session: comparing a Tabata's effort to a
   *  warm-up's means nothing. */
  history: CompletedSession[];
  /** How many attempts are kept for the reading. */
  limit?: number;
}

type Drift = 'harder' | 'easier' | null;

/**
 * A drift is only flagged when it is clear: at least three rated attempts, no
 * reversal of direction, and an amplitude of at least two levels. The rest is
 * noise — and a coach who sees an alert for noise stops reading them.
 */
const detectDrift = (efforts: number[]): Drift => {
  if (efforts.length < 3) return null;
  const first = efforts[0];
  const last = efforts[efforts.length - 1];
  if (
    last - first >= 2 &&
    efforts.every((v, i) => i === 0 || v >= efforts[i - 1])
  )
    return 'harder';
  if (
    first - last >= 2 &&
    efforts.every((v, i) => i === 0 || v <= efforts[i - 1])
  )
    return 'easier';
  return null;
};

const countTags = (sessions: CompletedSession[]) => {
  const counts = new Map<FeedbackTag, number>();
  sessions.forEach((s) =>
    (s.feedback?.tags ?? []).forEach((tag) =>
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    )
  );
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
};

export const EffortTrend = ({ history, limit = 5 }: EffortTrendProps) => {
  // Oldest to newest: a trend reads in the direction of time.
  const chronological = [...history]
    .sort(
      (a, b) =>
        new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    )
    .slice(-limit);

  const rated = chronological.filter((c) => c.feedback?.effort !== undefined);
  const efforts = rated.map((c) => c.feedback!.effort);
  const drift = detectDrift(efforts);
  const lastLabel =
    getEffortLevel(rated[rated.length - 1]?.feedback?.effort)?.label ?? '—';
  const tags = countTags(rated);

  // No rated attempt: wrap-ups from before the rework never carried the
  // question. We say so, we do not draw an empty curve.
  if (rated.length === 0) {
    return (
      <Text fontSize="xs" color="fg.muted">
        {chronological.length > 0
          ? 'Aucun ressenti comparable sur cette séance.'
          : "Cette séance n'a pas encore été faite."}
      </Text>
    );
  }

  return (
    <VStack align="stretch" gap={2}>
      {/* The axis, with its own labels and the target named in the
          middle. The bars it replaces encoded the rating twice — by height
          and by colour — without ever saying that the height meant anything.
          Here the position IS the scale, and it is written underneath:
          nothing to memorise. */}
      <Box position="relative" h="26px" mx="6px">
        <Box
          position="absolute"
          top="12px"
          left={0}
          right={0}
          h="1px"
          bg="whiteAlpha.200"
        />
        {/* The middle marker carries the scale's middle colour, not the
            amber of action: it is a graduation, you do not click it. This
            column only appeared beyond 1536 px, which had kept it out of the
            amber decluttering. */}
        <Box
          position="absolute"
          top="6px"
          left="50%"
          w="1px"
          h="13px"
          bg={EFFORT_ZONE_COLOR.target}
          opacity={0.55}
        />
        {rated.map((completed, i) => {
          const level = getEffortLevel(completed.feedback!.effort)!;
          const isLast = i === rated.length - 1;
          // 1 → 0 %, 5 → 100 %. The most recent point is solid, the earlier
          // ones set back: you read the direction of travel.
          const left = ((level.value - 1) / 4) * 100;
          return (
            <Box
              key={completed._id}
              position="absolute"
              top={isLast ? '8px' : '10px'}
              left={`${left}%`}
              transform="translateX(-50%)"
              w={isLast ? '9px' : '6px'}
              h={isLast ? '9px' : '6px'}
              borderRadius="full"
              bg={EFFORT_ZONE_COLOR[level.zone]}
              opacity={isLast ? 1 : 0.42}
              title={`${level.label} — ${getRelativeDate(completed.completedAt)}`}
            />
          );
        })}
      </Box>

      {/* The labels come from EFFORT_LEVELS — the order of the stored
          values — and not from EFFORT_SCALE, which is the client's *display*
          scale, reversed so that "1" is "Trop dure". Taking them from there
          put the red dot under "Trop facile". Here the position and the word
          come from the same source, and the hardest is on the right: that is
          the direction the drift arrow already announces. */}
      <HStack justify="space-between" fontSize="10px" color="fg.muted">
        <Text>{EFFORT_LEVELS[0].label}</Text>
        <Text color={EFFORT_ZONE_COLOR.target}>
          {EFFORT_LEVELS[Math.floor(EFFORT_LEVELS.length / 2)].label}
        </Text>
        <Text>{EFFORT_LEVELS[EFFORT_LEVELS.length - 1].label}</Text>
      </HStack>

      <HStack gap={2} justify="space-between" align="baseline">
        {/* The word, not the number. The sequence "3 → 4" read like a code:
            nothing on screen said on what scale, nor in which direction. */}
        {/* The axis only carries rated attempts; the table below shows the
            others with a dash. So we no longer count them here. */}
        <Text fontSize="xs" color="fg.muted">
          {rated.length === 1
            ? `Dernier ressenti : ${lastLabel}`
            : drift
              ? `${rated.length} passages notés`
              : `${rated.length} passages notés — ${lastLabel} en dernier`}
        </Text>
        {drift && (
          <Text
            fontSize="xs"
            fontWeight="bold"
            color={
              drift === 'harder'
                ? EFFORT_ZONE_COLOR.hard
                : EFFORT_ZONE_COLOR.easy
            }
            flexShrink={0}
          >
            {drift === 'harder'
              ? '↗ Devient trop dure'
              : '↘ Devient trop facile'}
          </Text>
        )}
      </HStack>

      {tags.length > 0 && (
        <Wrap gap={1.5}>
          {tags.map(([tag, count]) => (
            <Box
              key={tag}
              px={2}
              py={0.5}
              borderRadius="full"
              borderWidth="1px"
              borderColor="whiteAlpha.200"
              fontSize="xs"
              color="fg.muted"
            >
              {FEEDBACK_TAG_LABELS[tag]}
              {count > 1 && ` ×${count}`}
            </Box>
          ))}
        </Wrap>
      )}
    </VStack>
  );
};
