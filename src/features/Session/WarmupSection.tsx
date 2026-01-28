import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { LuFlame } from "react-icons/lu";
import { ExerciseCard } from "./ExerciseCard";
import { WarmupExercise } from "@/types";

interface WarmupSectionProps {
  exercises: WarmupExercise[];
}

export const WarmupSection = ({ exercises }: WarmupSectionProps) => {
  if (!exercises || exercises.length === 0) return null;

  return (
    <Box
      p={3}
      mx={{ base: 0, md: 6 }}
      mb={4}
      bg="orange.900/20"
      borderRadius={{ base: 0, md: "md" }}
    >
      <HStack gap={2} mb={2}>
        <LuFlame size={14} color="#fb923c" />
        <Text fontSize="xs" fontWeight="bold" color="orange.400">
          Échauffement
        </Text>
      </HStack>
      <VStack gap={2} align="stretch">
        {exercises.map((ex, idx) => {
          return (
            <ExerciseCard
              key={idx}
              name={ex.exercise.name}
              duration={ex.duration}
              reps={ex.reps}
            />
          );
        })}
      </VStack>
    </Box>
  );
};
