import { useAuth } from "@/contexts/AuthContext";
import { ClientsGrid } from "@/features/Coach/ClientsGrid";
import InvitationBlock from "@/features/Coach/InvitationBlock";
import {
  Container,
  VStack,
  HStack,
  Text,
  Box,
  Heading,
} from "@chakra-ui/react";

const CoachDashboard = () => {
  const { user } = useAuth();

  return (
    <Container maxW="container.lg" position="relative" py={8}>
      <HStack justify="space-between" w="100%" px={2} align="start">
        <VStack gap={0}>
          <Text fontSize="xl" fontWeight="bold" ml={5}>
            Bonjour {user?.firstName},
          </Text>
        </VStack>
      </HStack>

      <VStack gap={8} w="100%" mt={8}>
        {/* En-tête avec titre + bouton */}
        <Box w="100%">
          <VStack gap={4} align="stretch">
            <VStack align="center">
              <Text color="fg.muted">
                Partagez le lien d'invitation pour ajouter un nouveau client
              </Text>
              <InvitationBlock />
            </VStack>
          </VStack>
        </Box>

        {/* Liste des clients */}
        <ClientsGrid />
      </VStack>
    </Container>
  );
};

export default CoachDashboard;
