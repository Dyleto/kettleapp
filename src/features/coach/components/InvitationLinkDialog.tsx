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
import { linkExpiry } from '../invitation';

interface Props {
  link: string | null;
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
export const InvitationLinkDialog = ({ link, expiresAt, onClose }: Props) => {
  const field = useRef<HTMLParagraphElement>(null);
  const [copied, setCopied] = useState(false);
  const isOpen = link !== null;

  useBackDismiss(isOpen, onClose);

  const selectAll = () => {
    const n = field.current;
    if (!n) return;
    const range = document.createRange();
    range.selectNodeContents(n);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };

  // Here the click is brand new: this is the attempt most likely to succeed,
  // and it costs nothing if it fails again.
  const copyAgain = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      selectAll();
    }
  };

  return (
    <Dialog.Root
      open={isOpen}
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
                  onClick={selectAll}
                  textAlign="left"
                  bg="whiteAlpha.100"
                  borderRadius="md"
                  px={3}
                  py={2.5}
                  minH="44px"
                >
                  <Text
                    ref={field}
                    fontSize="xs"
                    fontFamily="mono"
                    wordBreak="break-all"
                    userSelect="all"
                  >
                    {link}
                  </Text>
                </Box>
                {expiresAt && (
                  <Text fontSize="xs" color="fg.muted">
                    {linkExpiry(expiresAt)}
                  </Text>
                )}
                <HStack gap={2}>
                  <Button
                    flex={1}
                    minH="44px"
                    bg={copied ? 'app.success' : 'app.primary'}
                    color="bg.canvas"
                    fontWeight="bold"
                    onClick={copyAgain}
                  >
                    {copied ? <LuCheck /> : <LuCopy />}
                    {copied ? 'Copié' : 'Copier'}
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
