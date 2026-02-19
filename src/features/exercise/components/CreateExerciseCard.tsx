import { useThemeColors } from "@/hooks/useThemeColors";
import { Box, VStack } from "@chakra-ui/react";
import { LuPlus } from "react-icons/lu";

interface CreateExerciseCardProps {
  type: "warmup" | "workout";
  onClick?: () => void;
}

export const CreateExerciseCard = ({
  type,
  onClick,
}: CreateExerciseCardProps) => {
  const colors = useThemeColors();

  return (
    <Box
      p={6}
      borderWidth="2px"
      borderStyle="dashed"
      borderColor={type === "workout" ? colors.primary : colors.secondary}
      borderRadius="xl"
      cursor={onClick ? "pointer" : "default"}
      transition="all 0.3s ease"
      display="flex"
      alignItems="center"
      justifyContent="center"
      minH="200px"
      _hover={{
        borderColor:
          type === "workout" ? colors.primaryHover : colors.secondaryHover,
        bg: type === "workout" ? colors.primaryBg : colors.secondaryBg,
        transform: "translateY(-2px)",
      }}
      onClick={() => onClick && onClick()}
    >
      <VStack
        gap={3}
        color={type === "workout" ? colors.primary : colors.secondary}
      >
        <Box
          p={3}
          bg={type === "workout" ? colors.primaryBg : colors.secondaryBg}
          borderRadius="full"
          borderWidth="2px"
          borderStyle="dashed"
          borderColor={type === "workout" ? colors.primary : colors.secondary}
        >
          <LuPlus size={32} />
        </Box>
        <Box fontWeight="bold" fontSize="md" textAlign="center">
          Ajouter un {type === "workout" ? "exercice" : "échauffement"}
        </Box>
      </VStack>
    </Box>
  );
};
