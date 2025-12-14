import { Client } from "@/types";
import {
  Avatar,
  Box,
  Card,
  Grid,
  SkeletonCircle,
  SkeletonText,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMinimumLoading } from "@/hooks/useMinimulLoading";
import api from "@/config/api";

const MOCK_CLIENTS: Client[] = [
  {
    _id: "1",
    firstName: "Marie",
    lastName: "Dupont",
    email: "marie.dupont@example.com",
    picture: "https://i.pravatar.cc/150?img=1",
    linkedAt: new Date(),
  },
  {
    _id: "2",
    firstName: "Thomas",
    lastName: "Martin",
    email: "thomas.martin@example.com",
    picture: "https://i.pravatar.cc/150?img=12",
    linkedAt: new Date(),
  },
  {
    _id: "3",
    firstName: "Sophie",
    lastName: "Bernard",
    email: "sophie.bernard@example.com",
    picture: "https://i.pravatar.cc/150?img=5",
    linkedAt: new Date(),
  },
  {
    _id: "4",
    firstName: "Lucas",
    lastName: "Petit",
    email: "lucas.petit@example.com",
    linkedAt: new Date(),
  },
  {
    _id: "5",
    firstName: "Emma",
    lastName: "Durand",
    email: "emma.durand@example.com",
    picture: "https://i.pravatar.cc/150?img=9",
    linkedAt: new Date(),
  },
  {
    _id: "6",
    firstName: "Alexandre",
    lastName: "Moreau",
    email: "alex.moreau@example.com",
    picture: "https://i.pravatar.cc/150?img=13",
    linkedAt: new Date(),
  },
  {
    _id: "7",
    firstName: "Léa",
    lastName: "Simon",
    email: "lea.simon@example.com",
    picture: "https://i.pravatar.cc/150?img=20",
    linkedAt: new Date(),
  },
  {
    _id: "8",
    firstName: "Hugo",
    lastName: "Laurent",
    email: "hugo.laurent@example.com",
    linkedAt: new Date(),
  },
];

export const ClientsGrid = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const { loading, executeWithMinimumLoading } = useMinimumLoading();
  const navigate = useNavigate();

  useEffect(() => {
    executeWithMinimumLoading(async () => {
      const response = await api.get("/api/coach/clients");
      setClients(response.data);
      // setClients(MOCK_CLIENTS);
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
            <Card.Root key={index} p={4}>
              <Card.Body>
                <VStack gap={3}>
                  <SkeletonCircle size="11" />

                  <VStack gap={1} w="100%">
                    <SkeletonText height={6} noOfLines={1} />
                  </VStack>
                </VStack>
              </Card.Body>
            </Card.Root>
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
          <Card.Root
            key={client._id}
            onClick={() => navigate(`/coach/clients/${client._id}`)}
            p={4}
            cursor="pointer"
            borderTopWidth="3px"
            borderTopColor="transparent"
            transition="all 0.2s"
            _hover={{
              borderTopColor: "yellow.400",
              transform: "translateY(-2px)",
              boxShadow: "md",
            }}
          >
            <Card.Body>
              <VStack gap={3}>
                <Avatar.Root size="lg">
                  <Avatar.Fallback
                    name={`${client.firstName} ${client.lastName}`}
                  />
                  <Avatar.Image src={client.picture} />
                </Avatar.Root>

                <VStack gap={1}>
                  <Text fontWeight="bold" fontSize="md">
                    {client.firstName} {client.lastName}
                  </Text>
                </VStack>
              </VStack>
            </Card.Body>
          </Card.Root>
        ))}
      </Grid>
    </Box>
  );
};
