import {
  Box,
  Flex,
  HStack,
  IconButton,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { formatDuration } from "@/utils/formatters";
import { LuHash, LuTimer } from "react-icons/lu";

interface ExerciseCardProps {
  name: string;
  sets?: number;
  reps?: number;
  duration?: number;
  restBetweenSets?: number;
  isEditing?: boolean;
  uiMode?: "timer" | "reps";
  hideSets?: boolean; // Option pour cacher les séries (ex: pour les exercices d'échauffement)
  onUpdate?: (updates: {
    sets?: number;
    reps?: number;
    duration?: number;
    restBetweenSets?: number;
    _uiMode?: "timer" | "reps";
  }) => void;
}

// Input helper
const NumberInput = ({
  value,
  label,
  onChange,
  w = "45px", // Largeur custom
}: {
  value?: number;
  label: string;
  onChange: (val: number) => void;
  w?: string;
}) => (
  <VStack gap={0} align="center">
    <Input
      size="xs"
      w={w}
      textAlign="center"
      value={value || ""}
      type="number"
      variant="subtle"
      bg="whiteAlpha.100"
      _focus={{ bg: "whiteAlpha.200", borderColor: "blue.500" }}
      px={1}
      h="32px" // Un peu plus haut pour le doigt
      onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      onClick={(e) => e.stopPropagation()}
    />
    <Text fontSize="2xs" color="gray.500" mt={0.5}>
      {label}
    </Text>
  </VStack>
);

export const ExerciseCard = ({
  name,
  sets,
  reps,
  duration,
  restBetweenSets,
  isEditing,
  onUpdate,
  uiMode,
  hideSets,
}: ExerciseCardProps) => {
  const isTimeMode = uiMode ? uiMode === "timer" : (duration || 0) > 0;

  if (isEditing) {
    return (
      <Box
        p={3}
        bg="whiteAlpha.50"
        borderRadius="md"
        borderWidth="1px"
        borderColor="whiteAlpha.100"
      >
        <VStack align="stretch" gap={3}>
          {/* Ligne 1 : Titre */}
          <Text
            color="gray.300"
            fontWeight="medium"
            fontSize="sm"
            lineClamp={2}
            lineHeight="shorter"
          >
            {name}
          </Text>

          {/* Ligne 2 : Switch Mode */}
          <HStack justify="start">
            <HStack
              gap={0}
              borderWidth="1px"
              borderColor="whiteAlpha.200"
              borderRadius="md"
              bg="blackAlpha.200"
              p="2px"
            >
              <IconButton
                size="xs"
                h="24px"
                minW="40px"
                variant={!isTimeMode ? "solid" : "ghost"}
                colorPalette={!isTimeMode ? "blue" : "gray"}
                fontSize="xs"
                aria-label="Mode répétitions"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isTimeMode) {
                    onUpdate?.({
                      _uiMode: "reps",
                      sets: sets || 4,
                      reps: reps || 12,
                    });
                  }
                }}
              >
                <LuHash />
              </IconButton>
              <IconButton
                size="xs"
                h="24px"
                minW="40px"
                variant={isTimeMode ? "solid" : "ghost"}
                colorPalette={isTimeMode ? "blue" : "gray"}
                fontSize="xs"
                aria-label="Mode temps"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isTimeMode) {
                    onUpdate?.({
                      _uiMode: "timer",
                      duration: duration || 30,
                    });
                  }
                }}
              >
                <LuTimer />
              </IconButton>
            </HStack>
          </HStack>

          {/* Ligne 3 : Metrics (Inputs) */}
          <Flex gap={2} align="center">
            {isTimeMode ? (
              <NumberInput
                value={duration}
                label="secondes"
                w="70px"
                onChange={(v) => onUpdate?.({ duration: v })}
              />
            ) : (
              <>
                {!hideSets && (
                  <>
                    <NumberInput
                      value={sets}
                      label="séries"
                      onChange={(v) => onUpdate?.({ sets: v })}
                    />
                    <Text pb={4} color="gray.500" fontSize="sm">
                      x
                    </Text>
                  </>
                )}
                <NumberInput
                  value={reps}
                  label="reps"
                  onChange={(v) => onUpdate?.({ reps: v })}
                />
              </>
            )}
          </Flex>

          {/* Ligne 4 : Repos (séparé, en dessous) */}
          {typeof restBetweenSets !== "undefined" && (
            <Box borderTopWidth="1px" borderColor="whiteAlpha.100" pt={2}>
              <Flex align="center" gap={3}>
                <Text fontSize="xs" color="gray.400">
                  Repos :
                </Text>
                <NumberInput
                  value={restBetweenSets}
                  label="sec"
                  onChange={(v) => onUpdate?.({ restBetweenSets: v })}
                />
              </Flex>
            </Box>
          )}
        </VStack>
      </Box>
    );
  }

  // --- Mode Lecture ---
  return (
    <Box p={3} bg="gray.900/50" borderRadius="md">
      <VStack align="stretch" gap={1}>
        <Text color="gray.300" fontWeight="medium" fontSize="sm">
          {name}
        </Text>

        {/* Mobile View */}
        <VStack
          align="stretch"
          gap={0}
          fontSize="sm"
          color="gray.500"
          display="flex"
        >
          <HStack gap={3}>
            {sets && <Text>{sets} séries</Text>}
            {sets && reps && <Text>x</Text>}
            {reps && <Text>{reps} reps</Text>}
            {!!duration && <Text>{formatDuration(duration)}</Text>}
          </HStack>
          {restBetweenSets && (
            <Text>{formatDuration(restBetweenSets)} repos</Text>
          )}
        </VStack>
      </VStack>
    </Box>
  );
};
