import ClickableCard from "@/components/ClickableCard";
import { toaster } from "@/components/ui/toaster";
import api from "@/config/api";
import { useExerciseStats } from "@/hooks/queries/useExerciseStats";
import { useThemeColors } from "@/hooks/useThemeColors";
import { getErrorMessage } from "@/utils/errorMessages";
import {
  Box,
  Heading,
  HStack,
  Skeleton,
  SkeletonCircle,
  VStack,
} from "@chakra-ui/react";
import { use, useEffect } from "react";
import { LuDumbbell, LuFlame, LuArrowRight, LuLibrary } from "react-icons/lu";
import { useNavigate } from "react-router-dom";

export const ExercisesBlock = () => {
  const navigate = useNavigate();
  const colors = useThemeColors();

  const {
    data: { warmupCount = 0, exerciseCount = 0 } = {},
    isLoading,
    error,
  } = useExerciseStats();

  useEffect(() => {
    if (error) {
      toaster.create({
        title: "Impossible de charger le nombre d'exercices",
        description: getErrorMessage(error, "Chargement du nombre d'exercices"),
        type: "error",
      });
    }
  }, [error]);

  if (isLoading) {
    return (
      <ClickableCard onClick={() => {}} color={colors.primary} minW="50%">
        <VStack gap={4} align="stretch">
          <HStack justify="space-between" align="start" gap={8}>
            <VStack align="start" gap={2} flex={1}>
              <Skeleton height="32px" width="70%" />
              <Skeleton height="20px" width="50%" />
            </VStack>
            <SkeletonCircle size="8" />
          </HStack>

          <HStack gap={6} mt={2}>
            <HStack gap={2}>
              <SkeletonCircle size="10" />
              <VStack gap={1} align="start">
                <Skeleton height="24px" width="40px" />
                <Skeleton height="16px" width="80px" />
              </VStack>
            </HStack>

            <HStack gap={2}>
              <SkeletonCircle size="10" />
              <VStack gap={1} align="start">
                <Skeleton height="24px" width="40px" />
                <Skeleton height="16px" width="80px" />
              </VStack>
            </HStack>
          </HStack>
        </VStack>
      </ClickableCard>
    );
  }

  return (
    <ClickableCard
      onClick={() => navigate("/coach/exercises")}
      color={colors.primary}
      minW="50%"
    >
      <VStack gap={4} align="stretch">
        {/* En-tête */}
        <HStack justify="space-between" align="start" gap={8}>
          <VStack align="start" gap={2}>
            <Box fontSize="2xl" fontWeight="bold" color="fg">
              <HStack gap={4}>
                <LuLibrary size={28} color={colors.primaryHex} />
                <Heading size="xl">Mes exercices</Heading>
              </HStack>
            </Box>
            <Box fontSize="md" color="gray.400">
              Gérez mes échauffements et exercices
            </Box>
          </VStack>

          {/* Icône flèche visible à droite */}
          <Box color={colors.primary} fontSize="2xl" flexShrink={0}>
            <LuArrowRight />
          </Box>
        </HStack>

        {/* Statistiques */}
        <HStack gap={6} mt={2}>
          <HStack gap={2}>
            <Box
              p={2}
              bg={colors.secondaryBg}
              borderRadius="md"
              borderWidth="1px"
              borderColor={colors.secondaryBorder}
            >
              <LuFlame size={20} color={colors.secondaryHex} />
            </Box>
            <VStack gap={0} align="start">
              <Box fontSize="xl" fontWeight="bold" color="white">
                {warmupCount}
              </Box>
              <Box fontSize="xs" color="gray.400">
                échauffements
              </Box>
            </VStack>
          </HStack>

          <HStack gap={2}>
            <Box
              p={2}
              bg={colors.primaryBg}
              borderRadius="md"
              borderWidth="1px"
              borderColor={colors.primaryBorder}
            >
              <LuDumbbell size={20} color={colors.primaryHex} />
            </Box>
            <VStack gap={0} align="start">
              <Box fontSize="xl" fontWeight="bold" color="white">
                {exerciseCount}
              </Box>
              <Box fontSize="xs" color="gray.400">
                exercices
              </Box>
            </VStack>
          </HStack>
        </HStack>
      </VStack>
    </ClickableCard>
  );
};
