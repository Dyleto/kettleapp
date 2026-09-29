import { Skeleton, SkeletonCircle, VStack } from '@chakra-ui/react';
import { Card } from '@/shared/components/Card';

/**
 * L'ombre d'une carte d'exercice pendant le chargement.
 *
 * Elle reprend la forme de la vraie carte — pastille, titre, deux lignes —
 * pour que la grille ne se réorganise pas quand les données arrivent : un
 * doigt déjà posé sur une carte ne doit pas se retrouver sur une autre.
 */
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
