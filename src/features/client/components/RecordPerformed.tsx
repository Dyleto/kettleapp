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
  /** Closed without going further: back to the session. */
  onCancel: () => void;
  /** On to how it felt, whether or not the loads were recorded. */
  onContinue: () => void;
}

/**
 * Recording your loads once the session is over — and only if you want to.
 *
 * The "weight / reps" fields used to live under every exercise on the
 * session screen, visible before you had even started: you read a program
 * covered in empty boxes, without quite knowing what they were waiting for.
 * They now come at the end, behind a question you can answer no to.
 *
 * Two surfaces, sized to what you do on them: a small box for the question,
 * the full screen for the entry. Opening a full-screen panel for two buttons
 * is already too much ceremony.
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
      {/* Centred: on mobile the box used to stick to the top of the screen,
          far from the thumb and far from the gesture just finished. */}
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

              {/* Two ordinary answers, of the same shape and the same size.
                  A ghost button next to a solid one does not compare: it
                  reads as an emergency exit, whereas "non merci" leads to
                  exactly the same place. */}
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
