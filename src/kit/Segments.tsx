import { Box, HStack } from '@chakra-ui/react';

/**
 * Les blocs d'une séance, un segment chacun : sarcelle quand le bloc est
 * fait, ambre pour la part faite de celui qu'on a quitté.
 *
 * Muets pour un lecteur d'écran : là où ils s'affichent, des mots disent la
 * même chose — « Bloc 2 sur 2 », « Série 3 sur 4 ». `data-part` porte la part
 * de chaque segment, en pour cent, pour le banc.
 */
export const Segments = ({ parts }: { parts: number[] }) => (
  <HStack gap="5px" aria-hidden data-block-bar>
    {parts.map((part, index) => (
      <Box
        key={index}
        flex={1}
        h="6px"
        borderRadius="3px"
        bg={part >= 1 ? 'session.rest' : 'bg.surface'}
        position="relative"
        overflow="hidden"
        data-part={Math.round(part * 100)}
      >
        {part > 0 && part < 1 && (
          <Box
            position="absolute"
            insetY={0}
            left={0}
            w={`${part * 100}%`}
            bg="app.primary"
            borderRadius="3px"
          />
        )}
      </Box>
    ))}
  </HStack>
);
