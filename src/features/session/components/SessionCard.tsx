import { VStack, Box, IconButton } from "@chakra-ui/react";
import { Card } from "@/components/Card";
import { Session } from "@/types";
import { SessionHeader } from "./SessionHeader";
import { WarmupSection } from "./WarmupSection";
import { WorkoutSection } from "./WorkoutSection";
import { calculateSessionDuration } from "@/utils/sessionUtils";
import { useThemeColors } from "@/hooks/useThemeColors";
import { LuTrash } from "react-icons/lu";

interface SessionCardProps {
  session: Session;
  interactive?: boolean;
  isEditing?: boolean;
  onAddExercise?: (type: "warmup" | "workout") => void;
  onRemoveExercise?: (type: "warmup" | "workout", index: number) => void;
  onUpdateExercise?: (
    type: "warmup" | "workout",
    index: number,
    updates: any,
  ) => void;
  onUpdateRounds?: (newRounds: number) => void;
  onRemoveSession?: () => void;
  onUpdateRestBetweenRounds?: (value: number) => void;
}

export const SessionCard = ({
  session,
  interactive = true,
  isEditing,
  onAddExercise,
  onRemoveExercise,
  onUpdateExercise,
  onUpdateRounds,
  onRemoveSession,
  onUpdateRestBetweenRounds,
}: SessionCardProps) => {
  const colors = useThemeColors();

  // Handlers intermédiaires pour simplifier les appels
  const handleUpdateWarmup = (index: number, updates: any) =>
    onUpdateExercise?.("warmup", index, updates);

  const handleUpdateWorkout = (index: number, updates: any) =>
    onUpdateExercise?.("workout", index, updates);

  return (
    <Box position="relative" w="full">
      {/* Bouton de suppression de séance (visible uniquement en édition) */}
      {isEditing && (
        <IconButton
          aria-label="Supprimer la séance"
          size="xs"
          variant="solid"
          bg={colors.error}
          rounded="full"
          position="absolute"
          top="-10px"
          right="-10px"
          zIndex={2}
          onClick={(e) => {
            e.stopPropagation();
            onRemoveSession?.();
          }}
        >
          <LuTrash />
        </IconButton>
      )}

      <Card
        p={0}
        accentColor={colors.primary}
        hoverEffect={interactive ? "both" : "none"}
        onClick={interactive ? undefined : undefined}
      >
        <VStack align="stretch" gap={0}>
          <SessionHeader
            order={session.order}
            duration={calculateSessionDuration(session)}
          />

          <WarmupSection
            exercises={session.warmup?.exercises || []}
            isEditing={isEditing}
            onAddExercise={() => onAddExercise?.("warmup")}
            onRemoveExercise={(idx) => onRemoveExercise?.("warmup", idx)}
            onUpdateExercise={handleUpdateWarmup}
          />

          <WorkoutSection
            exercises={session.workout.exercises}
            rounds={session.workout.rounds}
            restBetweenRounds={session.workout.restBetweenRounds}
            isEditing={isEditing}
            onAddExercise={() => onAddExercise?.("workout")}
            onRemoveExercise={(idx) => onRemoveExercise?.("workout", idx)}
            onUpdateRounds={onUpdateRounds}
            onUpdateExercise={handleUpdateWorkout}
            onUpdateRestBetweenRounds={onUpdateRestBetweenRounds}
          />
        </VStack>
      </Card>
    </Box>
  );
};
