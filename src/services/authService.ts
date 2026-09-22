import api from '@/config/api';
import { User } from '@/types'; // Assurez-vous d'avoir le type User

export const authService = {
  // Sign in with Google.
  googleLogin: async (
    code: string,
    redirectUri: string,
    invitationToken?: string
  ) => {
    const { data } = await api.post<{ user: User }>(
      '/api/auth/google-callback',
      {
        code,
        redirectUri,
        invitationToken,
      }
    );
    return data;
  },

  // Fetch the current profile.
  getMe: async () => {
    const { data } = await api.get<{ user: User }>('/api/auth/me');
    return data;
  },

  // Sign out.
  logout: async () => {
    await api.post('/api/auth/logout');
  },

  // Check an invitation token (public).
  verifyInviteToken: async (token: string) => {
    const { data } = await api.get(
      `/api/auth/verify-invite-token?token=${token}`
    );
    return data;
  },
};
