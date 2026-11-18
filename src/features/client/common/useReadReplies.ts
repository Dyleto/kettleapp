import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService } from '@/features/client/common/client.service';
import { queryKeys } from '@/shared/config/queryKeys';
import type { CompletedSession } from '@/shared/types';

/**
 * Marquer lues les réponses du coach à une séance.
 *
 * C'est ce qui fait lire au coach « lue par Sarah », et ce qui lui dit
 * qu'il ne peut plus la modifier. La séance revenue prend sa place dans
 * l'historique, sans recharger : l'écran qui l'a montrée garde sa pastille
 * « Nouveau » le temps de la visite, c'est à lui de le décider.
 *
 * Sans toast en cas d'échec : rien n'est perdu, la réponse reste à lire, et
 * la prochaine ouverture recommencera.
 */
export const useReadReplies = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (completedId: string) => clientService.readReplies(completedId),
    onSuccess: (completed) =>
      queryClient.setQueryData<CompletedSession[]>(
        queryKeys.client.history.all(),
        (history) =>
          history?.map((c) => (c._id === completed._id ? completed : c))
      ),
  });
};
