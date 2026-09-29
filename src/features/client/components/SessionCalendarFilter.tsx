import { Box, HStack, Text, useBreakpointValue } from '@chakra-ui/react';
import { useState } from 'react';
import { LuCalendarDays } from 'react-icons/lu';
import { CompletedSession } from '@/shared/types';
import { SessionCalendar } from './SessionCalendar';

interface SessionCalendarFilterProps {
  history: CompletedSession[];
  selectedDay: string | null;
  onSelectDay: (day: string | null) => void;
  /** Deux mois côte à côte quand la colonne a la place. */
  months?: 1 | 2;
  /** Below this width, the calendar folds away. */
  collapseBelow?: 'md' | 'lg';
}

/**
 * Le calendrier, replié quand l'écran est trop étroit pour le porter.
 *
 * Une grille de mois occupe presque tout l'écran d'un téléphone : ce qu'on
 * est venu lire — les séances et ce que le client en a dit — commence alors
 * sous la ligne de flottaison. Rangé derrière « Filtrer par date », il
 * redevient ce qu'il est : un filtre qu'on ouvre quand on en a besoin.
 *
 * Ce comportement n'existait que du côté coach, et l'historique du client
 * montrait la même grille sur 390 px. Deux calendriers dans la même
 * application doivent se comporter pareil — et comme la version repliée est
 * la bonne sur un téléphone, c'est celle-là qu'on partage, plutôt que de
 * l'écrire une seconde fois et de la laisser diverger.
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

  // Un jour choisi garde le calendrier ouvert : on vient d'y cliquer, et le
  // refermer sous le doigt retirerait le repère dont on se sert.
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
