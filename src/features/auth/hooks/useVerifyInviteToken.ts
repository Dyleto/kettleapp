import { useQuery } from '@tanstack/react-query';
import api from '@/shared/config/api';
import { Coach } from '@/shared/types';
import { queryKeys } from '@/shared/config/queryKeys';

interface VerifyTokenResponse {
  coach: Coach;
}

/**
 * Checks an invitation token.
 */
export const useVerifyInviteToken = (token: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.auth.verifyInviteToken(token || ''),
    queryFn: async () => {
      if (!token) throw new Error('No token provided');

      const response = await api.get<VerifyTokenResponse>(
        `/api/auth/verify-invite-token?token=${token}`
      );
      return response.data;
    },
    enabled: !!token, // Ne lance la requête que si le token existe
    retry: false, // Pas de retry pour éviter les multiples erreurs
    staleTime: Infinity, // Le token ne change pas
  });
};
