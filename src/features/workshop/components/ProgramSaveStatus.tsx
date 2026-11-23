import { useEffect, useState } from 'react';
import { Box, chakra, HStack, Spinner, Text } from '@chakra-ui/react';
import { LuCheck, LuTriangleAlert } from 'react-icons/lu';
import type { SaveState } from '@/features/workshop/hooks/useProgramAutoSave';
import { useClaimBottomBar } from '@/shared/hooks/useBottomBar';
import { useOnline } from '@/shared/hooks/useOnline';

interface Props {
  state: SaveState;
  savedAt: Date | null;
  onRetry: () => void;
}

/** Combien de temps « Enregistré » reste à l'écran avant de s'effacer : les
 * trois secondes de la maquette. */
const CONFIRMATION_DURATION = 3000;

/**
 * Ce que l'enregistrement automatique a à dire, et rien quand tout va bien
 * depuis un moment.
 *
 * Le parti pris : le coach n'a pas à surveiller une ligne pour se sentir en
 * sécurité — c'est précisément ce que l'enregistrement automatique lui
 * épargne. L'état n'apparaît que pendant un enregistrement, trois secondes
 * après pour confirmer, et il reste si quelque chose échoue, jusqu'à ce
 * qu'un enregistrement réussisse.
 */
const useSaveSignal = (
  state: SaveState,
  savedAt: Date | null
): 'saving' | 'saved' | 'failed' | 'offline' | null => {
  const online = useOnline();
  // On retient le dernier enregistrement *expiré* plutôt qu'un booléen :
  // l'état n'est alors écrit que depuis le minuteur, jamais pendant un rendu
  // ni au montage de l'effet.
  const [cleared, setCleared] = useState<Date | null>(null);

  useEffect(() => {
    if (!savedAt) return;
    const timer = setTimeout(() => setCleared(savedAt), CONFIRMATION_DURATION);
    return () => clearTimeout(timer);
  }, [savedAt]);

  // Sans réseau, l'envoi n'échoue pas : TanStack Query le met en pause et
  // le reprend au retour. La ligne disait « Enregistrement… » sans fin, ce
  // qui ressemblait à une application figée. Elle dit ce qui est vrai — ce
  // n'est pas enregistré — et ne propose pas de réessayer, puisque l'envoi
  // repartira seul.
  if (!online && state !== 'idle') return 'offline';
  if (state === 'error') return 'failed';
  // « En attente » et « en vol » sont un seul état pour qui regarde : les
  // distinguer ferait clignoter la ligne à chaque frappe.
  if (state === 'pending' || state === 'saving') return 'saving';
  if (savedAt !== null && cleared !== savedAt) return 'saved';
  return null;
};

/**
 * L'état de l'enregistrement dans l'en-tête de la séance, à droite, avant
 * son « ⋯ » : là où la maquette le pose, et là où le regard du coach est
 * déjà. Il vivait en bas de page, loin de ce qu'on venait d'écrire.
 *
 * À partir de `md` seulement : sur téléphone, l'en-tête cède sa place, et
 * la ligne du bas (`ProgramSaveStatus`) dit la même chose.
 */
export const SaveStatus = ({ state, savedAt, onRetry }: Props) => {
  const signal = useSaveSignal(state, savedAt);
  if (!signal) return null;
  return (
    <chakra.span
      role="status"
      display={{ base: 'none', md: 'inline-flex' }}
      alignItems="center"
      gap="8px"
      fontSize="13px"
      fontWeight="600"
      color={
        signal === 'failed' || signal === 'offline'
          ? 'session.work.fg'
          : signal === 'saved'
            ? 'session.rest.fg'
            : 'fg.muted'
      }
      data-save-status={signal}
    >
      {signal === 'offline' ? (
        <>
          <LuTriangleAlert size={16} aria-hidden />
          Non enregistré · envoi au retour du réseau
        </>
      ) : signal === 'failed' ? (
        <>
          <LuTriangleAlert size={16} aria-hidden />
          Non enregistré ·
          <chakra.button
            type="button"
            onClick={onRetry}
            fontWeight="800"
            textDecoration="underline"
            textUnderlineOffset="3px"
          >
            Réessayer
          </chakra.button>
        </>
      ) : signal === 'saving' ? (
        <>
          <Spinner size="xs" />
          Enregistrement…
        </>
      ) : (
        <>
          <LuCheck size={16} aria-hidden />
          Enregistré
        </>
      )}
    </chakra.span>
  );
};

/**
 * La même chose en une ligne au bas de l'écran : sur téléphone, où
 * l'en-tête de la séance cède sa place, et partout où il n'y a pas de séance
 * ouverte pour porter l'en-tête — supprimer la dernière séance s'enregistre
 * aussi.
 */
export const ProgramSaveStatus = ({
  state,
  savedAt,
  onRetry,
  phoneOnly = false,
}: Props & {
  /** L'en-tête de la séance dit déjà l'état à partir de `md`. */
  phoneOnly?: boolean;
}) => {
  const signal = useSaveSignal(state, savedAt);
  const failed = signal === 'failed';
  const inFlight = signal === 'saving';
  const visible = signal !== null;

  // Seul un échec réclame le bas de l'écran. Un enregistrement qui se passe
  // bien ne prend rien au coach : ce qu'il vient d'écrire est en route, et
  // naviguer ailleurs ne lui coûte rien. L'échec est celui qui dure, et qui
  // n'a pas d'ailleurs à offrir.
  useClaimBottomBar(failed);

  if (!visible) return null;

  return (
    <Box
      display={phoneOnly ? { base: 'block', md: 'none' } : 'block'}
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
        {signal === 'offline' ? (
          <>
            <Box color="app.error" display="flex">
              <LuTriangleAlert size={14} />
            </Box>
            <Text fontSize="sm" color="app.error" mr="auto">
              Non enregistré · envoi au retour du réseau
            </Text>
          </>
        ) : failed ? (
          <>
            <Box color="app.error" display="flex">
              <LuTriangleAlert size={14} />
            </Box>
            <Text fontSize="sm" color="app.error" mr="auto">
              Non enregistré
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
