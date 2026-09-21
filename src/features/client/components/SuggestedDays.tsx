import { HStack, Box, Text } from '@chakra-ui/react';
import { dayChipStyle } from '@/components/dayChip';
import {
  WEEKDAY_FULL,
  WEEKDAY_SHORT,
  formatSuggestedDays,
} from '../sessionDates';

interface SuggestedDaysProps {
  days?: number[];
  /** Rappelle à quoi servent les pastilles là où rien ne l'annonce. */
  withLabel?: boolean;
}

/**
 * Les jours conseillés, tels que le coach les a cochés.
 *
 * Le client lisait « Conseillée le lundi et le jeudi » là où le coach voyait
 * des pastilles : la même donnée sous deux formes, qu'on ne rapproche pas
 * d'un coup d'œil. Ce sont les mêmes pastilles des deux côtés, seulement
 * inertes ici — le client ne choisit pas ses jours.
 *
 * Seuls les jours conseillés paraissent : montrer les sept, dont cinq
 * éteints, serait une commande sans commande.
 */
export const SuggestedDays = ({ days, withLabel }: SuggestedDaysProps) => {
  const valid = [...new Set(days ?? [])]
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    .sort((a, b) => a - b);
  if (valid.length === 0) return null;

  return (
    // Une séance peut porter les sept jours : à 390 px, sept pastilles et
    // leur libellé dépassent de 23 px. Elles passent à la ligne plutôt que
    // de pousser la page en travers.
    <HStack
      gap={1.5}
      wrap="wrap"
      aria-label={`Conseillée ${formatSuggestedDays(valid)}`}
    >
      {withLabel && (
        <Text fontSize="xs" color="fg.muted" aria-hidden>
          Conseillée
        </Text>
      )}
      <HStack gap={1} wrap="wrap" aria-hidden>
        {valid.map((day) => (
          <Box key={day} {...dayChipStyle(true)} title={WEEKDAY_FULL[day]}>
            {WEEKDAY_SHORT[day]}
          </Box>
        ))}
      </HStack>
    </HStack>
  );
};
