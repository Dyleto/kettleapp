import { HStack, Box, Text } from '@chakra-ui/react';
import { dayChipStyle } from '@/components/dayChip';
import {
  WEEKDAY_FULL,
  WEEKDAY_SHORT,
  formatSuggestedDays,
} from '../sessionDates';

interface SuggestedDaysProps {
  days?: number[];
  /** Recalls what the chips are for, where nothing else announces it. */
  withLabel?: boolean;
}

/**
 * The suggested days, as the coach ticked them.
 *
 * The client read "Conseillée le lundi et le jeudi" where the coach saw
 * chips: the same data in two forms, which you do not connect at a glance.
 * They are the same chips on both sides, only inert here — the client does
 * not choose their days.
 *
 * Only the suggested days appear: showing all seven, five of them off, would
 * be a control that controls nothing.
 */
export const SuggestedDays = ({ days, withLabel }: SuggestedDaysProps) => {
  const valid = [...new Set(days ?? [])]
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    .sort((a, b) => a - b);
  if (valid.length === 0) return null;

  return (
    // A session can carry all seven days: at 390 px, seven chips and their
    // label overflow by 23 px. They wrap rather than push the page sideways.
    <HStack
      gap={1.5}
      wrap="wrap"
      aria-label={`Conseillée ${formatSuggestedDays(valid)}`}
    >
      {withLabel && (
        <Text fontSize="xs" color="fg.muted" aria-hidden>
          Conseillée
        </Text>
      )}
      <HStack gap={1} wrap="wrap" aria-hidden>
        {valid.map((day) => (
          <Box key={day} {...dayChipStyle(true)} title={WEEKDAY_FULL[day]}>
            {WEEKDAY_SHORT[day]}
          </Box>
        ))}
      </HStack>
    </HStack>
  );
};
