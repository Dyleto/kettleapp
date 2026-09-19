import { toaster } from '@/components/ui/toasterInstance';
import api from '@/config/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import { lienInvitation } from '../invitation';

interface InvitationResponse {
  token: string;
  /** Le lien ne vaut que quelques jours : on le dit au moment où on le copie. */
  expiresAt: string;
}

/**
 * Hook pour générer un lien d'invitation
 */
export const useGenerateInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await api.post<InvitationResponse>(
        '/api/coach/generate-invitation'
      );
      return {
        token: response.data.token,
        link: lienInvitation(response.data.token),
        expiresAt: response.data.expiresAt,
      };
    },
    // Le jeton fraîchement créé est celui que l'API recyclera : on le pose
    // dans le cache pour que le clic suivant n'ait plus rien à attendre.
    onSuccess: ({ token, expiresAt }) => {
      queryClient.setQueryData(queryKeys.coach.invitation(), {
        token,
        expiresAt,
      });
    },
    onError: () => {
      toaster.create({
        title: 'Erreur',
        description: `Une erreur est survenue lors de la génération de l'invitation`,
        type: 'error',
      });
    },
  });
};
