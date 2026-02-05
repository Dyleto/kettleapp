import { VStack } from "@chakra-ui/react";
import { Card } from "@/components/Card";
import { Session } from "@/types";
import { SessionHeader } from "./SessionHeader";
import { WarmupSection } from "./WarmupSection";
import { WorkoutSection } from "./WorkoutSection";
import { calculateSessionDuration } from "@/utils/sessionUtils";
import { useThemeColors } from "@/hooks/useThemeColors";

interface SessionCardProps {
  session: Session;
  interactive?: boolean;
}

export const SessionCard = ({
  session,
  interactive = true,
}: SessionCardProps) => {
  const colors = useThemeColors();

  return (
    <Card
      p={0}
      accentColor={colors.primary}
      hoverEffect={interactive ? "both" : "none"}
      onClick={interactive ? undefined : undefined}
    >
      <VStack align="stretch" gap={0}>
        <SessionHeader
          order={session.order}
          duration={calculateSessionDuration(session)}
        />

        {session.warmup?.exercises && (
          <WarmupSection exercises={session.warmup.exercises} />
        )}

        <WorkoutSection
          exercises={session.workout.exercises}
          rounds={session.workout.rounds}
          restBetweenRounds={session.workout.restBetweenRounds}
        />
      </VStack>
    </Card>
  );
};
