import { Box, Text } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { SessionBlock } from '@/shared/types';
import {
  getBlockConfigSummary,
  getBlockFreeName,
} from '@/features/program/constants';
import { BlockFrame } from './BlockFrame';
import { BlockExerciseRow } from './BlockExerciseRow';

interface BlockCardProps {
  block: SessionBlock;
  /**
   * Contenu inséré sous chaque exercice, en lecture seule.
   *
   * Permet au client de noter ce qu'il a réellement fait sans que le rendu
   * partagé avec le coach ne bouge d'un pixel quand la propriété est absente.
   *
   * Vivait dans un `BlockProps` de onze champs, dans `blocks/shared/` : le
   * reste décrivait l'édition, que ces composants ne font plus depuis
   * longtemps. C'était le dernier champ encore lu.
   */
  renderExerciseExtra?: (ctx: {
    blockOrder: number;
    exerciseOrder: number;
    exerciseId?: string;
  }) => ReactNode;
}

/**
 * Un bloc en lecture — côté client, et dans le bilan que le coach relit.
 *
 * Il passait par onze composants, un par type, tous délégant à une coquille
 * qui savait aussi éditer. L'édition est partie dans l'éditeur depuis
 * longtemps : il ne restait qu'une carte arrondie et beaucoup de code mort.
 * Les réglages de chaque type se résument déjà en une phrase — c'est tout ce
 * dont la lecture a besoin, et un type de plus ne réclame donc plus un
 * composant de plus.
 */
export const BlockCard = ({ block, renderExerciseExtra }: BlockCardProps) => {
  const summary = getBlockConfigSummary(block);
  const nomLibre = getBlockFreeName(block);

  return (
    <BlockFrame
      block={block}
      name={
        /* Le tiret cadratin sépare : sans lui, le type et le nom se
                   collaient en bouillie — « AMRAP AMRAP 12 ». La règle vit dans
                   `getBlockFreeName`, pas ici : l'éditeur du coach montre le nom tel
                   qu'il est tapé, puisque c'est là qu'on le change. */
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
