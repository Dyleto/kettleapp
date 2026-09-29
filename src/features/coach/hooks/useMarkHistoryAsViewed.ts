import { queryClient } from '@/shared/config/queryClient';
import { queryKeys } from '@/shared/config/queryKeys';
import { coachService } from '@/features/coach/coach.service';
import { useMutation } from '@tanstack/react-query';

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
