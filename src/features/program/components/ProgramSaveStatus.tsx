import { useEffect, useState } from 'react';
import { Box, HStack, Spinner, Text } from '@chakra-ui/react';
import { LuCheck, LuTriangleAlert } from 'react-icons/lu';
import type { SaveState } from '@/features/program/hooks/useProgramAutoSave';
import { useClaimBottomBar } from '@/shared/hooks/useBottomBar';

interface Props {
  state: SaveState;
  savedAt: Date | null;
  onRetry: () => void;
}

/** How long "Enregistré" stays on screen before fading out. */
const CONFIRMATION_DURATION = 2500;

/**
 * L'état de l'enregistrement automatique, en une ligne.
 *
 * Le parti pris : ne rien montrer quand tout va bien depuis un moment. Le
 * coach n'a pas à surveiller une barre pour se sentir en sécurité — c'est
 * précisément ce que l'enregistrement automatique lui épargne. La ligne
 * n'apparaît que pendant un enregistrement, brièvement après pour confirmer,
 * et elle s'installe pour de bon si quelque chose échoue.
 */
export const ProgramSaveStatus = ({ state, savedAt, onRetry }: Props) => {
  // On retient le dernier enregistrement *expiré* plutôt qu'un booléen :
  // l'état n'est alors écrit que depuis le minuteur, jamais pendant un rendu
  // ni au montage de l'effet.
  const [cleared, setCleared] = useState<Date | null>(null);

  useEffect(() => {
    if (!savedAt) return;
    const timer = setTimeout(() => setCleared(savedAt), CONFIRMATION_DURATION);
    return () => clearTimeout(timer);
  }, [savedAt]);

  const confirmed = savedAt !== null && cleared !== savedAt;

  // « En attente » et « en vol » sont un seul état pour qui regarde : les
  // distinguer ferait clignoter la ligne à chaque frappe.
  const inFlight = state === 'pending' || state === 'saving';
  const failed = state === 'error';
  const visible = inFlight || failed || confirmed;

  // Seul un échec réclame le bas de l'écran. Un enregistrement qui se passe
  // bien ne prend rien au coach : ce qu'il vient d'écrire est en route, et
  // naviguer ailleurs ne lui coûte rien. L'échec est celui qui dure, et qui
  // n'a pas d'ailleurs à offrir.
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
      {/* En cas d'échec la ligne a pris la place de la barre d'onglets,
          elle se pose donc au ras du bas de l'écran. Pendant un
          enregistrement qui se passe bien, les onglets sont encore là et elle
          doit se poser au-dessus. */}
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
