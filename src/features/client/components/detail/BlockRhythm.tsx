import { Box, HStack } from '@chakra-ui/react';
import type { SessionBlock } from '@/shared/types';
import { BLOCK_ACCENT_COLOR, getBlockAccent } from '@/domain/session/blocks';
import { blockDrawing } from '@/domain/session/drawing';

/**
 * Le dessin d'un bloc, peint : ce qu'il montre se décide dans
 * `blockDrawing`, ici seulement les couleurs et les proportions.
 *
 * Le dessin est muet : la carte dit la même chose en mots.
 */
export const BlockRhythm = ({
  block,
  height = 18,
}: {
  block: SessionBlock;
  height?: number;
}) => {
  const { bars, alternates } = blockDrawing(block);
  // Quand le dessin alterne, le trait haut est l'effort et le trait bas le
  // repos : l'accent du format — sarcelle pour un Tabata — peignait les deux
  // de la même couleur, et l'alternance ne se voyait plus.
  const color = alternates
    ? BLOCK_ACCENT_COLOR.work
    : BLOCK_ACCENT_COLOR[getBlockAccent(block.type)];

  return (
    <HStack
      gap="3px"
      h={`${height}px`}
      align="flex-end"
      aria-hidden
      data-rhythm
    >
      {bars.map((bar, i) => (
        <HStack key={i} gap="3px" flex={1} h="full" align="flex-end">
          <Box
            flex={2}
            h={`${bar * 100}%`}
            borderRadius="3px"
            bg={color}
            data-bar="work"
          />
          {alternates && (
            <Box
              flex={1}
              h="55%"
              borderRadius="3px"
              bg="session.rest"
              opacity={0.8}
              data-bar="rest"
            />
          )}
        </HStack>
      ))}
    </HStack>
  );
};
