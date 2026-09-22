import { Button, Dialog, HStack, Text, VStack } from '@chakra-ui/react';
import { LuTrash2 } from 'react-icons/lu';
import { useDeleteAccount } from '../hooks/useAccount';

interface Props {
  open: boolean;
  onClose: () => void;
  /** What disappears, spelled out, with the real numbers. */
  consequences: string[];
  tutoiement: boolean;
}

/**
 * The deletion confirmation.
 *
 * It lists what goes rather than asking "are you sure": the question informs
 * nobody, the list does. And the destructive button sits above "Annuler" — on
 * a phone the thumb lands at the bottom, and that is where you want the way
 * out.
 */
export const DeleteAccountDialog = ({
  open,
  onClose,
  consequences,
  tutoiement,
}: Props) => {
  const { mutate, isPending } = useDeleteAccount();

  return (
    <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          bg="bg.canvas"
          borderColor="whiteAlpha.100"
          borderWidth="1px"
          maxW="sm"
        >
          <Dialog.Header>
            <Dialog.Title>
              Supprimer {tutoiement ? 'ton' : 'votre'} compte ?
            </Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <VStack align="stretch" gap={3}>
              <Text fontSize="sm" color="fg.muted">
                Voici ce qui disparaît, sans retour possible :
              </Text>
              <VStack as="ul" align="stretch" gap={2} listStyleType="none">
                {consequences.map((ligne) => (
                  <HStack as="li" key={ligne} gap={2.5} align="baseline">
                    <Text as="span" color="app.error" flexShrink={0}>
                      —
                    </Text>
                    <Text as="span" fontSize="sm" color="fg">
                      {ligne}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </VStack>
          </Dialog.Body>
          <Dialog.Footer flexDirection="column" alignItems="stretch" gap={2}>
            <Button
              bg="app.error"
              color="bg.canvas"
              fontWeight="bold"
              minH="48px"
              loading={isPending}
              onClick={() => mutate()}
            >
              <LuTrash2 /> Supprimer définitivement
            </Button>
            <Button
              variant="ghost"
              color="fg.muted"
              minH="48px"
              disabled={isPending}
              onClick={onClose}
            >
              Annuler
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};
