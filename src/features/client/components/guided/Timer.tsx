import { useCountdown } from '../../useCountdown';
import { Box, HStack, Text } from '@chakra-ui/react';
import { formatCountdown } from '@/shared/utils/formatters';
import { useEffect, useState } from 'react';
import { LuTimer } from 'react-icons/lu';

interface TimerProps {
  duration: number;
  /**
   * Provided when the clock leads — an imposed rest, a timed round: it moves
   * on by itself, that is the format. Absent when it merely accompanies: a
   * timed set stops and waits, because nobody wants to watch the page change
   * under them while they finish their last rep.
   */
  onComplete?: () => void;
  couleur: string;
  /** The track under the gauge — darker on a light background. */
  track?: string;
  /** What reads to the left of the time: the block and the round, "Repos"… */
  title?: React.ReactNode;
  holdLabel?: string;
  /**
   * Smaller when it sits above a list: in an AMRAP the clock matters, but the
   * list of movements is what you came to read.
   */
  compact?: boolean;
  /**
   * `false` makes the clock wait for a tap.
   *
   * A rest starts on its own — it was triggered by the gesture that ended the
   * set. A round does not: the client has to pick up the bell first.
   */
  autoStart?: boolean;
  /** Called on the very first start, never on a resume. */
  onStart?: () => void;
}

export const Timer = ({
  duration,
  onComplete,
  couleur,
  track = 'whiteAlpha.200',
  title,
  holdLabel,
  compact = false,
  autoStart = true,
  onStart,
}: TimerProps) => {
  const { remaining, isRunning, pause, resume } = useCountdown(duration, {
    onComplete,
    autoStart,
  });
  const isDone = remaining === 0;
  // Never started, as opposed to started and paused: the two look alike on a
  // stopped clock but do not say the same thing, and what has to be said
  // first is « this is waiting for you ».
  const [started, setStarted] = useState(autoStart);

  useEffect(() => {
    if (remaining > 0 && remaining <= 3) {
      navigator.vibrate?.(150);
    }
  }, [remaining]);

  // A countdown that does not hand over by itself announces once, plainly:
  // nobody is looking at the screen at that moment.
  useEffect(() => {
    if (isDone && !onComplete) {
      navigator.vibrate?.([120, 80, 120]);
    }
  }, [isDone, onComplete]);

  const lu = formatCountdown(remaining);
  const part =
    duration > 0 ? Math.max(0, Math.min(1, remaining / duration)) : 0;

  return (
    <Box
      as="button"
      w="full"
      textAlign="left"
      onClick={
        isDone
          ? undefined
          : () => {
              if (isRunning) return pause();
              if (!started) {
                setStarted(true);
                onStart?.();
              }
              resume();
            }
      }
      cursor={isDone ? 'default' : 'pointer'}
      // The remaining time is part of the name: without it, someone who
      // cannot see the screen may pause without ever knowing where they are.
      aria-label={
        isDone
          ? 'Temps écoulé'
          : !started
            ? `Lancer le décompte — ${lu}`
            : `${isRunning ? 'Mettre en pause' : 'Reprendre le décompte'} — ${lu} restant`
      }
    >
      <HStack justify="space-between" align="flex-end" gap={3}>
        {/* The hint sits under the title rather than under the gauge: the
            left column is shorter than the figure on the right, so it costs
            no height at all. Adding a line below cost 20 px, which is what a
            phone lying flat does not have. */}
        <Box minW={0}>
          {title}
          {!isDone && !isRunning && (
            <Text fontSize="2xs" color={couleur} opacity={0.75} mt={1}>
              {started ? 'Toucher pour reprendre' : 'Toucher pour lancer'}
            </Text>
          )}
        </Box>
        <Text
          fontSize={compact ? '40px' : '72px'}
          fontWeight="800"
          lineHeight="0.85"
          letterSpacing={compact ? '-1px' : '-3px'}
          fontVariantNumeric="tabular-nums"
          color={couleur}
          opacity={isRunning || isDone ? 1 : 0.5}
          flexShrink={0}
        >
          {lu}
        </Text>
      </HStack>

      <Box
        mt={compact ? 2 : 3}
        h={compact ? '6px' : '10px'}
        borderRadius="full"
        bg={track}
        overflow="hidden"
      >
        <Box
          h="100%"
          borderRadius="full"
          bg={couleur}
          style={{
            width: `${part * 100}%`,
            transition: isRunning ? 'width 1s linear' : 'none',
          }}
        />
      </Box>

      {isDone && holdLabel ? (
        <Text fontSize="sm" color={couleur} opacity={0.75} mt={2}>
          {holdLabel}
        </Text>
      ) : null}
    </Box>
  );
};

/**
 * A countdown offered rather than imposed.
 *
 * The page-by-page flow gave a full-screen stopwatch to every timed set and
 * every rest. It is that staging the field feedback refused — "not 7 reps
 * back squat, then 120 s rest, then 6 reps" — not the stopwatch itself, which
 * was useful. Removing it along with the screen would throw out the useful
 * thing with its bad presentation.
 *
 * So it lives under the line that prescribes it: "2 min" for the work,
 * "45 s rest" for what follows. You start it when you get there, and it turns
 * back into a button once done — because three sets remain.
 */
export const OnDemandTimer = ({
  duration,
  label,
  couleur,
}: {
  duration: number;
  label: string;
  couleur: string;
}) => {
  const [isCurrent, setEnCours] = useState(false);

  if (isCurrent)
    return (
      <Box pl={4} py={1}>
        <Timer
          duration={duration}
          couleur={couleur}
          onComplete={() => {
            // Nobody is looking at the screen at that moment: we say it to
            // the wrist. `Timer` only does so itself without `onComplete`.
            navigator.vibrate?.([120, 80, 120]);
            setEnCours(false);
          }}
          compact
        />
      </Box>
    );

  return (
    <Box pl={4}>
      <Box
        as="button"
        onClick={() => setEnCours(true)}
        aria-label={`Lancer le décompte — ${label}`}
        minH="44px"
        display="flex"
        alignItems="center"
        fontSize="xs"
        color={couleur}
        fontWeight="bold"
        _hover={{ opacity: 0.8 }}
      >
        <HStack gap={1.5}>
          <LuTimer size={13} />
          <Text as="span">{label}</Text>
        </HStack>
      </Box>
    </Box>
  );
};
