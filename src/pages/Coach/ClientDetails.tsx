import { SlidePanel } from "@/components/SlidePanel";
import { Exercise } from "@/types";
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
import { useThemeColors } from "@/hooks/useThemeColors";
import { useClientDetails } from "@/hooks/queries/useClientDetails";
import { useUpdateProgramSessions } from "@/hooks/mutations/useProgramMutations";

const ClientDetails = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const colors = useThemeColors();

  const { data: client, isLoading } = useClientDetails(clientId!);

  const updateProgramMutation = useUpdateProgramSessions(clientId!);

  // --- Hook de gestion du programme (Logique Métier) ---
  const { program, initialize, actions } = useProgramEditor(null);

  // --- États UI (Affichage uniquement) ---
  const [isEditing, setIsEditing] = useState(false);

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
    if (client && client.program && !isEditing) {
      initialize(client.program);
    }
  }, [client, initialize, isEditing]);

  // --- Gestionnaires d'Actions UI ---

  const handleSave = () => {
    if (!program) return;

    updateProgramMutation.mutate(program.sessions, {
      onSuccess: () => {
        setIsEditing(false);
      },
    });
  };

  const handleCancel = () => {
    if (client && client.program) {
      initialize(client.program);
    }

    setIsEditing(false);
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
          {isLoading && (
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

                {/* 3. Section Programme (Grille de Sessions) */}
                {program && (
                  <Box mt={4}>
                    <HStack justify="space-between" mb={6}>
                      <Heading size="lg">Programme</Heading>
                      {isEditing ? (
                        <HStack>
                          <Button
                            variant="ghost"
                            onClick={handleCancel}
                            disabled={updateProgramMutation.isPending}
                          >
                            <LuX /> Annuler
                          </Button>
                          <Button
                            data-state="active"
                            bg={colors.primary}
                            color="gray.900"
                            onClick={handleSave}
                            loading={updateProgramMutation.isPending}
                          >
                            <LuSave /> Enregistrer
                          </Button>
                        </HStack>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(true)}
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
                      <HStack justify="flex-end" mt={6} gap={3}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancel}
                          disabled={updateProgramMutation.isPending}
                        >
                          <LuX /> Annuler
                        </Button>
                        <Button
                          size="sm"
                          bg={colors.primary}
                          color="gray.900"
                          onClick={handleSave}
                          loading={updateProgramMutation.isPending}
                        >
                          <LuSave /> Enregistrer
                        </Button>
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
