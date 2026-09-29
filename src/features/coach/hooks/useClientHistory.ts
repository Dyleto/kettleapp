import { queryKeys } from '@/shared/config/queryKeys';
import { coachService } from '@/features/coach/coach.service';
import { useQuery } from '@tanstack/react-query';

/**
 * L'historique d'un client, du plus récent au plus ancien.
 *
 * Le tri est fait ici et non dans les écrans : trois écrans le consomment, et
 * deux d'entre eux l'affichaient dans l'ordre où l'API le rendait.
 */
export const useClientHistory = (clientId: string) => {
  return useQuery({
    queryKey: queryKeys.coach.clients.history(clientId),
    queryFn: () => coachService.getClientHistory(clientId),
    enabled: !!clientId,
    // L'API ne garantit aucun ordre, et le journal affichait les séances dans
    // celui où elles arrivaient : 19, 16, 22, 26 août à la suite. Un journal
    // se lit du plus récent au plus ancien — on trie ici, une fois, plutôt
    // que dans chaque écran qui le consomme.
    select: (history) =>
      [...history].sort(
        (a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      ),
  });
};
