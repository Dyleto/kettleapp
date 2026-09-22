import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { CompletedSession } from '@/types';
import { EFFORT_ZONE_COLOR } from '../constants';
import { getEffortSummary } from '../format';
import { dayKey } from '../sessionDates';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const monthLabel = (d: Date) =>
  new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
    d
  );

/** Monday = 0: the French week does not start on Sunday. */
const mondayIndex = (date: Date) => (date.getDay() + 6) % 7;

/** The month's weeks, each of seven cells, padded with `null`. */
const buildWeeks = (cursor: Date): (Date | null)[][] => {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const daysInMonth = new Date(
    cursor.getFullYear(),
    cursor.getMonth() + 1,
    0
  ).getDate();

  const cells: (Date | null)[] = Array(mondayIndex(first)).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
};

interface SessionCalendarProps {
  history: CompletedSession[];
  /** The day shown in detail, or `null` for "the whole month". */
  selectedDay: string | null;
  onSelectDay: (day: string | null) => void;
  /**
   * How many months show side by side. Two months give the depth needed to
   * read a rhythm — one month alone cuts the momentum in half.
   */
  months?: 1 | 2;
}

interface MonthGridProps {
  cursor: Date;
  byDay: Map<string, CompletedSession[]>;
  selectedDay: string | null;
  onSelectDay: (day: string | null) => void;
  todayKey: string;
  showLabel: boolean;
}

const MonthGrid = ({
  cursor,
  byDay,
  selectedDay,
  onSelectDay,
  todayKey,
  showLabel,
}: MonthGridProps) => {
  const weeks = useMemo(() => buildWeeks(cursor), [cursor]);

  return (
    <VStack align="stretch" gap={1} minW={0} flex={1}>
      {showLabel && (
        <Text
          fontSize="xs"
          fontWeight="bold"
          color="fg.muted"
          textTransform="capitalize"
          textAlign="center"
        >
          {monthLabel(cursor)}
        </Text>
      )}

      <Box
        display="grid"
        gridTemplateColumns="repeat(7, 1fr)"
        gap={1}
        role="grid"
        aria-label={`Séances de ${monthLabel(cursor)}`}
      >
        {WEEKDAYS.map((letter, i) => (
          <Text
            key={`${letter}-${i}`}
            fontSize="xs"
            color="fg.muted"
            textAlign="center"
            pb={1}
            aria-hidden
          >
            {letter}
          </Text>
        ))}
      </Box>

      {weeks.map((week, weekIndex) => {
        return (
          <Box
            key={weekIndex}
            display="grid"
            gridTemplateColumns="repeat(7, 1fr)"
            gap={1}
            role="row"
          >
            {week.map((date, index) => {
              if (!date) return <Box key={`empty-${weekIndex}-${index}`} />;

              const key = dayKey(date);
              const sessions = byDay.get(key) ?? [];
              const isSelected = selectedDay === key;
              const isToday = key === todayKey;

              // The chip takes the effort colour. Several sessions on the
              // same day: the one from the last recorded wrap-up.
              const effort =
                sessions.length > 0 ? getEffortSummary(sessions[0]) : null;
              const dotColor = effort
                ? EFFORT_ZONE_COLOR[effort.zone]
                : 'app.primary';

              // A day with no session is not a disabled control: it is not a
              // control at all. So it does not go in the tab order, and a
              // screen reader does not announce it.
              const isActionable = sessions.length > 0;

              return (
                <Box
                  key={key}
                  as={isActionable ? 'button' : undefined}
                  aria-label={
                    isActionable
                      ? `${date.getDate()} — ${sessions.length} séance${sessions.length > 1 ? 's' : ''}`
                      : undefined
                  }
                  aria-pressed={isActionable ? isSelected : undefined}
                  onClick={
                    isActionable
                      ? () => onSelectDay(isSelected ? null : key)
                      : undefined
                  }
                  minH="44px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  py={1.5}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor={isSelected ? 'app.primary' : 'transparent'}
                  bg={isSelected ? 'app.primary/12' : 'transparent'}
                  cursor={isActionable ? 'pointer' : 'default'}
                  _hover={isActionable ? { bg: 'whiteAlpha.50' } : undefined}
                  transition="background-color 0.12s"
                >
                  <VStack gap={0.5}>
                    <Text
                      fontSize="xs"
                      fontFamily="mono"
                      color={
                        isActionable
                          ? 'fg'
                          : isToday
                            ? 'fg.muted'
                            : 'whiteAlpha.600'
                      }
                      fontWeight={isToday ? 'bold' : 'normal'}
                      textDecoration={isToday ? 'underline' : 'none'}
                      textUnderlineOffset="2px"
                    >
                      {date.getDate()}
                    </Text>
                    {/* One chip per session: two on the same day are visible. */}
                    <HStack gap="2px" h="5px" justify="center">
                      {sessions.map((s) => (
                        <Box
                          key={s._id}
                          w="5px"
                          h="5px"
                          borderRadius="full"
                          bg={dotColor}
                        />
                      ))}
                    </HStack>
                  </VStack>
                </Box>
              );
            })}
          </Box>
        );
      })}
    </VStack>
  );
};

/**
 * The month, with a chip on the days the client trained.
 *
 * A list answers "what did they do?", not "at what rhythm?". Two sessions
 * back to back then ten days of nothing shows on a calendar and is counted
 * painfully on a list. The chip's colour takes the declared effort: you read
 * a workload at a glance.
 *
 * Each week carries its count on the left, and a dash when it is empty: a
 * skipped week is what you are looking for, and nothing distinguished it from
 * the empty cells at the start and end of a month.
 */
export const SessionCalendar = ({
  history,
  selectedDay,
  onSelectDay,
  months = 1,
}: SessionCalendarProps) => {
  // We open on the month of the most recent session, not on the current
  // month: a client idle for six weeks would show an empty grid, and you
  // would think the journal was broken.
  const [cursor, setCursor] = useState(() => {
    const latest = history[0]?.completedAt;
    const base = latest ? new Date(latest) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const byDay = useMemo(() => {
    const map = new Map<string, CompletedSession[]>();
    history.forEach((completed) => {
      const key = dayKey(new Date(completed.completedAt));
      const list = map.get(key);
      if (list) list.push(completed);
      else map.set(key, [completed]);
    });
    return map;
  }, [history]);

  // The cursor is the most recent month; earlier ones show to its left, so
  // you read left to right in the direction of time.
  const shownMonths = useMemo(
    () =>
      Array.from(
        { length: months },
        (_, i) =>
          new Date(
            cursor.getFullYear(),
            cursor.getMonth() - (months - 1 - i),
            1
          )
      ),
    [cursor, months]
  );

  const shiftMonth = (delta: number) => {
    setCursor(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1)
    );
    onSelectDay(null);
  };

  const todayKey = dayKey(new Date());
  const rangeCount = useMemo(
    () =>
      shownMonths.reduce(
        (total, month) =>
          total +
          buildWeeks(month)
            .flat()
            .reduce(
              (sum, date) =>
                date ? sum + (byDay.get(dayKey(date))?.length ?? 0) : sum,
              0
            ),
        0
      ),
    [shownMonths, byDay]
  );

  const rangeLabel =
    months === 1
      ? monthLabel(cursor)
      : `${monthLabel(shownMonths[0])} — ${monthLabel(cursor)}`;

  return (
    <VStack align="stretch" gap={3}>
      <HStack justify="space-between" align="center">
        <Box
          as="button"
          aria-label="Mois précédent"
          onClick={() => shiftMonth(-1)}
          color="fg.muted"
          _hover={{ color: 'app.primary' }}
          display="flex"
          alignItems="center"
          justifyContent="center"
          minW="44px"
          minH="44px"
        >
          <LuChevronLeft size={16} />
        </Box>
        <VStack gap={0}>
          <Text
            fontSize="sm"
            fontWeight="bold"
            textTransform="capitalize"
            textAlign="center"
            aria-live="polite"
          >
            {rangeLabel}
          </Text>
          <Text fontSize="xs" color="fg.muted">
            {rangeCount === 0
              ? 'aucune séance'
              : `${rangeCount} séance${rangeCount > 1 ? 's' : ''}`}
          </Text>
        </VStack>
        <Box
          as="button"
          aria-label="Mois suivant"
          onClick={() => shiftMonth(1)}
          color="fg.muted"
          _hover={{ color: 'app.primary' }}
          display="flex"
          alignItems="center"
          justifyContent="center"
          minW="44px"
          minH="44px"
        >
          <LuChevronRight size={16} />
        </Box>
      </HStack>

      <HStack align="start" gap={6}>
        {shownMonths.map((month) => (
          <MonthGrid
            key={`${month.getFullYear()}-${month.getMonth()}`}
            cursor={month}
            byDay={byDay}
            selectedDay={selectedDay}
            onSelectDay={onSelectDay}
            todayKey={todayKey}
            showLabel={months > 1}
          />
        ))}
      </HStack>
    </VStack>
  );
};
