import { SlidePanel } from "@/components/SlidePanel";
import api from "@/config/api";
import { ClientWithDetails, Session } from "@/types";
import { formatDuration } from "@/utils/formatters";
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
  IconButton,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
  LuArrowLeft,
  LuChevronDown,
  LuChevronUp,
  LuClock,
  LuDumbbell,
  LuFlame,
} from "react-icons/lu";
import { useNavigate, useParams } from "react-router-dom";

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
                exerciseId: {
                  _id: "ex1",
                  name: "Jumping Jacks",
                  type: "warmup",
                } as any,
                duration: 60,
              },
              {
                exerciseId: {
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
                exerciseId: {
                  _id: "ex3",
                  name: "Développé Couché",
                  type: "exercise",
                } as any,
                sets: 4,
                reps: 8,
                restBetweenSets: 90,
              },
              {
                exerciseId: {
                  _id: "ex4",
                  name: "Tractions",
                  type: "exercise",
                } as any,
                sets: 4,
                reps: 10,
                restBetweenSets: 60,
              },
              {
                exerciseId: {
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
                exerciseId: {
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
                exerciseId: {
                  _id: "ex7",
                  name: "Développé Incliné",
                  type: "exercise",
                } as any,
                sets: 4,
                reps: 10,
                restBetweenSets: 75,
              },
              {
                exerciseId: {
                  _id: "ex8",
                  name: "Élévations Latérales",
                  type: "exercise",
                } as any,
                sets: 3,
                reps: 12,
                restBetweenSets: 45,
              },
              {
                exerciseId: {
                  _id: "ex9",
                  name: "Dips",
                  type: "exercise",
                } as any,
                sets: 3,
                reps: 15,
                restBetweenSets: 60,
              },
              {
                exerciseId: {
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
                exerciseId: {
                  _id: "ex11",
                  name: "Fentes Dynamiques",
                  type: "warmup",
                } as any,
                reps: 20,
              },
              {
                exerciseId: {
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
                exerciseId: {
                  _id: "ex13",
                  name: "Squat Barre",
                  type: "exercise",
                } as any,
                sets: 5,
                reps: 6,
                restBetweenSets: 120,
              },
              {
                exerciseId: {
                  _id: "ex14",
                  name: "Leg Press",
                  type: "exercise",
                } as any,
                sets: 4,
                reps: 10,
                restBetweenSets: 90,
              },
              {
                exerciseId: {
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
                exerciseId: {
                  _id: "ex16",
                  name: "Rowing Barre",
                  type: "exercise",
                } as any,
                sets: 4,
                reps: 8,
                restBetweenSets: 90,
              },
              {
                exerciseId: {
                  _id: "ex17",
                  name: "Tirage Vertical",
                  type: "exercise",
                } as any,
                sets: 3,
                reps: 10,
                restBetweenSets: 75,
              },
              {
                exerciseId: {
                  _id: "ex18",
                  name: "Curl Barre",
                  type: "exercise",
                } as any,
                sets: 3,
                reps: 12,
                restBetweenSets: 60,
              },
              {
                exerciseId: {
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
                exerciseId: {
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
                exerciseId: {
                  _id: "ex21",
                  name: "Soulevé de Terre",
                  type: "exercise",
                } as any,
                sets: 4,
                reps: 6,
                restBetweenSets: 120,
              },
              {
                exerciseId: {
                  _id: "ex22",
                  name: "Développé Militaire",
                  type: "exercise",
                } as any,
                sets: 4,
                reps: 8,
                restBetweenSets: 90,
              },
              {
                exerciseId: {
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
                exerciseId: {
                  _id: "ex24",
                  name: "Mountain Climbers",
                  type: "exercise",
                } as any,
                duration: 60,
              },
              {
                exerciseId: {
                  _id: "ex25",
                  name: "Planche",
                  type: "exercise",
                } as any,
                duration: 45,
              },
              {
                exerciseId: {
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
                exerciseId: {
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
                exerciseId: {
                  _id: "ex28",
                  name: "Yoga Flow",
                  type: "exercise",
                } as any,
                duration: 120,
              },
              {
                exerciseId: {
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

  // Fonction pour calculer le temps total d'une séance
  const calculateSessionDuration = (session: Session): number => {
    let totalSeconds = 0;

    // Temps d'échauffement
    if (session.warmup?.exercises) {
      session.warmup.exercises.forEach((ex) => {
        if (ex.duration) {
          totalSeconds += ex.duration; // Déjà en secondes
        }
        if (ex.reps) {
          totalSeconds += 60; // 1 minute par exercice avec reps
        }
      });
    }

    // Temps d'entraînement par tour
    let workoutTimePerRound = 0;
    session.workout.exercises.forEach((ex) => {
      if (ex.duration) {
        workoutTimePerRound += ex.duration; // Déjà en secondes
      }
      if (ex.sets) {
        workoutTimePerRound += ex.sets * 60; // 1 min par série
      }
      // Repos entre séries
      if (ex.sets && ex.restBetweenSets) {
        workoutTimePerRound += (ex.sets - 1) * ex.restBetweenSets; // Déjà en secondes
      }
    });

    // Multiplier par le nombre de tours
    totalSeconds += workoutTimePerRound * session.workout.rounds;

    // Ajouter repos entre tours
    if (session.workout.restBetweenRounds && session.workout.rounds > 1) {
      totalSeconds +=
        (session.workout.rounds - 1) * session.workout.restBetweenRounds; // Déjà en secondes
    }

    return totalSeconds;
  };

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
                    templateColumns={{
                      base: "1fr",
                      md: "repeat(auto-fill, minmax(450px, 450px))",
                      lg: "repeat(auto-fill, minmax(500px, 500px))",
                    }}
                    gap={8}
                    justifyContent="space-evenly"
                  >
                    {client.sessions.map((session) => (
                      <Box
                        key={session._id}
                        p={0}
                        borderTopWidth="3px"
                        borderTopColor="transparent"
                        borderRadius="xl"
                        bg="gray.800"
                        boxShadow="0 8px 24px rgba(0, 0, 0, 0.4)"
                        position="relative"
                        overflow="hidden"
                        cursor="pointer"
                        transition="all 0.3s ease"
                        _hover={{
                          transform: "translateY(-2px)",
                          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.5)",
                          borderTopColor: "yellow.400",
                        }}
                      >
                        {/* Effet brillance dans le coin */}
                        <Box
                          position="absolute"
                          top="-50px"
                          right="-50px"
                          w="150px"
                          h="150px"
                          bg="yellow.400"
                          opacity={0.1}
                          borderRadius="full"
                          filter="blur(40px)"
                        />

                        {/* Contenu */}
                        <VStack
                          align="stretch"
                          gap={0}
                          position="relative"
                          zIndex={1}
                        >
                          {/* Header avec numéro et temps */}
                          <HStack
                            justify="space-between"
                            align="center"
                            p={{ base: 4, md: 6 }}
                          >
                            {/* Spacer gauche pour centrer le numéro (desktop uniquement) */}
                            <Box
                              w="80px"
                              display={{ base: "none", md: "block" }}
                            />

                            {/* Numéro stylisé */}
                            <Box
                              px={4}
                              py={2}
                              borderRadius="full"
                              bg="yellow.400"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              fontWeight="bold"
                              fontSize="lg"
                              color="gray.900"
                              boxShadow="0 4px 12px rgba(251, 191, 36, 0.3)"
                              position="relative"
                              _before={{
                                content: '""',
                                position: "absolute",
                                inset: "-3px",
                                borderRadius: "full",
                                padding: "3px",
                                background:
                                  "linear-gradient(135deg, rgba(251, 191, 36, 0.4), rgba(251, 191, 36, 0.1))",
                                WebkitMask:
                                  "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                                WebkitMaskComposite: "xor",
                                maskComposite: "exclude",
                              }}
                            >
                              Séance {session.order}
                            </Box>

                            {/* Temps à droite */}
                            <HStack
                              gap={2}
                              color="gray.400"
                              fontSize="sm"
                              w={{ base: "auto", md: "80px" }}
                              justify="flex-end"
                            >
                              <LuClock size={14} />
                              <Text fontWeight="medium">
                                {formatDuration(
                                  calculateSessionDuration(session),
                                )}
                              </Text>
                            </HStack>
                          </HStack>

                          {/* Échauffement */}
                          {session.warmup &&
                            session.warmup.exercises?.length > 0 && (
                              <Box
                                p={3}
                                mx={{ base: 0, md: 6 }}
                                mb={4}
                                bg="orange.900/20"
                                borderRadius={{ base: 0, md: "md" }}
                              >
                                <HStack gap={2} mb={2}>
                                  <LuFlame size={14} color="#fb923c" />
                                  <Text
                                    fontSize="xs"
                                    fontWeight="bold"
                                    color="orange.400"
                                  >
                                    Échauffement
                                  </Text>
                                </HStack>
                                <VStack gap={2} align="stretch">
                                  {session.warmup.exercises.map((ex, idx) => (
                                    <Box
                                      key={idx}
                                      p={3}
                                      bg="gray.900/50"
                                      borderRadius="md"
                                    >
                                      <VStack align="stretch" gap={1}>
                                        <Text
                                          color="gray.300"
                                          fontWeight="medium"
                                          fontSize="sm"
                                        >
                                          {typeof ex.exerciseId === "object" &&
                                          "name" in ex.exerciseId
                                            ? ex.exerciseId.name
                                            : `Exercice ${idx + 1}`}
                                        </Text>
                                        <HStack
                                          gap={3}
                                          fontSize="sm"
                                          color="gray.500"
                                        >
                                          {ex.duration && (
                                            <Text>
                                              {formatDuration(ex.duration)}
                                            </Text>
                                          )}
                                          {ex.reps && (
                                            <Text>× {ex.reps} reps</Text>
                                          )}
                                        </HStack>
                                      </VStack>
                                    </Box>
                                  ))}
                                </VStack>
                              </Box>
                            )}

                          {/* Entraînement */}
                          <Box
                            p={3}
                            mx={{ base: 0, md: 6 }}
                            mb={{ base: 0, md: 6 }}
                            bg="yellow.900/20"
                            borderRadius={{ base: 0, md: "md" }}
                          >
                            <HStack gap={2} mb={2}>
                              <LuDumbbell size={14} color="#fbbf24" />
                              <Text
                                fontSize="xs"
                                fontWeight="bold"
                                color="yellow.400"
                              >
                                Entraînement
                              </Text>
                            </HStack>

                            {/* Exercices avec accolade */}
                            <HStack gap={3} align="stretch">
                              {/* Liste des exercices */}
                              <VStack gap={2} align="stretch" flex={1}>
                                {session.workout.exercises.map((ex, idx) => (
                                  <Box
                                    key={idx}
                                    p={3}
                                    bg="gray.900/50"
                                    borderRadius="md"
                                  >
                                    <VStack align="stretch" gap={1}>
                                      <Text
                                        color="gray.300"
                                        fontWeight="medium"
                                        fontSize="sm"
                                      >
                                        {typeof ex.exerciseId === "object" &&
                                        "name" in ex.exerciseId
                                          ? ex.exerciseId.name
                                          : `Exercice ${idx + 1}`}
                                      </Text>
                                      <HStack
                                        gap={3}
                                        fontSize="sm"
                                        color="gray.500"
                                      >
                                        {ex.sets && (
                                          <Text>{ex.sets} séries</Text>
                                        )}
                                        {ex.reps && (
                                          <Text>× {ex.reps} reps</Text>
                                        )}
                                        {ex.duration && (
                                          <Text>
                                            {formatDuration(ex.duration)}
                                          </Text>
                                        )}
                                        {ex.restBetweenSets && (
                                          <>
                                            <Text>•</Text>
                                            <Text>
                                              {formatDuration(
                                                ex.restBetweenSets,
                                              )}{" "}
                                              repos
                                            </Text>
                                          </>
                                        )}
                                      </HStack>
                                    </VStack>
                                  </Box>
                                ))}
                              </VStack>

                              {/* Accolade + Tours */}
                              <VStack
                                justify="center"
                                align="center"
                                minW="60px"
                                gap={1}
                                alignSelf="stretch"
                              >
                                <HStack gap={2} align="stretch" h="full">
                                  {/* SVG Accolade */}
                                  <Box h="full" w="20px" position="relative">
                                    <svg
                                      width="20"
                                      height="100%"
                                      viewBox="0 0 20 100"
                                      preserveAspectRatio="none"
                                      style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        height: "100%",
                                      }}
                                    >
                                      <path
                                        d="M 5 0 Q 10 0, 10 5 L 10 45 Q 10 50, 15 50 Q 10 50, 10 55 L 10 95 Q 10 100, 5 100"
                                        fill="none"
                                        stroke="#fbbf24"
                                        strokeWidth="2"
                                        vectorEffect="non-scaling-stroke"
                                      />
                                    </svg>
                                  </Box>

                                  {/* Nombre de tours */}
                                  <VStack
                                    gap={0}
                                    align="start"
                                    justify="center"
                                  >
                                    <Text
                                      fontSize="xl"
                                      fontWeight="bold"
                                      color="yellow.400"
                                      lineHeight="1"
                                    >
                                      ×{session.workout.rounds}
                                    </Text>
                                    <Text fontSize="2xs" color="gray.500">
                                      tours
                                    </Text>
                                  </VStack>
                                </HStack>
                              </VStack>
                            </HStack>

                            {/* Repos entre tours */}
                            {((session.workout?.restBetweenRounds &&
                              session.workout.restBetweenRounds) ??
                              0) > 0 && (
                              <HStack
                                gap={2}
                                mt={2}
                                fontSize="sm"
                                color="gray.400"
                              >
                                <Text>Repos entre tours :</Text>
                                <Text fontWeight="bold" color="yellow.400">
                                  {formatDuration(
                                    session.workout.restBetweenRounds ?? 0,
                                  )}
                                </Text>
                              </HStack>
                            )}
                          </Box>
                        </VStack>
                      </Box>
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
