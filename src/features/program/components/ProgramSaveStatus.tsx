import { useEffect, useState } from 'react';
import { Box, HStack, Spinner, Text } from '@chakra-ui/react';
import { LuCheck, LuTriangleAlert } from 'react-icons/lu';
import type { SaveState } from '@/features/program/hooks/useProgramAutoSave';
import { useClaimBottomBar } from '@/hooks/useBottomBar';

interface Props {
  state: SaveState;
  savedAt: Date | null;
  onRetry: () => void;
}

/** How long "Enregistré" stays on screen before fading out. */
const CONFIRMATION_DURATION = 2500;

/**
 * The state of the autosave, in one line.
 *
 * The stance: show nothing when all has been well for a while. The coach
 * should not have to watch a bar to feel safe — that is precisely what
 * autosave spares them. The line only appears during a save, briefly after
 * it to confirm, and it settles in for good if something fails.
 */
export const ProgramSaveStatus = ({ state, savedAt, onRetry }: Props) => {
  // We hold on to the last *expired* save rather than a boolean: the state
  // is then only written from the timer, never during a render nor when the
  // effect mounts.
  const [cleared, setCleared] = useState<Date | null>(null);

  useEffect(() => {
    if (!savedAt) return;
    const timer = setTimeout(() => setCleared(savedAt), CONFIRMATION_DURATION);
    return () => clearTimeout(timer);
  }, [savedAt]);

  const confirmed = savedAt !== null && cleared !== savedAt;

  // "Pending" and "in flight" are a single state to whoever is looking:
  // distinguishing them would make the line flicker on every keystroke.
  const inFlight = state === 'pending' || state === 'saving';
  const failed = state === 'error';
  const visible = inFlight || failed || confirmed;

  // Only a failure claims the bottom of the screen. A save that goes well
  // takes nothing from the coach: what they just wrote is on its way, and
  // navigating elsewhere costs them nothing. A failure is the one that
  // lasts, and that has no elsewhere to offer.
  useClaimBottomBar(failed);

  if (!visible) return null;

  return (
    <Box
      position="sticky"
      bottom={0}
      zIndex={2}
      bg="bg.canvas"
      mt={6}
      borderTop="1px solid"
      borderColor="whiteAlpha.100"
    >
      {/* On failure the line has taken the tab bar's place, so it sits
          flush with the bottom of the screen. During a save that is going
          well the tabs are still there and it has to sit above them. */}
      <HStack
        gap={2}
        pt={2.5}
        pb={
          failed
            ? 'calc(env(safe-area-inset-bottom, 0px) + 10px)'
            : { base: 'calc(env(safe-area-inset-bottom, 0px) + 72px)', md: 2.5 }
        }
        justify="flex-end"
        role="status"
      >
        {state === 'error' ? (
          <>
            <Box color="app.error" display="flex">
              <LuTriangleAlert size={14} />
            </Box>
            <Text fontSize="sm" color="app.error" mr="auto">
              Modifications non enregistrées
            </Text>
            <Box
              as="button"
              onClick={onRetry}
              fontSize="sm"
              fontWeight="medium"
              color="app.primary"
              px={2}
              py={1}
              borderRadius="md"
              _hover={{ bg: 'app.primary/12' }}
            >
              Réessayer
            </Box>
          </>
        ) : inFlight ? (
          <>
            <Spinner size="xs" color="fg.muted" />
            <Text fontSize="sm" color="fg.muted">
              Enregistrement…
            </Text>
          </>
        ) : (
          <>
            <Box color="app.success" display="flex">
              <LuCheck size={14} />
            </Box>
            <Text fontSize="sm" color="fg.muted">
              Enregistré
            </Text>
          </>
        )}
      </HStack>
    </Box>
  );
};
