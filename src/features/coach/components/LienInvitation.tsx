import {
  Box,
  Button,
  Dialog,
  HStack,
  Portal,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useRef, useState } from 'react';
import { LuCheck, LuCopy } from 'react-icons/lu';
import { useBackDismiss } from '@/hooks/useBackDismiss';
import { echeanceLien } from '../invitation';

interface Props {
  lien: string | null;
  expiresAt?: string;
  onClose: () => void;
}

/**
 * The link, spelled out, when nothing else worked.
 *
 * The clipboard refuses more often than people think: insecure context,
 * permission withdrawn, activation lost to a network round-trip. Kettle then
 * showed the link in a twenty-second toast — the one place in the app where
 * information you cannot reconstruct vanished by itself. Past the delay the
 * coach had nothing, and nothing told them they had just lost something.
 *
 * A dialog, then, that waits to be closed. The link there is selectable and
 * selected in one gesture: on a phone, "select all" is safer than aiming at
 * the start of a sixty-character address.
 */
export const LienInvitation = ({ lien, expiresAt, onClose }: Props) => {
  const champ = useRef<HTMLParagraphElement>(null);
  const [copie, setCopie] = useState(false);
  const ouvert = lien !== null;

  useBackDismiss(ouvert, onClose);

  const selectionner = () => {
    const n = champ.current;
    if (!n) return;
    const plage = document.createRange();
    plage.selectNodeContents(n);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(plage);
  };

  // Here the click is brand new: this is the attempt most likely to succeed,
  // and it costs nothing if it fails again.
  const recopier = async () => {
    if (!lien) return;
    try {
      await navigator.clipboard.writeText(lien);
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    } catch {
      selectionner();
    }
  };

  return (
    <Dialog.Root
      open={ouvert}
      onOpenChange={(e) => !e.open && onClose()}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            bg="bg.canvas"
            borderColor="whiteAlpha.100"
            borderWidth="1px"
            maxW="sm"
          >
            <Dialog.Header>
              <VStack align="start" gap={1}>
                <Dialog.Title>Le lien d&rsquo;invitation</Dialog.Title>
                <Text fontSize="sm" color="fg.muted" fontWeight="normal">
                  Votre navigateur n&rsquo;a pas voulu le copier. Le voici —
                  envoyez-le à votre client, il rejoindra votre suivi.
                </Text>
              </VStack>
            </Dialog.Header>

            <Dialog.Body pb={5}>
              <VStack align="stretch" gap={3}>
                <Box
                  as="button"
                  onClick={selectionner}
                  textAlign="left"
                  bg="whiteAlpha.100"
                  borderRadius="md"
                  px={3}
                  py={2.5}
                  minH="44px"
                >
                  <Text
                    ref={champ}
                    fontSize="xs"
                    fontFamily="mono"
                    wordBreak="break-all"
                    userSelect="all"
                  >
                    {lien}
                  </Text>
                </Box>
                {expiresAt && (
                  <Text fontSize="xs" color="fg.muted">
                    {echeanceLien(expiresAt)}
                  </Text>
                )}
                <HStack gap={2}>
                  <Button
                    flex={1}
                    minH="44px"
                    bg={copie ? 'app.success' : 'app.primary'}
                    color="bg.canvas"
                    fontWeight="bold"
                    onClick={recopier}
                  >
                    {copie ? <LuCheck /> : <LuCopy />}
                    {copie ? 'Copié' : 'Copier'}
                  </Button>
                  <Button
                    variant="ghost"
                    color="fg.muted"
                    minH="44px"
                    onClick={onClose}
                  >
                    Fermer
                  </Button>
                </HStack>
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
