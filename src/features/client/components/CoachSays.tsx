import { Text } from '@chakra-ui/react';
import { useCoachVoice } from '../coach';

/**
 * « Julie te dit : » — la ligne qui ouvre une bulle du coach.
 *
 * Elle était écrite cinq fois, mot pour mot, là où un mot du coach
 * s'affiche : la carte de l'accueil, la fiche, l'ouverture de la séance, la
 * consigne d'un exercice, l'objectif d'un AMRAP. Le jour où « Ton coach » est
 * devenu un prénom, il aurait fallu le retrouver cinq fois.
 */
export const CoachSays = () => {
  const coach = useCoachVoice();
  return (
    <Text fontSize="xs" color="fg.muted" mb={1}>
      {coach.opening} te dit&nbsp;:
    </Text>
  );
};
