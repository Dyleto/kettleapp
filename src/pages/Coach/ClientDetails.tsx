import { SlidePanel } from "@/components/SlidePanel";
import { ClientProgram, ClientWithDetails, Exercise } from "@/types";
import {
  SessionCard,
  ExerciseSelectorPanel,
  CreateSessionCard,
} from "@/features/session";
import { useProgramEditor } from "@/features/program/hooks/useProgramEditor";
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
import { toaster } from "@/components/ui/toaster";
import { useThemeColors } from "@/hooks/useThemeColors";

const ClientDetails = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const colors = useThemeColors();

  const [client, setClient] = useState<ClientWithDetails | null>(null);

  // --- Hook de gestion du programme (Logique Métier) ---
  const { program, initialize, actions } = useProgramEditor(null);

  // --- États UI (Affichage uniquement) ---
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState(false);

  // Sauvegarde temporaire pour annulation
  const [originalProgram, setOriginalProgram] = useState<ClientProgram | null>(
    null,
  );

  // État du panneau de sélection d'exercice
  const [selectorState, setSelectorState] = useState<{
    isOpen: boolean;
    sessionId: string | null;
    sectionType: "warmup" | "workout";
  }>({
    isOpen: false,
    sessionId: null,
    sectionType: "workout",
  });

  // Chargement des données (Mock ou API)
  useEffect(() => {
    // NOTE: Ici tu remplaceras par ton appel API réel
    const data: ClientWithDetails = {
      _id: "c123456789",
      firstName: "Thomas",
      lastName: "Dubois",
      email: "thomas.dubois@example.com",
      picture: "https://i.pravatar.cc/150?u=thomas",
      linkedAt: new Date("2025-01-15T10:00:00Z"),
      program: {
        sessions: [
          {
            _id: "s1",
            name: "Push A",
            order: 1,
            warmup: {
              notes: "Mobilité épaules",
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
              notes: "Focus Pecs/Triceps",
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
                  mode: "reps",
                },
                {
                  exercise: {
                    _id: "ex4",
                    name: "Dips",
                    type: "exercise",
                  } as any,
                  sets: 3,
                  reps: 10,
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
            name: "Pull A",
            order: 2,
            warmup: {
              notes: "Activation Dos",
              exercises: [
                {
                  exercise: {
                    _id: "ex5",
                    name: "Cat-Cow",
                    type: "warmup",
                  } as any,
                  duration: 45,
                  mode: "timer",
                },
              ],
            },
            workout: {
              notes: "Focus Dos/Biceps",
              rounds: 4,
              restBetweenRounds: 60,
              exercises: [
                {
                  exercise: {
                    _id: "ex6",
                    name: "Tractions",
                    type: "exercise",
                  } as any,
                  sets: 4,
                  reps: 8,
                  restBetweenSets: 90,
                  mode: "reps",
                },
                {
                  exercise: {
                    _id: "ex7",
                    name: "Rowing Barre",
                    type: "exercise",
                  } as any,
                  sets: 3,
                  reps: 10,
                  restBetweenSets: 75,
                  mode: "reps",
                },
              ],
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            _id: "s3",
            name: "Legs A (Quad)",
            order: 3,
            warmup: {
              notes: "Mobilité Hanches",
              exercises: [
                {
                  exercise: {
                    _id: "ex8",
                    name: "Squat PDC",
                    type: "warmup",
                  } as any,
                  reps: 20,
                  mode: "reps",
                },
              ],
            },
            workout: {
              notes: "Focus Quadriceps",
              rounds: 3,
              restBetweenRounds: 120,
              exercises: [
                {
                  exercise: {
                    _id: "ex9",
                    name: "Squat Barre",
                    type: "exercise",
                  } as any,
                  sets: 4,
                  reps: 8,
                  restBetweenSets: 120,
                  mode: "reps",
                },
                {
                  exercise: {
                    _id: "ex10",
                    name: "Leg Extension",
                    type: "exercise",
                  } as any,
                  sets: 3,
                  reps: 15,
                  restBetweenSets: 60,
                  mode: "reps",
                },
              ],
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            _id: "s4",
            name: "Repos / Cardio",
            order: 4,
            warmup: { exercises: [], notes: "" },
            workout: {
              notes: "Récupération active",
              rounds: 1,
              restBetweenRounds: 0,
              exercises: [
                {
                  exercise: {
                    _id: "ex11",
                    name: "Course à pied (Léger)",
                    type: "exercise",
                  } as any,
                  duration: 1800,
                  mode: "timer",
                  restBetweenSets: 0,
                },
              ],
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            _id: "s5",
            name: "Push B",
            order: 5,
            warmup: { exercises: [], notes: "" },
            workout: {
              notes: "Focus Epaules",
              rounds: 3,
              restBetweenRounds: 90,
              exercises: [
                {
                  exercise: {
                    _id: "ex12",
                    name: "Développé Militaire",
                    type: "exercise",
                  } as any,
                  sets: 4,
                  reps: 8,
                  restBetweenSets: 90,
                  mode: "reps",
                },
                {
                  exercise: {
                    _id: "ex13",
                    name: "Elévations Latérales",
                    type: "exercise",
                  } as any,
                  sets: 3,
                  reps: 15,
                  restBetweenSets: 45,
                  mode: "reps",
                },
              ],
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            _id: "s6",
            name: "Pull B",
            order: 6,
            warmup: { exercises: [], notes: "" },
            workout: {
              notes: "Focus Epaisseur Dos",
              rounds: 4,
              restBetweenRounds: 60,
              exercises: [
                {
                  exercise: {
                    _id: "ex14",
                    name: "Tirage Poitrine",
                    type: "exercise",
                  } as any,
                  sets: 4,
                  reps: 10,
                  restBetweenSets: 60,
                  mode: "reps",
                },
                {
                  exercise: {
                    _id: "ex15",
                    name: "Face Pull",
                    type: "exercise",
                  } as any,
                  sets: 3,
                  reps: 15,
                  restBetweenSets: 45,
                  mode: "reps",
                },
              ],
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            _id: "s7",
            name: "Legs B (Ischios)",
            order: 7,
            warmup: { exercises: [], notes: "" },
            workout: {
              notes: "Focus Chaîne Postérieure",
              rounds: 3,
              restBetweenRounds: 90,
              exercises: [
                {
                  exercise: {
                    _id: "ex16",
                    name: "Soulevé de Terre Roumain",
                    type: "exercise",
                  } as any,
                  sets: 4,
                  reps: 8,
                  restBetweenSets: 120,
                  mode: "reps",
                },
                {
                  exercise: {
                    _id: "ex17",
                    name: "Leg Curl",
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
        ],
      },
    };

    initialize(data.program);
    setClient(data);
    setLoading(false);
  }, [clientId, initialize]);

  // --- Gestionnaires d'Actions UI ---

  const handleStartEditing = () => {
    if (program) {
      setOriginalProgram(JSON.parse(JSON.stringify(program)));
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    if (originalProgram) {
      initialize(originalProgram);
    }
    setIsEditing(false);
    setOriginalProgram(null);
  };

  const handleSave = () => {
    if (program) {
      // TODO: Appel API pour sauvegarder `program`
      console.log("Données sauvegardées vers l'API :", program);

      setIsEditing(false);
      setOriginalProgram(null);
      toaster.create({
        title: "Programme sauvegardé avec succès",
        type: "success",
      });
    }
  };

  // --- Gestion du panneau sélecteur d'exercices ---

  const handleOpenSelector = (
    sessionId: string,
    type: "warmup" | "workout",
  ) => {
    setSelectorState({ isOpen: true, sessionId, sectionType: type });
  };

  const handleSelectExercise = (exercise: Exercise) => {
    const { sessionId, sectionType } = selectorState;
    if (sessionId) {
      actions.addExercise(sessionId, sectionType, exercise);
    }
    setSelectorState((prev) => ({ ...prev, isOpen: false }));
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
            <Container maxW="container.xl" px={4} py={8}>
              <VStack gap={6} align="stretch">
                {/* 1. Header Navigation & Actions */}
                <HStack justify="space-between">
                  <Button variant="ghost" onClick={handleClose}>
                    <LuArrowLeft /> Retour
                  </Button>
                </HStack>

                {/* 2. Info Client */}
                <Card.Root>
                  <Card.Body>
                    <HStack gap={6}>
                      <Avatar.Root size="2xl">
                        <Avatar.Fallback
                          name={`${client.firstName} ${client.lastName}`}
                        />
                        <Avatar.Image src={client.picture} />
                      </Avatar.Root>
                      <VStack align="start" gap={1} flex={1}>
                        <Heading size="2xl">
                          {client.firstName} {client.lastName}
                        </Heading>
                        <Text color="fg.muted" fontSize="lg">
                          {client.email}
                        </Text>
                      </VStack>
                    </HStack>
                  </Card.Body>
                </Card.Root>

                {/* 3. Section Programme (Grille de Sessions) */}
                {program && (
                  <Box mt={4}>
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

                    <Grid
                      templateColumns={{
                        base: "1fr",
                        md: "repeat(auto-fill, minmax(400px, 1fr))",
                      }}
                      gap={8}
                      alignItems="start"
                    >
                      {/* Liste des sessions */}
                      {program.sessions.map((session) => (
                        <SessionCard
                          key={session._id}
                          session={session}
                          interactive={false}
                          isEditing={isEditing}
                          onRemoveSession={() =>
                            actions.removeSession(session._id)
                          }
                          onUpdateSessionNotes={(notes) =>
                            actions.updateSessionNotes(session._id, notes)
                          }
                          // Warmup & Workout Actions
                          onAddExercise={(type) =>
                            handleOpenSelector(session._id, type)
                          }
                          onRemoveExercise={(type, index) =>
                            actions.removeExercise(session._id, type, index)
                          }
                          onUpdateExercise={(type, idx, updates) =>
                            actions.updateExerciseDetails(
                              session._id,
                              type,
                              idx,
                              updates,
                            )
                          }
                          // Workout Specifics
                          onUpdateRounds={(rounds) =>
                            actions.updateRounds(session._id, rounds)
                          }
                          onUpdateRestBetweenRounds={(value) =>
                            actions.updateRestBetweenRounds(session._id, value)
                          }
                        />
                      ))}

                      {/* Carte d'ajout (visible uniquement en édition) */}
                      {isEditing && (
                        <CreateSessionCard onClick={actions.addSession} />
                      )}

                      {/* Empty State */}
                      {!isEditing && program.sessions.length === 0 && (
                        <Box
                          gridColumn="1 / -1"
                          p={8}
                          bg="whiteAlpha.50"
                          borderRadius="lg"
                          textAlign="center"
                          borderWidth="1px"
                          borderColor="whiteAlpha.200"
                        >
                          <Text color="gray.400">
                            Ce programme ne contient aucune séance pour le
                            moment.
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
                )}
              </VStack>
            </Container>
          )}

          {/* Panneau latéral de sélection d'exercice */}
          {selectorState.isOpen && (
            <ExerciseSelectorPanel
              isOpen={selectorState.isOpen}
              onClose={() =>
                setSelectorState((prev) => ({ ...prev, isOpen: false }))
              }
              type={selectorState.sectionType}
              onSelect={handleSelectExercise}
            />
          )}
        </>
      )}
    </SlidePanel>
  );
};

export default ClientDetails;
