import { useAuth } from "@/contexts/AuthContext";
import { ClientsGrid } from "@/features/Coach/ClientsGrid";
import InvitationBlock from "@/features/Coach/InvitationBlock";
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

      <VStack mt={8} gap={8}>
        <ClientsGrid />
        <InvitationBlock />
      </VStack>
    </Container>
  );
};

export default CoachDashboard;
