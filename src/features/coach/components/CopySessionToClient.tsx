import {
  Avatar,
  Box,
  Dialog,
  HStack,
  Portal,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useState } from 'react';
import { LuCopy } from 'react-icons/lu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { coachService } from '@/services/coachService';
import { queryKeys } from '@/config/queryKeys';
import { toaster } from '@/components/ui/toasterInstance';
import { useClients } from '@/features/coach/hooks/useClients';
import { useBackDismiss } from '@/hooks/useBackDismiss';
import { hitArea } from '@/components/hitArea';

interface CopySessionToClientProps {
  sourceClientId: string;
  sourceSessionId: string;
  /** The session's displayed number — "Séance 3". */
  sessionOrder: number;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Placing a session with another client.
 *
 * From the field: "a shame not to be able to copy the session and paste it
 * to another client. That would be more useful than duplicating it."
 *
 * A list of names, one per line, and that is all: there is nothing to set.
 * The current client is not on it — for a copy onto oneself, "Dupliquer la
 * séance" already exists two buttons away, and offering both paths for the
 * same thing would force a choice between them.
 *
 * The copy lands at the end of the destination program rather than at a
 * chosen place: when copying, you know who you are placing it with, rarely
 * where. The session rail then serves to move it, and already knows how.
 */
export const CopySessionToClient = ({
  sourceClientId,
  sourceSessionId,
  sessionOrder,
  isOpen,
  onClose,
}: CopySessionToClientProps) => {
  const { data: clients = [], isLoading } = useClients();
  const queryClient = useQueryClient();
  const [enCours, setEnCours] = useState<string | null>(null);

  useBackDismiss(isOpen, onClose);

  const autres = clients.filter((c) => c._id !== sourceClientId);

  const copier = useMutation({
    mutationFn: coachService.copySessionToClient,
    onSuccess: (_, variables) => {
      const destinataire = clients.find(
        (c) => c._id === variables.targetClientId
      );
      // The destination program changed underneath the cache: the next
      // visit to that client has to re-read it, otherwise the copied session
      // only appears after a full reload.
      queryClient.invalidateQueries({
        queryKey: queryKeys.coach.clients.detail(variables.targetClientId),
      });
      toaster.create({
        type: 'success',
        // The whole name, not the first name: two clients can share it, and
        // a message that leaves the recipient of a copy in doubt is of no
        // use.
        title: `Séance copiée chez ${
          destinataire
            ? `${destinataire.firstName} ${destinataire.lastName}`
            : 'le client'
        }`,
        description: 'Elle est posée à la fin de son programme.',
      });
      onClose();
    },
    onError: () => {
      toaster.create({
        type: 'error',
        title: 'La copie a échoué',
        description: 'Rien n’a été modifié. Réessayez dans un instant.',
      });
    },
    onSettled: () => setEnCours(null),
  });

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      placement="center"
      scrollBehavior="inside"
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
                <Dialog.Title>
                  Copier la séance {sessionOrder} chez&nbsp;:
                </Dialog.Title>
                <Text fontSize="sm" color="fg.muted" fontWeight="normal">
                  Elle sera posée à la fin de son programme. Ses jours
                  conseillés ne suivent pas — ils appartiennent à la semaine de
                  chacun.
                </Text>
              </VStack>
            </Dialog.Header>

            <Dialog.Body pb={5}>
              {isLoading ? (
                <HStack justify="center" py={6}>
                  <Spinner size="sm" color="app.primary" />
                </HStack>
              ) : autres.length === 0 ? (
                <Text fontSize="sm" color="fg.muted">
                  Vous n'avez pas d'autre client pour l'instant.
                </Text>
              ) : (
                <VStack align="stretch" gap={0}>
                  {autres.map((client) => {
                    const occupe = enCours === client._id;
                    return (
                      <Box
                        key={client._id}
                        as="button"
                        textAlign="left"
                        minH="52px"
                        px={2}
                        borderRadius="md"
                        // A copy in flight locks the list: two quick clicks
                        // would place two sessions.
                        aria-disabled={copier.isPending}
                        opacity={copier.isPending && !occupe ? 0.5 : 1}
                        cursor={copier.isPending ? 'default' : 'pointer'}
                        _hover={
                          copier.isPending
                            ? undefined
                            : { bg: 'whiteAlpha.100' }
                        }
                        css={hitArea(44)}
                        onClick={() => {
                          if (copier.isPending) return;
                          setEnCours(client._id);
                          copier.mutate({
                            targetClientId: client._id,
                            sourceClientId,
                            sourceSessionId,
                          });
                        }}
                      >
                        <HStack gap={3}>
                          <Avatar.Root size="sm" flexShrink={0}>
                            <Avatar.Fallback
                              name={`${client.firstName} ${client.lastName}`}
                            />
                            <Avatar.Image alt="" src={client.picture} />
                          </Avatar.Root>
                          <Text fontSize="sm" flex={1} minW={0} lineClamp={1}>
                            {client.firstName} {client.lastName}
                          </Text>
                          {occupe ? (
                            <Spinner size="xs" color="app.primary" />
                          ) : (
                            <Box color="fg.muted" flexShrink={0}>
                              <LuCopy size={14} />
                            </Box>
                          )}
                        </HStack>
                      </Box>
                    );
                  })}
                </VStack>
              )}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
