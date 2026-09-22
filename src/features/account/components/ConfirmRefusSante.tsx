import { Button, Dialog, Text, VStack } from '@chakra-ui/react';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  /** "Refuser le partage ?" on the way in, "Retirer mon accord ?" after. */
  titre: string;
  /** The action's label, which has to say what it does. */
  action: string;
  /** How many wrap-ups still carry a tag or a comment. */
  nombre: number;
}

/**
 * What is announced before erasing.
 *
 * Refusing to share does not only erase the future: what has already been
 * collected goes too, otherwise the refusal would be mere display and the
 * data would stay in the database with nothing to justify it. It cannot be
 * undone, so it is said beforehand — with the real number, not a vague
 * phrase.
 *
 * The dialog only opens when there is something to lose. On an account that
 * has declared nothing yet, refusing stays a single gesture: putting an
 * obstacle in front of a refusal with no object is discouraging the refusal.
 */
export const ConfirmRefusSante = ({
  open,
  onClose,
  onConfirm,
  isPending,
  titre,
  action,
  nombre,
}: Props) => (
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
          <Dialog.Title>{titre}</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <VStack align="stretch" gap={3}>
            <Text fontSize="sm" color="fg" lineHeight="1.65">
              {nombre === 1
                ? 'Une séance porte une étiquette de ressenti ou un commentaire.'
                : `${nombre} séances portent une étiquette de ressenti ou un commentaire.`}{' '}
              Ces étiquettes et ces commentaires seront effacés, et ça ne se
              rattrape pas.
            </Text>
            <Text fontSize="sm" color="fg.muted" lineHeight="1.65">
              Mes charges, mes séries et mon niveau d'effort restent, et mon
              coach continue de les voir.
            </Text>
          </VStack>
        </Dialog.Body>
        <Dialog.Footer flexDirection="column" alignItems="stretch" gap={2}>
          <Button
            bg="app.error"
            color="bg.canvas"
            fontWeight="bold"
            minH="48px"
            loading={isPending}
            onClick={onConfirm}
          >
            {action}
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
