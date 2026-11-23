import { useState } from 'react';
import {
  Box,
  chakra,
  Dialog,
  HStack,
  Portal,
  Text,
  VStack,
} from '@chakra-ui/react';
import { LuX } from 'react-icons/lu';
import { ActionButton } from '@/kit';
import { useDeleteAccount } from '../hooks/useAccount';

/** Le mot qui arme le bouton rouge. */
const WORD = 'SUPPRIMER';

/**
 * La confirmation de suppression du compte.
 *
 * Elle énumère ce qui part plutôt que de demander « es-tu sûr » : la
 * question n'informe personne, la liste si. Puis le mot à écrire : le
 * bouton rouge ne s'active qu'une fois « SUPPRIMER » tapé — la seule action
 * de Kettle qu'aucun « Annuler » ne rattrape, et qu'un double toucher
 * suffisait à lancer. Le mot se tape sans souci de la casse : c'est
 * l'intention qu'on demande, pas une épreuve.
 *
 * « Garder mon compte » est le bouton plein, en dessous : la sortie sûre a
 * la place et la couleur d'une action principale.
 */
export const DeleteAccountDialog = ({
  open,
  onClose,
  consequences,
}: {
  open: boolean;
  onClose: () => void;
  /** Ce qui disparaît, énoncé, avec les vrais nombres. */
  consequences: string[];
}) => {
  const { mutate, isPending, isError } = useDeleteAccount();
  const [typed, setTyped] = useState('');
  const armed = typed.trim().toUpperCase() === WORD;
  const close = () => {
    setTyped('');
    onClose();
  };

  return (
    <Dialog.Root
      role="alertdialog"
      open={open}
      onOpenChange={(e) => !e.open && !isPending && close()}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            bg="bg.surface"
            borderRadius="card"
            maxW="400px"
            mx={4}
          >
            <Dialog.Body pt={6}>
              <VStack align="stretch" gap="14px">
                <Dialog.Title asChild>
                  <Text as="h2" fontWeight="800" fontSize="22px">
                    Supprimer ton compte ?
                  </Text>
                </Dialog.Title>
                <Text color="fg.muted">C'est définitif. Seront effacés :</Text>
                <VStack
                  as="ul"
                  align="stretch"
                  gap="8px"
                  listStyleType="none"
                  data-delete-consequences
                >
                  {consequences.map((line) => (
                    <HStack as="li" key={line} gap="10px" align="start">
                      <Box color="app.error" pt="3px" aria-hidden>
                        <LuX size={18} />
                      </Box>
                      <Text>{line}</Text>
                    </HStack>
                  ))}
                </VStack>
                <chakra.input
                  aria-label={`Écris ${WORD} pour confirmer`}
                  placeholder={`Écris ${WORD} pour confirmer`}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  minH="50px"
                  px="16px"
                  borderRadius="17px"
                  bg="surface.card"
                  border="none"
                  outline="none"
                  boxShadow="inset 0 0 0 1.5px {colors.line}"
                  _focus={{ boxShadow: 'inset 0 0 0 2px {colors.app.error}' }}
                  color="fg"
                  _placeholder={{ color: 'fg.muted' }}
                />
                {isError && (
                  <Text role="alert" fontSize="sm" color="fg.muted">
                    La suppression n'a pas abouti : ton compte est intact.
                    Réessaie.
                  </Text>
                )}
                <ActionButton
                  tone="danger"
                  size="md"
                  w="full"
                  disabled={!armed}
                  loading={isPending}
                  onClick={() => mutate()}
                >
                  Supprimer définitivement
                </ActionButton>
                <ActionButton
                  size="md"
                  w="full"
                  disabled={isPending}
                  onClick={close}
                >
                  Garder mon compte
                </ActionButton>
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
