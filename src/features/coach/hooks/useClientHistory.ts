import { queryKeys } from '@/config/queryKeys';
import { coachService } from '@/services/coachService';
import { useQuery } from '@tanstack/react-query';

export const useClientHistory = (clientId: string) => {
  return useQuery({
    queryKey: queryKeys.coach.clients.history(clientId),
    queryFn: () => coachService.getClientHistory(clientId),
    enabled: !!clientId,
    // L'API ne garantit pas d'ordre, et le journal affichait les séances
    // telles qu'elles arrivaient : 19, 16, 22, 26 août à la suite. Un journal
    // se lit du plus récent au plus ancien — on le trie ici, une fois, plutôt
    // que dans chaque écran qui le consomme.
    select: (history) =>
      [...history].sort(
        (a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      ),
  });
};
