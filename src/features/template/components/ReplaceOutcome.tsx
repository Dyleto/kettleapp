import { Box, chakra, HStack, Text, VStack } from '@chakra-ui/react';
import { LuCheck, LuX } from 'react-icons/lu';

/**
 * Ce qu'un import emporte, ce qu'il apporte et ce qui reste : la boîte de
 * « Remplacer le programme de Sarah ? ».
 *
 * Partagée par l'atelier du client et par l'écran des modèles : la même
 * question, posée depuis deux portes, reçoit les mêmes trois réponses. C'est
 * la seule que l'atelier pose avant d'agir — partout ailleurs une bannière
 * « Annuler » rattrape le geste —, et elle ne dit pas « Es-tu sûr ? » : elle
 * compte. Ce qui reste est écrit aussi, parce que c'est ce qu'un coach
 * craint de perdre : l'historique et les charges ne vivent pas dans le
 * programme.
 */
export const ReplaceOutcome = ({
  currentCount,
  incomingCount,
  bg = 'bg.surface',
}: {
  /** Les séances que le programme porte aujourd'hui. */
  currentCount: number;
  /** Celles du modèle, qui prennent leur place. */
  incomingCount: number;
  /** Le fond de la boîte, un ton au-dessus de ce qui la porte : la boîte de
   * dialogue de l'atelier est sur le fond de l'application, la feuille des
   * modèles sur une surface. */
  bg?: string;
}) => (
  <VStack
    align="stretch"
    gap="10px"
    bg={bg}
    borderRadius="16px"
    p="16px"
    data-import-outcome
  >
    <HStack gap="10px" align="start">
      <Box color="session.work" pt="2px" aria-hidden>
        <LuX size={18} />
      </Box>
      <Text>
        {currentCount > 1 ? 'Ses ' : 'Sa '}
        <chakra.b>
          {currentCount > 1
            ? `${currentCount} séances actuelles`
            : 'séance actuelle'}
        </chakra.b>{' '}
        {currentCount > 1
          ? 'seront retirées du programme.'
          : 'sera retirée du programme.'}
      </Text>
    </HStack>
    <HStack gap="10px" align="start">
      <Box color="session.rest" pt="2px" aria-hidden>
        <LuCheck size={18} />
      </Box>
      <Text>
        {incomingCount > 1 ? 'Les ' : 'La '}
        <chakra.b>
          {incomingCount > 1
            ? `${incomingCount} séances du modèle`
            : 'séance du modèle'}
        </chakra.b>{' '}
        {currentCount > 1
          ? incomingCount > 1
            ? 'les remplacent.'
            : 'les remplace.'
          : incomingCount > 1
            ? 'la remplacent.'
            : 'la remplace.'}
      </Text>
    </HStack>
    <HStack gap="10px" align="start">
      <Box color="session.rest" pt="2px" aria-hidden>
        <LuCheck size={18} />
      </Box>
      <Text>
        Son <chakra.b>historique</chakra.b> et ses charges restent.
      </Text>
    </HStack>
  </VStack>
);
