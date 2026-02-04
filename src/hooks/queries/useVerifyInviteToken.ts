import { useQuery } from "@tanstack/react-query";
import api from "@/config/api";
import { Coach } from "@/types";

interface VerifyTokenResponse {
  coach: Coach;
}

/**
 * Hook pour vérifier un token d'invitation
 */
export const useVerifyInviteToken = (token: string | undefined) => {
  return useQuery({
    queryKey: ["auth", "verify-invite-token", token],
    queryFn: async () => {
      if (!token) throw new Error("No token provided");

      const response = await api.get<VerifyTokenResponse>(
        `/api/auth/verify-invite-token?token=${token}`,
      );
      return response.data;
    },
    enabled: !!token, // Ne lance la requête que si le token existe
    retry: false, // Pas de retry pour éviter les multiples erreurs
    staleTime: Infinity, // Le token ne change pas
  });
};
