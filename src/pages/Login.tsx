// src/pages/Login.tsx
import { FcGoogle } from "react-icons/fc";
import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";
import {
  Box,
  Button,
  Container,
  Heading,
  Icon,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Login: React.FC = () => {
  const { loginWithGoogle } = useGoogleOAuth();
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
        <Button
          w="100%"
          h="14"
          fontSize="md"
          fontWeight="600"
          bg="white"
          color="gray.800"
          border="2px solid"
          borderColor="gray.200"
          onClick={() => loginWithGoogle()}
          _hover={{
            bg: "gray.50",
            borderColor: "gray.300",
            shadow: "md",
            transform: "translateY(-2px)",
            transition: "all 0.3s ease",
          }}
          _active={{
            transform: "translateY(0px)",
          }}
          borderRadius="xl"
          transition="all 0.3s ease"
          boxShadow="sm"
        >
          <Icon as={FcGoogle} boxSize="6" /> Continuer avec Google
        </Button>
      </VStack>
    </Container>
  );
};

export default Login;
