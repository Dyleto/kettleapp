import { useQuery } from "@tanstack/react-query";
import { coachService } from "@/services/coachService";
import { queryKeys } from "@/config/queryKeys";

// On passe l'ID en paramètre du hook
export const useClientDetails = (clientId: string) => {
  return useQuery({
    queryKey: queryKeys.coach.clients.detail(clientId),
    queryFn: () => coachService.getClientDetails(clientId),
    enabled: !!clientId, // Ne lance la requête que si l'ID est présent
  });
};
