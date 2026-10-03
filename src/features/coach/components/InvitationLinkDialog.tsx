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
import { useBackDismiss } from '@/shared/hooks/useBackDismiss';
import { linkExpiry } from '../invitation';

interface Props {
  link: string | null;
  expiresAt?: string;
  onClose: () => void;
}

/**
 * Le lien, écrit en toutes lettres, quand rien d'autre n'a marché.
 *
 * Le presse-papiers refuse plus souvent qu'on ne le croit : contexte non
 * sécurisé, permission retirée, activation perdue dans un aller-retour
 * réseau. Kettle affichait alors le lien dans un toast de vingt secondes — le
 * seul endroit de l'application où une information qu'on ne peut pas
 * reconstituer disparaissait d'elle-même. Passé le délai le coach n'avait
 * plus rien, et rien ne lui disait qu'il venait de perdre quelque chose.
 *
 * Une boîte, donc, qui attend qu'on la ferme. Le lien y est sélectionnable et
 * sélectionné d'un geste : sur un téléphone, « tout sélectionner » est plus
 * sûr que viser le début d'une adresse de soixante caractères.
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
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  // Ici le clic est tout neuf : c'est la tentative qui a le plus de chances
  // d'aboutir, et elle ne coûte rien si elle échoue encore.
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
