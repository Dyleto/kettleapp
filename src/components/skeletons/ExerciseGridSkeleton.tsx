import { Grid } from "@chakra-ui/react";
import { ExerciseCardSkeleton } from "./ExerciseCardSkeleton";
import { GRID_LAYOUTS } from "@/constants/layouts";

interface ExerciseGridSkeletonProps {
  count?: number;
}

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
