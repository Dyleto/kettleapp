import {
  Box,
  Button,
  Dialog,
  Drawer,
  Portal,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useState } from 'react';
import { LuPencil, LuX } from 'react-icons/lu';
import { PerformedValues, Session } from '@/types';
import { SessionDetail } from './SessionDetail';
import { LastPerformance } from '../lastPerformance';

interface RecordPerformedProps {
  session: Session;
  isOpen: boolean;
  performed: Record<string, PerformedValues>;
  onPerformedChange: (key: string, next: PerformedValues) => void;
  lastPerformance?: Map<string, LastPerformance>;
  /** Fermé sans aller plus loin : on revient à la séance. */
  onCancel: () => void;
  /** On passe au ressenti, que les charges aient été notées ou non. */
  onContinue: () => void;
}

/**
 * Noter ses charges, une fois la séance finie — et seulement si on le veut.
 *
 * Les champs « poids / reps » vivaient auparavant sous chaque exercice de
 * l'écran de séance, visibles avant même d'avoir commencé : on lisait un
 * programme couvert de cases vides, et on ne savait pas trop ce qu'elles
 * attendaient. Ils arrivent maintenant à la fin, derrière une question à
 * laquelle on peut répondre non.
 *
 * Deux surfaces, à la mesure de ce qu'on y fait : une petite boîte pour la
 * question, le plein écran pour la saisie. Ouvrir un panneau plein écran
 * pour deux boutons, c'est déjà trop de cérémonie.
 */
export const RecordPerformed = ({
  session,
  isOpen,
  performed,
  onPerformedChange,
  lastPerformance,
  onCancel,
  onContinue,
}: RecordPerformedProps) => {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <>
      {/* Centrée : sur mobile la boîte se collait en haut de l'écran, loin du
          pouce et loin du geste qu'on vient de finir. */}
      <Dialog.Root
        open={isOpen && !isRecording}
        onOpenChange={(e) => !e.open && onCancel()}
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
                  <Dialog.Title>Tu veux noter tes charges&nbsp;?</Dialog.Title>
                  <Text fontSize="sm" color="fg.muted" fontWeight="normal">
                    Le poids et les répétitions que tu as vraiment faits. Ton
                    coach les verra, et la prochaine fois on te rappellera ce
                    que tu avais mis.
                  </Text>
                </VStack>
              </Dialog.Header>

              {/* Deux réponses ordinaires, de même forme et de même taille.
                  Un bouton fantôme à côté d'un bouton plein ne se compare
                  pas : il se lit comme une sortie de secours, alors que « non
                  merci » mène exactement au même endroit. */}
              <Dialog.Footer gap={2} flexWrap="wrap">
                <Button
                  flex="1 1 140px"
                  minH="48px"
                  variant="outline"
                  borderColor="whiteAlpha.300"
                  color="fg"
                  onClick={onContinue}
                >
                  Passer au ressenti
                </Button>
                <Button
                  flex="1 1 140px"
                  minH="48px"
                  bg="app.primary"
                  color="bg.canvas"
                  fontWeight="bold"
                  onClick={() => setIsRecording(true)}
                  _hover={{ bg: 'app.primary.hover' }}
                >
                  <LuPencil size={14} /> Noter mes charges
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <Drawer.Root
        open={isOpen && isRecording}
        onOpenChange={(e) => !e.open && onCancel()}
        size={{ base: 'full', md: 'md' }}
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content bg="bg.canvas">
              <Drawer.Body p={5} pb="96px">
                <VStack align="stretch" gap={4}>
                  <Box>
                    <Text fontSize="lg" fontWeight="bold">
                      Tes charges
                    </Text>
                    <Text fontSize="sm" color="fg.muted">
                      Renseigne ce dont tu te souviens — tout est facultatif.
                    </Text>
                  </Box>

                  <SessionDetail
                    session={session}
                    performed={performed}
                    onPerformedChange={onPerformedChange}
                    lastPerformance={lastPerformance}
                  />
                </VStack>
              </Drawer.Body>

              <Box
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                p={4}
                bg="bg.canvas"
                borderTopWidth="1px"
                borderColor="whiteAlpha.100"
              >
                <Button
                  w="full"
                  bg="app.primary"
                  color="bg.canvas"
                  fontWeight="bold"
                  size="lg"
                  onClick={onContinue}
                  _hover={{ bg: 'app.primary.hover' }}
                >
                  Continuer vers le ressenti
                </Button>
              </Box>

              <Drawer.CloseTrigger asChild>
                <Box
                  as="button"
                  aria-label="Fermer"
                  position="absolute"
                  top={2}
                  right={2}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  minW="44px"
                  minH="44px"
                  color="fg.muted"
                  _hover={{ color: 'fg' }}
                >
                  <LuX size={18} />
                </Box>
              </Drawer.CloseTrigger>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </>
  );
};
