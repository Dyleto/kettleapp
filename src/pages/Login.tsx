import {
  Box,
  Container,
  Heading,
  Separator,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { useThemeColors } from "@/hooks/useThemeColors";

const Login: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const colors = useThemeColors();

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/");
    }
  }, [isLoading, user, navigate]);

  if (isLoading) return <Spinner />;

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
              borderColor={colors.primary}
              borderWidth="1px"
              width="50vw"
            />
            <Text color="fg.muted" fontSize="md">
              Votre application de coaching personnel
            </Text>
          </VStack>

          {/* Bouton Google stylisé */}
          <GoogleLoginButton text="Continuer avec Google" />
        </VStack>
      </Container>
    </Box>
  );
};

export default Login;
