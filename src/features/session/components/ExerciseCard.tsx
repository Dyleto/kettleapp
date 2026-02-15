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
import { LuClock, LuHash, LuTimer } from "react-icons/lu";
import { useThemeColors } from "@/hooks/useThemeColors";

interface ExerciseCardProps {
  name: string;
  sets?: number;
  reps?: number;
  duration?: number;
  restBetweenSets?: number;
  isEditing?: boolean;
  mode?: "timer" | "reps";
  type?: "workout" | "warmup"; // Option pour cacher les séries (ex: pour les exercices d'échauffement)
  onUpdate?: (updates: {
    sets?: number;
    reps?: number;
    duration?: number;
    restBetweenSets?: number;
    mode?: "timer" | "reps";
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
      inputMode="numeric"
      pattern="[0-9]*"
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
  mode,
  type,
}: ExerciseCardProps) => {
  const colors = useThemeColors();

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
          <HStack
            bg="blackAlpha.400"
            p="2px"
            borderRadius="md"
            w="fit-content"
            borderWidth="1px"
            borderColor="whiteAlpha.100"
          >
            <Box
              as="button"
              px={3}
              py={1}
              borderRadius="sm"
              bg={mode === "reps" ? "whiteAlpha.200" : "transparent"}
              color={mode === "reps" ? "white" : "gray.500"}
              fontSize="xs"
              fontWeight="medium"
              onClick={(e: any) => {
                e.stopPropagation();
                onUpdate?.({
                  mode: "reps",
                  sets: type === "workout" ? sets || 3 : undefined,
                  reps: reps || 10,
                });
              }}
              _hover={{
                bg: mode === "reps" ? "whiteAlpha.300" : "whiteAlpha.50",
              }}
              transition="all 0.2s"
            >
              <HStack gap={1} align="center">
                <LuHash size={12} />
                Reps
              </HStack>
            </Box>
            <Box
              as="button"
              px={3}
              py={1}
              borderRadius="sm"
              bg={mode === "timer" ? "whiteAlpha.200" : "transparent"}
              color={mode === "timer" ? "white" : "gray.500"}
              fontSize="xs"
              fontWeight="medium"
              onClick={(e: any) => {
                e.stopPropagation();
                onUpdate?.({ mode: "timer", duration: duration || 30 });
              }}
              _hover={{
                bg: mode === "timer" ? "whiteAlpha.300" : "whiteAlpha.50",
              }}
              transition="all 0.2s"
            >
              <HStack gap={2} align="center">
                <LuClock size={12} /> Temps
              </HStack>
            </Box>
          </HStack>

          {/* Ligne 3 : Metrics (Inputs) */}
          <Flex gap={2} align="center">
            {mode === "timer" ? (
              <NumberInput
                value={duration}
                label="secondes"
                w="70px"
                onChange={(v) => onUpdate?.({ duration: v })}
              />
            ) : (
              <>
                {type !== "warmup" && (
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
            {type === "workout" && mode === "reps" && (
              <>
                <VStack gap={0} align="center">
                  <Text fontWeight="bold" color={colors.primary} lineHeight="1">
                    {sets}
                  </Text>
                  <Text fontSize="2xs" color="gray.500">
                    séries
                  </Text>
                </VStack>
                <Text fontSize="lg">x</Text>
              </>
            )}

            {mode === "reps" && (
              <VStack gap={0} align="center">
                <Text
                  fontWeight="bold"
                  color={type === "warmup" ? colors.secondary : colors.primary}
                  lineHeight="1"
                >
                  {reps}
                </Text>
                <Text fontSize="2xs" color="gray.500">
                  reps
                </Text>
              </VStack>
            )}
            {mode === "timer" && !!duration && (
              <Text
                fontWeight="bold"
                color={type === "warmup" ? colors.secondary : colors.primary}
              >
                {formatDuration(duration)}
              </Text>
            )}
          </HStack>
          {restBetweenSets && (
            <VStack gap={0} align="start" width="fit-content" mt={2}>
              <Text
                alignSelf="center"
                fontWeight="bold"
                color={type === "warmup" ? colors.secondary : colors.primary}
              >
                {formatDuration(restBetweenSets)}
              </Text>
              <Text fontSize="2xs" color="gray.500">
                repos entre série
              </Text>
            </VStack>
          )}
        </VStack>
      </VStack>
    </Box>
  );
};
