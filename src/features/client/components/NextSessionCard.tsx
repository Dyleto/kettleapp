import { Card } from "@/components/Card";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Session } from "@/types";
import { calculateSessionDuration } from "@/utils/sessionUtils";
import { formatDuration } from "@/utils/formatters";
import { WarmupSection } from "@/features/program/components/WarmupSection";
import { WorkoutSection } from "@/features/program/components/WorkoutSection";
import { Box, Button, HStack, Separator, Text, VStack } from "@chakra-ui/react";
import { LuArrowRight, LuClock, LuZap } from "react-icons/lu";
import { keyframes } from "@emotion/react";

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
`;

interface NextSessionCardProps {
  session: Session;
  onComplete: () => void;
}

export const NextSessionCard = ({
  session,
  onComplete,
}: NextSessionCardProps) => {
  const colors = useThemeColors();
  const duration = calculateSessionDuration(session);

  return (
    <Box style={{ filter: `drop-shadow(0 0 16px ${colors.primaryHex}50)` }}>
      <Card accentColor={colors.primary} p={0}>
        {/* Header */}
        <Box
          px={6}
          pt={4}
          pb={4}
          style={{
            background: `linear-gradient(135deg, ${colors.primaryHex}18 0%, transparent 60%)`,
          }}
        >
          <HStack justify="space-between" align="center">
            <VStack align="start" gap={1}>
              <HStack gap={2}>
                {/* Badge pulsant */}
                <HStack
                  gap={1.5}
                  px={2}
                  py={0.5}
                  borderRadius="full"
                  bg={`${colors.primaryHex}20`}
                  borderWidth="1px"
                  borderColor={`${colors.primaryHex}40`}
                >
                  <Box
                    w="6px"
                    h="6px"
                    borderRadius="full"
                    bg={colors.primary}
                    animation={`${pulse} 2s ease-in-out infinite`}
                  />
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color={colors.primary}
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    À faire
                  </Text>
                </HStack>
              </HStack>
              <HStack gap={2} align="baseline">
                <LuZap size={16} color={colors.primaryHex} />
                <Text fontSize="2xl" fontWeight="bold">
                  Séance {session.order}
                </Text>
              </HStack>
            </VStack>

            <HStack gap={1} color="gray.400" fontSize="sm">
              <LuClock size={14} />
              <Text>{formatDuration(duration)}</Text>
            </HStack>
          </HStack>
        </Box>

        <Separator borderColor="whiteAlpha.100" />

        {/* Contenu de la séance */}
        <VStack align="stretch" gap={4} py={4}>
          {session.notes && (
            <Box
              mx={6}
              p={3}
              bg="whiteAlpha.50"
              borderRadius="md"
              borderLeft="3px solid"
              borderLeftColor={colors.primaryBorder}
            >
              <Text fontSize="xs" color="gray.400" mb={1} fontWeight="bold">
                Note du coach
              </Text>
              <Text fontSize="sm" color="gray.300">
                {session.notes}
              </Text>
            </Box>
          )}

          <WarmupSection exercises={session.warmup?.exercises || []} />

          <WorkoutSection
            exercises={session.workout.exercises}
            rounds={session.workout.rounds}
            restBetweenRounds={session.workout.restBetweenRounds}
          />
        </VStack>

        <Separator borderColor="whiteAlpha.100" />

        {/* CTA */}
        <Box px={6} py={4}>
          <Button
            w="full"
            bg={colors.primary}
            color="gray.900"
            fontWeight="bold"
            size="lg"
            onClick={onComplete}
            _hover={{ bg: colors.primaryHover }}
          >
            J'ai terminé cette séance <LuArrowRight />
          </Button>
        </Box>
      </Card>
    </Box>
  );
};
