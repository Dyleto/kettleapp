import ClickableCard from "@/components/clickableCard";
import { SlidePanel } from "@/components/SlidePanel";
import api from "@/config/api";
import { Box, Button, Container, Grid, Heading, HStack, Input, VStack, Card, Spinner } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuArrowLeft, LuPlus, LuSearch, LuFlame, LuDumbbell, LuPencil, LuTrash2 } from "react-icons/lu";
import { useNavigate } from "react-router-dom";

interface Exercise {
  _id: string;
  name: string;
  description?: string;
  videoUrl?: string;
  type: "warmup" | "exercise";
}

// Mock data pour l'aperçu
const MOCK_EXERCISES: Exercise[] = [
  {
    _id: "1",
    name: "Cardio léger",
    description: "5 minutes de course à pied à allure modérée",
    type: "warmup",
  },
  {
    _id: "2",
    name: "Mobilité articulaire",
    description: "Rotations des épaules, hanches et chevilles",
    type: "warmup",
  },
  {
    _id: "3",
    name: "Étirements dynamiques",
    description: "Montées de genoux, talons fesses",
    type: "warmup",
  },
  {
    _id: "4",
    name: "Squat goblet",
    description: "Squat avec kettlebell tenue devant la poitrine",
    type: "exercise",
  },
  {
    _id: "5",
    name: "Burpees",
    description: "Exercice complet sollicitant tout le corps",
    type: "exercise",
  },
  {
    _id: "6",
    name: "Kettlebell Swing",
    description: "Balancement de kettlebell, focus sur les hanches",
    type: "exercise",
  },
  {
    _id: "7",
    name: "Push-ups",
    description: "Pompes classiques, mains largeur d'épaules",
    type: "exercise",
  },
  {
    _id: "8",
    name: "Turkish Get-Up",
    description: "Mouvement complexe de transition sol-debout",
    type: "exercise",
  },
];

const Exercises = () => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      // const response = await api.get("/api/coach/exercises");
      // setExercises(response.data);

      // Mock pour l'aperçu
      setTimeout(() => {
        setExercises(MOCK_EXERCISES);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter((ex) => ex.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const warmups = filteredExercises.filter((ex) => ex.type === "warmup");
  const workouts = filteredExercises.filter((ex) => ex.type === "exercise");

  return (
    <SlidePanel onClose={() => navigate("/coach")}>
      {(handleClose) => (
        <Container maxW="container.xl" py={8}>
          <VStack gap={6} align="stretch">
            {/* Header */}
            <HStack justify="space-between" align="center">
              <HStack gap={4}>
                <Button variant="ghost" onClick={handleClose}>
                  <LuArrowLeft />
                  Retour
                </Button>
                <Heading size="xl">📚 Mes exercices</Heading>
              </HStack>
            </HStack>

            {/* Barre de recherche */}
            <Box>
              <HStack w="100%" bg="gray.800" borderRadius="md" borderWidth="1px" borderColor="gray.700" px={3}>
                <LuSearch color="gray" />
                <Input
                  placeholder="Rechercher un exercice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="lg"
                  border="none"
                  _focus={{ boxShadow: "none" }}
                />
              </HStack>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" py={12}>
                <Spinner size="xl" />
              </Box>
            ) : (
              <>
                {/* Section Échauffements */}
                <Box>
                  <HStack gap={3} mb={4}>
                    <LuFlame size={24} color="#fb923c" />
                    <Heading size="lg" color="orange.400">
                      Échauffements ({warmups.length})
                    </Heading>
                  </HStack>

                  <Grid
                    templateColumns={{
                      base: "1fr",
                      sm: "repeat(2, 1fr)",
                      md: "repeat(3, 1fr)",
                      lg: "repeat(4, 1fr)",
                    }}
                    gap={4}
                  >
                    {/* Bloc d'ajout en première position */}
                    <Box
                      p={6}
                      borderWidth="2px"
                      borderStyle="dashed"
                      borderColor="orange.400"
                      borderRadius="xl"
                      cursor="pointer"
                      transition="all 0.3s ease"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      minH="200px"
                      _hover={{
                        borderColor: "orange.300",
                        bg: "orange.400/5",
                        transform: "translateY(-2px)",
                      }}
                      onClick={() => navigate("/coach/exercises/new?type=warmup")}
                    >
                      <VStack gap={3} color="orange.400">
                        <Box
                          p={3}
                          bg="orange.400/10"
                          borderRadius="full"
                          borderWidth="2px"
                          borderStyle="dashed"
                          borderColor="orange.400"
                        >
                          <LuPlus size={32} />
                        </Box>
                        <Box fontWeight="bold" fontSize="md" textAlign="center">
                          Ajouter un échauffement
                        </Box>
                      </VStack>
                    </Box>

                    {/* Liste des échauffements */}
                    {warmups.map((exercise) => (
                      <ClickableCard
                        key={exercise._id}
                        onClick={() => navigate(`/coach/exercises/${exercise._id}`)}
                        p={6}
                        color="orange.400"
                      >
                        <VStack gap={3} align="stretch">
                          {/* Icône */}
                          <Box
                            p={3}
                            bg="orange.400/10"
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor="orange.400/30"
                            alignSelf="center"
                          >
                            <LuFlame size={28} color="#fb923c" />
                          </Box>

                          {/* Nom */}
                          <Box fontWeight="bold" fontSize="lg" textAlign="center" color="white">
                            {exercise.name}
                          </Box>

                          {/* Description courte */}
                          {exercise.description && (
                            <Box fontSize="sm" color="gray.400" lineClamp={2} textAlign="center">
                              {exercise.description}
                            </Box>
                          )}
                        </VStack>
                      </ClickableCard>
                    ))}
                  </Grid>
                </Box>

                {/* Section Exercices */}
                <Box>
                  <HStack gap={3} mb={4}>
                    <LuDumbbell size={24} color="#fbbf24" />
                    <Heading size="lg" color="yellow.400">
                      Exercices ({workouts.length})
                    </Heading>
                  </HStack>

                  <Grid
                    templateColumns={{
                      base: "1fr",
                      sm: "repeat(2, 1fr)",
                      md: "repeat(3, 1fr)",
                      lg: "repeat(4, 1fr)",
                    }}
                    gap={4}
                  >
                    {/* Bloc d'ajout en première position */}
                    <Box
                      p={6}
                      borderWidth="2px"
                      borderStyle="dashed"
                      borderColor="yellow.400"
                      borderRadius="xl"
                      cursor="pointer"
                      transition="all 0.3s ease"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      minH="200px"
                      _hover={{
                        borderColor: "yellow.300",
                        bg: "yellow.400/5",
                        transform: "translateY(-2px)",
                      }}
                      onClick={() => navigate("/coach/exercises/new?type=exercise")}
                    >
                      <VStack gap={3} color="yellow.400">
                        <Box
                          p={3}
                          bg="yellow.400/10"
                          borderRadius="full"
                          borderWidth="2px"
                          borderStyle="dashed"
                          borderColor="yellow.400"
                        >
                          <LuPlus size={32} />
                        </Box>
                        <Box fontWeight="bold" fontSize="md" textAlign="center">
                          Ajouter un exercice
                        </Box>
                      </VStack>
                    </Box>

                    {/* Liste des exercices */}
                    {workouts.map((exercise) => (
                      <ClickableCard
                        key={exercise._id}
                        onClick={() => navigate(`/coach/exercises/${exercise._id}`)}
                        p={6}
                      >
                        <VStack gap={3} align="stretch">
                          {/* Icône */}
                          <Box
                            p={3}
                            bg="yellow.400/10"
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor="yellow.400/30"
                            alignSelf="center"
                          >
                            <LuDumbbell size={28} color="#fbbf24" />
                          </Box>

                          {/* Nom */}
                          <Box fontWeight="bold" fontSize="lg" textAlign="center" color="white">
                            {exercise.name}
                          </Box>

                          {/* Description courte */}
                          {exercise.description && (
                            <Box fontSize="sm" color="gray.400" lineClamp={2} textAlign="center">
                              {exercise.description}
                            </Box>
                          )}
                        </VStack>
                      </ClickableCard>
                    ))}
                  </Grid>
                </Box>
              </>
            )}
          </VStack>
        </Container>
      )}
    </SlidePanel>
  );
};

export default Exercises;
