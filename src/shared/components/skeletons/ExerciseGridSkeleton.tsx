import { Grid } from '@chakra-ui/react';
import { ExerciseCardSkeleton } from './ExerciseCardSkeleton';
import { GRID_LAYOUTS } from '@/shared/config/layouts';

interface ExerciseGridSkeletonProps {
  count?: number;
}

/**
 * Une grille d'ombres, au même gabarit que la grille réelle.
 */
export const ExerciseGridSkeleton = ({
  count = 4,
}: ExerciseGridSkeletonProps) => {
  return (
    <Grid templateColumns={GRID_LAYOUTS.fourColumns} gap={4}>
      {[...Array(count)].map((_, index) => (
        <ExerciseCardSkeleton key={index} />
      ))}
    </Grid>
  );
};
