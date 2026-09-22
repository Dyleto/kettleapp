import { useQuery } from '@tanstack/react-query';
import { coachService } from '@/services/coachService';
import { queryKeys } from '@/config/queryKeys';

// The id is passed as a parameter.
export const useClientDetails = (clientId: string) => {
  return useQuery({
    queryKey: queryKeys.coach.clients.detail(clientId),
    queryFn: () => coachService.getClientDetails(clientId),
    enabled: !!clientId, // Ne lance la requête que si l'ID est présent
  });
};
