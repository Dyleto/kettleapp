import { Box, HStack } from '@chakra-ui/react';
import { TACTILE, hitArea } from '@/shared/components/hitArea';
import { dayChipStyle } from '@/shared/components/dayChip';
import { WEEKDAY_FULL, WEEKDAY_SHORT } from '@/features/client/sessionDates';

interface SuggestedDaysPickerProps {
  value?: number[];
  onChange: (days: number[]) => void;
}

/**
 * Les jours que le coach conseille pour cette séance. Lundi = 0.
 *
 * La rangée reste en place, même vide. Elle a d'abord vécu derrière un « + jour
 * conseillé » révélé au survol, comme la note de séance : personne ne l'aurait
 * trouvée, et sept boutons sur une ligne ne coûtent pas ce que coûte une
 * commande introuvable.
 *
 * Ce que les jours cochés veulent dire se lit sur les boutons eux-mêmes —
 * `aria-pressed` pour les lecteurs d'écran, l'accent pour tout le monde. La
 * phrase qui doublait la rangée ne disait rien de plus.
 *
 * Plusieurs jours sont permis, et c'est le cas courant : un full body se fait
 * le lundi, le mercredi et le vendredi. Rien n'empêche non plus deux séances
 * le même jour — ce n'est pas un conflit à arbitrer, juste deux conseils.
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
    // Sept boutons ne tiennent pas toujours dans la largeur qu'on leur donne
    // — mesuré à 768 px, « Dim » débordait de 22 px. Ils se replient plutôt
    // que de pousser la page.
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
            /* Sous un doigt, la pastille grandit réellement au lieu d'être
                           doublée d'une zone invisible : sept d'entre elles se suivent à
                           4 px, et sept zones de 44 px se recouvriraient toutes. Sept
                           pastilles de 44 px tiennent en travers d'un téléphone — et si
                           elles ne tiennent pas, la rangée se replie, ce qu'elle sait
                           déjà faire. */
            css={{
              ...hitArea(32),
              [TACTILE]: { minWidth: '44px', minHeight: '44px' },
            }}
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
