import { Skeleton, SkeletonCircle, VStack } from "@chakra-ui/react";
import { Card } from "@/components/Card";

export const ExerciseCardSkeleton = () => {
  return (
    <Card p={6} hoverEffect="none" withGlow={false}>
      <VStack gap={3} align="stretch">
        <SkeletonCircle size="16" alignSelf="center" />
        <Skeleton height="24px" />
        <Skeleton height="16px" />
        <Skeleton height="16px" width="80%" />
      </VStack>
    </Card>
  );
};
