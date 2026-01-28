import GoogleLoginButton from "@/components/GoogleLoginButton";
import api from "@/config/api";
import { Coach } from "@/types";
import {
  Button,
  Container,
  Heading,
  Spinner,
  VStack,
  Text,
  Separator,
  Box,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

type TokenStatus = "loading" | "valid" | "invalid" | "expired" | "error";

const Join = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<TokenStatus>("loading");
  const [coach, setCoach] = useState<Coach | null>(null);

  const invitationToken = searchParams.get("token") as string | undefined;

  useEffect(() => {
    const verifyToken = async () => {
      if (!invitationToken) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        // Vérifier le token avec le backend
        const response = await api.get(
          `/api/auth/verify-invite-token?token=${invitationToken}`,
        );
        setCoach(response.data.coach);
        setStatus("valid");
      } catch (error: any) {
        switch (error.response?.status) {
          case 404:
            setStatus("invalid");
            break;
          case 410:
            setStatus("expired");
            break;
          default:
            setStatus("error");
        }
      }
    };

    verifyToken();
  }, [invitationToken, navigate]);

  const getContent = () => {
    switch (status) {
      case "loading":
        return <Spinner />;

      case "valid":
        return (
          <VStack gap={6} maxW="md" w="100%">
            <Heading>
              Vous avez été invité par {coach?.firstName} {coach?.lastName}
            </Heading>

            <VStack gap={3} w="100%">
              <Text fontSize="sm" color="fg.muted">
                Pour accepter l'invitation, connectez-vous avec Google
              </Text>
              <GoogleLoginButton invitationToken={invitationToken} />
            </VStack>
          </VStack>
        );
      case "expired":
        return (
          <VStack gap={4} maxW="md" w="100%">
            <Heading color="red.400">Lien d'invitation expiré</Heading>
            <Text color="fg.muted" textAlign="center">
              Ce lien d'invitation n'est plus valide.
            </Text>
            <Text color="fg.muted" textAlign="center">
              Demandez un nouveau lien à votre coach.
            </Text>
          </VStack>
        );

      case "invalid":
        return (
          <VStack gap={6} maxW="md" w="100%">
            <Heading color="red.400">Lien d'invitation invalide</Heading>
            <Text color="fg.muted">
              Le lien que vous avez cliqué n'existe pas ou est incorrect.
            </Text>
          </VStack>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minH="100vh"
    >
      <Container centerContent py={20}>
        <VStack gap={16} w="100%" maxW="md">
          {/* Header */}
          <VStack gap={4} textAlign="center">
            <Heading size="7xl" fontWeight="bold" letterSpacing="10px">
              KETTLE
            </Heading>
            <Separator
              borderColor="yellow.400"
              borderWidth="1px"
              width="50vw"
              // opacity={0.5}
            />
          </VStack>

          {getContent()}
        </VStack>
      </Container>
    </Box>
  );
};

export default Join;
