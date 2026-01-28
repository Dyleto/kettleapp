import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { formatDuration } from "@/utils/formatters";

interface ExerciseCardProps {
  name: string;
  sets?: number;
  reps?: number;
  duration?: number;
  restBetweenSets?: number;
}

export const ExerciseCard = ({
  name,
  sets,
  reps,
  duration,
  restBetweenSets,
}: ExerciseCardProps) => {
  return (
    <Box p={3} bg="gray.900/50" borderRadius="md">
      <VStack align="stretch" gap={1}>
        {/* Nom de l'exercice */}
        <Text color="gray.300" fontWeight="medium" fontSize="sm">
          {name}
        </Text>

        {/* Desktop : 1 ligne */}
        <HStack
          gap={3}
          fontSize="sm"
          color="gray.500"
          display={{ base: "none", md: "flex" }}
        >
          {sets && <Text>{sets} séries</Text>}
          {reps && <Text>× {reps} reps</Text>}
          {duration && <Text>{formatDuration(duration)}</Text>}
          {restBetweenSets && (
            <>
              <Text>•</Text>
              <Text>{formatDuration(restBetweenSets)} repos</Text>
            </>
          )}
        </HStack>

        {/* Mobile : 2 lignes */}
        <VStack
          align="stretch"
          gap={0}
          fontSize="sm"
          color="gray.500"
          display={{ base: "flex", md: "none" }}
        >
          <HStack gap={3}>
            {sets && <Text>{sets} séries</Text>}
            {reps && <Text>× {reps} reps</Text>}
            {duration && <Text>{formatDuration(duration)}</Text>}
          </HStack>
          {restBetweenSets && (
            <Text>{formatDuration(restBetweenSets)} repos</Text>
          )}
        </VStack>
      </VStack>
    </Box>
  );
};
