import { useQuery } from "@tanstack/react-query";
import { coachService } from "@/services/coachService";
import { queryKeys } from "@/config/queryKeys";

export const useClients = () => {
  return useQuery({
    queryKey: queryKeys.coach.clients.lists(),
    queryFn: coachService.getClients,
  });
};
