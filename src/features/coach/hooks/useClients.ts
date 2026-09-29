import { useQuery } from '@tanstack/react-query';
import { coachService } from '@/features/coach/coach.service';
import { queryKeys } from '@/shared/config/queryKeys';

export const useClients = () => {
  return useQuery({
    queryKey: queryKeys.coach.clients.lists(),
    queryFn: coachService.getClients,
  });
};
