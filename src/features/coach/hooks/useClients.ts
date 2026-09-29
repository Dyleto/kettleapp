import { useQuery } from '@tanstack/react-query';
import { coachService } from '@/features/coach/coach.service';
import { queryKeys } from '@/shared/config/queryKeys';

/** La liste des clients du coach. Chargée une fois : elle porte déjà les
 * compteurs de non-lus et la dernière note d'effort, que l'API calcule pour
 * éviter une requête par ligne. */
export const useClients = () => {
  return useQuery({
    queryKey: queryKeys.coach.clients.lists(),
    queryFn: coachService.getClients,
  });
};
