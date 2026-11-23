import { useEffect, useState } from 'react';
import { Text } from '@chakra-ui/react';

/** Au bout de combien de temps un chargement mérite un mot : la maquette des
 * états du système. */
export const SLOW_AFTER = 10_000;

/**
 * « C'est plus long que d'habitude », quand un chargement dure.
 *
 * Les formes fantômes disent que quelque chose arrive ; au-delà de dix
 * secondes, elles finissent par ressembler à un écran figé, et l'on
 * recharge — ce qui recommence tout. La phrase dit que l'application le
 * sait, et qu'elle attend encore.
 *
 * Rien avant dix secondes : un mot qui clignote à chaque chargement
 * ordinaire serait du bruit. Le compte part au montage, donc avec le
 * chargement lui-même ; démonté quand le contenu arrive, il disparaît avec.
 */
export const SlowNotice = () => {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER);
    return () => clearTimeout(timer);
  }, []);
  if (!slow) return null;
  return (
    <Text
      role="status"
      fontSize="sm"
      color="fg.muted"
      textAlign="center"
      pt="4px"
      data-slow
    >
      C’est plus long que d’habitude.
    </Text>
  );
};
