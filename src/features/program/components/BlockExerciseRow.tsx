import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { ReactNode, useState } from 'react';
import { LuChevronDown, LuVideo } from 'react-icons/lu';
import { BlockExercise, BlockType, SessionBlock } from '@/types';
import {
  blockIndexPrefix,
  blockSupportsSets,
} from '@/features/program/constants';
import { formatExerciseMetric } from '@/utils/formatters';
import VideoPlayer from '@/components/VideoPlayer';
import { hitArea } from '@/components/hitArea';

interface BlockExerciseRowProps {
  exercise: BlockExercise;
  blockType: BlockType;
  /** Le bloc porteur : Tabata et On-Off y définissent l'effort, pas l'exercice. */
  block?: Pick<SessionBlock, 'workDuration'>;
  index: number;
  /** Glissé sous la ligne : le réalisé, ou le rappel de la dernière fois. */
  extra?: ReactNode;
}

/**
 * Une ligne d'exercice en lecture — la jumelle exacte de celle de l'atelier.
 *
 * Même colonne de gauche pour le nom, même colonne de droite en chiffres
 * tabulaires pour la prescription, même filet de séparation. La seule chose
 * qu'elle a en plus : la consigne et la vidéo de l'exercice se déplient au
 * clic, ce qui n'a de sens que quand on exécute la séance.
 */
export const BlockExerciseRow = ({
  exercise,
  blockType,
  block,
  index,
  extra,
}: BlockExerciseRowProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const metric = formatExerciseMetric(exercise, blockType, block);
  const rest =
    blockSupportsSets(blockType) &&
    (exercise.sets ?? 1) > 1 &&
    exercise.restBetweenSets
      ? `${exercise.restBetweenSets}s repos`
      : null;

  const ex = exercise.exercise;
  const hasDescription = !!ex.description?.trim();
  const hasVideo = !!ex.videoUrl?.trim();
  const hasDetail = hasDescription || hasVideo;

  // Toute ligne se déplie, même vide.
  //
  // Ne rendre cliquables que les exercices documentés créait un silence
  // ambigu : on tape sur un nom, rien ne bouge, et rien ne dit si on a mal
  // visé, si l'écran est cassé, ou s'il n'y a simplement rien à lire. Le
  // dépliage répond dans les trois cas.

  return (
    <Box borderTopWidth="1px" borderColor="whiteAlpha.100">
      <HStack
        as="button"
        w="full"
        textAlign="left"
        aria-expanded={isOpen}
        aria-label={`${ex.name} — voir la consigne`}
        onClick={() => setIsOpen((v) => !v)}
        py={1.5}
        minH="44px"
        gap={3}
        rowGap={1}
        flexWrap="wrap"
        align="center"
        css={hitArea(44)}
        _hover={{ color: 'fg' }}
        transition="color 0.12s"
      >
        <HStack gap={1} flex="1 1 auto" minW={0}>
          {blockIndexPrefix(blockType) && (
            <Text fontSize="sm" color="fg.muted" flexShrink={0}>
              {index + 1} ·
            </Text>
          )}
          <Text fontSize="sm" color="fg.muted" lineClamp={2}>
            {ex.name}
          </Text>
          {hasVideo && (
            <Box color="fg.muted" flexShrink={0} opacity={0.7}>
              <LuVideo size={11} />
            </Box>
          )}
        </HStack>

        {/* La prescription, alignée à droite en chiffres tabulaires : c'est ce
            qu'on parcourt verticalement quand on relit une séance. */}
        {(metric || rest) && (
          <VStack gap={0} align="end" flexShrink={0} ml="auto">
            {metric && (
              <Text
                fontSize="sm"
                color="fg"
                fontWeight="semibold"
                fontFamily="mono"
              >
                {metric}
              </Text>
            )}
            {rest && (
              <Text fontSize="xs" color="fg.muted">
                {rest}
              </Text>
            )}
          </VStack>
        )}

        <Box
          color="fg.muted"
          flexShrink={0}
          opacity={hasDetail ? 1 : 0.45}
          transition="transform 0.2s"
          transform={isOpen ? 'rotate(180deg)' : 'none'}
        >
          <LuChevronDown size={13} />
        </Box>
      </HStack>

      {extra && <Box pb={1.5}>{extra}</Box>}

      {isOpen && (
        <VStack align="stretch" gap={3} pb={3}>
          {hasDescription && (
            <Text
              fontSize="xs"
              color="fg.muted"
              lineHeight="tall"
              whiteSpace="pre-wrap"
            >
              {ex.description}
            </Text>
          )}
          {hasVideo && <VideoPlayer url={ex.videoUrl!} />}
          {!hasDetail && (
            <Text fontSize="xs" color="fg.muted" fontStyle="italic">
              Ton coach n'a pas laissé de consigne pour cet exercice.
            </Text>
          )}
        </VStack>
      )}
    </Box>
  );
};
