import {
  Box,
  Flex,
  HStack,
  IconButton,
  Input,
  NumberInput,
  Text,
  VStack,
} from "@chakra-ui/react";
import { formatDuration } from "@/utils/formatters";
import { LuClock, LuHash, LuInfo, LuX } from "react-icons/lu";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useState } from "react";
import { SlidePanel } from "@/components/SlidePanel";
import VideoPlayer from "@/components/VideoPlayer";

interface ExerciseCardProps {
  name: string;
  sets?: number;
  reps?: number;
  duration?: number;
  restBetweenSets?: number;
  isEditing?: boolean;
  mode?: "timer" | "reps";
  type?: "workout" | "warmup";
  description?: string;
  videoUrl?: string;
  onUpdate?: (updates: {
    sets?: number;
    reps?: number;
    duration?: number;
    restBetweenSets?: number;
    mode?: "timer" | "reps";
  }) => void;
}

// Input helper
const NumberInputHelper = ({
  value,
  label,
  onChange,
  w = "75px",
}: {
  value?: number;
  label?: string;
  onChange: (val: number) => void;
  w?: string;
}) => (
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
  description,
  videoUrl,
}: ExerciseCardProps) => {
  const colors = useThemeColors();
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const hasDetail = !isEditing && (!!description || !!videoUrl);

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

          {/* Ligne 4 : Repos */}
          {!!restBetweenSets && (
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
  }

  // --- Mode Lecture ---
  return (
    <>
      <Box p={3} bg="gray.900/50" borderRadius="md">
        <HStack align="flex-start" justify="space-between">
          <VStack align="stretch" gap={1} flex={1}>
            <Text color="gray.300" fontWeight="medium" fontSize="sm">
              {name}
            </Text>

            <VStack
              align="center"
              gap={0}
              fontSize="sm"
              color="gray.500"
              display="flex"
              width="fit-content"
            >
              <HStack gap={3} align="flex-start">
                {mode === "reps" && (
                  <>
                    <VStack gap={0} align="center">
                      <Text
                        fontWeight="bold"
                        color={
                          type === "warmup" ? colors.secondary : colors.primary
                        }
                      >
                        {reps}
                      </Text>
                      {type === "warmup" && (
                        <Text fontSize="2xs" color="gray.500">
                          reps
                        </Text>
                      )}
                    </VStack>
                    {type === "workout" && (
                      <>
                        <Text fontSize="lg" lineHeight="1">
                          x
                        </Text>
                        <Text fontWeight="bold" color={colors.primary}>
                          {sets}
                        </Text>
                      </>
                    )}
                  </>
                )}
                {mode === "timer" && !!duration && (
                  <Text
                    fontWeight="bold"
                    color={
                      type === "warmup" ? colors.secondary : colors.primary
                    }
                  >
                    {formatDuration(duration)}
                  </Text>
                )}
              </HStack>
              {!!restBetweenSets && (
                <VStack gap={0} align="center" width="fit-content" mt={2}>
                  <Text
                    alignSelf="center"
                    fontWeight="bold"
                    color={
                      type === "warmup" ? colors.secondary : colors.primary
                    }
                  >
                    {formatDuration(restBetweenSets)}
                  </Text>
                  <Text fontSize="2xs" color="gray.500">
                    repos
                  </Text>
                </VStack>
              )}
            </VStack>
          </VStack>

          {hasDetail && (
            <IconButton
              aria-label="Détails de l'exercice"
              size="xs"
              variant="ghost"
              color="gray.500"
              _hover={{ color: "gray.300" }}
              onClick={() => setIsDetailOpen(true)}
            >
              <LuInfo size={16} />
            </IconButton>
          )}
        </HStack>
      </Box>

      {isDetailOpen && (
        <SlidePanel onClose={() => setIsDetailOpen(false)}>
          {(handleClose) => (
            <VStack align="stretch" gap={0} h="100%">
              {/* Header */}
              <HStack
                px={4}
                py={4}
                borderBottomWidth="1px"
                borderColor="whiteAlpha.100"
                justify="space-between"
                align="center"
              >
                <Text fontWeight="bold" fontSize="lg" color="white">
                  {name}
                </Text>
                <IconButton
                  aria-label="Fermer"
                  size="sm"
                  variant="ghost"
                  color="gray.400"
                  _hover={{ color: "white" }}
                  onClick={handleClose}
                >
                  <LuX size={18} />
                </IconButton>
              </HStack>

              {/* Contenu */}
              <VStack align="stretch" gap={6} p={5} overflowY="auto" flex={1}>
                {!!videoUrl && <VideoPlayer url={videoUrl} />}

                {!!description && (
                  <VStack align="stretch" gap={2}>
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color="gray.400"
                      textTransform="uppercase"
                      letterSpacing="wider"
                    >
                      Description
                    </Text>
                    <Text fontSize="sm" color="gray.300" lineHeight="tall">
                      {description}
                    </Text>
                  </VStack>
                )}
              </VStack>
            </VStack>
          )}
        </SlidePanel>
      )}
    </>
  );
};
