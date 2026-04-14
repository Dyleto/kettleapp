import { Card } from "@/components/Card";
import { useThemeColors } from "@/hooks/useThemeColors";
import { CompletedSession, SessionMetrics } from "@/types";
import { calculateSessionDuration } from "@/utils/sessionUtils";
import { formatDuration } from "@/utils/formatters";
import { Box, Grid, HStack, Separator, Text, VStack } from "@chakra-ui/react";
import {
  LuBicepsFlexed,
  LuBrain,
  LuClock,
  LuMoon,
  LuRepeat,
  LuSmile,
  LuZap,
} from "react-icons/lu";
import { RadarChart } from "@/components/RadarChart";
import { ReactNode } from "react";

interface SessionHistoryCardProps {
  completed: CompletedSession;
  showUnseenIndicator?: boolean;
}

export const SessionHistoryCard = ({
  completed,
  showUnseenIndicator = false,
}: SessionHistoryCardProps) => {
  const colors = useThemeColors();

  const duration = calculateSessionDuration({
    _id: completed._id,
    order: completed.sessionOrder,
    warmup: completed.warmup,
    workout: completed.workout,
    createdAt: completed.completedAt,
    updatedAt: completed.completedAt,
  });

  const completedDate = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(completed.completedAt));

  const avgScore =
    Object.values(completed.metrics).reduce((a, b) => a + b, 0) /
    Object.values(completed.metrics).length;

  const METRICS_CONFIG: {
    key: keyof SessionMetrics;
    label: ReactNode;
    text: string;
  }[] = [
    {
      key: "stress",
      label: <LuBrain size={16} color={colors.primaryHex} />,
      text: "Stress",
    },
    {
      key: "mood",
      label: <LuSmile size={16} color={colors.primaryHex} />,
      text: "Humeur",
    },
    {
      key: "energy",
      label: <LuZap size={16} color={colors.primaryHex} />,
      text: "Énergie",
    },
    {
      key: "sleep",
      label: <LuMoon size={16} color={colors.primaryHex} />,
      text: "Sommeil",
    },
    {
      key: "soreness",
      label: <LuBicepsFlexed size={16} color={colors.primaryHex} />,
      text: "Douleurs",
    },
  ];

  const allExercises = [
    ...(completed.warmup?.exercises ?? []).map((e) => ({
      name: e.exercise.name,
      type: "warmup" as const,
    })),
    ...completed.workout.exercises.map((e) => ({
      name: e.exercise.name,
      type: "workout" as const,
    })),
  ];

  return (
    <Card accentColor={colors.primary} p={0} hoverEffect="none">
      <VStack align="stretch" gap={0}>
        {/* Header */}
        <HStack justify="space-between" px={4} pt={3} pb={2}>
          <HStack gap={2}>
            <Text fontSize="sm" fontWeight="bold">
              Séance {completed.sessionOrder}
            </Text>
            {showUnseenIndicator && (
              <Box
                px={2}
                py={0.5}
                borderRadius="full"
                bg="orange.400"
                color="white"
                fontSize="2xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Nouveau
              </Box>
            )}
          </HStack>
          <Text fontSize="xs" color="gray.500">
            {completedDate}
          </Text>
          <Text fontSize="xs" color={colors.primary} fontWeight="bold">
            {avgScore.toFixed(1)} / 5
          </Text>
        </HStack>

        <Separator borderColor="whiteAlpha.100" />

        {/* Body 2 colonnes */}
        <Grid templateColumns="1fr 1fr" gap={0}>
          {/* Colonne gauche — Radar */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={2}
            borderRight="1px solid"
            borderColor="whiteAlpha.100"
          >
            <RadarChart
              values={METRICS_CONFIG.map(({ key }) => completed.metrics[key])}
              labels={METRICS_CONFIG.map(({ label, text }) => (
                <VStack key={text} gap={0.5} align="center">
                  {label}
                  <Text fontSize="2xs" color="gray.500" lineHeight={1.2}>
                    {text}
                  </Text>
                </VStack>
              ))}
              size={130}
            />
          </Box>

          {/* Colonne droite — Stats + Exercices */}
          <VStack align="stretch" gap={3} p={4}>
            <VStack align="start" gap={1}>
              <HStack gap={2} color="gray.400" fontSize="xs">
                <LuClock size={12} />
                <Text>{formatDuration(duration)}</Text>
              </HStack>
              <HStack gap={2} color="gray.400" fontSize="xs">
                <LuRepeat size={12} />
                <Text>{completed.workout.rounds} rounds</Text>
              </HStack>
            </VStack>

            <Separator borderColor="whiteAlpha.100" />

            <VStack align="stretch" gap={1}>
              {allExercises.map((ex, i) => (
                <HStack key={i} gap={2}>
                  <Box
                    w="4px"
                    h="4px"
                    borderRadius="full"
                    flexShrink={0}
                    bg={
                      ex.type === "warmup" ? colors.secondary : colors.primary
                    }
                  />
                  <Text fontSize="xs" color="gray.300" lineClamp={1}>
                    {ex.name}
                  </Text>
                </HStack>
              ))}
            </VStack>

            {completed.clientNotes && (
              <>
                <Separator borderColor="whiteAlpha.100" />
                <Text
                  fontSize="xs"
                  color="gray.400"
                  fontStyle="italic"
                  lineClamp={2}
                >
                  "{completed.clientNotes}"
                </Text>
              </>
            )}
          </VStack>
        </Grid>

        <Separator borderColor="whiteAlpha.100" />
      </VStack>
    </Card>
  );
};
