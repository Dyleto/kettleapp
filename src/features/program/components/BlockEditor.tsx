import { BlockExercise, BlockType, Exercise, SessionBlock } from "@/types";
import {
  blockSupportsSets,
  getBlockColor,
  getBlockLabel,
} from "@/constants/blockTypes";
import {
  Box,
  Button,
  HStack,
  IconButton,
  Input,
  NumberInput,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import { BlockExerciseEdit } from "./BlockExerciseCard";

// ─── Block-level config inputs ────────────────────────────────────────────────

const NumField = ({
  label,
  value,
  min = 0,
  onChange,
}: {
  label: string;
  value?: number;
  min?: number;
  onChange: (v: number) => void;
}) => (
  <VStack align="start" gap={1} flex={1}>
    <Text fontSize="2xs" color="gray.500" textTransform="uppercase" letterSpacing="wider">
      {label}
    </Text>
    <NumberInput.Root
      size="sm"
      value={value?.toString() || "0"}
      min={min}
      variant="subtle"
      onValueChange={(e) => onChange(parseInt(e.value) || 0)}
    >
      <NumberInput.Input
        bg="whiteAlpha.100"
        _focus={{ bg: "whiteAlpha.200" }}
        borderRadius="md"
        h="36px"
      />
      <NumberInput.Control>
        <NumberInput.IncrementTrigger />
        <NumberInput.DecrementTrigger />
      </NumberInput.Control>
    </NumberInput.Root>
  </VStack>
);

const BlockConfig = ({
  block,
  onUpdate,
}: {
  block: SessionBlock;
  onUpdate: (updates: Partial<SessionBlock>) => void;
}) => {
  switch (block.type) {
    case "emom":
    case "amrap":
      return (
        <NumField
          label="Durée (min)"
          value={block.durationMinutes}
          min={1}
          onChange={(v) => onUpdate({ durationMinutes: v })}
        />
      );

    case "timecap":
      return (
        <NumField
          label="Temps max (min)"
          value={block.durationMinutes}
          min={1}
          onChange={(v) => onUpdate({ durationMinutes: v })}
        />
      );

    case "every":
      return (
        <HStack gap={3}>
          <NumField
            label="Toutes les (min)"
            value={block.intervalMinutes}
            min={1}
            onChange={(v) => onUpdate({ intervalMinutes: v })}
          />
          <NumField
            label="Répétitions"
            value={block.rounds}
            min={1}
            onChange={(v) => onUpdate({ rounds: v })}
          />
          <NumField
            label="Repos entre (s)"
            value={block.restBetweenRounds}
            onChange={(v) => onUpdate({ restBetweenRounds: v })}
          />
        </HStack>
      );

    case "tabata":
    case "onoff":
      return (
        <HStack gap={3}>
          <NumField
            label="Tours"
            value={block.rounds}
            min={1}
            onChange={(v) => onUpdate({ rounds: v })}
          />
          <NumField
            label={block.type === "tabata" ? "Travail (s)" : "On (s)"}
            value={block.workDuration}
            min={1}
            onChange={(v) => onUpdate({ workDuration: v })}
          />
          <NumField
            label={block.type === "tabata" ? "Repos (s)" : "Off (s)"}
            value={block.restDuration}
            onChange={(v) => onUpdate({ restDuration: v })}
          />
        </HStack>
      );

    case "pyramid":
    case "ladder": {
      const schemeStr = (block.repsScheme || []).join(", ");
      return (
        <VStack align="stretch" gap={2}>
          <VStack align="start" gap={1}>
            <Text fontSize="2xs" color="gray.500" textTransform="uppercase" letterSpacing="wider">
              Paliers (ex: 5, 10, 15, 20)
            </Text>
            <Input
              size="sm"
              value={schemeStr}
              bg="whiteAlpha.100"
              borderColor="whiteAlpha.200"
              _focus={{ borderColor: `${getBlockColor(block.type)}60` }}
              borderRadius="md"
              onChange={(e) => {
                const vals = e.target.value
                  .split(/[,\s]+/)
                  .map((v) => parseInt(v.trim()))
                  .filter((v) => !isNaN(v) && v > 0);
                onUpdate({ repsScheme: vals });
              }}
            />
          </VStack>
          <NumField
            label="Repos entre paliers (s)"
            value={block.restBetweenRounds}
            onChange={(v) => onUpdate({ restBetweenRounds: v })}
          />
        </VStack>
      );
    }

    default:
      return null;
  }
};

// ─── Main BlockEditor ─────────────────────────────────────────────────────────

interface BlockEditorProps {
  block: SessionBlock;
  onUpdate: (updates: Partial<SessionBlock>) => void;
  onRemove: () => void;
  onAddExercise: () => void;
  onRemoveExercise: (index: number) => void;
  onUpdateExercise: (
    index: number,
    updates: Partial<Omit<BlockExercise, "exercise">>,
  ) => void;
}

export const BlockEditor = ({
  block,
  onUpdate,
  onRemove,
  onAddExercise,
  onRemoveExercise,
  onUpdateExercise,
}: BlockEditorProps) => {
  const color = getBlockColor(block.type);

  return (
    <Box
      borderRadius="xl"
      overflow="hidden"
      borderWidth="1px"
      borderColor={`${color}30`}
    >
      {/* Header */}
      <Box px={4} py={3} bg={`${color}18`}>
        <HStack justify="space-between" gap={2}>
          <HStack gap={2} flex={1}>
            <Box w="8px" h="8px" borderRadius="full" bg={color} flexShrink={0} />
            <Text fontSize="xs" fontWeight="bold" color={color} textTransform="uppercase" letterSpacing="wider">
              {getBlockLabel(block.type)}
            </Text>
            <Input
              size="xs"
              value={block.label || ""}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Nom du bloc (optionnel)"
              bg="blackAlpha.300"
              borderColor="whiteAlpha.100"
              _focus={{ borderColor: `${color}50` }}
              borderRadius="md"
              maxW="200px"
              fontSize="xs"
              color="gray.300"
            />
          </HStack>
          <IconButton
            aria-label="Supprimer le bloc"
            size="xs"
            variant="ghost"
            color="gray.500"
            _hover={{ color: "red.400" }}
            onClick={onRemove}
          >
            <LuTrash2 size={14} />
          </IconButton>
        </HStack>
      </Box>

      <VStack align="stretch" gap={0} p={3}>
        {/* Block config */}
        <BlockConfig block={block} onUpdate={onUpdate} />

        {/* Exercises */}
        {block.exercises.length > 0 && (
          <VStack align="stretch" gap={2} mt={3}>
            {block.exercises.map((ex, i) => (
              <BlockExerciseEdit
                key={i}
                exercise={ex}
                blockType={block.type}
                onUpdate={(updates) => onUpdateExercise(i, updates)}
                onRemove={() => onRemoveExercise(i)}
              />
            ))}
          </VStack>
        )}

        {/* Add exercise */}
        {!(["tabata", "onoff"].includes(block.type) && block.exercises.length >= 1) && (
          <Button
            size="sm"
            variant="ghost"
            color={color}
            borderWidth="1px"
            borderColor={`${color}30`}
            borderStyle="dashed"
            borderRadius="lg"
            mt={block.exercises.length > 0 ? 3 : 3}
            onClick={onAddExercise}
            _hover={{ bg: `${color}10` }}
            w="full"
          >
            <LuPlus size={14} />
            Ajouter un exercice
          </Button>
        )}
      </VStack>
    </Box>
  );
};
