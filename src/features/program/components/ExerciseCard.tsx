import {
  Box,
  Flex,
  HStack,
  NumberInput,
  Text,
  VStack,
  Collapsible,
} from "@chakra-ui/react";
import { formatDuration } from "@/utils/formatters";
import {
  LuClock,
  LuHash,
  LuInfo,
  LuChevronDown,
  LuChevronUp,
  LuTimer,
} from "react-icons/lu";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useState } from "react";
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

  return (
    <Box
      bg="gray.900/50"
      borderRadius="md"
      borderWidth="1px"
      borderColor={isDetailOpen ? "whiteAlpha.200" : "transparent"}
      transition="all 0.2s"
      overflow="hidden"
    >
      <Box
        p={3}
        as={hasDetail ? "button" : "div"}
        w="100%"
        textAlign="left"
        onClick={() => hasDetail && setIsDetailOpen(!isDetailOpen)}
        cursor={hasDetail ? "pointer" : "default"}
        _hover={hasDetail ? { bg: "whiteAlpha.100" } : {}}
      >
        <HStack align="flex-start" justify="space-between">
          <VStack align="stretch" gap={1} flex={1}>
            <Text color="gray.200" fontWeight="medium" fontSize="sm">
              {name}
            </Text>

            {/* Métriques d'effort et de repos en badges (Pilules) */}
            <HStack flexWrap="wrap" gap={2} mt={1}>
              {/* Badge d'Effort (Séries x Reps ou Timer) */}
              <HStack
                bg={
                  type === "warmup"
                    ? `${colors.secondary}20`
                    : `${colors.primary}20`
                }
                px={2.5}
                py={1}
                borderRadius="md"
                borderWidth="1px"
                borderColor={
                  type === "warmup"
                    ? `${colors.secondary}40`
                    : `${colors.primary}40`
                }
                gap={1.5}
                align="center"
              >
                {mode === "reps" && (
                  <>
                    {type === "workout" && (
                      <>
                        <Text
                          fontWeight="bold"
                          fontSize="sm"
                          color={colors.primary}
                        >
                          {sets}
                        </Text>
                        <Text fontSize="sm" color={`${colors.primary}90`}>
                          ×
                        </Text>
                      </>
                    )}
                    <Text
                      fontWeight="bold"
                      fontSize="sm"
                      color={
                        type === "warmup" ? colors.secondary : colors.primary
                      }
                    >
                      {reps}
                    </Text>
                    <Text
                      fontSize="sm"
                      fontWeight="medium"
                      color={
                        type === "warmup"
                          ? `${colors.secondary}90`
                          : `${colors.primary}90`
                      }
                    >
                      reps
                    </Text>
                  </>
                )}

                {mode === "timer" && !!duration && (
                  <>
                    <Box
                      color={
                        type === "warmup" ? colors.secondary : colors.primary
                      }
                    >
                      <LuClock size={14} />
                    </Box>
                    <Text
                      fontWeight="bold"
                      fontSize="sm"
                      color={
                        type === "warmup" ? colors.secondary : colors.primary
                      }
                    >
                      {formatDuration(duration)}
                    </Text>
                  </>
                )}
              </HStack>

              {/* Badge de Repos */}
              {!!restBetweenSets && (
                <HStack
                  bg="whiteAlpha.100"
                  px={2.5}
                  py={1}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="whiteAlpha.200"
                  gap={1.5}
                  align="center"
                >
                  <Box color="gray.400" display="flex" alignItems="center">
                    <LuTimer size={14} />
                  </Box>
                  <Text fontWeight="bold" fontSize="xs" color="gray.300">
                    {formatDuration(restBetweenSets)}
                  </Text>
                </HStack>
              )}
            </HStack>
          </VStack>

          {hasDetail && (
            <HStack color={isDetailOpen ? "gray.200" : "gray.500"} mt={1}>
              <Text
                fontSize="xs"
                fontWeight="medium"
                display={{ base: "none", sm: "block" }}
              >
                {isDetailOpen ? "Masquer détails" : "Voir détails"}
              </Text>
              {isDetailOpen ? (
                <LuChevronUp size={20} />
              ) : (
                <LuChevronDown size={20} />
              )}
            </HStack>
          )}
        </HStack>
      </Box>

      <Collapsible.Root open={isDetailOpen}>
        <Collapsible.Content>
          <Box
            p={3}
            pt={1}
            bg="blackAlpha.300"
            borderTopWidth="1px"
            borderColor="whiteAlpha.100"
          >
            <VStack align="stretch" gap={4}>
              {!!videoUrl && (
                <Box borderRadius="md" overflow="hidden">
                  <VideoPlayer url={videoUrl} />
                </Box>
              )}

              {!!description && (
                <Box
                  bg="whiteAlpha.50"
                  p={3}
                  borderRadius="md"
                  borderLeftWidth="3px"
                  borderColor={
                    type === "warmup" ? colors.secondary : colors.primary
                  }
                >
                  <HStack align="flex-start" gap={2}>
                    <Box
                      color={
                        type === "warmup" ? colors.secondary : colors.primary
                      }
                      mt={0.5}
                    >
                      <LuInfo size={16} />
                    </Box>
                    <Text fontSize="sm" color="gray.300" lineHeight="tall">
                      {description}
                    </Text>
                  </HStack>
                </Box>
              )}
            </VStack>
          </Box>
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  );
};
