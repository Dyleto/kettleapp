import { useAuth } from "@/contexts/AuthContext";
import { Container, VStack, HStack, Text } from "@chakra-ui/react";

const ClientDashboard = () => {
  const { user } = useAuth();

  return (
    <Container maxW="container.lg" position="relative" py={8}>
      <HStack justify="space-between" w="100%" px={2} align="start">
        <VStack gap={0}>
          <Text fontSize="xl" fontWeight="bold">
            Bonjour {user?.firstName},
          </Text>
        </VStack>
      </HStack>
    </Container>
  );
};

export default ClientDashboard;
