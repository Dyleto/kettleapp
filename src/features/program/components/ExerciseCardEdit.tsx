import {
  Box,
  Flex,
  HStack,
  NumberInput,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuClock, LuHash } from "react-icons/lu";
import React from "react";

interface NumberInputHelperProps {
  value?: number;
  label?: string;
  onChange: (val: number) => void;
  w?: string;
}

export const NumberInputHelper = ({
  value,
  label,
  onChange,
  w = "75px",
}: NumberInputHelperProps) => (
  <VStack gap={0} align="center">
    <NumberInput.Root
      size="xs"
      width={w}
      value={value?.toString() || "0"}
      min={0}
      variant="subtle"
      onValueChange={(e) => onChange(parseInt(e.value) || 0)}
      onClick={(e) => e.stopPropagation()}
    >
      <NumberInput.Input
        textAlign="center"
        bg="whiteAlpha.100"
        _focus={{ bg: "whiteAlpha.200", borderColor: "blue.500" }}
        px={1}
        h="32px"
        borderRadius="md"
      />
      <NumberInput.Control>
        <NumberInput.IncrementTrigger />
        <NumberInput.DecrementTrigger />
      </NumberInput.Control>
    </NumberInput.Root>
    {label && (
      <Text fontSize="2xs" color="gray.500" mt={0.5}>
        {label}
      </Text>
    )}
  </VStack>
);

interface ExerciseCardEditProps {
  name: string;
  sets?: number;
  reps?: number;
  duration?: number;
  restBetweenSets?: number;
  mode?: "timer" | "reps";
  type?: "workout" | "warmup";
  onUpdate?: (updates: {
    sets?: number;
    reps?: number;
    duration?: number;
    restBetweenSets?: number;
    mode?: "timer" | "reps";
  }) => void;
}

export const ExerciseCardEdit = ({
  name,
  sets,
  reps,
  duration,
  restBetweenSets,
  mode,
  type,
  onUpdate,
}: ExerciseCardEditProps) => (
  <Box
    p={3}
    bg="whiteAlpha.50"
    borderRadius="md"
    borderWidth="1px"
    borderColor="whiteAlpha.100"
  >
    <VStack align="stretch" gap={3}>
      <Text
        color="gray.300"
        fontWeight="medium"
        fontSize="sm"
        lineClamp={2}
        lineHeight="shorter"
      >
        {name}
      </Text>

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
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onUpdate?.({
              mode: "reps",
              sets: type === "workout" ? sets || 3 : undefined,
              reps: reps || 10,
            });
          }}
          _hover={{ bg: mode === "reps" ? "whiteAlpha.300" : "whiteAlpha.50" }}
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
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onUpdate?.({ mode: "timer", duration: duration || 30 });
          }}
          _hover={{ bg: mode === "timer" ? "whiteAlpha.300" : "whiteAlpha.50" }}
          transition="all 0.2s"
        >
          <HStack gap={2} align="center">
            <LuClock size={12} /> Temps
          </HStack>
        </Box>
      </HStack>

      <Flex gap={2} align="center">
        {mode === "timer" ? (
          <NumberInputHelper
            value={duration}
            label="secondes"
            w="70px"
            onChange={(v) => onUpdate?.({ duration: v })}
          />
        ) : (
          <>
            {type !== "warmup" && (
              <>
                <NumberInputHelper
                  value={sets}
                  onChange={(v) => onUpdate?.({ sets: v })}
                />
                <Text pb={4} color="gray.500" fontSize="sm">
                  x
                </Text>
              </>
            )}
            <NumberInputHelper
              value={reps}
              label={type === "warmup" ? "reps" : undefined}
              onChange={(v) => onUpdate?.({ reps: v })}
            />
          </>
        )}
      </Flex>

      {restBetweenSets !== undefined && (
        <Box borderTopWidth="1px" borderColor="whiteAlpha.100" pt={2}>
          <Flex align="center" gap={3}>
            <Text fontSize="xs" color="gray.400">
              Repos :
            </Text>
            <NumberInputHelper
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
