import { Box } from '@chakra-ui/react';
import { chipTime } from '@/features/client/guided/amrap';

/**
 * Le temps qui reste avant la limite d'un bloc, en haut de la scène.
 *
 * Le chipper borné l'a pris à l'échelle, qui le dessinait pour elle seule :
 * ambre tant que le temps passe, corail aux trois dernières secondes, pâle
 * tant que le bloc n'est pas lancé. Un `timer` nommé : un lecteur d'écran
 * dit « Temps restant — 14:20 », pas une suite de chiffres.
 */
export const LimitChip = ({
  seconds,
  live,
}: {
  seconds: number;
  /** Le chrono tourne, ou il s'est arrêté sur un résultat. */
  live: boolean;
}) => {
  const hot = live && seconds <= 3;
  return (
    <Box
      role="timer"
      aria-label={`Temps restant — ${chipTime(seconds)}`}
      px="15px"
      py="9px"
      borderRadius="full"
      bg={hot ? 'session.work/20' : 'app.primary.bg'}
      color={hot ? 'session.work.fg' : 'app.primary.fg'}
      fontFamily="heading"
      fontSize="20px"
      fontWeight="800"
      lineHeight="1"
      fontVariantNumeric="tabular-nums"
      opacity={live ? 1 : 0.6}
      flexShrink={0}
      data-limit-chip
    >
      {chipTime(seconds)}
    </Box>
  );
};
