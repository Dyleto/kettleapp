import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Box, Heading, Spinner, VStack } from "@chakra-ui/react";
// Services & Hooks
import { authService } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { getDefaultRoleRoute } from "@/utils/navigation";
import storage from "@/utils/storage";
import { useThemeColors } from "@/hooks/useThemeColors";
import { toaster } from "@/components/ui/toaster";

// Temps mini avant redirection (pour ne pas flasher l'écran)
const MINIMUM_DISPLAY_TIME_MS = 800;

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const colors = useThemeColors();

  useEffect(() => {
    // Flag pour éviter le double appel en React StrictMode (Dev)
    let isMounted = true;

    const handleCallback = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error || !code) {
        toaster.create({
          title: "Connexion annulée ou échouée",
          type: "error",
        });
        return navigate("/login", { replace: true });
      }

      try {
        const startTime = Date.now();
        const redirectUri = `${window.location.origin}/auth/callback`;
        const invitationToken = storage.getItem("invitation_token");

        // --- APPEL API VIA SERVICE ---
        const data = await authService.googleLogin(
          code,
          redirectUri,
          invitationToken || undefined,
        );

        // Nettoyage token invitation
        if (invitationToken) storage.removeItem("invitation_token");

        if (isMounted) {
          setUser(data.user);

          toaster.create({ title: "Connexion réussie !", type: "success" });

          // Délai esthétique pour UX
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(
            0,
            MINIMUM_DISPLAY_TIME_MS - elapsedTime,
          );

          setTimeout(() => {
            navigate(getDefaultRoleRoute(data.user), { replace: true });
          }, remainingTime);
        }
      } catch (err) {
        console.error("Auth Error:", err);
        toaster.create({
          title: "Impossible de vous connecter",
          description: "Veuillez réessayer.",
          type: "error",
        });
        if (isMounted) navigate("/login", { replace: true });
      }
    };

    handleCallback();

    return () => {
      isMounted = false;
    };
  }, [searchParams, navigate, setUser]); // Dépendances stables

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
