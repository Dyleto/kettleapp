import { queryClient } from "@/config/queryClient";
import { queryKeys } from "@/config/queryKeys";
import { coachService } from "@/services/coachService";
import { useMutation } from "@tanstack/react-query";

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
