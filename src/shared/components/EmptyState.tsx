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
 * Un écran vide, écrit d'une seule façon.
 *
 * Le même état — « ton coach n'a pas encore écrit de programme » — se disait
 * de trois façons selon l'écran, dont une sèche : « Aucune séance dans le
 * programme. » Trois formulations laissent croire à trois situations
 * différentes, et la sèche laisse croire à une erreur.
 *
 * Le ton chaleureux est le bon : un programme vide n'est pas une panne, c'est
 * un moment normal de la relation avec un coach. C'est la version sèche qui
 * devait partir.
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
