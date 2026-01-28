import { SlidePanel } from "@/components/SlidePanel";
import { ClientWithDetails } from "@/types";
import { SessionCard } from "@/features/Session";
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
import { GRID_LAYOUTS } from "@/constants/layouts";

const ClientDetails = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientWithDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Mock complet avec exercices détaillés
    const mockClient: ClientWithDetails = {
      _id: clientId || "1",
      firstName: "Marie",
      lastName: "Dupont",
      email: "marie.dupont@example.com",
      picture: "https://i.pravatar.cc/150?img=1",
      linkedAt: new Date("2024-01-15"),
      program: {
        _id: "prog1",
        name: "Programme Prise de Masse 12 Semaines",
        description: "Programme intensif pour développer la masse musculaire",
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-04-15"),
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-10"),
      },
      sessions: [
        {
          _id: "s1",
          programId: "prog1",
          name: "Full Body A",
          order: 1,
          warmup: {
            notes: "5 min de cardio léger + mobilité articulaire",
            exercises: [
              {
                exercise: {
                  _id: "ex1",
                  name: "Jumping Jacks",
                  type: "warmup",
                } as any,
                duration: 60,
              },
              {
                exercise: {
                  _id: "ex2",
                  name: "Rotations des épaules",
                  type: "warmup",
                } as any,
                reps: 15,
              },
            ],
          },
          workout: {
            notes: "Focus sur la technique, ne pas forcer",
            rounds: 3,
            restBetweenRounds: 90,
            exercises: [
              {
                exercise: {
                  _id: "ex3",
                  name: "Développé Couché",
                  type: "exercise",
                } as any,
                sets: 4,
                reps: 8,
                restBetweenSets: 90,
              },
              {
                exercise: {
                  _id: "ex4",
                  name: "Tractions",
                  type: "exercise",
                } as any,
                sets: 4,
                reps: 10,
                restBetweenSets: 60,
              },
              {
                exercise: {
                  _id: "ex5",
                  name: "Squat",
                  type: "exercise",
                } as any,
                sets: 3,
                reps: 12,
                restBetweenSets: 60,
              },
            ],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: "s2",
          programId: "prog1",
          name: "Upper Body Push",
          order: 2,
          warmup: {
            notes: "Échauffement des épaules et bras",
            exercises: [
              {
                exercise: {
                  _id: "ex6",
                  name: "Arm Circles",
                  type: "warmup",
                } as any,
                duration: 30,
              },
            ],
          },
          workout: {
            notes: "Travail des pectoraux et épaules",
            rounds: 4,
            restBetweenRounds: 60,
            exercises: [
              {
                exercise: {
                  _id: "ex7",
                  name: "Développé Incliné",
                  type: "exercise",
                } as any,
                sets: 4,
                reps: 10,
                restBetweenSets: 75,
              },
              {
                exercise: {
                  _id: "ex8",
                  name: "Élévations Latérales",
                  type: "exercise",
                } as any,
                sets: 3,
                reps: 12,
                restBetweenSets: 45,
              },
              {
                exercise: {
                  _id: "ex9",
                  name: "Dips",
                  type: "exercise",
                } as any,
                sets: 3,
                reps: 15,
                restBetweenSets: 60,
              },
              {
                exercise: {
                  _id: "ex10",
                  name: "Pompes",
                  type: "exercise",
                } as any,
                sets: 3,
                reps: 20,
                restBetweenSets: 45,
              },
            ],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: "s3",
          programId: "prog1",
          name: "Lower Body",
          order: 3,
          warmup: {
            notes: "Mobilité hanches et chevilles",
            exercises: [
              {
                exercise: {
                  _id: "ex11",
                  name: "Fentes Dynamiques",
                  type: "warmup",
                } as any,
                reps: 20,
              },
              {
                exercise: {
                  _id: "ex12",
                  name: "Hip Circles",
                  type: "warmup",
                } as any,
                duration: 45,
              },
            ],
          },
          workout: {
            notes: "Jour jambes intensif",
            rounds: 4,
            restBetweenRounds: 120,
            exercises: [
              {
                exercise: {
                  _id: "ex13",
                  name: "Squat Barre",
                  type: "exercise",
                } as any,
                sets: 5,
                reps: 6,
                restBetweenSets: 120,
              },
              {
                exercise: {
                  _id: "ex14",
                  name: "Leg Press",
                  type: "exercise",
                } as any,
                sets: 4,
                reps: 10,
                restBetweenSets: 90,
              },
              {
                exercise: {
                  _id: "ex15",
                  name: "Leg Curl",
                  type: "exercise",
                } as any,
                sets: 3,
                reps: 15,
                restBetweenSets: 60,
              },
            ],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: "s4",
          programId: "prog1",
          name: "Upper Body Pull",
          order: 4,
          workout: {
            notes: "Focus dos et biceps",
            rounds: 4,
            restBetweenRounds: 60,
            exercises: [
              {
                exercise: {
                  _id: "ex16",
                  name: "Rowing Barre",
                  type: "exercise",
                } as any,
                sets: 4,
                reps: 8,
                restBetweenSets: 90,
              },
              {
                exercise: {
                  _id: "ex17",
                  name: "Tirage Vertical",
                  type: "exercise",
                } as any,
                sets: 3,
                reps: 10,
                restBetweenSets: 75,
              },
              {
                exercise: {
                  _id: "ex18",
                  name: "Curl Barre",
                  type: "exercise",
                } as any,
                sets: 3,
                reps: 12,
                restBetweenSets: 60,
              },
              {
                exercise: {
                  _id: "ex19",
                  name: "Curl Marteau",
                  type: "exercise",
                } as any,
                sets: 3,
                reps: 15,
                restBetweenSets: 45,
              },
            ],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: "s5",
          programId: "prog1",
          name: "Full Body B",
          order: 5,
          warmup: {
            notes: "Échauffement dynamique complet",
            exercises: [
              {
                exercise: {
                  _id: "ex20",
                  name: "Burpees légers",
                  type: "warmup",
                } as any,
                reps: 10,
              },
            ],
          },
          workout: {
            notes: "Variante du Full Body A",
            rounds: 3,
            restBetweenRounds: 90,
            exercises: [
              {
                exercise: {
                  _id: "ex21",
                  name: "Soulevé de Terre",
                  type: "exercise",
                } as any,
                sets: 4,
                reps: 6,
                restBetweenSets: 120,
              },
              {
                exercise: {
                  _id: "ex22",
                  name: "Développé Militaire",
                  type: "exercise",
                } as any,
                sets: 4,
                reps: 8,
                restBetweenSets: 90,
              },
              {
                exercise: {
                  _id: "ex23",
                  name: "Fentes Bulgares",
                  type: "exercise",
                } as any,
                sets: 3,
                reps: 12,
                restBetweenSets: 60,
              },
            ],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: "s6",
          programId: "prog1",
          name: "Cardio & Core",
          order: 6,
          workout: {
            notes: "Travail cardio et gainage",
            rounds: 5,
            restBetweenRounds: 30,
            exercises: [
              {
                exercise: {
                  _id: "ex24",
                  name: "Mountain Climbers",
                  type: "exercise",
                } as any,
                duration: 60,
              },
              {
                exercise: {
                  _id: "ex25",
                  name: "Planche",
                  type: "exercise",
                } as any,
                duration: 45,
              },
              {
                exercise: {
                  _id: "ex26",
                  name: "Russian Twists",
                  type: "exercise",
                } as any,
                reps: 20,
              },
            ],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: "s7",
          programId: "prog1",
          name: "Recovery & Stretching",
          order: 7,
          warmup: {
            notes: "Foam rolling 10 min",
            exercises: [
              {
                exercise: {
                  _id: "ex27",
                  name: "Foam Rolling Global",
                  type: "warmup",
                } as any,
                duration: 600,
              },
            ],
          },
          workout: {
            notes: "Séance de récupération active",
            rounds: 2,
            restBetweenRounds: 60,
            exercises: [
              {
                exercise: {
                  _id: "ex28",
                  name: "Yoga Flow",
                  type: "exercise",
                } as any,
                duration: 120,
              },
              {
                exercise: {
                  _id: "ex29",
                  name: "Étirements Complets",
                  type: "exercise",
                } as any,
                duration: 90,
              },
            ],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    setClient(mockClient);
    setLoading(false);
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
            <Container maxW="100%" px={8} py={8}>
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

                  <Grid
                    templateColumns={GRID_LAYOUTS.sessions}
                    gap={8}
                    justifyContent="space-evenly"
                  >
                    {client.sessions.map((session) => (
                      <SessionCard
                        key={session._id}
                        session={session}
                        interactive={false}
                      />
                    ))}

                    {/* Message si aucune séance */}
                    {client.sessions.length === 0 && (
                      <Box
                        gridColumn="1 / -1"
                        p={8}
                        bg="gray.800"
                        borderRadius="lg"
                        textAlign="center"
                      >
                        <Text fontSize="sm" color="gray.400">
                          Aucune séance dans ce programme
                        </Text>
                      </Box>
                    )}
                  </Grid>
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
