import { Container, Heading, Spinner, Text, VStack } from "@chakra-ui/react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import GoogleLoginButton from "@/components/GoogleLoginButton";

const Login: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/");
    }
  }, [isLoading, user, navigate]);

  if (isLoading) return <Spinner />;

  return (
    <Container centerContent py={20}>
      <VStack gap={16} w="100%" maxW="md">
        {/* Header */}
        <VStack gap={4} textAlign="center">
          <Heading size="3xl" fontWeight="bold">
            Personal Trainer
          </Heading>
          <Text color="fg.muted" fontSize="md">
            Votre application de coaching personnel
          </Text>
        </VStack>

        {/* Bouton Google stylisé */}
        <GoogleLoginButton text="Continuer avec Google" />
      </VStack>
    </Container>
  );
};

export default Login;
