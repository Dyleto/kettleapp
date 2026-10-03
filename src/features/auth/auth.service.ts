import api from '@/shared/config/api';
import { User } from '@/shared/types';

/**
 * L'authentification, côté client : trois appels et pas un de plus.
 *
 * Aucun jeton ne transite ici. Le serveur pose un cookie `httpOnly` que le
 * JavaScript ne peut ni lire ni voler ; `getMe` est donc la seule façon de
 * savoir qui est connecté.
 */
export const authService = {
  /**
   * Échange le code d'autorisation de Google contre une session.
   *
   * `redirectUri` repart avec le code : Google le vérifie une seconde fois,
   * côté serveur, et refuse si les deux ne coïncident pas. C'est ce qui
   * empêche un code intercepté d'être utilisé depuis ailleurs.
   */
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

  // Le profil courant. La session vit dans un cookie `httpOnly` : c'est le
  // seul moyen de savoir qui est connecté.
  getMe: async () => {
    const { data } = await api.get<{ user: User }>('/api/auth/me');
    return data;
  },

  // Sign out.
  logout: async () => {
    await api.post('/api/auth/logout');
  },

  // Vérifier un lien d'invitation. Publique : on arrive dessus sans compte.
  verifyInviteToken: async (token: string) => {
    const { data } = await api.get(
      `/api/auth/verify-invite-token?token=${token}`
    );
    return data;
  },
};
