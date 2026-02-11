import { useAuth } from "@/contexts/AuthContext";
import { ClientsGrid, ExercisesBlock, InvitationBlock } from "@/features/coach";
import { Container, VStack, HStack, Text, Box } from "@chakra-ui/react";

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

      <HStack justify="space-evenly" mt={8}>
        <ExercisesBlock />
      </HStack>

      <VStack gap={8} w="100%" mt={8}>
        {/* En-tête avec titre + bouton */}
        <Box w="100%">
          <VStack gap={4} align="stretch">
            <VStack align="center">
              <InvitationBlock />
              <Text textAlign="center" color="fg.muted">
                Partagez le lien d'invitation pour ajouter un nouveau client
              </Text>
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
