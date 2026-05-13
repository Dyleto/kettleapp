import { BlockExercise, BlockType } from "@/types";
import {
  blockSupportsSets,
  getBlockColor,
} from "@/constants/blockTypes";
import { formatDuration } from "@/utils/formatters";
import {
  Box,
  Flex,
  HStack,
  IconButton,
  NumberInput,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuTrash2 } from "react-icons/lu";

// ─── Metric display helper ────────────────────────────────────────────────────

export const formatExerciseMetric = (
  ex: BlockExercise,
  blockType: BlockType,
): string => {
  const effort = ex.reps
    ? `${ex.reps} reps`
    : ex.duration
    ? formatDuration(ex.duration)
    : ex.customMetric
    ? `${ex.customMetric.value} ${ex.customMetric.unit}`
    : "";

  if (!effort) return "";
  if (blockSupportsSets(blockType) && ex.sets && ex.sets > 1) {
    return `${ex.sets} × ${effort}`;
  }
  return effort;
};

// ─── View mode ────────────────────────────────────────────────────────────────

interface ViewProps {
  exercise: BlockExercise;
  blockType: BlockType;
}

export const BlockExerciseView = ({ exercise, blockType }: ViewProps) => {
  const metric = formatExerciseMetric(exercise, blockType);
  const color = getBlockColor(blockType);

  return (
    <HStack justify="space-between" py={2} gap={3}>
      <HStack gap={2} flex={1} minW={0}>
        <Box
          w="5px"
          h="5px"
          borderRadius="full"
          bg={color}
          flexShrink={0}
          opacity={0.7}
        />
        <Text fontSize="sm" color="gray.300" lineClamp={1}>
          {exercise.exercise.name}
        </Text>
      </HStack>
      {metric && (
        <Text fontSize="sm" color="gray.500" flexShrink={0}>
          {metric}
        </Text>
      )}
    </HStack>
  );
};

// ─── Edit mode ────────────────────────────────────────────────────────────────

type MetricMode = "reps" | "duration" | "custom";

interface EditProps {
  exercise: BlockExercise;
  blockType: BlockType;
  onUpdate: (updates: Partial<Omit<BlockExercise, "exercise">>) => void;
  onRemove: () => void;
}

const NumInput = ({
  value,
  min = 0,
  onChange,
  w = "68px",
  label,
}: {
  value?: number;
  min?: number;
  onChange: (v: number) => void;
  w?: string;
  label?: string;
}) => (
  <VStack gap={0} align="center">
    <NumberInput.Root
      size="xs"
      width={w}
      value={value?.toString() || "0"}
      min={min}
      variant="subtle"
      onValueChange={(e) => onChange(parseInt(e.value) || 0)}
      onClick={(e) => e.stopPropagation()}
    >
      <NumberInput.Input
        textAlign="center"
        bg="whiteAlpha.100"
        _focus={{ bg: "whiteAlpha.200" }}
        px={1}
        h="30px"
        borderRadius="md"
      />
      <NumberInput.Control>
        <NumberInput.IncrementTrigger />
        <NumberInput.DecrementTrigger />
      </NumberInput.Control>
    </NumberInput.Root>
    {label && (
      <Text fontSize="2xs" color="gray.600" mt={0.5}>
        {label}
      </Text>
    )}
  </VStack>
);

export const BlockExerciseEdit = ({
  exercise,
  blockType,
  onUpdate,
  onRemove,
}: EditProps) => {
  const supportsSets = blockSupportsSets(blockType);
  const color = getBlockColor(blockType);

  const currentMode: MetricMode = exercise.duration
    ? "duration"
    : exercise.customMetric
    ? "custom"
    : "reps";

  const setMode = (mode: MetricMode) => {
    if (mode === "reps")
      onUpdate({ reps: 10, duration: undefined, customMetric: undefined });
    if (mode === "duration")
      onUpdate({ duration: 30, reps: undefined, customMetric: undefined });
    if (mode === "custom")
      onUpdate({
        customMetric: { value: 100, unit: "m" },
        reps: undefined,
        duration: undefined,
      });
  };

  return (
    <Box
      p={3}
      bg="whiteAlpha.50"
      borderRadius="md"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
    >
      <VStack align="stretch" gap={2}>
        {/* Exercise name + delete */}
        <HStack justify="space-between">
          <Text fontSize="sm" color="gray.300" fontWeight="medium" lineClamp={1} flex={1}>
            {exercise.exercise.name}
          </Text>
          <IconButton
            aria-label="Supprimer"
            size="xs"
            variant="ghost"
            color="gray.500"
            _hover={{ color: "red.400" }}
            onClick={onRemove}
          >
            <LuTrash2 size={13} />
          </IconButton>
        </HStack>

        {/* Metric mode toggle */}
        <HStack
          bg="blackAlpha.400"
          p="2px"
          borderRadius="md"
          w="fit-content"
          borderWidth="1px"
          borderColor="whiteAlpha.100"
          gap={0}
        >
          {(["reps", "duration", "custom"] as MetricMode[]).map((mode) => (
            <Box
              key={mode}
              as="button"
              px={2.5}
              py={1}
              borderRadius="sm"
              bg={currentMode === mode ? "whiteAlpha.200" : "transparent"}
              color={currentMode === mode ? "white" : "gray.500"}
              fontSize="xs"
              fontWeight="medium"
              onClick={() => setMode(mode)}
              _hover={{ bg: currentMode === mode ? "whiteAlpha.300" : "whiteAlpha.50" }}
              transition="all 0.15s"
            >
              {mode === "reps" ? "Reps" : mode === "duration" ? "Durée" : "Mesure"}
            </Box>
          ))}
        </HStack>

        {/* Metric inputs */}
        <Flex gap={2} align="flex-end" flexWrap="wrap">
          {supportsSets && (
            <>
              <NumInput
                value={exercise.sets}
                min={1}
                label="séries"
                onChange={(v) => onUpdate({ sets: v })}
              />
              <Text pb={4} color="gray.500" fontSize="sm">
                ×
              </Text>
            </>
          )}

          {currentMode === "reps" && (
            <NumInput
              value={exercise.reps}
              label="reps"
              onChange={(v) => onUpdate({ reps: v })}
            />
          )}

          {currentMode === "duration" && (
            <NumInput
              value={exercise.duration}
              label="secondes"
              w="72px"
              onChange={(v) => onUpdate({ duration: v })}
            />
          )}

          {currentMode === "custom" && (
            <HStack gap={2} align="flex-end">
              <NumInput
                value={exercise.customMetric?.value}
                label="valeur"
                w="72px"
                onChange={(v) =>
                  onUpdate({
                    customMetric: {
                      value: v,
                      unit: exercise.customMetric?.unit || "m",
                    },
                  })
                }
              />
              <Box pb={4}>
                <input
                  value={exercise.customMetric?.unit || ""}
                  onChange={(e) =>
                    onUpdate({
                      customMetric: {
                        value: exercise.customMetric?.value || 0,
                        unit: e.target.value,
                      },
                    })
                  }
                  placeholder="unité"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "6px",
                    color: "white",
                    fontSize: "12px",
                    padding: "4px 8px",
                    width: "60px",
                    height: "30px",
                  }}
                />
              </Box>
            </HStack>
          )}
        </Flex>

        {/* Rest between sets */}
        {supportsSets && (exercise.sets || 1) > 1 && (
          <HStack gap={2} align="center" borderTopWidth="1px" borderColor="whiteAlpha.100" pt={2}>
            <Text fontSize="xs" color="gray.500">
              Repos entre séries :
            </Text>
            <NumInput
              value={exercise.restBetweenSets}
              label="s"
              w="60px"
              onChange={(v) => onUpdate({ restBetweenSets: v })}
            />
          </HStack>
        )}

        {/* Color accent line */}
        <Box h="2px" borderRadius="full" bg={`${color}40`} mt={1} />
      </VStack>
    </Box>
  );
};
