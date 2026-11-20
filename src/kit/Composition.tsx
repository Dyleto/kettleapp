import { Box, HStack } from '@chakra-ui/react';
import type { SessionBlock } from '@/shared/types';
import { BLOCK_ACCENT_COLOR, getBlockAccent } from '@/domain/session/blocks';

/**
 * Une rangée de segments, un par bloc, dans l'accent de son type : gris
 * pour l'échauffement, brique pour le travail, sarcelle pour la
 * récupération. On lit l'équilibre d'une séance en 150 px, sans l'ouvrir.
 *
 * Elle vivait dans le rail du coach. Le programme du client la reçoit
 * (F1) — « même code que dans l'atelier du coach », dit la maquette —, et
 * deux copies auraient fini par ne plus colorer pareil.
 *
 * Une séance sans bloc garde sa ligne, vide : les cartes voisines restent
 * alignées, et le vide se voit.
 */
export const Composition = ({
  blocks,
}: {
  blocks: readonly Pick<SessionBlock, '_id' | 'type'>[];
}) => {
  if (blocks.length === 0) {
    return <Box h="6px" borderRadius="3px" bg="line" data-composition />;
  }
  return (
    <HStack gap="3px" h="6px" aria-hidden data-composition>
      {blocks.map((block) => (
        <Box
          key={block._id}
          flex={1}
          h="full"
          borderRadius="3px"
          bg={BLOCK_ACCENT_COLOR[getBlockAccent(block.type)]}
          data-accent={getBlockAccent(block.type)}
        />
      ))}
    </HStack>
  );
};
