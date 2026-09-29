import { Box, HStack } from '@chakra-ui/react';
import { TACTILE, hitArea } from '@/shared/components/hitArea';
import { dayChipStyle } from '@/shared/components/dayChip';
import { WEEKDAY_FULL, WEEKDAY_SHORT } from '@/features/client/sessionDates';

interface SuggestedDaysPickerProps {
  value?: number[];
  onChange: (days: number[]) => void;
}

/**
 * The days the coach suggests for this session. Monday = 0.
 *
 * The row stays put, even when empty. It first lived behind a "+ jour
 * conseillé" revealed on hover, like the session note: nobody would have
 * found it, and seven buttons on one line do not cost what an undiscoverable
 * control costs.
 *
 * What the ticked days mean reads from the buttons themselves —
 * `aria-pressed` for screen readers, the accent for everyone else. The
 * sentence that doubled the row said nothing more.
 *
 * Several days are allowed, and that is the common case: a full body happens
 * Monday, Wednesday and Friday. Nothing stops two sessions on the same day
 * either — that is not a conflict to arbitrate, just two suggestions.
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
