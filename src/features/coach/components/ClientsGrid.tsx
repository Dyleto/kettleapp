import { Client } from "@/types";
import {
  Avatar,
  Box,
  Grid,
  SkeletonCircle,
  SkeletonText,
  Text,
  VStack,
  Button,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import ClickableCard from "@/components/ClickableCard";
import { useClients } from "@/hooks/queries/useClients";
import { toaster } from "@/components/ui/toaster";
import { useEffect } from "react";
import { getErrorMessage } from "@/utils/errorMessages";

export const ClientsGrid = () => {
  const navigate = useNavigate();
  const { data: clients = [], isLoading, error, refetch } = useClients();

  // Afficher un toast avec un message spécifique si erreur
  useEffect(() => {
    if (error) {
      toaster.create({
        title: "Impossible de charger vos clients",
        description: getErrorMessage(error, "Chargement des clients"),
        type: "error",
        duration: 5000,
      });
    }
  }, [error]);

  // Loading state
  if (isLoading) {
    return (
      <Box w="100%">
        <Grid
          templateColumns={{
            base: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(4, 1fr)",
          }}
          gap={4}
        >
          {[...Array(8)].map((_, index) => (
            <ClickableCard key={index} onClick={() => {}} p={8}>
              <VStack gap={3}>
                <SkeletonCircle size="11" />
                <VStack gap={1} w="100%">
                  <SkeletonText height={6} noOfLines={1} />
                </VStack>
              </VStack>
            </ClickableCard>
          ))}
        </Grid>
      </Box>
    );
  }

  // Error state avec possibilité de retry
  if (error) {
    return (
      <Box textAlign="center" py={12}>
        <VStack gap={4}>
          <Text color="red.400" fontSize="lg" fontWeight="bold">
            Erreur de chargement
          </Text>
          <Text color="gray.400">
            Impossible de récupérer la liste de vos clients.
          </Text>
          <Button colorPalette="yellow" onClick={() => refetch()}>
            Réessayer
          </Button>
        </VStack>
      </Box>
    );
  }

  // Empty state
  if (clients.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="fg.muted">Aucun client pour le moment</Text>
      </Box>
    );
  }

  // Success state
  return (
    <Box w="100%">
      <Grid
        templateColumns={{
          base: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
          lg: "repeat(4, 1fr)",
        }}
        gap={4}
      >
        {clients.map((client) => (
          <ClickableCard
            key={client._id}
            onClick={() => navigate(`/coach/clients/${client._id}`)}
            p={8}
          >
            <VStack gap={3}>
              <Avatar.Root size="lg">
                <Avatar.Fallback
                  name={`${client.firstName} ${client.lastName}`}
                />
                {client.picture && <Avatar.Image src={client.picture} />}
              </Avatar.Root>
              <VStack gap={1}>
                <Text fontWeight="bold" fontSize="lg" textAlign="center">
                  {client.firstName} {client.lastName}
                </Text>
              </VStack>
            </VStack>
          </ClickableCard>
        ))}
      </Grid>
    </Box>
  );
};
