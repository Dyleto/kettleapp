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
  /** Le numéro affiché de la séance — « Séance 3 ». */
  sessionOrder: number;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Poser une séance chez un autre client.
 *
 * Retour du terrain : « dommage de ne pas pouvoir copier la séance et la
 * coller chez un autre client. Ce serait plus utile que le dupliquer. »
 *
 * Une liste de noms, un par ligne, et c'est tout : il n'y a rien à régler.
 * Le client courant n'y figure pas — pour une copie chez soi, « Dupliquer la
 * séance » existe déjà à deux boutons de là, et proposer les deux chemins
 * pour la même chose obligerait à choisir entre eux.
 *
 * La copie part à la fin du programme de destination plutôt qu'à une place
 * choisie : au moment de copier, on sait chez qui on pose, rarement où. Le
 * rail de séances sert ensuite à la déplacer, et il sait déjà le faire.
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
      // Le programme de destination a changé sous le cache : le prochain
      // passage chez ce client doit le relire, sinon la séance copiée n'y
      // apparaît qu'après un rechargement complet.
      queryClient.invalidateQueries({
        queryKey: queryKeys.coach.clients.detail(variables.targetClientId),
      });
      toaster.create({
        type: 'success',
        // Le nom entier, pas le prénom : deux clients peuvent le partager, et
        // un message qui laisse un doute sur le destinataire d'une copie ne
        // sert à rien.
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
                        // Une copie en vol verrouille la liste : deux clics
                        // rapides poseraient deux séances.
                        aria-disabled={copier.isPending}
                        opacity={copier.isPending && !occupe ? 0.5 : 1}
                        cursor={copier.isPending ? 'default' : 'pointer'}
                        _hover={
                          copier.isPending ? undefined : { bg: 'whiteAlpha.100' }
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
