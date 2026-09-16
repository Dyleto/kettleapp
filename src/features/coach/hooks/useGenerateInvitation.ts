import { toaster } from '@/components/ui/toasterInstance';
import api from '@/config/api';
import { useMutation } from '@tanstack/react-query';

interface InvitationResponse {
  token: string;
  /** Le lien ne vaut que quelques jours : on le dit au moment où on le copie. */
  expiresAt: string;
}

/**
 * Hook pour générer un lien d'invitation
 */
export const useGenerateInvitation = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post<InvitationResponse>(
        '/api/coach/generate-invitation'
      );
      const link = `${window.location.origin}/join?token=${response.data.token}`;

      return { link, expiresAt: response.data.expiresAt };
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
