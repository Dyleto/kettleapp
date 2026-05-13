import { Card } from "@/components/Card";
import { useThemeColors } from "@/hooks/useThemeColors";
import { CompletedSession } from "@/types";
import { calculateSessionDuration } from "@/utils/sessionUtils";
import { formatDuration } from "@/utils/formatters";
import { getBlockColor, getBlockLabel } from "@/constants/blockTypes";
import { Box, Grid, HStack, Separator, Text, VStack } from "@chakra-ui/react";
import { LuClock } from "react-icons/lu";
import { RadarChart } from "@/components/RadarChart";
import { METRICS_CONFIG } from "@/constants/metricsConfig";

interface SessionHistoryCardProps {
  completed: CompletedSession;
  showUnseenIndicator?: boolean;
}

export const SessionHistoryCard = ({
  completed,
  showUnseenIndicator = false,
}: SessionHistoryCardProps) => {
  const colors = useThemeColors();

  const duration = calculateSessionDuration({ blocks: completed.blocks });

  const completedDate = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(completed.completedAt));

  const avgScore =
    Object.values(completed.metrics).reduce((a, b) => a + b, 0) /
    Object.values(completed.metrics).length;

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
              labels={METRICS_CONFIG.map(({ key, Icon, label }) => (
                <VStack key={key} gap={0.5} align="center">
                  <Icon size={16} color={colors.primaryHex} />
                  <Text fontSize="2xs" color="gray.500" lineHeight={1.2}>
                    {label}
                  </Text>
                </VStack>
              ))}
              size={130}
            />
          </Box>

          {/* Colonne droite — Stats + Blocs */}
          <VStack align="stretch" gap={2} p={3}>
            <HStack gap={2} color="gray.400" fontSize="xs">
              <LuClock size={12} />
              <Text>{formatDuration(duration)}</Text>
            </HStack>

            <Separator borderColor="whiteAlpha.100" />

            {/* Blocs avec exercices */}
            <VStack align="stretch" gap={2}>
              {completed.blocks.map((block, bi) => {
                const color = getBlockColor(block.type as Parameters<typeof getBlockColor>[0]);
                return (
                  <VStack key={bi} align="stretch" gap={0.5}>
                    <HStack gap={1.5}>
                      <Box
                        w="5px"
                        h="5px"
                        borderRadius="full"
                        bg={color}
                        flexShrink={0}
                      />
                      <Text fontSize="2xs" color={color} fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                        {getBlockLabel(block.type as Parameters<typeof getBlockLabel>[0])}
                      </Text>
                    </HStack>
                    {block.exercises.map((ex, ei) => {
                      const name = (ex.exercise as { name?: string })?.name ?? "—";
                      return (
                        <Text key={ei} fontSize="xs" color="gray.400" pl={3} lineClamp={1}>
                          {name}
                        </Text>
                      );
                    })}
                  </VStack>
                );
              })}
            </VStack>

            {completed.clientNotes && (
              <>
                <Separator borderColor="whiteAlpha.100" />
                <Text fontSize="xs" color="gray.400" fontStyle="italic" lineClamp={2}>
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
