import { useQuery } from '@tanstack/react-query';
import api from '@/shared/config/api';
import { InvitedCoach } from '@/shared/types';
import { queryKeys } from '@/shared/config/queryKeys';

interface VerifyTokenResponse {
  coach: InvitedCoach;
}

/**
 * Vérifier un lien d'invitation avant toute connexion.
 *
 * `staleTime: Infinity` et aucune reprise : un jeton ne change pas, et son
 * refus non plus. Réessayer donnerait trois fois la même erreur sur l'écran
 * d'entrée d'un nouveau client.
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
