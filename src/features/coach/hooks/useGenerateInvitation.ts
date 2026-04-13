import { toaster } from "@/components/ui/toaster";
import api from "@/config/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface InvitationResponse {
  token: string;
}

/**
 * Hook pour générer un lien d'invitation
 */
export const useGenerateInvitation = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post<InvitationResponse>(
        "/api/coach/generate-invitation",
      );
      const link = `${window.location.origin}/join?token=${response.data.token}`;

      return { link };
    },
    onError: () => {
      toaster.create({
        title: "Erreur",
        description: `Une erreur est survenue lors de la génération de l'invitation`,
        type: "error",
      });
    },
  });
};
