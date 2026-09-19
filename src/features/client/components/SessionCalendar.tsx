import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { CompletedSession } from '@/types';
import { EFFORT_ZONE_COLOR } from '../constants';
import { getEffortSummary } from '../format';
import { dayKey } from '../sessionDates';
import { majusculeInitiale } from '@/components/typographie';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const monthLabel = (d: Date) =>
  new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
    d
  );

/** Lundi = 0 : la semaine française ne commence pas le dimanche. */
const mondayIndex = (date: Date) => (date.getDay() + 6) % 7;

/** Les semaines du mois, chacune de sept cases, complétées de `null`. */
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
  /** Jour affiché en détail, ou `null` pour « tout le mois ». */
  selectedDay: string | null;
  onSelectDay: (day: string | null) => void;
  /**
   * Nombre de mois affichés côte à côte. Deux mois donnent la profondeur qu'il
   * faut pour lire une régularité — un mois seul coupe l'élan en deux.
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
          css={majusculeInitiale}
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

              // La pastille prend la couleur du ressenti. Plusieurs séances le
              // même jour : celle du dernier bilan enregistré.
              const effort =
                sessions.length > 0 ? getEffortSummary(sessions[0]) : null;
              const dotColor = effort
                ? EFFORT_ZONE_COLOR[effort.zone]
                : 'app.primary';

              // Un jour sans séance n'est pas une commande désactivée : ce
              // n'est pas une commande du tout. Il ne va donc pas dans l'ordre
              // de tabulation, et un lecteur d'écran ne l'annonce pas.
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
                    {/* Une pastille par séance : deux le même jour se voient. */}
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
 * Le mois, avec une pastille les jours où le client s'est entraîné.
 *
 * Une liste répond à « qu'a-t-il fait ? », pas à « à quel rythme ? ». Deux
 * séances collées puis dix jours de rien, ça se voit sur un calendrier et
 * ça se compte péniblement sur une liste. La couleur de la pastille reprend
 * le ressenti déclaré : on lit une charge de travail d'un coup d'œil.
 *
 * Chaque semaine porte son compte à gauche, et un tiret quand elle est vide :
 * une semaine sautée est ce qu'on cherche, et rien ne la distinguait des
 * cases vides de début et de fin de mois.
 */
export const SessionCalendar = ({
  history,
  selectedDay,
  onSelectDay,
  months = 1,
}: SessionCalendarProps) => {
  // On ouvre sur le mois de la séance la plus récente, pas sur le mois
  // courant : un client à l'arrêt depuis six semaines afficherait une grille
  // vide, et on croirait le journal cassé.
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

  // Le curseur est le mois le plus récent ; les précédents s'affichent à sa
  // gauche, pour qu'on lise de gauche à droite dans le sens du temps.
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
            css={majusculeInitiale}
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
