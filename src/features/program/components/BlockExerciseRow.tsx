import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { ReactNode, useState } from 'react';
import { LuChevronDown, LuVideo } from 'react-icons/lu';
import { formatDuration } from '@/utils/duration';
import { BlockExercise, BlockType, SessionBlock } from '@/types';
import {
  blockIndexPrefix,
  restBetweenSetsOf,
} from '@/features/program/constants';
import { formatExerciseMetric } from '@/utils/formatters';
import VideoPlayer from '@/components/VideoPlayer';
import { hitArea } from '@/components/hitArea';

interface BlockExerciseRowProps {
  exercise: BlockExercise;
  blockType: BlockType;
  /** The parent block: in Tabata and On-Off it defines the work, not the exercise. */
  block?: Pick<SessionBlock, 'workDuration' | 'repsScheme'>;
  index: number;
  /** Slotted under the row: what was performed, or last time's reminder. */
  extra?: ReactNode;
}

/**
 * An exercise row in read mode — the exact twin of the editor's.
 *
 * Same left column for the name, same right column in tabular figures for
 * the prescription, same separating rule. The one thing it has in addition:
 * the exercise's instruction and video unfold on click, which only makes
 * sense while doing the session.
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
  const restSeconds = restBetweenSetsOf({ type: blockType }, exercise);
  const rest = restSeconds ? `${formatDuration(restSeconds)} repos` : null;

  const ex = exercise.exercise;
  // Two levels of instruction, which must not be stacked without being told
  // apart. `exercise.note` is what the coach wrote for this placement, in
  // this session; `ex.description` describes the movement in general and
  // comes from the library, shared by all their clients.
  const consigne = exercise.note?.trim();
  const hasNote = !!consigne;
  const hasDescription = !!ex.description?.trim();
  const hasVideo = !!ex.videoUrl?.trim();
  const hasDetail = hasNote || hasDescription || hasVideo;

  // Every row unfolds, even an empty one.
  //
  // Making only documented exercises clickable created an ambiguous silence:
  // you tap a name, nothing moves, and nothing says whether you missed,
  // whether the screen is broken, or whether there is simply nothing to read.
  // Unfolding answers in all three cases.

  return (
    <Box borderTopWidth="1px" borderColor="whiteAlpha.100">
      <HStack
        as="button"
        data-exercise-row
        w="full"
        textAlign="left"
        aria-expanded={isOpen}
        aria-label={
          hasDetail
            ? `${ex.name} — voir la consigne`
            : `${ex.name} — aucune consigne`
        }
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
          {/* A pictogram the size of a character, in the text colour: a
              client who never noticed it does not know the app contains
              videos. One exercise in seven carries one — there is room to say
              so. */}
          {hasVideo && (
            <HStack gap={1} color="app.primary" flexShrink={0}>
              <LuVideo size={13} />
              <Text fontSize="2xs" fontWeight="bold" letterSpacing="wide">
                vidéo
              </Text>
            </HStack>
          )}
        </HStack>

        {/* The prescription and the chevron form a single flex element:
            separated, they wrapped independently and the chevron ended up
            alone on the line below. */}
        <HStack gap={3} flexShrink={0} ml="auto" align="center">
          {(metric || rest) && (
            <VStack gap={0} align="end" flexShrink={0}>
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

          {/* No chevron when there is nothing below: its absence becomes
              accurate information, instead of a disappointment on every
              opening. The row stays clickable all the same — tapping a name
              and getting no response does not say whether you missed, whether
              the screen is broken, or whether there is nothing to read;
              unfolding answers "your coach left no instruction". */}
          {hasDetail && (
            <Box
              color="fg.muted"
              flexShrink={0}
              transition="transform 0.2s"
              transform={isOpen ? 'rotate(180deg)' : 'none'}
            >
              <LuChevronDown size={13} />
            </Box>
          )}
        </HStack>
      </HStack>

      {extra && <Box pb={1.5}>{extra}</Box>}

      {isOpen && (
        <VStack align="stretch" gap={3} pb={3}>
          {/* What the coach wrote for you comes first, recognisable by the
              amber bar — the same as their session note. What comes from the
              library stays plain text, below. */}
          {hasNote && (
            <Box
              p={3}
              bg="whiteAlpha.50"
              borderRadius="md"
              borderLeft="2px solid"
              borderLeftColor="app.primary.border"
            >
              <Text
                fontSize="2xs"
                color="fg.muted"
                fontWeight="bold"
                letterSpacing="wide"
                textTransform="uppercase"
                mb={1}
              >
                Consigne du coach
              </Text>
              <Text
                fontSize="xs"
                color="fg"
                lineHeight="tall"
                whiteSpace="pre-wrap"
              >
                {consigne}
              </Text>
            </Box>
          )}
          {hasDescription && (
            <Box>
              {/* The heading only appears when there are two texts to tell
                  apart: on its own, the library's does not need us to say
                  where it comes from. */}
              {hasNote && (
                <Text
                  fontSize="2xs"
                  color="fg.muted"
                  fontWeight="bold"
                  letterSpacing="wide"
                  textTransform="uppercase"
                  mb={1}
                >
                  Le mouvement
                </Text>
              )}
              <Text
                fontSize="xs"
                color="fg.muted"
                lineHeight="tall"
                whiteSpace="pre-wrap"
              >
                {ex.description}
              </Text>
            </Box>
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
