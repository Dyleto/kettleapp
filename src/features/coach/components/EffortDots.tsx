import { Box, HStack } from '@chakra-ui/react';
import { EFFORT_ZONE_COLOR, type EffortZone } from '@/domain/history/effort';

const ZONE_WORD: Record<EffortZone, string> = {
  easy: 'facile',
  target: 'juste',
  hard: 'dure',
};

/**
 * Les cinq derniers ressentis d'une séance, en points : bleu facile, vert
 * juste, corail dur, vide quand rien n'a été dit.
 *
 * Un lecteur d'écran entend la même suite en mots — « juste, juste, dure,
 * dure » — et non cinq ronds sans nom.
 *
 * Un point vide n'est pas pris dans `line`, comme sur la maquette : sur la
 * ligne active du rail, posée sur `bg.raised`, il disparaissait — trois
 * points au lieu de cinq, et le rang du plus ancien devenait illisible.
 */
export const EffortDots = ({
  zones,
  size = 'sm',
}: {
  zones: readonly (EffortZone | null)[];
  size?: 'sm' | 'lg';
}) => {
  const said = zones.filter((z): z is EffortZone => z !== null);
  const dot = size === 'lg' ? '16px' : '10px';
  return (
    <HStack
      gap="4px"
      role="img"
      aria-label={
        said.length
          ? `Derniers ressentis : ${said.map((z) => ZONE_WORD[z]).join(', ')}`
          : 'Aucun ressenti'
      }
      data-pulse
    >
      {zones.map((zone, i) => (
        <Box
          key={i}
          w={dot}
          h={dot}
          borderRadius="full"
          bg={zone ? EFFORT_ZONE_COLOR[zone] : 'fg.muted'}
          opacity={zone ? 1 : 0.3}
          data-zone={zone ?? 'none'}
        />
      ))}
    </HStack>
  );
};
