import { Client } from "@/types";
import {
  Box,
  Spinner,
  Container,
  VStack,
  Button,
  Card,
  HStack,
  Avatar,
  Heading,
  Badge,
  Text,
} from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { LuArrowLeft } from "react-icons/lu";
import { useNavigate, useParams } from "react-router-dom";

interface Program {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: "active" | "completed" | "upcoming";
}

const MotionBox = motion(Box);

const ClientDetails = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        // TODO: Remplacer par l'API réelle
        // const response = await api.get(`/api/coach/clients/${clientId}`);
        // setClient(response.data);

        // Mock pour le moment
        await new Promise((resolve) => setTimeout(resolve, 500));
        setClient({
          _id: clientId!,
          firstName: "Marie",
          lastName: "Dupont",
          email: "marie.dupont@example.com",
          picture: "https://i.pravatar.cc/150?img=1",
          linkedAt: new Date("2024-01-15"),
        });
      } catch (error) {
        console.error("Error fetching client:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [clientId]);

  const handleBack = () => {
    setIsExiting(true);
    setTimeout(() => {
      navigate("/coach");
    }, 250); // Durée de l'animation
  };

  // Mock program
  const mockProgram: Program = {
    name: "Programme Prise de Masse",
    description:
      "Programme intensif sur 12 semaines avec focus sur les groupes musculaires principaux",
    startDate: new Date("2024-11-01"),
    endDate: new Date("2025-01-31"),
    status: "active",
  };

  const statusColors = {
    active: "green",
    completed: "blue",
    upcoming: "yellow",
  };

  const statusLabels = {
    active: "En cours",
    completed: "Terminé",
    upcoming: "À venir",
  };

  return (
    <AnimatePresence>
      <MotionBox
        initial={{ x: "100%" }}
        animate={{ x: isExiting ? window.innerWidth : 0 }}
        exit={{ x: "100%" }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
        position="fixed"
        top={0}
        right={0}
        bottom={0}
        width="100%"
        bg="bg"
        zIndex={999}
        overflowY="auto"
      >
        {loading && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minH="100vh"
          >
            <Spinner size="xl" />
          </Box>
        )}
        {client && (
          <Container maxW="container.lg" py={8}>
            <VStack gap={6} align="stretch">
              {/* Bouton retour */}
              <Button
                variant="ghost"
                onClick={handleBack}
                alignSelf="flex-start"
              >
                <LuArrowLeft />
                Retour
              </Button>

              {/* En-tête client */}
              <Card.Root>
                <Card.Body>
                  <HStack gap={6}>
                    <Avatar.Root size="2xl">
                      <Avatar.Fallback
                        name={`${client.firstName} ${client.lastName}`}
                      />
                      <Avatar.Image src={client.picture} />
                    </Avatar.Root>

                    <VStack align="start" gap={2} flex={1}>
                      <Heading size="xl">
                        {client.firstName} {client.lastName}
                      </Heading>
                      <Text color="fg.muted" fontSize="md">
                        {client.email}
                      </Text>
                      <Text fontSize="sm" color="fg.muted">
                        Client depuis le{" "}
                        {new Date(client.linkedAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </Text>
                    </VStack>
                  </HStack>
                </Card.Body>
              </Card.Root>

              {/* Programme en cours */}
              <Box>
                <Heading size="lg" mb={4}>
                  Programme en cours
                </Heading>

                <Card.Root>
                  <Card.Body>
                    <VStack align="stretch" gap={4}>
                      <HStack justify="space-between">
                        <Heading size="md">{mockProgram.name}</Heading>
                        <Badge
                          colorPalette={statusColors[mockProgram.status]}
                          size="lg"
                        >
                          {statusLabels[mockProgram.status]}
                        </Badge>
                      </HStack>

                      <Text color="fg.muted">{mockProgram.description}</Text>

                      <HStack gap={6}>
                        <VStack align="start" gap={0}>
                          <Text fontSize="sm" color="fg.muted">
                            Date de début
                          </Text>
                          <Text fontWeight="bold">
                            {new Date(mockProgram.startDate).toLocaleDateString(
                              "fr-FR"
                            )}
                          </Text>
                        </VStack>

                        <VStack align="start" gap={0}>
                          <Text fontSize="sm" color="fg.muted">
                            Date de fin
                          </Text>
                          <Text fontWeight="bold">
                            {new Date(mockProgram.endDate).toLocaleDateString(
                              "fr-FR"
                            )}
                          </Text>
                        </VStack>
                      </HStack>

                      <Button bg="yellow.400" color="gray.800" mt={2}>
                        Modifier le programme
                      </Button>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              </Box>

              {/* Autres sections possibles */}
              <Box>
                <Heading size="lg" mb={4}>
                  Statistiques
                </Heading>
                <Card.Root>
                  <Card.Body>
                    <Text color="fg.muted">
                      Section statistiques à venir...
                    </Text>
                  </Card.Body>
                </Card.Root>
              </Box>
            </VStack>
          </Container>
        )}
      </MotionBox>
    </AnimatePresence>
  );
};

export default ClientDetails;
