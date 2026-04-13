import { Session } from "@/types";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Box, HStack, Text } from "@chakra-ui/react";
import { LuRefreshCw } from "react-icons/lu";

interface CycleProgressProps {
  sessions: Session[];
  currentCycleNumber: number;
  sessionsDoneInCurrentCycle: number;
}

export const CycleProgress = ({
  sessions,
  currentCycleNumber,
  sessionsDoneInCurrentCycle,
}: CycleProgressProps) => {
  const colors = useThemeColors();

  return (
    <Box
      p={4}
      bg="whiteAlpha.50"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
    >
      <HStack justify="space-between" mb={3}>
        <HStack gap={2}>
          <LuRefreshCw size={13} color={colors.primaryHex} />
          <Text
            fontSize="xs"
            fontWeight="bold"
            color={colors.primary}
            textTransform="uppercase"
            letterSpacing="wider"
          >
            Cycle {currentCycleNumber} en cours
          </Text>
        </HStack>
        <Text fontSize="xs" color="gray.400">
          {sessionsDoneInCurrentCycle} / {sessions.length} séances
        </Text>
      </HStack>
      <HStack gap={2}>
        {sessions.map((s, index) => {
          const isDone = index < sessionsDoneInCurrentCycle;
          return (
            <Box
              key={s._id}
              flex={1}
              h="6px"
              borderRadius="full"
              bg={isDone ? colors.primary : "whiteAlpha.200"}
              transition="background 0.3s"
            />
          );
        })}
      </HStack>
    </Box>
  );
};
