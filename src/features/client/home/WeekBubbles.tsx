import { Box, Text, VStack } from '@chakra-ui/react';
import { LuCheck } from 'react-icons/lu';
import { WEEKDAY_LETTERS } from '@/domain/week/dates';

/** Un jour de la bande : ce qui s'y est passé, et ce qu'on peut y ouvrir. */
export interface WeekBubble {
  date: Date;
  /** Fait : une séance y a été faite. Conseillé : le coach y en a mis une. */
  state: 'done' | 'planned' | 'free';
  today: boolean;
  /** Ce que le lecteur d'écran annonce quand le jour s'ouvre. */
  label?: string;
  onOpen?: () => void;
}

/**
 * Les sept jours de la semaine en bulles, du lundi au dimanche.
 *
 * Une seule écriture pour l'accueil et pour le dernier écran de la fin de
 * séance : la maquette leur donne le même dessin, et deux bandes voisines
 * qui ne cochent pas de la même façon feraient douter de ce qu'une coche
 * veut dire.
 *
 * Le numéro du jour dans la bulle, la lettre dessous : « 12 » se retrouve
 * dans un calendrier, « J » seul non. Un jour conseillé passé sans séance
 * garde son cercle gris, sans rien de plus — un conseil n'a pas de retard.
 */
export const WeekBubbles = ({ days }: { days: WeekBubble[] }) => (
  <Box display="flex" justifyContent="space-between">
    {days.map((day, index) => {
      const face = (
        <Box
          w="38px"
          h="38px"
          borderRadius="full"
          display="grid"
          placeItems="center"
          fontSize="13px"
          fontWeight="600"
          bg={
            day.state === 'done'
              ? 'session.rest'
              : day.state === 'planned'
                ? 'transparent'
                : 'bg.surface'
          }
          color={
            day.state === 'done' ? 'bg.canvas' : day.today ? 'fg' : 'fg.muted'
          }
          boxShadow={
            day.today
              ? '0 0 0 2.5px {colors.app.primary}'
              : day.state === 'planned'
                ? 'inset 0 0 0 2px {colors.fg.muted}'
                : undefined
          }
        >
          {day.state === 'done' ? (
            <LuCheck size={18} strokeWidth={3} aria-hidden />
          ) : (
            day.date.getDate()
          )}
        </Box>
      );
      return (
        <VStack
          key={index}
          gap="6px"
          data-day={day.state}
          data-today={day.today || undefined}
        >
          {day.onOpen ? (
            <Box
              as="button"
              borderRadius="full"
              aria-label={day.label}
              onClick={day.onOpen}
            >
              {face}
            </Box>
          ) : (
            face
          )}
          <Text
            fontSize="12px"
            fontWeight="600"
            color="fg.muted"
            lineHeight="1"
            aria-hidden
          >
            {WEEKDAY_LETTERS[index]}
          </Text>
        </VStack>
      );
    })}
  </Box>
);
