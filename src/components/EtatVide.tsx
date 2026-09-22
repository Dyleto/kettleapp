import { ReactNode } from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';

interface EtatVideProps {
  /** What is missing, in one line. Not "no results": what is missing. */
  titre: string;
  /** Why it is empty, and what will happen. Optional when the title suffices. */
  phrase?: string;
  /** An action, when there is one to offer. */
  action?: ReactNode;
}

/**
 * An empty screen, written one way.
 *
 * The same state — "your coach has not written a programme yet" — was said
 * three ways depending on the screen, one of them curt: "Aucune séance dans
 * le programme." Three wordings suggest three different situations, and the
 * curt one suggests an error.
 *
 * The warm tone is the right one: an empty programme is not a breakdown, it
 * is a normal moment in the relationship with a coach. It was the curt
 * version that had to go.
 */
export const EtatVide = ({ titre, phrase, action }: EtatVideProps) => (
  <Box
    p={8}
    textAlign="center"
    bg="whiteAlpha.50"
    borderRadius="xl"
    borderWidth="1px"
    borderColor="whiteAlpha.100"
  >
    <VStack gap={1.5}>
      <Text fontSize="lg" fontWeight="bold">
        {titre}
      </Text>
      {phrase && (
        <Text color="fg.muted" fontSize="sm" maxW="42ch" lineHeight="1.7">
          {phrase}
        </Text>
      )}
      {action && <Box pt={2}>{action}</Box>}
    </VStack>
  </Box>
);
