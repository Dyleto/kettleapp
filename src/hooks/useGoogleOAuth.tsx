import { useNavigate, useSearchParams } from "react-router-dom";
import api from "@/config/api";
import { useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function useGoogleOAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
  const redirectUri = `${window.location.origin}/login`;

  const loginWithGoogle = useCallback(() => {
    const state = Math.random().toString(36).substring(2);
    localStorage.setItem("google_oauth_state", state);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid profile email",
      state: state,
      prompt: "consent",
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    window.location.href = googleAuthUrl;
  }, [clientId, redirectUri]);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code) return;

    const storedState = localStorage.getItem("google_oauth_state");
    if (state !== storedState) {
      console.error("State mismatch - possible CSRF attack");
      return;
    }

    const handleCallback = async () => {
      try {
        // Envoyer le code au backend pour l'échanger
        const response = await api.post("/api/auth/google-callback", {
          code,
          redirectUri,
        });

        // Sauvegarder les infos
        localStorage.setItem(
          "id_token",
          response.data.token || response.data.idToken
        );
        localStorage.setItem("user", JSON.stringify(response.data.user));

        setUser(response.data.user);

        // Nettoyer
        localStorage.removeItem("google_oauth_state");

        // Rediriger
        navigate("/", { replace: true });
      } catch (error) {
        console.error("Google OAuth callback error:", error);
        navigate("/login", { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return { loginWithGoogle };
}
