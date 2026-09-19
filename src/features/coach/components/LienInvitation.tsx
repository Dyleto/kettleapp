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
 * Le lien, écrit en toutes lettres, quand rien d'autre n'a marché.
 *
 * Le presse-papier se refuse plus souvent qu'on ne le croit : contexte non
 * sécurisé, permission retirée, activation perdue par un aller-retour réseau.
 * Kettle affichait alors le lien dans un bandeau de vingt secondes — le seul
 * endroit de l'application où une information qu'on ne peut pas reconstituer
 * disparaissait toute seule. Passé le délai, le coach n'avait plus rien, et
 * rien ne lui disait qu'il venait de perdre quelque chose.
 *
 * Une fenêtre, donc, qui attend qu'on la ferme. Le lien y est sélectionnable
 * et sélectionné d'un geste : sur un téléphone, « tout sélectionner » est
 * plus sûr que viser le début d'une adresse de soixante caractères.
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

  // Ici, le clic est tout frais : c'est la tentative qui a le plus de chances
  // d'aboutir, et elle ne coûte rien si elle échoue encore.
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
