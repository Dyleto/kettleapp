import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { LuDumbbell } from "react-icons/lu";
import { ExerciseCard } from "./ExerciseCard";
import { formatDuration } from "@/utils/formatters";
import { WorkoutExercise } from "@/types";
import { useThemeColors } from "@/hooks/useThemeColors";

interface WorkoutSectionProps {
  exercises: WorkoutExercise[];
  rounds: number;
  restBetweenRounds?: number;
}

export const WorkoutSection = ({
  exercises,
  rounds,
  restBetweenRounds,
}: WorkoutSectionProps) => {
  const colors = useThemeColors();

  return (
    <Box
      p={3}
      mx={{ base: 0, md: 6 }}
      mb={{ base: 0, md: 6 }}
      bg={colors.workoutBg}
      borderRadius={{ base: 0, md: "md" }}
    >
      <HStack gap={2} mb={2}>
        <LuDumbbell size={14} color={colors.primaryHex} />
        <Text fontSize="xs" fontWeight="bold" color={colors.primary}>
          Entraînement
        </Text>
      </HStack>

      {/* Exercices avec accolade */}
      <HStack gap={3} align="stretch">
        {/* Liste des exercices */}
        <VStack gap={2} align="stretch" flex={1}>
          {exercises.map((ex, idx) => {
            return (
              <ExerciseCard
                key={idx}
                name={ex.exercise.name}
                sets={ex.sets}
                reps={ex.reps}
                duration={ex.duration}
                restBetweenSets={ex.restBetweenSets}
              />
            );
          })}
        </VStack>

        {/* Accolade + Tours */}
        <VStack
          justify="center"
          align="center"
          minW="60px"
          gap={1}
          alignSelf="stretch"
        >
          <HStack gap={2} align="stretch" h="full">
            {/* SVG Accolade */}
            <Box h="full" w="20px" position="relative">
              <svg
                width="20"
                height="100%"
                viewBox="0 0 20 100"
                preserveAspectRatio="none"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: "100%",
                }}
              >
                <path
                  d="M 5 0 Q 10 0, 10 5 L 10 45 Q 10 50, 15 50 Q 10 50, 10 55 L 10 95 Q 10 100, 5 100"
                  fill="none"
                  stroke={colors.primaryHex}
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </Box>

            {/* Nombre de tours */}
            <VStack gap={0} align="start" justify="center">
              <Text
                fontSize="xl"
                fontWeight="bold"
                color={colors.primary}
                lineHeight="1"
              >
                ×{rounds}
              </Text>
              <Text fontSize="2xs" color="gray.500">
                tours
              </Text>
            </VStack>
          </HStack>
        </VStack>
      </HStack>

      {/* Repos entre tours */}
      {restBetweenRounds && restBetweenRounds > 0 && (
        <HStack gap={2} mt={2} fontSize="sm" color="gray.400">
          <Text>Repos entre tours :</Text>
          <Text fontWeight="bold" color={colors.primary}>
            {formatDuration(restBetweenRounds)}
          </Text>
        </HStack>
      )}
    </Box>
  );
};
