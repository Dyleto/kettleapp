import { useState } from 'react';
import { HStack, VStack } from '@chakra-ui/react';
import { ActionButton, LANDSCAPE } from '@/kit';
import type { GuidedStep } from '@/features/client/guided/steps';
import { Footer } from './ListScene';
import { RestHero } from './RestHero';

/**
 * Le repos entre deux blocs, sur la même scène que le repos entre deux
 * séries.
 *
 * Il passait par l'ancien minuteur : une jauge horizontale en plein écran
 * sarcelle, « Ensuite : Kettlebell Swing » en petit dessous, et un
 * « Précédent » à côté de « Passer ». Deux repos, deux dessins, pour le
 * même geste : souffler en regardant ce qui vient. L'anneau, « Ensuite » et
 * « + 15 s » sont ceux de la série.
 */
export const BetweenBlocks = ({
  step,
  onDone,
}: {
  step: Extract<GuidedStep, { type: 'rest' }>;
  onDone: () => void;
}) => {
  // Les secondes ajoutées : ce repos n'appartient à aucune série, il garde
  // donc son rallongement pour lui.
  const [bonus, setBonus] = useState(0);
  return (
    <>
      <VStack
        flex={1}
        minH={0}
        overflowY="auto"
        align="stretch"
        justify="center"
        px={5}
        pt={4}
        pb={2}
      >
        <RestHero
          duration={step.duration}
          bonus={bonus}
          nextTitle={step.nextExerciseName ?? ''}
          nextDetail=""
          onDone={onDone}
        />
      </VStack>
      <Footer>
        <HStack gap={2.5}>
          <ActionButton
            tone="ghost"
            size="xl"
            aria-label="Quinze secondes de repos de plus"
            onClick={() => setBonus((more) => more + 15)}
            css={{ [LANDSCAPE]: { minHeight: '52px' } }}
          >
            + 15 s
          </ActionButton>
          <ActionButton
            tone="soft"
            size="xl"
            flex={1}
            onClick={onDone}
            css={{ [LANDSCAPE]: { minHeight: '52px' } }}
          >
            Passer
          </ActionButton>
        </HStack>
      </Footer>
    </>
  );
};
