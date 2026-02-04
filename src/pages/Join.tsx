import GoogleLoginButton from "@/components/GoogleLoginButton";
import { useVerifyInviteToken } from "@/hooks/queries/useVerifyInviteToken";
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
import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const Join = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const invitationToken = searchParams.get("token") ?? undefined;

  const { data, isLoading, error } = useVerifyInviteToken(invitationToken);

  // Rediriger si pas de token
  useEffect(() => {
    if (!invitationToken) {
      navigate("/login", { replace: true });
    }
  }, [invitationToken, navigate]);

  const getContent = () => {
    if (isLoading) {
      return <Spinner />;
    }

    if (error) {
      const status = (error as any).response?.status;

      if (status === 410) {
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
      }

      return (
        <VStack gap={6} maxW="md" w="100%">
          <Heading color="red.400">Lien d'invitation invalide</Heading>
          <Text color="fg.muted">
            Le lien que vous avez cliqué n'existe pas ou est incorrect.
          </Text>
        </VStack>
      );
    }

    // Token valide
    return (
      <VStack gap={6} maxW="md" w="100%">
        <Heading>
          Vous avez été invité par {data?.coach.firstName}{" "}
          {data?.coach.lastName}
        </Heading>

        <VStack gap={3} w="100%">
          <Text fontSize="sm" color="fg.muted">
            Pour accepter l'invitation, connectez-vous avec Google
          </Text>
          <GoogleLoginButton invitationToken={invitationToken} />
        </VStack>
      </VStack>
    );
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
            />
          </VStack>

          {getContent()}
        </VStack>
      </Container>
    </Box>
  );
};

export default Join;
