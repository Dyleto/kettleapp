import { queryKeys } from "@/config/queryKeys";
import { coachService } from "@/services/coachService";
import { useQuery } from "@tanstack/react-query";

export const useClientHistory = (clientId: string) => {
  return useQuery({
    queryKey: queryKeys.coach.clients.history(clientId),
    queryFn: () => coachService.getClientHistory(clientId),
  });
};
