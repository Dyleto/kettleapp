import api from "@/config/api";
import { Client } from "@/types";
import {
  Avatar,
  Box,
  Card,
  Grid,
  Heading,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

const MINIMUM_LOADING_TIME_IN_MS = 300;

export const ClientsGrid = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      const startTime = Date.now();

      try {
        // const response = await api.get("/api/coach/clients");
        // setClients(response.data);
        setClients(MOCK_CLIENTS);
      } catch (error) {
        console.error("Error fetching clients:", error);
      } finally {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(
          0,
          MINIMUM_LOADING_TIME_IN_MS - elapsedTime
        );

        setTimeout(() => {
          setLoading(false);
        }, remainingTime);
      }
    };

    fetchClients();
  }, []);

  if (loading) {
    return (
      <Box w="100%">
        <SkeletonText height="28px" noOfLines={1} width="100px" mb={6} />
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
                    <SkeletonText height="21px" noOfLines={1} />
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
        <Text fontSize="sm" color="fg.muted" mt={2}>
          Partagez votre lien d'invitation pour ajouter des clients
        </Text>
      </Box>
    );
  }

  return (
    <Box w="100%">
      <Heading size="lg" mb={6}>
        Vos Clients
      </Heading>

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
                  <Text fontSize="sm" color="fg.muted">
                    {client.email}
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
