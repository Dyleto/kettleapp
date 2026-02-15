import {
  Box,
  Button,
  HStack,
  IconButton,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuFlame, LuPlus, LuTrash } from "react-icons/lu";
import { ExerciseCard } from "./ExerciseCard";
import { WarmupExercise } from "@/types";
import { useThemeColors } from "@/hooks/useThemeColors";

interface WarmupSectionProps {
  exercises: WarmupExercise[];
  isEditing?: boolean;
  onAddExercise?: () => void;
  onRemoveExercise?: (index: number) => void;
  onUpdateExercise?: (index: number, updates: any) => void;
}

export const WarmupSection = ({
  exercises,
  isEditing,
  onAddExercise,
  onRemoveExercise,
  onUpdateExercise,
}: WarmupSectionProps) => {
  const colors = useThemeColors();

  // On affiche s'il y a des exos OU si on est en mode édition (pour pouvoir ajouter le premier)
  if ((!exercises || exercises.length === 0) && !isEditing) return null;

  return (
    <Box
      p={3}
      mx={{ base: 0, md: 6 }}
      mb={4}
      bg={colors.warmupBg}
      borderRadius={{ base: 0, md: "md" }}
    >
      <HStack gap={2} mb={2}>
        <LuFlame size={14} color={colors.secondaryHex} />
        <Text fontSize="xs" fontWeight="bold" color={colors.secondary}>
          Échauffement
        </Text>
      </HStack>
      <VStack gap={2} align="stretch">
        {exercises?.map((ex, idx) => {
          return (
            <HStack key={idx} align="center" gap={2} position="relative">
              <Box flex={1}>
                <ExerciseCard
                  name={ex.exercise.name}
                  duration={ex.duration}
                  reps={ex.reps}
                  isEditing={isEditing}
                  onUpdate={(updates) => onUpdateExercise?.(idx, updates)}
                  mode={ex.mode}
                  type="warmup"
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
              <LuPlus /> Ajouter un échauffement
            </Button>
            {/* Espace vide pour compenser l'alignement avec la poubelle au dessus (environ 32px) */}
            <Box w="32px" />
          </HStack>
        )}
      </VStack>
    </Box>
  );
};
