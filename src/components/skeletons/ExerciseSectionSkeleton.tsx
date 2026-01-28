import { Box, HStack, Skeleton, SkeletonCircle } from "@chakra-ui/react";
import { ExerciseGridSkeleton } from "./ExerciseGridSkeleton";

interface ExerciseSectionSkeletonProps {
  count?: number;
  titleWidth?: string;
}

export const ExerciseSectionSkeleton = ({
  count = 4,
  titleWidth = "250px",
}: ExerciseSectionSkeletonProps) => {
  return (
    <Box>
      <HStack gap={3} mb={4}>
        <SkeletonCircle size="6" />
        <Skeleton height="32px" width={titleWidth} />
      </HStack>
      <ExerciseGridSkeleton count={count} />
    </Box>
  );
};
