import { useCallback } from 'react';
import storage from '@/shared/utils/storage';

/**
 * Le départ vers Google, et ce qu'on laisse derrière soi.
 *
 * `state` est tiré au hasard à chaque départ et relu au retour : c'est ce qui
 * distingue un retour qu'on a déclenché d'un retour fabriqué par un tiers
 * (CSRF). Le jeton d'invitation part au rangement pour la même raison — le
 * retour de Google arrive sur une page neuve, qui ne sait rien de l'aller.
 */
export function useGoogleOAuth() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
  const redirectUri = `${window.location.origin}/auth/callback`;

  const loginWithGoogle = useCallback(
    (invitationToken?: string) => {
      const state = Math.random().toString(36).substring(2);

      storage.setItem('google_oauth_state', state);

      // On garde le jeton d'invitation pour le relire après le retour.
      if (invitationToken) {
        storage.setItem('invitation_token', invitationToken);
      } else {
        storage.removeItem('invitation_token');
      }

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid profile email',
        state: state,
      });

      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      window.location.href = googleAuthUrl;
    },
    [clientId, redirectUri]
  );

  return { loginWithGoogle };
}
