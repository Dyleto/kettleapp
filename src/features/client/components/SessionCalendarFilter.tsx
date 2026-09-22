import { Box, HStack, Text, useBreakpointValue } from '@chakra-ui/react';
import { useState } from 'react';
import { LuCalendarDays } from 'react-icons/lu';
import { CompletedSession } from '@/types';
import { SessionCalendar } from './SessionCalendar';

interface SessionCalendarFilterProps {
  history: CompletedSession[];
  selectedDay: string | null;
  onSelectDay: (day: string | null) => void;
  /** Two months side by side when the column has room. */
  months?: 1 | 2;
  /** Below this width, the calendar folds away. */
  collapseBelow?: 'md' | 'lg';
}

/**
 * The calendar, folded away when the screen is too narrow to carry it.
 *
 * A month grid takes up almost a whole phone screen: what you came to read —
 * the sessions and what the client said about them — then starts below the
 * fold. Tucked behind "Filtrer par date", it becomes what it is again: a
 * filter you open when you need it.
 *
 * This behaviour existed on the coach side only, and the client's history
 * showed the same grid on 390 px. Two calendars in the same app must behave
 * the same — and since the folded version is the right one on a phone, that
 * is the one we share, rather than writing it a second time and letting it
 * drift.
 */
export const SessionCalendarFilter = ({
  history,
  selectedDay,
  onSelectDay,
  months,
  collapseBelow = 'md',
}: SessionCalendarFilterProps) => {
  const isNarrow =
    useBreakpointValue({ base: true, [collapseBelow]: false }) ?? false;
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // A chosen day keeps the calendar open: you have just clicked in it, and
  // closing it under the finger would remove the landmark you are using.
  const showCalendar = !isNarrow || isFilterOpen || selectedDay !== null;

  return (
    <>
      {isNarrow && (
        <Box
          as="button"
          w="full"
          aria-expanded={isFilterOpen || selectedDay !== null}
          onClick={() => {
            setIsFilterOpen((open) => !open);
            if (selectedDay !== null) onSelectDay(null);
          }}
          px={3}
          py={2}
          mb={showCalendar ? 3 : 0}
          borderWidth="1px"
          borderColor="whiteAlpha.200"
          borderRadius="md"
          color="fg.muted"
          _hover={{ color: 'fg', borderColor: 'whiteAlpha.300' }}
        >
          <HStack gap={2} justify="center">
            <LuCalendarDays size={14} />
            <Text fontSize="sm">
              {selectedDay !== null
                ? 'Voir tout le journal'
                : isFilterOpen
                  ? 'Masquer le calendrier'
                  : 'Filtrer par date'}
            </Text>
          </HStack>
        </Box>
      )}
      {showCalendar && (
        <SessionCalendar
          history={history}
          selectedDay={selectedDay}
          onSelectDay={onSelectDay}
          months={months}
        />
      )}
    </>
  );
};
