import { Button, Dialog, Text, VStack } from '@chakra-ui/react';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  /** "Refuser le partage ?" on the way in, "Retirer mon accord ?" after. */
  title: string;
  /** Le libellé de l'action, qui doit dire ce qu'elle fait. */
  action: string;
  /** Combien de bilans portent encore une étiquette ou un commentaire. */
  count: number;
}

/**
 * Ce qu'on annonce avant d'effacer.
 *
 * Refuser de partager n'efface pas que l'avenir : ce qui a déjà été collecté
 * part aussi, sans quoi le refus ne serait qu'un affichage et la donnée
 * resterait en base sans plus rien pour la justifier. C'est sans retour, donc
 * c'est dit avant — avec le nombre réel, pas une formule vague.
 *
 * La boîte ne s'ouvre que s'il y a quelque chose à perdre. Sur un compte qui
 * n'a encore rien déclaré, refuser reste un seul geste : mettre un obstacle
 * devant un refus sans objet, c'est décourager le refus.
 */
export const ConfirmHealthOptOut = ({
  open,
  onClose,
  onConfirm,
  isPending,
  title,
  action,
  count,
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
          <Dialog.Title>{title}</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <VStack align="stretch" gap={3}>
            <Text fontSize="sm" color="fg" lineHeight="1.65">
              {count === 1
                ? 'Une séance porte une étiquette de ressenti ou un commentaire.'
                : `${count} séances portent une étiquette de ressenti ou un commentaire.`}{' '}
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
