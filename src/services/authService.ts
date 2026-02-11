import api from "@/config/api";
import { User } from "@/types"; // Assurez-vous d'avoir le type User

export const authService = {
  // Login avec Google
  googleLogin: async (
    code: string,
    redirectUri: string,
    invitationToken?: string,
  ) => {
    const { data } = await api.post<{ user: User }>(
      "/api/auth/google-callback",
      {
        code,
        redirectUri,
        invitationToken,
      },
    );
    return data;
  },

  // Récupérer le profil courant
  getMe: async () => {
    const { data } = await api.get<{ user: User }>("/api/auth/me");
    return data;
  },

  // Déconnexion
  logout: async () => {
    await api.post("/api/auth/logout");
  },

  // Vérifier un token d'invitation (public)
  verifyInviteToken: async (token: string) => {
    const { data } = await api.get(
      `/api/auth/verify-invite-token?token=${token}`,
    );
    return data;
  },
};
