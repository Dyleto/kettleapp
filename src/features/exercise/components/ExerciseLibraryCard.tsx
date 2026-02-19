import ClickableCard from "@/components/ClickableCard";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Exercise } from "@/types";
import { Box, VStack } from "@chakra-ui/react";
import { LuDumbbell, LuFlame } from "react-icons/lu";

interface ExerciseLibraryCardProps {
  exercise: Exercise;
  onClick?: () => void;
  type: "warmup" | "workout";
}

export const ExerciseLibraryCard = ({
  exercise,
  onClick,
  type,
}: ExerciseLibraryCardProps) => {
  const colors = useThemeColors();

  return (
    <ClickableCard
      onClick={() => onClick && onClick()}
      p={6}
      color={type === "workout" ? colors.primary : colors.secondary}
      cursor={onClick ? "pointer" : "default"}
    >
      <VStack gap={3} align="stretch">
        <Box
          p={3}
          bg={type === "workout" ? colors.primaryBg : colors.secondaryBg}
          borderRadius="md"
          borderWidth="1px"
          borderColor={
            type === "workout" ? colors.primaryBorder : colors.secondaryBorder
          }
          alignSelf="center"
        >
          {type === "workout" ? (
            <LuDumbbell size={28} color={colors.primaryHex} />
          ) : (
            <LuFlame size={28} color={colors.secondaryHex} />
          )}
        </Box>

        {/* Nom */}
        <Box fontWeight="bold" fontSize="lg" textAlign="center" color="white">
          {exercise.name}
        </Box>

        {/* Description courte */}
        {exercise.description && (
          <Box fontSize="sm" color="gray.400" lineClamp={2} textAlign="center">
            {exercise.description}
          </Box>
        )}
      </VStack>
    </ClickableCard>
  );
};
