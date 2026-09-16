import { Box, HStack } from '@chakra-ui/react';
import { hitArea } from '@/components/hitArea';
import { dayChipStyle } from '@/components/dayChip';
import { WEEKDAY_FULL, WEEKDAY_SHORT } from '@/features/client/sessionDates';

interface SuggestedDaysPickerProps {
  value?: number[];
  onChange: (days: number[]) => void;
}

/**
 * Les jours où le coach conseille cette séance. Lundi = 0.
 *
 * La rangée reste posée, même vide. Elle a d'abord vécu derrière un
 * « + jour conseillé » révélé au survol, comme la note de séance : personne
 * ne l'aurait trouvée, et sept boutons d'une ligne ne pèsent pas le prix
 * d'une commande introuvable.
 *
 * Ce que veulent dire les jours cochés se lit sur les boutons eux-mêmes —
 * `aria-pressed` pour les lecteurs d'écran, l'accent pour les autres. La
 * phrase qui doublait la rangée ne disait rien de plus.
 *
 * Plusieurs jours sont permis, et c'est le cas courant : un full body se fait
 * lundi, mercredi et vendredi. Rien n'empêche non plus deux séances le même
 * jour — ce n'est pas un conflit à arbitrer, juste deux conseils.
 */
export const SuggestedDaysPicker = ({
  value,
  onChange,
}: SuggestedDaysPickerProps) => {
  const days = value ?? [];

  const toggle = (day: number) =>
    onChange(
      days.includes(day)
        ? days.filter((d) => d !== day)
        : [...days, day].sort((a, b) => a - b)
    );

  return (
    // Sept boutons ne tiennent pas toujours sur la largeur qu'on leur laisse
    // — mesuré à 768 px, « Dim » débordait de 22 px. Ils passent à la ligne
    // plutôt que de pousser la page.
    <HStack
      gap={1}
      rowGap={1}
      wrap="wrap"
      role="group"
      aria-label="Jours conseillés"
    >
      {WEEKDAY_SHORT.map((short, day) => {
        const active = days.includes(day);
        return (
          <Box
            as="button"
            key={day}
            aria-pressed={active}
            aria-label={WEEKDAY_FULL[day]}
            onClick={() => toggle(day)}
            {...dayChipStyle(active)}
            css={hitArea(32)}
            _hover={{ borderColor: active ? 'app.primary' : 'whiteAlpha.400' }}
            transition="border-color 0.15s, background-color 0.15s"
          >
            {short}
          </Box>
        );
      })}
    </HStack>
  );
};
