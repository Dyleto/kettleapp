import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { LuVideo } from 'react-icons/lu';
import { Exercise } from '@/types';

interface ExerciseRowProps {
  exercise: Exercise;
  onClick?: () => void;
  selected?: boolean;
  /** Controls revealed on hover, at the right of the row. */
  extra?: ReactNode;
  /** Replaces the description: "déjà 3 fois dans ce programme", etc. */
  subtitle?: string;
}

/**
 * An exercise row: text on a rule, nothing more.
 *
 * The library used to show a rounded card per exercise, with an identical
 * dumbbell on every row and a chevron that said nothing. Ten exercises
 * filled the screen for ten words. The same law as the workshop applies
 * here: typography and a rule, and the ornament only shows when it carries
 * information — a video, a counter.
 */
export const ExerciseRow = ({
  exercise,
  onClick,
  selected,
  extra,
  subtitle,
}: ExerciseRowProps) => {
  const secondary = subtitle ?? exercise.description;
  const usage = exercise.usageCount ?? 0;

  // The two marks on the right are mute to a screen reader: "7" on its own
  // means nothing. We describe them in the row's name and remove them from
  // the accessibility tree.
  const label = [
    exercise.name,
    usage > 0
      ? `utilisé dans ${usage} séance${usage > 1 ? 's' : ''}`
      : 'jamais utilisé',
    exercise.videoUrl && 'vidéo',
  ]
    .filter(Boolean)
    .join(' — ');

  return (
    <HStack
      className="group"
      as={onClick ? 'button' : undefined}
      aria-label={onClick ? label : undefined}
      w="full"
      minH="44px"
      textAlign="left"
      gap={3}
      px={2}
      py={2}
      align="center"
      borderTopWidth="1px"
      borderColor="whiteAlpha.100"
      bg={selected ? 'app.primary/12' : 'transparent'}
      _hover={
        onClick
          ? { bg: selected ? 'app.primary/12' : 'whiteAlpha.50' }
          : undefined
      }
      _focusVisible={{
        outlineOffset: '-2px',
      }}
      transition="background-color 0.12s"
      onClick={onClick}
    >
      <VStack gap={0} align="stretch" flex={1} minW={0}>
        <Text
          fontSize="sm"
          fontWeight={selected ? 'semibold' : 'normal'}
          color={selected ? 'app.primary' : 'fg'}
          lineClamp={1}
        >
          {exercise.name}
        </Text>
        {secondary && (
          <Text fontSize="xs" color="fg.muted" lineClamp={1}>
            {secondary}
          </Text>
        )}
      </VStack>

      {/* The count carries a suffix: "12" next to a video icon read as
          twelve videos.

          And absence is spelled out. Two exercises with no number among
          eight that carry one asked a question with no answer — zero, or
          missing data? It is in fact the most useful information in the
          list: those are the exercises you can delete. */}
      <HStack gap={2.5} flexShrink={0} color="fg.muted" aria-hidden>
        {exercise.videoUrl && <LuVideo size={12} />}
        <Text as="span" fontSize="xs" whiteSpace="nowrap">
          {usage > 0 ? (
            <>
              <Text as="span" fontFamily="mono">
                {usage}
              </Text>{' '}
              séance{usage > 1 ? 's' : ''}
            </>
          ) : (
            'jamais utilisé'
          )}
        </Text>
      </HStack>

      {extra && (
        <Box flexShrink={0} onClick={(e) => e.stopPropagation()}>
          {extra}
        </Box>
      )}
    </HStack>
  );
};
