import { ReactNode } from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';

interface EtatVideProps {
  /** Ce qui manque, en une ligne. Pas « Aucun résultat » : ce qui manque. */
  titre: string;
  /** Pourquoi c'est vide, et ce qui va arriver. Facultatif si le titre suffit. */
  phrase?: string;
  /** Une action, quand il y en a une à proposer. */
  action?: ReactNode;
}

/**
 * Un écran vide, écrit d'une seule façon.
 *
 * Le même état — « ton coach n'a pas encore écrit de programme » — se disait
 * de trois manières selon l'écran, dont une sèche : « Aucune séance dans le
 * programme. » Trois formulations donnent l'impression de trois situations
 * différentes, et la version sèche donne l'impression d'une erreur.
 *
 * Le ton chaleureux est le bon : un programme vide n'est pas une panne, c'est
 * un moment normal de la relation avec son coach. C'est la version sèche qui
 * devait disparaître.
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
