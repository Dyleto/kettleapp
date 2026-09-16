import { Box, Text } from '@chakra-ui/react';
import { SessionBlock } from '@/types';
import {
  getBlockConfigSummary,
  getBlockFreeName,
} from '@/features/program/constants';
import { BlockFrame } from './BlockFrame';
import { BlockExerciseRow } from './BlockExerciseRow';
import { BlockProps } from './blocks/shared/types';

interface BlockCardProps {
  block: SessionBlock;
  renderExerciseExtra?: BlockProps['renderExerciseExtra'];
}

/**
 * Un bloc en lecture — côté client, et dans le bilan que relit le coach.
 *
 * Il passait par onze composants, un par type, tous délégant à une coquille
 * qui savait aussi éditer. L'édition est passée à l'atelier depuis longtemps :
 * il ne restait qu'une carte arrondie et beaucoup de code mort. Les réglages
 * de chaque type se résument déjà en une phrase — c'est tout ce dont la
 * lecture a besoin, et un type de plus ne demande donc plus de composant.
 */
export const BlockCard = ({ block, renderExerciseExtra }: BlockCardProps) => {
  const summary = getBlockConfigSummary(block);
  const nomLibre = getBlockFreeName(block);

  return (
    <BlockFrame
      block={block}
      name={
        /* Le tiret cadratin sépare : sans lui, le type et le nom se
           collaient en une bouillie — « AMRAP AMRAP 12 ». La règle vit dans
           `getBlockFreeName`, pas ici : l'atelier du coach, lui, montre le
           nom tel qu'il l'a tapé, puisque c'est là qu'il le modifie. */
        nomLibre ? (
          <Text fontSize="xs" color="fg.muted">
            — {nomLibre}
          </Text>
        ) : undefined
      }
      config={
        summary ? (
          <Text fontSize="sm" fontFamily="mono" color="fg">
            {summary}
          </Text>
        ) : undefined
      }
      notes={
        block.notes ? (
          <Text fontSize="xs" color="fg.muted" whiteSpace="pre-wrap">
            {block.notes}
          </Text>
        ) : undefined
      }
    >
      {block.exercises.length > 0 ? (
        block.exercises.map((ex, i) => (
          <BlockExerciseRow
            key={i}
            exercise={ex}
            blockType={block.type}
            block={block}
            index={i}
            extra={renderExerciseExtra?.({
              blockOrder: block.order,
              exerciseOrder: ex.order,
              exerciseId: ex.exercise?._id,
            })}
          />
        ))
      ) : (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            Aucun exercice
          </Text>
        </Box>
      )}
    </BlockFrame>
  );
};
