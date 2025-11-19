import { useAuth } from "@/contexts/AuthContext";
import {
  Container,
  VStack,
  HStack,
  Heading,
  Button,
  Box,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleSelectRole = () => {
    navigate("/select-role");
  };

  return (
    <Container maxW="container.lg" py={8}>
      <VStack gap={8} align="start" w="100%">
        <HStack justify="space-between" w="100%">
          <Heading>Dashboard Client</Heading>
          <Button colorScheme="red" onClick={handleSelectRole}>
            Changer de vue
          </Button>
          <Button colorScheme="red" onClick={handleLogout}>
            Déconnexion
          </Button>
        </HStack>

        <Box>
          <Heading size="md" mb={4}>
            Bienvenue {user?.firstName} !
          </Heading>
          <VStack gap={4} align="start">
            <Button colorScheme="blue">Voir mon coach</Button>
            <Button colorScheme="blue">Voir mes séances</Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default ClientDashboard;
