import api from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";
import { getDefaultRoleRoute } from "@/utils/navigation";
import storage from "@/utils/storage";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Box, Heading, Spinner, VStack } from "@chakra-ui/react";
import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const MINIMUM_DISPLAY_TIME_MS = 500;

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const colors = useThemeColors();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const startTime = Date.now();
        const code = searchParams.get("code");
        const redirectUri = `${window.location.origin}/auth/callback`;
        const invitationToken = storage.getItem("invitation_token");

        const response = await api.post("/api/auth/google-callback", {
          code,
          redirectUri,
          invitationToken,
        });

        // Nettoyer après utilisation
        if (invitationToken) {
          storage.removeItem("invitation_token");
        }

        // Sauvegarder
        setUser(response.data.user);

        // Confirmer la session
        await api.get("/api/auth/me");

        // Calculer le temps écoulé
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(
          0,
          MINIMUM_DISPLAY_TIME_MS - elapsedTime,
        );

        // Rediriger
        setTimeout(() => {
          navigate(getDefaultRoleRoute(response.data.user), { replace: true });
        }, remainingTime);
      } catch (error) {
        console.error("Google OAuth callback error:", error);
        navigate("/login", { replace: true });
      }
    };

    if (searchParams.get("code")) {
      handleCallback();
    } else {
      navigate("/login", { replace: true });
    }
  }, [searchParams, navigate, setUser]);

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minH="100vh"
      bg="bg.muted"
    >
      <VStack gap={4}>
        <Spinner size="xl" color={colors.primary} />
        <Heading size="md">Connexion en cours...</Heading>
      </VStack>
    </Box>
  );
};

export default AuthCallback;
