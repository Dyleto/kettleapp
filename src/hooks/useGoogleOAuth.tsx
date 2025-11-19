import { useNavigate, useSearchParams } from "react-router-dom";
import api from "@/config/api";
import { useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function useGoogleOAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
  const redirectUri = `${window.location.origin}/auth/callback`;

  const loginWithGoogle = useCallback(
    (invitationToken?: string) => {
      const state = Math.random().toString(36).substring(2);
      localStorage.setItem("google_oauth_state", state);

      // Stocker le token d'invitation pour le récupérer après callback
      if (invitationToken) {
        localStorage.setItem("invitation_token", invitationToken);
      } else {
        localStorage.removeItem("invitation_token");
      }

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid profile email",
        state: state,
      });

      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      window.location.href = googleAuthUrl;
    },
    [clientId, redirectUri]
  );

  return { loginWithGoogle };
}
