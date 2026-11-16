import { Fragment } from 'react';
import { Box, Grid, HStack, Text, VStack } from '@chakra-ui/react';
import { LuInfo } from 'react-icons/lu';
import type { BlockExercise } from '@/shared/types';
import { formatCountdown } from '@/shared/utils/duration';
import type { LastPerformance } from '@/domain/history/lastPerformance';
import { formatWeight, heaviest } from '@/domain/history/load';

/** La dose d'une ligne, sans unité quand ce sont des répétitions : « 15 ». */
const lineDose = (exercise: BlockExercise): string => {
  if (exercise.reps) return String(exercise.reps);
  if (exercise.duration) return formatCountdown(exercise.duration);
  if (exercise.customMetric)
    return `${exercise.customMetric.value}\u00A0${exercise.customMetric.unit}`;
  return '';
};

/**
 * Ce qu'il y a à faire dans un tour : la dose en ambre devant le nom.
 *
 * La charge du dernier bilan se lit dessous, pour mémoire — on ne saisit
 * rien pendant un bloc chronométré, les mains sont prises. Avant le départ
 * elle dit d'où elle vient, « la dernière fois 20 kg » ; ensuite le chiffre
 * suffit.
 */
export const ExerciseLines = ({
  exercises,
  lastPerformance,
  running,
  onOpenDetail,
}: {
  exercises: BlockExercise[];
  lastPerformance?: Map<string, LastPerformance>;
  running: boolean;
  onOpenDetail: (exercise: BlockExercise) => void;
}) => {
  const lines = exercises.map((exercise) => ({
    exercise,
    dose: lineDose(exercise),
  }));
  // Une colonne de doses dès qu'une ligne en porte une : les noms
  // s'alignent sur la plus large — « 1:00 » d'un rameur à côté de « 10 »
  // décalait sinon les noms d'une ligne à l'autre.
  const withDoses = lines.some((line) => line.dose);
  return (
    <Grid
      templateColumns={withDoses ? 'auto 1fr' : '1fr'}
      columnGap={2.5}
      rowGap={3.5}
      alignItems="baseline"
      bg="bg.surface"
      borderRadius="xl"
      px={4}
      py={3.5}
      textAlign="left"
    >
      {lines.map(({ exercise, dose }) => {
        const load = heaviest(
          lastPerformance?.get(exercise.exercise._id)?.sets
        );
        const hasDetail =
          !!exercise.note?.trim() ||
          !!exercise.exercise.description?.trim() ||
          !!exercise.exercise.videoUrl?.trim();
        return (
          <Fragment key={`${exercise.order}-${exercise.exercise._id}`}>
            {withDoses && (
              <Text
                fontFamily="heading"
                fontSize="36px"
                fontWeight="800"
                fontStretch="76%"
                lineHeight="0.9"
                fontVariantNumeric="tabular-nums"
                color="app.primary.fg"
                minW="54px"
              >
                {dose}
              </Text>
            )}
            <VStack align="start" gap={1} minW={0}>
              {hasDetail ? (
                <Box
                  as="button"
                  textAlign="left"
                  minH="44px"
                  my="-12px"
                  aria-label={`Voir la consigne — ${exercise.exercise.name}`}
                  onClick={() => onOpenDetail(exercise)}
                >
                  <HStack gap={1.5}>
                    <Text fontSize="19px" fontWeight="bold">
                      {exercise.exercise.name}
                    </Text>
                    <Box color="app.primary" flexShrink={0}>
                      <LuInfo size={15} />
                    </Box>
                  </HStack>
                </Box>
              ) : (
                <Text fontSize="19px" fontWeight="bold">
                  {exercise.exercise.name}
                </Text>
              )}
              {load !== undefined && (
                <Text fontSize="sm" color="fg.muted">
                  {running
                    ? `${formatWeight(load)}\u00A0kg`
                    : `la dernière fois ${formatWeight(load)}\u00A0kg`}
                </Text>
              )}
            </VStack>
          </Fragment>
        );
      })}
    </Grid>
  );
};
