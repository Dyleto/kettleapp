import { useQuery } from '@tanstack/react-query';
import { coachService } from '@/features/coach/coach.service';
import { queryKeys } from '@/shared/config/queryKeys';

/**
 * Le fil « À lire ».
 *
 * Lu par l'écran et par le compteur de l'onglet, qui partagent la même
 * entrée en cache : le compteur ne coûte pas une requête de plus, et il dit
 * le même nombre que l'écran qu'il ouvre.
 */
export const useInbox = (state: 'unread' | 'read' = 'unread', enabled = true) =>
  useQuery({
    queryKey: queryKeys.coach.inbox(state),
    queryFn: () => coachService.getInbox(state),
    enabled,
  });
