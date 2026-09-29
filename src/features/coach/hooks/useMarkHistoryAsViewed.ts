import { queryClient } from '@/shared/config/queryClient';
import { queryKeys } from '@/shared/config/queryKeys';
import { coachService } from '@/features/coach/coach.service';
import { useMutation } from '@tanstack/react-query';

/**
 * Marque comme lues les séances d'un client.
 *
 * Trois invalidations : la fiche du client, son historique, et la liste — qui
 * porte le compteur de non-lus. Oublier la troisième laissait la pastille
 * allumée sur un client dont le coach venait de tout lire.
 */
export const useMarkHistoryAsViewed = (clientId: string) => {
  return useMutation({
    mutationFn: () => coachService.markClientHistoryAsViewed(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.coach.clients.detail(clientId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.coach.clients.history(clientId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.coach.clients.lists(),
      });
    },
  });
};
