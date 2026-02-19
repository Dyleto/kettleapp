import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import {
  Container,
  VStack,
  HStack,
  Heading,
  Button,
  Box,
  Text,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <Container maxW="container.lg" py={8}>
      <HStack justify="space-between" w="100%" px={2} align="start">
        <VStack gap={0}>
          <Text fontSize="xl" fontWeight="bold">
            Bonjour {user?.firstName},
          </Text>
        </VStack>

        <Header />
      </HStack>
      <Button
        colorPalette="yellow"
        onClick={() => navigate("/admin/create-coach")}
      >
        Créer un coach
      </Button>
      <Button colorPalette="yellow">Voir tous les coachs</Button>
      <Button colorPalette="yellow">Voir tous les clients</Button>
      <VStack gap={4} align="start"></VStack>
    </Container>
  );
};

export default AdminDashboard;
