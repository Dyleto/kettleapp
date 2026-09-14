import { useEffect, useState } from 'react';
import { Box, HStack, Spinner, Text } from '@chakra-ui/react';
import { LuCheck, LuTriangleAlert } from 'react-icons/lu';
import type { SaveState } from '@/features/program/hooks/useProgramAutoSave';

interface Props {
  state: SaveState;
  savedAt: Date | null;
  onRetry: () => void;
}

/** Combien de temps « Enregistré » reste à l'écran avant de s'effacer. */
const DUREE_CONFIRMATION = 2500;

/**
 * L'état de l'enregistrement automatique, en une ligne.
 *
 * Le parti pris : ne rien afficher quand tout va bien depuis un moment. Le
 * coach n'a pas à surveiller une barre pour être tranquille — c'est
 * précisément ce dont l'enregistrement automatique le dispense. La ligne
 * n'apparaît que pendant un envoi, un court instant après pour confirmer, et
 * elle s'installe pour de bon si quelque chose échoue.
 */
export const ProgramSaveStatus = ({ state, savedAt, onRetry }: Props) => {
  // On retient le dernier enregistrement *périmé* plutôt qu'un booléen :
  // l'état ne s'écrit ainsi que depuis le minuteur, jamais pendant le rendu
  // ni au montage de l'effet.
  const [efface, setEfface] = useState<Date | null>(null);

  useEffect(() => {
    if (!savedAt) return;
    const minuteur = setTimeout(() => setEfface(savedAt), DUREE_CONFIRMATION);
    return () => clearTimeout(minuteur);
  }, [savedAt]);

  const confirme = savedAt !== null && efface !== savedAt;

  // « En attente » et « en cours » sont un seul état pour qui regarde : les
  // distinguer ferait clignoter la ligne à chaque frappe.
  const enCours = state === 'pending' || state === 'saving';
  const visible = enCours || state === 'error' || confirme;
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
      {/* Sous 768 px, la barre d'onglets est fixée en bas de l'écran. La
          ligne descend quand même jusqu'en bas — son fond masque le contenu
          qui défile — mais son texte se pose juste au-dessus des onglets,
          sinon l'échec passerait dessous sans jamais se voir. */}
      <HStack
        gap={2}
        pt={2.5}
        pb={{ base: 'calc(env(safe-area-inset-bottom, 0px) + 72px)', md: 2.5 }}
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
              _focusVisible={{
                outline: '2px solid',
                outlineColor: 'app.primary',
                outlineOffset: '2px',
              }}
            >
              Réessayer
            </Box>
          </>
        ) : enCours ? (
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
