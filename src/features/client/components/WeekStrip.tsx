import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { CompletedSession, Session } from '@/types';
import { hitArea } from '@/components/hitArea';
import { EFFORT_ZONE_COLOR } from '../constants';
import { getEffortSummary } from '../format';
import { dayKey, mondayIndex, WEEKDAY_LETTERS } from '../sessionDates';
import { WeekDayPlan } from '../weekPlan';

interface WeekStripProps {
  days: WeekDayPlan[];
  /** Opens the detail of a session already done. */
  onOpenCompleted: (completed: CompletedSession) => void;
  /** Opens a session suggested but not yet done. */
  onOpenSession: (session: Session) => void;
}

/**
 * The current week, Monday to Sunday: what is planned, what is done.
 *
 * Home said what was left to do and what had just been done, never where you
 * stood in your week. "I went twice" counts differently when you can see it —
 * and an empty Monday at the end of the day is not the same information as an
 * empty Monday in the morning.
 *
 * Every day that carries something is a button: the strip looked clickable
 * and was not. It filters nothing — filtering three recent sessions across
 * seven days empties the screen five times out of seven, and the history
 * already does that over a whole month. It leads to what the day contains:
 * the detail for a day done, the session for a suggested day.
 */
export const WeekStrip = ({
  days,
  onOpenCompleted,
  onOpenSession,
}: WeekStripProps) => {
  const todayKey = dayKey(new Date());
  /**
   * What is left to do, computed once for the strip and for its count.
   *
   * A suggested session whose equivalent was already done that day does not
   * stay "planned"; but another session suggested the same day does — a
   * Sunday on which you did number 4 does not make number 3 nonexistent.
   *
   * The rule lived in the chips' rendering, and the header's count applied
   * another, coarser one: it announced three planned sessions where the strip
   * drew six.
   */
  const jours = days.map((d) => ({
    ...d,
    pending: d.suggested.filter(
      (s) => !d.done.some((x) => x.originalSessionId === s._id)
    ),
  }));
  const faites = jours.reduce((sum, d) => sum + d.done.length, 0);
  const prevues = jours.reduce((sum, d) => sum + d.pending.length, 0);

  return (
    <VStack align="stretch" gap={2}>
      <HStack justify="space-between" align="baseline" maxW="420px">
        <Text
          fontSize="xs"
          fontWeight="bold"
          color="fg.muted"
          textTransform="uppercase"
          letterSpacing="wider"
        >
          Cette semaine
        </Text>
        {/* The count stops contradicting what is drawn just below: the
            header announced "aucune séance" while the strip showed three
            rings. It counted only what was done; the strip also shows what is
            planned. */}
        <Text fontSize="xs" color="fg.muted">
          {faites === 0 && prevues === 0
            ? 'rien de prévu'
            : [
                `${faites} faite${faites > 1 ? 's' : ''}`,
                prevues > 0 && `${prevues} prévue${prevues > 1 ? 's' : ''}`,
              ]
                .filter(Boolean)
                .join(' · ')}
        </Text>
      </HStack>

      {/* Capped: seven cells of one letter and two digits do not need
          600 px. Beyond that, the strip reads as an empty ribbon. */}
      {/* `role="group"` and not `list`: the days that carry something are
          buttons, and a `role="listitem"` placed on them would strip their
          command semantics. */}
      <HStack
        gap={1}
        maxW="420px"
        role="group"
        aria-label="Séances de la semaine"
      >
        {jours.map(({ date, key, done, pending }) => {
          const isToday = key === todayKey;
          const isFuture = key > todayKey;
          const effort = done.length > 0 ? getEffortSummary(done[0]) : null;
          const letter = WEEKDAY_LETTERS[mondayIndex(date)];

          // A suggested session already done that day no longer needs to
          // announce itself. But another, suggested the same day and not yet
          const target =
            done.length > 0
              ? 'completed'
              : pending.length > 0
                ? 'session'
                : null;
          const label = `${letter} ${date.getDate()} — ${
            done.length > 0
              ? `${done.length} séance${done.length > 1 ? 's' : ''} faite${done.length > 1 ? 's' : ''}, voir le détail`
              : pending.length > 0
                ? `séance ${pending[0].order} conseillée, l'ouvrir`
                : 'aucune séance'
          }`;

          const content = (
            <>
              <Text fontSize="xs" color="fg.muted" aria-hidden>
                {letter}
              </Text>
              <Text
                fontSize="xs"
                fontFamily="mono"
                color={done.length > 0 ? 'fg' : 'whiteAlpha.600'}
                fontWeight={isToday ? 'bold' : 'normal'}
                aria-hidden
              >
                {date.getDate()}
              </Text>
              {/* Three states on the same row of chips: solid for what is
                  done — the effort colour, like the history calendar —
                  hollow for what is suggested and not yet done, nothing at
                  all otherwise.

                  Neither is amber: a week chip is not clicked and does not
                  say where you are. It is solid against hollow that tells
                  done from planned — colour never added anything there. */}
              <HStack gap="2px" h="5px" justify="center" aria-hidden>
                {done.map((s) => (
                  <Box
                    key={s._id}
                    w="5px"
                    h="5px"
                    borderRadius="full"
                    bg={effort ? EFFORT_ZONE_COLOR[effort.zone] : 'fg.muted'}
                  />
                ))}
                {pending.map((s) => (
                  <Box
                    key={s._id}
                    w="5px"
                    h="5px"
                    borderRadius="full"
                    borderWidth="1px"
                    borderColor="fg.muted"
                  />
                ))}
              </HStack>
            </>
          );

          const shared = {
            flex: 1,
            minW: 0,
            gap: 1,
            py: 2,
            borderRadius: 'md',
            borderWidth: '1px',
            borderColor: isToday ? 'app.primary' : 'transparent',
            bg: done.length > 0 ? 'whiteAlpha.50' : 'transparent',
          } as const;

          // An empty day does not pretend to be a control: no button, no
          // hover, no tab stop. An honest disabled state beats a click that
          // does nothing.
          if (!target) {
            return (
              <VStack
                key={key}
                aria-label={label}
                {...shared}
                opacity={isFuture ? 0.45 : 1}
              >
                {content}
              </VStack>
            );
          }

          return (
            <VStack
              key={key}
              as="button"
              aria-label={label}
              onClick={() =>
                target === 'completed'
                  ? onOpenCompleted(done[0])
                  : onOpenSession(pending[0])
              }
              {...shared}
              opacity={isFuture ? 0.45 : 1}
              cursor="pointer"
              css={hitArea(44)}
              _hover={{ bg: 'app.primary/12' }}
              transition="background-color 0.15s"
            >
              {content}
            </VStack>
          );
        })}
      </HStack>
    </VStack>
  );
};
