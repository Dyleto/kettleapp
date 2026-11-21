import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toaster } from '@/shared/components/ui/toasterInstance';
import { sendCompletion } from '@/features/client/end/pending';
import {
  clientService,
  CompleteSessionPayload,
  UpdateCompletedSessionPayload,
} from '@/features/client/common/client.service';
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
      sendCompletion(sessionId, payload),
    // Hors connexion, React Query mettait l'envoi en pause : le bouton
    // tournait sans fin, et la requête repartait plus tard, quand plus
    // personne n'était là pour effacer l'enregistrement. Elle échoue
    // maintenant tout de suite, et le ressenti est gardé pour le retour du
    // réseau. Et pas de seconde tentative : un envoi arrivé dont la réponse
    // s'est perdue serait compté deux fois.
    networkMode: 'always',
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.client.history.all(),
      });
    },
    // Pas de toast en cas d'échec : l'écran du ressenti reste ouvert et le
    // dit lui-même, avec ce qui est sauf. Le toast arrivait sur un écran où
    // le ressenti avait déjà disparu.
  });
};

/** Corrige une séance déjà envoyée : un chiffre tapé de travers en plein
 * effort doit pouvoir se réparer depuis Progrès. */
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
      toaster.create({ title: 'Séance corrigée', type: 'success' });
    },
    // Pas de toast « Erreur » : l'écran de la correction dit lui-même ce
    // qui n'est pas parti, et que la séance n'a pas bougé (F3b).
  });
};
