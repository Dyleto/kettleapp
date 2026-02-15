import {
  Box,
  Button,
  HStack,
  IconButton,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  LuChevronDown,
  LuChevronUp,
  LuDumbbell,
  LuPlus,
  LuTrash,
} from "react-icons/lu";
import { ExerciseCard } from "./ExerciseCard";
import { formatDuration } from "@/utils/formatters";
import { WorkoutExercise } from "@/types";
import { useThemeColors } from "@/hooks/useThemeColors";

interface WorkoutSectionProps {
  exercises: WorkoutExercise[];
  rounds: number;
  restBetweenRounds?: number;
  isEditing?: boolean;
  onAddExercise?: () => void;
  onRemoveExercise?: (index: number) => void;
  onUpdateRounds?: (newRounds: number) => void;
  onUpdateExercise?: (index: number, updates: any) => void;
  onUpdateRestBetweenRounds?: (value: number) => void;
}

export const WorkoutSection = ({
  exercises,
  rounds,
  restBetweenRounds,
  isEditing,
  onAddExercise,
  onRemoveExercise,
  onUpdateRounds,
  onUpdateExercise,
  onUpdateRestBetweenRounds,
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

      <HStack gap={3} align="stretch">
        <VStack gap={2} align="stretch" flex={1}>
          {exercises.map((ex, idx) => {
            return (
              <HStack key={idx} align="center" gap={2} position="relative">
                <Box flex={1}>
                  <ExerciseCard
                    key={idx}
                    name={ex.exercise.name}
                    sets={ex.sets}
                    reps={ex.reps}
                    duration={ex.duration}
                    restBetweenSets={ex.restBetweenSets}
                    isEditing={isEditing}
                    onUpdate={(updates) => onUpdateExercise?.(idx, updates)}
                    mode={ex.mode}
                    type="workout"
                  />
                </Box>
                {isEditing && (
                  <IconButton
                    aria-label="Supprimer"
                    size="xs"
                    variant="solid"
                    colorPalette="red"
                    rounded="full"
                    position="absolute"
                    top="-10px"
                    right="-10px"
                    zIndex={2}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveExercise?.(idx);
                    }}
                  >
                    <LuTrash />
                  </IconButton>
                )}
              </HStack>
            );
          })}
          {isEditing && (
            <HStack gap={2}>
              <Button
                size="sm"
                variant="ghost"
                flex={1}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddExercise?.();
                }}
              >
                <LuPlus /> Ajouter un exercice
              </Button>
              <Box w="32px" />
            </HStack>
          )}
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

            <VStack gap={0} align="center" justify="center" zIndex={1} mt={3}>
              {isEditing && (
                <IconButton
                  size="xs"
                  variant="ghost"
                  aria-label="Plus"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateRounds?.(rounds + 1);
                  }}
                >
                  <LuChevronUp />
                </IconButton>
              )}
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
              {isEditing && (
                <IconButton
                  size="xs"
                  variant="ghost"
                  aria-label="Moins"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (rounds > 1) onUpdateRounds?.(rounds - 1);
                  }}
                >
                  <LuChevronDown />
                </IconButton>
              )}
            </VStack>
          </HStack>
        </VStack>
      </HStack>

      {/* FOOTER : Repos entre tours */}
      <Box
        mt={4}
        borderTopWidth="1px"
        borderColor="whiteAlpha.100"
        pt={2}
        fontSize="sm"
        color="gray.400"
      >
        {isEditing ? (
          <HStack gap={4}>
            <Text>Repos entre tours :</Text>
            <HStack gap={1}>
              <Input
                size="xs"
                w="50px"
                textAlign="center"
                type="number"
                variant="subtle"
                bg="whiteAlpha.100"
                value={restBetweenRounds || 0}
                onChange={(e) =>
                  onUpdateRestBetweenRounds?.(parseInt(e.target.value) || 0)
                }
              />
              <Text fontSize="xs">sec</Text>
            </HStack>
          </HStack>
        ) : // Affichage lecture seul si > 0
        restBetweenRounds && restBetweenRounds > 0 ? (
          <HStack gap={2}>
            <Text>Repos entre tours :</Text>
            <Text fontWeight="bold" color={colors.primary}>
              {formatDuration(restBetweenRounds)}
            </Text>
          </HStack>
        ) : null}
      </Box>
    </Box>
  );
};
