import api from "@/config/api";
import { SlidePanel } from "@/components/SlidePanel";
import { Field } from "@/components/ui/field";
import { toaster } from "@/components/ui/toaster";
import {
  Box,
  Button,
  Card,
  Container,
  Heading,
  HStack,
  IconButton,
  Input,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { LuArrowLeft, LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

interface SessionData {
  id: number;
  name: string;
  order: number;
  warmup: {
    notes: string;
    exercises: any[];
  };
  workout: {
    notes: string;
    rounds: number;
    restBetweenRounds: number;
    exercises: any[];
  };
}

const MotionBox = motion(Box);

function SessionCard({
  session,
  index,
  updateSession,
  removeSession,
}: {
  session: SessionData;
  index: number;
  updateSession: (index: number, updates: Partial<SessionData>) => void;
  removeSession: (index: number) => void;
}) {
  return (
    <Card.Root minW="300px" maxW="300px" flexShrink={0} overflow="hidden">
      <Card.Body>
        <VStack gap={5} align="stretch">
          {/* Nom */}
          <Input
            value={session.name}
            onChange={(e) => updateSession(index, { name: e.target.value })}
            placeholder="Nom de la séance"
            size="sm"
            fontWeight="medium"
          />

          {/* Échauffement */}
          <Box>
            <Text fontSize="xs" fontWeight="medium" mb={2} color="fg.muted">
              Échauffement
            </Text>
            <Box
              p={3}
              borderWidth="2px"
              borderStyle="dashed"
              borderColor="blue.300"
              borderRadius="md"
              cursor="pointer"
              transition="all 0.2s"
              color="fg.muted"
              _hover={{
                borderColor: "blue.300",
                bg: "blue.300",
                color: "fg.inverted",
              }}
            >
              <Text fontSize="xs" textAlign="center">
                + Ajouter un exercice
              </Text>
            </Box>
          </Box>

          {/* Workout info */}
          <Box>
            <Text fontSize="xs" fontWeight="medium" mb={2} color="fg.muted">
              Entraînement
            </Text>
            <VStack gap={2} align="stretch">
              <HStack gap={2} fontSize="xs">
                <Input
                  type="number"
                  min={1}
                  value={session.workout.rounds}
                  onChange={(e) =>
                    updateSession(index, {
                      workout: {
                        ...session.workout,
                        rounds: parseInt(e.target.value) || 1,
                      },
                    })
                  }
                  size="xs"
                  w="70px"
                  placeholder="Tours"
                />
                <Text color="fg.muted">tours</Text>
                <Input
                  type="number"
                  min={0}
                  value={session.workout.restBetweenRounds}
                  onChange={(e) =>
                    updateSession(index, {
                      workout: {
                        ...session.workout,
                        restBetweenRounds: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  size="xs"
                  w="70px"
                  placeholder="Repos"
                />
                <Text color="fg.muted">sec</Text>
              </HStack>
              <Box
                p={3}
                borderWidth="2px"
                borderStyle="dashed"
                borderColor="yellow.300"
                borderRadius="md"
                cursor="pointer"
                transition="all 0.2s"
                color="fg.muted"
                _hover={{
                  borderColor: "yellow.400",
                  bg: "yellow.400",
                  color: "fg.inverted",
                }}
              >
                <Text fontSize="xs" textAlign="center">
                  + Ajouter un exercice
                </Text>
              </Box>
            </VStack>
          </Box>

          {/* Footer */}
          <Box mt={3}>
            <HStack gap={2} justify="space-between" align="center">
              <Button variant="outline" size="xs" w="50%" colorPalette="yellow">
                Modifier
              </Button>

              <Button
                variant="outline"
                size="xs"
                w="50%"
                colorPalette="red"
                onClick={() => removeSession(index)}
              >
                Supprimer
              </Button>
            </HStack>
          </Box>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

function SessionSeparator({
  index,
  totalSessions,
  moveSession,
}: {
  index: number;
  totalSessions: number;
  moveSession: (from: number, to: number) => void;
}) {
  if (index === totalSessions - 1) return null;

  return (
    <VStack
      gap={5}
      flexShrink={0}
      justify="center"
      alignItems="center"
      alignSelf="center"
      minH="100px"
      w="60px"
    >
      {/* Flèche gauche : déplacer la carte suivante vers la gauche */}
      <IconButton
        aria-label="Déplacer vers la gauche"
        onClick={() => moveSession(index + 1, index)}
        size="md"
        variant="ghost"
        borderRadius="full"
      >
        <LuChevronLeft />
      </IconButton>

      {/* Flèche droite : déplacer la carte actuelle vers la droite */}
      <IconButton
        aria-label="Déplacer vers la droite"
        onClick={() => moveSession(index, index + 1)}
        size="md"
        variant="ghost"
        borderRadius="full"
      >
        <LuChevronRight />
      </IconButton>
    </VStack>
  );
}

const CreateProgram = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });

  const [sessions, setSessions] = useState<SessionData[]>([
    {
      id: 1,
      name: "Full Body",
      order: 1,
      warmup: {
        notes: "5 min cardio + mobilité",
        exercises: [],
      },
      workout: {
        notes: "Focus technique",
        rounds: 3,
        restBetweenRounds: 90,
        exercises: [],
      },
    },
    {
      id: 2,
      name: "Upper Body",
      order: 2,
      warmup: {
        notes: "",
        exercises: [],
      },
      workout: {
        notes: "Contrôler la descente",
        rounds: 4,
        restBetweenRounds: 60,
        exercises: [],
      },
    },
  ]);

  const moveSession = (from: number, to: number) => {
    if (to < 0 || to >= sessions.length) return;

    const newSessions = [...sessions];
    const [movedSession] = newSessions.splice(from, 1);
    newSessions.splice(to, 0, movedSession);

    setSessions(
      newSessions.map((s, index) => ({
        ...s,
        order: index + 1,
      }))
    );
  };

  const addSession = () => {
    const newSession: SessionData = {
      id: Date.now(),
      name: `Séance ${sessions.length + 1}`,
      order: sessions.length + 1,
      warmup: {
        notes: "",
        exercises: [],
      },
      workout: {
        notes: "",
        rounds: 1,
        restBetweenRounds: 0,
        exercises: [],
      },
    };
    setSessions([...sessions, newSession]);
  };

  const removeSession = (index: number) => {
    const newSessions = sessions.filter((_, i) => i !== index);
    // Réorganiser les orders
    setSessions(
      newSessions.map((s, i) => ({
        ...s,
        order: i + 1,
      }))
    );
  };

  const updateSession = (index: number, updates: Partial<SessionData>) => {
    const newSessions = [...sessions];
    newSessions[index] = { ...newSessions[index], ...updates };
    setSessions(newSessions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/api/coach/programs", {
        clientId,
        ...formData,
        sessions,
      });

      toaster.create({
        title: "Succès",
        description: "Programme créé avec succès",
        type: "success",
      });

      navigate(`/coach/clients/${clientId}`);
    } catch (error) {
      console.error("Error creating program:", error);
      toaster.create({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du programme",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SlidePanel onClose={() => navigate(`/coach/clients/${clientId}`)}>
      {(handleClose) => (
        <Container maxW="container.lg" py={8}>
          <form onSubmit={handleSubmit}>
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

              {/* Header */}
              <Card.Root>
                <Card.Body>
                  <Heading size="xl">Créer un programme</Heading>
                </Card.Body>
              </Card.Root>

              {/* Informations générales */}
              <Box>
                <Heading size="lg" mb={4}>
                  Informations générales
                </Heading>
                <Card.Root>
                  <Card.Body>
                    <VStack gap={4} align="stretch">
                      <Field label="Nom du programme" required>
                        <Input
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="Ex: Programme Prise de Masse 12 semaines"
                          required
                        />
                      </Field>

                      <Field label="Description">
                        <Textarea
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          placeholder="Description du programme, objectifs, consignes..."
                          rows={4}
                        />
                      </Field>

                      <Stack
                        gap={4}
                        flexDirection={{ base: "column", sm: "row" }}
                      >
                        <Field label="Date de début" required flex={1}>
                          <Input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                startDate: e.target.value,
                              })
                            }
                            required
                          />
                        </Field>

                        <Field label="Date de fin (optionnel)" flex={1}>
                          <Input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                endDate: e.target.value,
                              })
                            }
                            min={formData.startDate}
                          />
                        </Field>
                      </Stack>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              </Box>

              {/* Section Séances */}
              <Box>
                <Heading size="lg" mb={4}>
                  Séances ({sessions.length})
                </Heading>
                <HStack
                  gap={4}
                  overflowX="auto"
                  pb={4}
                  align="start"
                  css={{
                    "&::-webkit-scrollbar": {
                      height: "8px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "transparent",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "var(--chakra-colors-gray-300)",
                      borderRadius: "4px",
                    },
                    "&::-webkit-scrollbar-thumb:hover": {
                      background: "var(--chakra-colors-gray-400)",
                    },
                  }}
                >
                  <AnimatePresence mode="popLayout">
                    {sessions.map((session, index) => (
                      <MotionBox
                        key={session.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                        display="flex"
                        gap={4}
                      >
                        <SessionCard
                          key={session.id}
                          session={session}
                          index={index}
                          updateSession={updateSession}
                          removeSession={removeSession}
                        />
                        <SessionSeparator
                          key={`sep-${session.id}`}
                          index={index}
                          totalSessions={sessions.length}
                          moveSession={moveSession}
                        />
                      </MotionBox>
                    ))}
                  </AnimatePresence>

                  {/* Carte d'ajout de séance */}
                  <Box
                    minW="300px"
                    maxW="300px"
                    h="365px"
                    flexShrink={0}
                    borderWidth="2px"
                    borderStyle="dashed"
                    borderColor="yellow.300"
                    borderRadius="md"
                    cursor="pointer"
                    transition="all 0.2s"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="fg.muted"
                    _hover={{
                      borderColor: "yellow.400",
                      bg: "yellow.400",
                      color: "fg.inverted",
                    }}
                    onClick={addSession}
                  >
                    <VStack gap={2}>
                      <Text fontSize="2xl">+</Text>
                      <Text fontSize="sm" fontWeight="medium">
                        Ajouter une séance
                      </Text>
                    </VStack>
                  </Box>
                </HStack>
              </Box>

              {/* Actions */}
              <HStack gap={4} justify="flex-end">
                <Button variant="outline" onClick={handleClose}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  bg="yellow.400"
                  color="gray.800"
                  loading={loading}
                >
                  Créer le programme
                </Button>
              </HStack>
            </VStack>
          </form>
        </Container>
      )}
    </SlidePanel>
  );
};

export default CreateProgram;
