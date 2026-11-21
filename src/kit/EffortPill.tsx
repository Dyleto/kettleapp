import { Box } from '@chakra-ui/react';
import { EFFORT_ZONE_COLOR, getEffortLevel } from '@/domain/history/effort';

/**
 * Le ressenti d'une séance en pastille, à la couleur de sa zone : « Trop
 * dure » en corail, « Juste » en vert, « Facile » en bleu.
 *
 * Elle vivait dans la liste du journal du coach. La liste de Progrès la
 * reçoit (F3a) : le client et son coach lisent le même ressenti de la même
 * couleur. Rien pour une séance sans ressenti — un ancien bilan ou un
 * client qui ne s'est pas prononcé : ce que l'écran en dit à la place lui
 * revient.
 */
export const EffortPill = ({ effort }: { effort?: number }) => {
  const level = getEffortLevel(effort);
  if (!level) return null;
  return (
    <Box
      as="span"
      flexShrink={0}
      px="11px"
      py="5px"
      borderRadius="full"
      bg="bg.raised"
      color={EFFORT_ZONE_COLOR[level.zone]}
      fontSize="13px"
      fontWeight="700"
      whiteSpace="nowrap"
      data-effort={level.zone}
    >
      {level.label}
    </Box>
  );
};
