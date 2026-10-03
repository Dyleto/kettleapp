import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { useMemo } from 'react';
import { CompletedSession } from '@/shared/types';
import {
  buildExerciseProgressions,
  isRising,
  METRIC_UNIT,
} from '../exerciseProgression';

interface ExerciseProgressionsProps {
  history: CompletedSession[];
  /** Au-delà, la liste devient un tableau que personne ne lit. */
  limit?: number;
}

/**
 * « Goblet Squat : 20 → 24 → 26 kg », pour les mouvements récemment
 * travaillés.
 *
 * Calculé depuis l'historique déjà chargé : aucune requête. Le client voyait
 * ses séances une à une et devait se souvenir pour savoir s'il progressait.
 */
export const ExerciseProgressions = ({
  history,
  limit = 6,
}: ExerciseProgressionsProps) => {
  const progressions = useMemo(
    () => buildExerciseProgressions(history),
    [history]
  );

  if (progressions.length === 0) return null;
  const shown = progressions.slice(0, limit);

  return (
    <VStack align="stretch" gap={2}>
      <Text
        fontSize="xs"
        fontWeight="bold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="wider"
      >
        Progression
      </Text>

      <VStack align="stretch" gap={2}>
        {shown.map((progression) => {
          const rising = isRising(progression);
          const unit = METRIC_UNIT[progression.metric];

          return (
            <Box key={progression.exerciseId}>
              <Text fontSize="xs" color="fg.muted" lineClamp={1}>
                {progression.name}
              </Text>
              <HStack gap={1.5} align="baseline" flexWrap="wrap">
                {progression.points.map((point, index) => (
                  <HStack
                    key={`${point.completedAt.getTime()}-${index}`}
                    gap={1.5}
                    align="baseline"
                  >
                    {index > 0 && (
                      <Text fontSize="xs" color="fg.muted" aria-hidden>
                        →
                      </Text>
                    )}
                    <Text
                      fontSize="sm"
                      fontFamily="mono"
                      color={
                        index === progression.points.length - 1
                          ? rising
                            ? 'app.success'
                            : 'fg'
                          : 'fg.muted'
                      }
                      fontWeight={
                        index === progression.points.length - 1
                          ? 'bold'
                          : 'normal'
                      }
                    >
                      {point.value}
                    </Text>
                  </HStack>
                ))}
                <Text fontSize="xs" color="fg.muted">
                  {unit}
                </Text>
              </HStack>
            </Box>
          );
        })}
      </VStack>
    </VStack>
  );
};
