import { toaster } from '@/shared/components/ui/toasterInstance';
import api from '@/shared/config/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/config/queryKeys';
import { invitationLink } from '../invitation';

interface InvitationResponse {
  token: string;
  /** Le lien ne vaut que quelques jours : on le dit au moment où il est
   * copié. */
  expiresAt: string;
}

/**
 * Engendre un lien d'invitation.
 *
 * Invalide l'invitation en cours au succès : deux liens valides en même
 * temps donneraient au coach un lien affiché qui n'est plus celui que le
 * serveur accepte.
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
        link: invitationLink(response.data.token),
        expiresAt: response.data.expiresAt,
      };
    },
    // Le jeton qu'on vient de créer est celui que l'API recyclera : on le
    // met en cache pour que le clic suivant n'ait plus rien à attendre.
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
