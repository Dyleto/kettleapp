import { useQuery } from '@tanstack/react-query';
import api from '@/config/api';
import { queryKeys } from '@/config/queryKeys';

interface ActiveInvitation {
  token: string;
  expiresAt: string;
}

/**
 * The invitation link currently in force, if there is one.
 *
 * This is not a display convenience: it is what allows sharing or copying
 * **without a network round-trip**. Sharing and writing to the clipboard both
 * require "transient activation", which the browser withdraws moments after
 * the click — one request is enough to lose it on Safari, and the coach then
 * saw "link copied" over an empty clipboard.
 *
 * Loaded when the list opens, the link is already there when you click. Since
 * the API recycles the token while it is valid, it is exactly the one
 * "Inviter" would have produced.
 */
export const useActiveInvitation = () =>
  useQuery({
    queryKey: queryKeys.coach.invitation(),
    queryFn: async () => {
      const { data } = await api.get<ActiveInvitation | null>(
        '/api/coach/invitation'
      );
      return data;
    },
  });
