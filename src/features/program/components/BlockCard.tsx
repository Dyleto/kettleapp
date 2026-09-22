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
 * A block in read mode — on the client side, and in the wrap-up the coach
 * reads back.
 *
 * It went through eleven components, one per type, all delegating to a shell
 * that also knew how to edit. Editing moved to the editor long ago: what
 * remained was a rounded card and a lot of dead code. Each type's settings
 * already summarise in one sentence — that is all reading needs, and so one
 * more type no longer calls for one more component.
 */
export const BlockCard = ({ block, renderExerciseExtra }: BlockCardProps) => {
  const summary = getBlockConfigSummary(block);
  const nomLibre = getBlockFreeName(block);

  return (
    <BlockFrame
      block={block}
      name={
        /* The em dash separates: without it the type and the name ran
           together into mush — "AMRAP AMRAP 12". The rule lives in
           `getBlockFreeName`, not here: the coach's editor shows the name as
           typed, since that is where it gets changed. */
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
