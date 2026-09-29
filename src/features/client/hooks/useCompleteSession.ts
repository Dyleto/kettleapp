import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toaster } from '@/shared/components/ui/toasterInstance';
import {
  clientService,
  CompleteSessionPayload,
  UpdateCompletedSessionPayload,
} from '@/features/client/client.service';
import { queryKeys } from '@/shared/config/queryKeys';

/**
 * Termine une séance.
 *
 * C'est le seul moment où l'enregistrement local s'efface : tant que le
 * serveur n'a pas accusé réception, ce que le client a noté reste sur son
 * téléphone. Sortir du mode guidé, répondre au téléphone, recharger la page
 * ne coûtent rien.
 */
export const useCompleteSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      ...payload
    }: CompleteSessionPayload & { sessionId: string }) =>
      clientService.completeSession(sessionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.client.history.all(),
      });
    },
    onError: () => {
      toaster.create({
        title: 'Erreur',
        description: 'Impossible de valider la séance, réessaie.',
        type: 'error',
      });
    },
  });
};

/** Corrige un bilan déjà envoyé : un chiffre tapé de travers en plein effort
 * doit pouvoir se réparer depuis l'historique. */
export const useUpdateCompletedSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      completedId,
      ...payload
    }: UpdateCompletedSessionPayload & { completedId: string }) =>
      clientService.updateCompletedSession(completedId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.client.history.all(),
      });
      toaster.create({ title: 'Bilan corrigé', type: 'success' });
    },
    onError: () => {
      toaster.create({
        title: 'Erreur',
        description: 'Impossible de corriger ce bilan, réessaie.',
        type: 'error',
      });
    },
  });
};
