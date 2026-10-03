import { useQuery } from '@tanstack/react-query';
import { coachService } from '@/features/coach/coach.service';
import { queryKeys } from '@/shared/config/queryKeys';

// L'identifiant passe en paramètre : la clé de cache en dépend, et deux
// clients ne doivent pas partager la leur.
export const useClientDetails = (clientId: string) => {
  return useQuery({
    queryKey: queryKeys.coach.clients.detail(clientId),
    queryFn: () => coachService.getClientDetails(clientId),
    enabled: !!clientId, // Ne lance la requête que si l'ID est présent
  });
};
