import { useEffect, useState } from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import { formatCountdown, formatDuration } from '@/shared/utils/duration';
import { useCountdown } from '@/features/client/guided/useCountdown';
import { playCue } from '@/shared/feedback/sound';
import { useScenePaused } from '@/features/client/guided/PauseContext';
import { Ring } from '@/kit';
import { buzz } from '@/shared/feedback/haptics';

interface DurationRingProps {
  /** La durée prescrite, en secondes. */
  duration: number;
  /** À zéro : la série est faite. */
  onDone: () => void;
  /** « Remettre à 2 min » : repartir d'un anneau plein. */
  onReset: () => void;
}

/**
 * Un exercice qui se fait en temps : l'anneau remplace le nombre.
 *
 * « 2 min » écrit en grand ne dit pas combien il en reste, et le petit
 * chrono qu'on lançait dessous se lisait à un mètre. L'anneau se lit à
 * deux, et à zéro la série se coche seule : on n'a pas à lâcher la corde
 * pour toucher l'écran.
 *
 * Il attend une touche : on le lance quand on est prêt, pas quand l'écran
 * change.
 */
export const DurationRing = ({
  duration,
  onDone,
  onReset,
}: DurationRingProps) => {
  const frozen = useScenePaused();
  const [started, setStarted] = useState(false);
  const { remaining, isRunning, pause, resume } = useCountdown(duration, {
    autoStart: false,
    frozen,
    onComplete: () => {
      playCue('go');
      onDone();
    },
  });

  useEffect(() => {
    if (isRunning && !frozen && remaining > 0 && remaining <= 3) {
      buzz('tick');
      playCue('tick');
    }
  }, [remaining, isRunning, frozen]);

  const readable = formatCountdown(remaining);

  return (
    <VStack gap={2}>
      <Box
        as="button"
        aria-label={
          !started
            ? `Lancer le décompte — ${readable}`
            : `${isRunning ? 'Mettre en pause' : 'Reprendre le décompte'} — ${readable} restant`
        }
        borderRadius="full"
        onClick={() => {
          if (isRunning) return pause();
          setStarted(true);
          resume();
        }}
      >
        <Ring
          part={duration > 0 ? remaining / duration : 0}
          size={240}
          color={
            remaining <= 3 && isRunning
              ? 'var(--chakra-colors-session-work-fg)'
              : 'var(--chakra-colors-app-primary)'
          }
        >
          <Text
            fontFamily="heading"
            fontSize="80px"
            fontWeight="800"
            fontStretch="76%"
            lineHeight="0.9"
            fontVariantNumeric="tabular-nums"
          >
            {readable}
          </Text>
          <Text fontSize="14px" color="fg.muted" fontWeight="600">
            {started
              ? `sur ${formatDuration(duration)}`
              : 'Toucher pour lancer'}
          </Text>
        </Ring>
      </Box>
      {/* Seulement une fois lancé : avant, l'anneau est déjà plein, et le
          lien promettait de remettre ce qui n'avait pas bougé. */}
      {started && (
        <Box
          as="button"
          minH="44px"
          fontSize="13px"
          fontWeight="bold"
          color="fg.muted"
          onClick={onReset}
          _hover={{ color: 'fg' }}
        >
          Remettre à {formatDuration(duration)}
        </Box>
      )}
    </VStack>
  );
};
