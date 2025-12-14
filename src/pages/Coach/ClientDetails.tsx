import { SlidePanel } from "@/components/SlidePanel";
import api from "@/config/api";
import { ClientWithDetails } from "@/types";
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
  Text,
  Grid,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuArrowLeft } from "react-icons/lu";
import { useNavigate, useParams } from "react-router-dom";

const ClientDetails = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientWithDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const response = await api.get(`/api/coach/clients/${clientId}`);
        setClient(response.data);
      } catch (error) {
        console.error("Error fetching client:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [clientId]);

  return (
    <SlidePanel onClose={() => navigate("/coach")}>
      {(handleClose) => (
        <>
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
                  onClick={handleClose}
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
                      </VStack>
                    </HStack>
                  </Card.Body>
                </Card.Root>

                {/* Programme */}
                <Box>
                  <Heading size="lg" mb={4}>
                    Programme
                  </Heading>
                  {client.program ? (
                    <Card.Root>
                      <Card.Body>
                        <VStack align="stretch" gap={4}>
                          <Heading size="md">{client.program.name}</Heading>
                          {client.program.description && (
                            <Text color="fg.muted">
                              {client.program.description}
                            </Text>
                          )}
                          <HStack gap={6}>
                            <VStack align="start" gap={0}>
                              <Text fontSize="sm" color="fg.muted">
                                Date de début
                              </Text>
                              <Text fontWeight="bold">
                                {new Date(
                                  client.program.startDate
                                ).toLocaleDateString("fr-FR")}
                              </Text>
                            </VStack>
                            {client.program.endDate && (
                              <VStack align="start" gap={0}>
                                <Text fontSize="sm" color="fg.muted">
                                  Date de fin
                                </Text>
                                <Text fontWeight="bold">
                                  {new Date(
                                    client.program.endDate
                                  ).toLocaleDateString("fr-FR")}
                                </Text>
                              </VStack>
                            )}
                          </HStack>
                        </VStack>
                      </Card.Body>
                    </Card.Root>
                  ) : (
                    <Card.Root>
                      <Card.Body>
                        <Text color="fg.muted">Aucun programme actif</Text>
                        <Button
                          bg="yellow.400"
                          color="gray.800"
                          mt={4}
                          onClick={() =>
                            navigate(
                              `/coach/clients/${client._id}/programs/new`
                            )
                          }
                        >
                          Créer un programme
                        </Button>
                      </Card.Body>
                    </Card.Root>
                  )}
                </Box>

                {/* Séances */}
                <Box>
                  <Heading size="lg" mb={4}>
                    Séances ({client.sessions.length})
                  </Heading>
                  {client.sessions.length > 0 ? (
                    <Grid
                      templateColumns={{
                        base: "1fr",
                        md: "repeat(2, 1fr)",
                      }}
                      gap={4}
                    >
                      {client.sessions.map((session) => (
                        <Card.Root key={session._id}>
                          <Card.Body>
                            <VStack align="start" gap={2}>
                              <HStack justify="space-between" width="100%">
                                <Heading size="sm">{session.name}</Heading>
                                <Text fontSize="sm" color="fg.muted">
                                  Séance {session.order}
                                </Text>
                              </HStack>
                              <Text fontSize="sm" color="fg.muted">
                                {session.workout.exercises.length} exercice(s)
                              </Text>
                              <Text fontSize="sm" color="fg.muted">
                                {session.workout.rounds} tour(s)
                              </Text>
                            </VStack>
                          </Card.Body>
                        </Card.Root>
                      ))}
                    </Grid>
                  ) : (
                    <Card.Root>
                      <Card.Body>
                        <Text color="fg.muted">
                          Aucune séance dans ce programme
                        </Text>
                      </Card.Body>
                    </Card.Root>
                  )}
                </Box>
              </VStack>
            </Container>
          )}
        </>
      )}
    </SlidePanel>
  );
};

export default ClientDetails;
