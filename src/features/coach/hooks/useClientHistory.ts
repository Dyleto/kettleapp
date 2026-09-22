import { queryKeys } from '@/config/queryKeys';
import { coachService } from '@/services/coachService';
import { useQuery } from '@tanstack/react-query';

export const useClientHistory = (clientId: string) => {
  return useQuery({
    queryKey: queryKeys.coach.clients.history(clientId),
    queryFn: () => coachService.getClientHistory(clientId),
    enabled: !!clientId,
    // The API guarantees no order, and the journal showed sessions as they
    // arrived: 19, 16, 22, 26 August in a row. A journal reads newest first —
    // we sort here, once, rather than in every screen that consumes it.
    select: (history) =>
      [...history].sort(
        (a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      ),
  });
};
