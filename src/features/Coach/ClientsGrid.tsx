import { Client } from "@/types";
import { Avatar, Box, Grid, SkeletonCircle, SkeletonText, Text, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMinimumLoading } from "@/hooks/useMinimulLoading";
import api from "@/config/api";
import ClickableCard from "@/components/clickableCard";

export const ClientsGrid = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const { loading, executeWithMinimumLoading } = useMinimumLoading();
  const navigate = useNavigate();

  useEffect(() => {
    executeWithMinimumLoading(async () => {
      const response = await api.get("/api/coach/clients");
      setClients(response.data);
    });
  }, []);

  if (loading) {
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

  if (clients.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="fg.muted">Aucun client pour le moment</Text>
      </Box>
    );
  }

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
          <ClickableCard key={client._id} onClick={() => navigate(`/coach/clients/${client._id}`)} p={8}>
            <VStack gap={3}>
              <Avatar.Root size="lg">
                <Avatar.Fallback name={`${client.firstName} ${client.lastName}`} />
                <Avatar.Image src={client.picture} />
              </Avatar.Root>

              <VStack gap={1}>
                <Text fontWeight="bold" fontSize="md">
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
