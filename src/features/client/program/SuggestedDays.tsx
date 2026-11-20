import { HStack } from '@chakra-ui/react';
import { Chip } from '@/kit';
import { WEEKDAY_SHORT, formatSuggestedDays } from '@/domain/week/dates';

/**
 * Les jours conseillés d'une séance, en pastilles ambre : « Lun », « Jeu ».
 *
 * Le client lisait « Conseillée le lundi et le jeudi » là où le coach voyait
 * des pastilles : la même donnée sous deux formes, qu'on ne rapproche pas
 * d'un coup d'œil. La maquette garde les pastilles et retire « Conseillée »
 * devant : sur une carte du programme, des jours en ambre ne se lisent pas
 * autrement. Un lecteur d'écran entend la phrase entière.
 *
 * Seuls les jours conseillés apparaissent, lundi d'abord ; aucun, aucune
 * rangée — l'absence de conseil ne s'annonce pas.
 */
export const SuggestedDays = ({ days }: { days?: number[] }) => {
  const valid = [...new Set(days ?? [])]
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    .sort((a, b) => a - b);
  if (valid.length === 0) return null;

  return (
    // Une séance peut porter les sept jours : les pastilles se replient
    // plutôt que de pousser la carte de côté.
    <HStack
      gap="6px"
      wrap="wrap"
      role="group"
      aria-label={`Conseillée ${formatSuggestedDays(valid)}`}
      data-suggested-days
    >
      <HStack gap="6px" wrap="wrap" aria-hidden>
        {valid.map((day) => (
          <Chip key={day} tone="amber">
            {WEEKDAY_SHORT[day]}
          </Chip>
        ))}
      </HStack>
    </HStack>
  );
};
