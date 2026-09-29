import { ReactNode } from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';

interface EmptyStateProps {
  /** Ce qui manque, en une ligne. Pas « aucun résultat » : ce qui manque. */
  title: string;
  /** Pourquoi c'est vide, et ce qui va se passer. Facultatif si le titre suffit. */
  line?: string;
  /** Une action, quand il y en a une à proposer. */
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
export const EmptyState = ({ title, line, action }: EmptyStateProps) => (
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
        {title}
      </Text>
      {line && (
        <Text color="fg.muted" fontSize="sm" maxW="42ch" lineHeight="1.7">
          {line}
        </Text>
      )}
      {action && <Box pt={2}>{action}</Box>}
    </VStack>
  </Box>
);
