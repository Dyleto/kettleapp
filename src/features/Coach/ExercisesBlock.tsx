import ClickableCard from "@/components/ClickableCard";
import { toaster } from "@/components/ui/toaster";
import api from "@/config/api";
import { useExerciseStats } from "@/hooks/queries/useExerciseStats";
import { getErrorMessage } from "@/utils/errorMessages";
import {
  Box,
  Heading,
  HStack,
  Skeleton,
  SkeletonCircle,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuDumbbell, LuFlame, LuArrowRight, LuLibrary } from "react-icons/lu";
import { useNavigate } from "react-router-dom";

const ExercisesBlock = () => {
  const navigate = useNavigate();

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
      <ClickableCard onClick={() => {}} color="yellow.400" minW="50%">
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
      color="yellow.400"
      minW="50%"
    >
      <VStack gap={4} align="stretch">
        {/* En-tête */}
        <HStack justify="space-between" align="start" gap={8}>
          <VStack align="start" gap={2}>
            <Box fontSize="2xl" fontWeight="bold" color="fg">
              <HStack gap={4}>
                <LuLibrary size={28} color="#fbbf24" />
                <Heading size="xl">Mes exercices</Heading>
              </HStack>
            </Box>
            <Box fontSize="md" color="gray.400">
              Gérez mes échauffements et exercices
            </Box>
          </VStack>

          {/* Icône flèche visible à droite */}
          <Box color="yellow.400" fontSize="2xl" flexShrink={0}>
            <LuArrowRight />
          </Box>
        </HStack>

        {/* Statistiques */}
        <HStack gap={6} mt={2}>
          <HStack gap={2}>
            <Box
              p={2}
              bg="orange.400/10"
              borderRadius="md"
              borderWidth="1px"
              borderColor="orange.400/30"
            >
              <LuFlame size={20} color="#fb923c" />
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
              bg="yellow.400/10"
              borderRadius="md"
              borderWidth="1px"
              borderColor="yellow.400/30"
            >
              <LuDumbbell size={20} color="#fbbf24" />
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

export default ExercisesBlock;
