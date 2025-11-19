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

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <Container maxW="container.lg" py={8}>
      <VStack gap={8} align="start" w="100%">
        <HStack justify="space-between" w="100%">
          <Heading>Dashboard Admin</Heading>
          <Button colorScheme="red" onClick={handleLogout}>
            Déconnexion
          </Button>
        </HStack>

        <Box>
          <Heading size="md" mb={4}>
            Bienvenue {user?.firstName} !
          </Heading>
          <VStack gap={4} align="start">
            <Button
              colorPalette="yellow"
              onClick={() => navigate("/admin/create-coach")}
            >
              Créer un coach
            </Button>
            <Button colorPalette="yellow">Voir tous les coachs</Button>
            <Button colorPalette="yellow">Voir tous les clients</Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default AdminDashboard;
