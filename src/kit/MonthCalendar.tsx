import { useState } from 'react';
import { Box, chakra, HStack, Text } from '@chakra-ui/react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { EFFORT_ZONE_COLOR, type EffortZone } from '@/domain/history/effort';
import { dayKey, mondayIndex, WEEKDAY_LETTERS } from '@/domain/week/dates';
import { hitArea } from './hitArea';

/** Ce qu'un jour porte : la zone de son effort — rien pour un ancien bilan
 * —, et ce qu'un lecteur d'écran en entend. */
export interface DayMark {
  zone: EffortZone | null;
  label: string;
}

const monthLabel = (month: Date) => {
  const label = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(month);
  return label.charAt(0).toUpperCase() + label.slice(1);
};

/** Les cases du mois, lundi d'abord, `null` avant le premier jour. */
const cellsOf = (month: Date): (Date | null)[] => {
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return [
    ...Array<null>(mondayIndex(month)).fill(null),
    ...Array.from(
      { length: days },
      (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)
    ),
  ];
};

const shift = (month: Date, by: number) =>
  new Date(month.getFullYear(), month.getMonth() + by);

const Arrow = ({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <chakra.button
    type="button"
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    boxSize="32px"
    display="grid"
    placeItems="center"
    borderRadius="full"
    color="fg.muted"
    _hover={{ bg: 'whiteAlpha.100', color: 'fg' }}
    _disabled={{ opacity: 0.3, cursor: 'default', _hover: { bg: 'none' } }}
    css={hitArea(44)}
  >
    {children}
  </chakra.button>
);

/**
 * Un mois, une pastille pleine par jour fait, à la couleur de son effort.
 *
 * Le calendrier de l'ancien journal mettait un point de cinq pixels sous le
 * chiffre, et filtrait la liste au toucher : il fallait ensuite y chercher
 * la séance. La maquette remplit la case — un mois se lit d'un regard, dur
 * en corail, juste en vert — et la toucher ouvre la séance elle-même.
 *
 * Un jour sans séance n'est pas une commande désactivée, ce n'est pas une
 * commande du tout : il ne prend pas le focus et ne s'annonce pas.
 *
 * Les flèches parcourent `first` à `last`, sans au-delà : un mois avant la
 * première séance n'a rien à montrer. Il ouvre sur `start`.
 */
export const MonthCalendar = ({
  marks,
  first,
  last,
  start,
  onPick,
}: {
  /** Par jour, « 2026-08-30 ». */
  marks: ReadonlyMap<string, DayMark>;
  first: Date;
  last: Date;
  start: Date;
  onPick: (day: string) => void;
}) => {
  const [month, setMonth] = useState(start);
  const title = monthLabel(month);

  return (
    <Box bg="bg.surface" borderRadius="18px" p="18px" data-calendar>
      <HStack mb="10px">
        <Text as="h2" fontWeight="800" fontSize="17px" data-calendar-month>
          {title}
        </Text>
        <HStack ml="auto" gap="4px">
          <Arrow
            label="Mois précédent"
            disabled={month <= first}
            onClick={() => setMonth((m) => shift(m, -1))}
          >
            <LuChevronLeft size={18} />
          </Arrow>
          <Arrow
            label="Mois suivant"
            disabled={month >= last}
            onClick={() => setMonth((m) => shift(m, 1))}
          >
            <LuChevronRight size={18} />
          </Arrow>
        </HStack>
      </HStack>
      <Box
        display="grid"
        gridTemplateColumns="repeat(7, 1fr)"
        gap="4px"
        justifyItems="center"
      >
        {WEEKDAY_LETTERS.map((letter, i) => (
          <Text
            key={i}
            aria-hidden
            fontSize="xs"
            fontWeight="700"
            color="fg.muted"
          >
            {letter}
          </Text>
        ))}
        {cellsOf(month).map((date, i) => {
          if (!date) return <Box key={`vide-${i}`} />;
          const key = dayKey(date);
          const mark = marks.get(key);
          // La case remplit sa colonne, jusqu'à 44 px : sur un téléphone
          // la colonne en fait 42, et une zone de toucher plus large
          // déborderait sur le jour voisin.
          const shape = {
            w: 'full',
            maxW: '44px',
            aspectRatio: '1',
            borderRadius: 'full',
            display: 'grid',
            placeItems: 'center',
            fontSize: '13px',
            fontWeight: '700',
            fontVariantNumeric: 'tabular-nums',
          } as const;
          if (!mark)
            return (
              <Box key={key} {...shape} color="fg.muted">
                {date.getDate()}
              </Box>
            );
          return (
            <chakra.button
              key={key}
              type="button"
              aria-label={mark.label}
              onClick={() => onPick(key)}
              {...shape}
              bg={mark.zone ? EFFORT_ZONE_COLOR[mark.zone] : 'bg.raised'}
              color={mark.zone ? 'bg.canvas' : 'fg'}
              _hover={{ filter: 'brightness(1.12)' }}
              data-day={key}
              data-zone={mark.zone ?? 'none'}
            >
              {date.getDate()}
            </chakra.button>
          );
        })}
      </Box>
    </Box>
  );
};
