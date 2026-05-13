import { Box, Collapsible, HStack, Text, VStack } from "@chakra-ui/react";
import { formatDuration } from "@/utils/formatters";
import {
  LuClock,
  LuInfo,
  LuChevronDown,
  LuChevronUp,
  LuTimer,
} from "react-icons/lu";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useState } from "react";
import VideoPlayer from "@/components/VideoPlayer";

interface ExerciseCardViewProps {
  name: string;
  sets?: number;
  reps?: number;
  duration?: number;
  restBetweenSets?: number;
  mode?: "timer" | "reps";
  type?: "workout" | "warmup";
  description?: string;
  videoUrl?: string;
}

export const ExerciseCardView = ({
  name,
  sets,
  reps,
  duration,
  restBetweenSets,
  mode,
  type,
  description,
  videoUrl,
}: ExerciseCardViewProps) => {
  const colors = useThemeColors();
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const hasDetail = !!description || !!videoUrl;

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

            <HStack flexWrap="wrap" gap={2} mt={1}>
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
