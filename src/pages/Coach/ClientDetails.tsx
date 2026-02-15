import { SlidePanel } from "@/components/SlidePanel";
import { ClientWithDetails, Exercise } from "@/types";
import { SessionCard, ExerciseSelectorPanel } from "@/features/session";
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
import { LuArrowLeft, LuPencil, LuSave, LuX } from "react-icons/lu";
import { useNavigate, useParams } from "react-router-dom";
import { GRID_LAYOUTS } from "@/constants/layouts";
import { toaster } from "@/components/ui/toaster";
import { useThemeColors } from "@/hooks/useThemeColors";

const ClientDetails = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientWithDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const colors = useThemeColors();

  // --- États pour l'édition ---
  const [isEditing, setIsEditing] = useState(false);
  const [originalClient, setOriginalClient] =
    useState<ClientWithDetails | null>(null);

  // État du panneau de sélection
  const [selectorState, setSelectorState] = useState<{
    isOpen: boolean;
    sessionId: string | null;
    sectionType: "warmup" | "workout";
  }>({
    isOpen: false,
    sessionId: null,
    sectionType: "workout",
  });

  useEffect(() => {
    // Mock complet
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
                mode: "timer",
              },
              {
                exercise: {
                  _id: "ex2",
                  name: "Rotations des épaules",
                  type: "warmup",
                } as any,
                reps: 15,
                mode: "reps",
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
                sets: 3,
                reps: 8,
                restBetweenSets: 90,
                mode: "reps",
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
                mode: "reps",
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
                mode: "reps",
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
                mode: "timer",
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
                mode: "reps",
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
                mode: "reps",
              },
              {
                exercise: { _id: "ex9", name: "Dips", type: "exercise" } as any,
                sets: 3,
                reps: 15,
                restBetweenSets: 60,
                mode: "reps",
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
                mode: "reps",
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
                mode: "reps",
              },
              {
                exercise: {
                  _id: "ex12",
                  name: "Hip Circles",
                  type: "warmup",
                } as any,
                duration: 45,
                mode: "timer",
              },
            ],
          },
          workout: {
            notes: "Travail des jambes",
            rounds: 3,
            restBetweenRounds: 120,
            exercises: [
              {
                exercise: {
                  _id: "ex13",
                  name: "Squat Bulgare",
                  type: "exercise",
                } as any,
                sets: 3,
                reps: 10,
                restBetweenSets: 90,
                mode: "reps",
              },
              {
                exercise: {
                  _id: "ex14",
                  name: "Leg Press",
                  type: "exercise",
                } as any,
                sets: 3,
                reps: 15,
                restBetweenSets: 75,
                mode: "reps",
              },
              {
                exercise: {
                  _id: "ex15",
                  name: "Calf Raises",
                  type: "exercise",
                } as any,
                sets: 4,
                reps: 20,
                restBetweenSets: 45,
                mode: "reps",
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

  // --- Gestionnaires d'édition ---

  const handleStartEditing = () => {
    setOriginalClient(JSON.parse(JSON.stringify(client)));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setClient(originalClient);
    setIsEditing(false);
    setOriginalClient(null);
  };

  const handleSave = () => {
    // Nettoyage des données avant sauvegarde
    if (client) {
      const cleanClient = { ...client };

      cleanClient.sessions.forEach((session) => {
        // Nettoyage Warmup
        session.warmup?.exercises.forEach((ex: any) => {
          if (ex._uiMode === "timer") {
            ex.reps = 0;
            ex.sets = 0;
          } else if (ex._uiMode === "reps") {
            ex.duration = 0;
          }
          // Suppression du champ temporaire
          delete ex._uiMode;
        });

        // Nettoyage Workout
        session.workout.exercises.forEach((ex: any) => {
          if (ex._uiMode === "timer") {
            ex.reps = 0;
            ex.sets = 0;
          } else if (ex._uiMode === "reps") {
            ex.duration = 0;
          }
          delete ex._uiMode;
        });
      });

      // TODO: Envoyer cleanClient à l'API
      console.log("Données nettoyées envoyées :", cleanClient);
    }

    setIsEditing(false);
    setOriginalClient(null);
    toaster.create({ title: "Programme sauvegardé", type: "success" });
  };

  // Suppression session
  const handleRemoveSession = (sessionId: string) => {
    if (!client) return;
    setClient({
      ...client,
      sessions: client.sessions.filter((s) => s._id !== sessionId),
    });
  };

  // Suppression exercice
  const handleRemoveExercise = (
    sessionId: string,
    type: "warmup" | "workout",
    index: number,
  ) => {
    if (!client) return;
    setClient((prev) => {
      if (!prev) return null;
      const newClient = { ...prev };
      const session = newClient.sessions.find((s) => s._id === sessionId);
      if (session) {
        if (type === "warmup" && session.warmup) {
          session.warmup.exercises.splice(index, 1);
        } else if (type === "workout") {
          session.workout.exercises.splice(index, 1);
        }
      }
      return newClient;
    });
  };

  // Mise à jour rounds
  const handleUpdateRounds = (sessionId: string, newRounds: number) => {
    if (!client) return;
    setClient((prev) => {
      if (!prev) return null;
      const newClient = { ...prev };
      const session = newClient.sessions.find((s) => s._id === sessionId);
      if (session) session.workout.rounds = newRounds;
      return newClient;
    });
  };

  // Mise à jour exercice (reps, sets, timer...)
  const handleUpdateExercise = (
    sessionId: string,
    type: "warmup" | "workout",
    index: number,
    updates: any,
  ) => {
    if (!client) return;
    setClient((prev) => {
      if (!prev) return null;
      const newClient = { ...prev };
      const session = newClient.sessions.find((s) => s._id === sessionId);
      if (session) {
        if (type === "warmup" && session.warmup) {
          Object.assign(session.warmup.exercises[index], updates);
        } else if (type === "workout") {
          Object.assign(session.workout.exercises[index], updates);
        }
      }
      return newClient;
    });
  };

  // Ouverture du panneau d'ajout
  const handleAddExercise = (sessionId: string, type: "warmup" | "workout") => {
    setSelectorState({ isOpen: true, sessionId, sectionType: type });
  };

  // Sélection d'un exercice dans le panneau
  const handleSelectExercise = (exercise: Exercise) => {
    const { sessionId, sectionType } = selectorState;
    if (!sessionId || !client) return;

    setClient((prev) => {
      if (!prev) return null;
      const newClient = { ...prev };
      const session = newClient.sessions.find((s) => s._id === sessionId);

      if (session) {
        const newExercise = {
          exercise: {
            _id: exercise._id,
            name: exercise.name,
            type: sectionType,
          },
          // Valeurs par défaut intelligentes
          sets: sectionType === "workout" ? 3 : undefined,
          reps: 10,
          duration: 0,
          restBetweenSets: sectionType === "workout" ? 60 : undefined,
        } as any;

        if (sectionType === "warmup") {
          if (!session.warmup) session.warmup = { exercises: [], notes: "" };
          session.warmup.exercises.push(newExercise);
        } else {
          session.workout.exercises.push(newExercise);
        }
      }
      return newClient;
    });

    setSelectorState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleUpdateRestBetweenRounds = (sessionId: string, value: number) => {
    if (!client) return;
    setClient((prev) => {
      if (!prev) return null;
      const newClient = { ...prev };
      const session = newClient.sessions.find((s) => s._id === sessionId);
      if (session) {
        session.workout.restBetweenRounds = value;
      }
      return newClient;
    });
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
                {/* Header Navigation */}
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  alignSelf="flex-start"
                >
                  <LuArrowLeft /> Retour
                </Button>

                {/* Info Client */}
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

                {/* Section Programme */}
                <Box>
                  <HStack justify="space-between" mb={6}>
                    <Heading size="lg">Programme</Heading>
                    {!isEditing && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleStartEditing}
                      >
                        <LuPencil /> Modifier
                      </Button>
                    )}
                  </HStack>

                  {/* Grille des Sessions */}
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
                        isEditing={isEditing}
                        onRemoveSession={() => handleRemoveSession(session._id)}
                        onAddExercise={(type) =>
                          handleAddExercise(session._id, type)
                        }
                        onRemoveExercise={(type, index) =>
                          handleRemoveExercise(session._id, type, index)
                        }
                        onUpdateRounds={(rounds) =>
                          handleUpdateRounds(session._id, rounds)
                        }
                        onUpdateExercise={(type, idx, updates) =>
                          handleUpdateExercise(session._id, type, idx, updates)
                        }
                        onUpdateRestBetweenRounds={(value) =>
                          handleUpdateRestBetweenRounds(session._id, value)
                        }
                      />
                    ))}

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
                  {isEditing && (
                    <HStack justify="space-between" mt={6}>
                      <Box></Box>

                      <HStack>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancel}
                        >
                          <LuX /> Annuler
                        </Button>
                        <Button
                          size="sm"
                          bg={colors.primary}
                          onClick={handleSave}
                        >
                          <LuSave /> Enregistrer
                        </Button>
                      </HStack>
                    </HStack>
                  )}
                </Box>
              </VStack>
            </Container>
          )}

          {/* Panneau latéral de sélection d'exercice */}
          <ExerciseSelectorPanel
            isOpen={selectorState.isOpen}
            onClose={() =>
              setSelectorState((prev) => ({ ...prev, isOpen: false }))
            }
            type={selectorState.sectionType}
            onSelect={handleSelectExercise}
          />
        </>
      )}
    </SlidePanel>
  );
};

export default ClientDetails;
