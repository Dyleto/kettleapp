import { toaster } from '@/components/ui/toasterInstance';
import api from '@/config/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import { invitationLink } from '../invitation';

interface InvitationResponse {
  token: string;
  /** The link is only valid for a few days: we say so as it is copied. */
  expiresAt: string;
}

/**
 * Generates an invitation link.
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
    // The freshly created token is the one the API will recycle: we put it
    // in the cache so the next click has nothing left to wait for.
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
