import ClickableCard from "@/components/ClickableCard";
import { SlidePanel } from "@/components/SlidePanel";
import api from "@/config/api";
import {
  Box,
  Button,
  Container,
  Grid,
  Heading,
  HStack,
  Input,
  VStack,
  IconButton,
  Skeleton,
  SkeletonCircle,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
  LuArrowLeft,
  LuPlus,
  LuSearch,
  LuFlame,
  LuDumbbell,
  LuChevronDown,
  LuChevronUp,
  LuLibrary,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";

interface Exercise {
  _id: string;
  name: string;
  description?: string;
  videoUrl?: string;
  type: "warmup" | "exercise";
}

const Exercises = () => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isWarmupExpanded, setIsWarmupExpanded] = useState(true);
  const [isExerciseExpanded, setIsExerciseExpanded] = useState(true);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/coach/exercises");
      setExercises(response.data);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      setLoading(false);
    } finally {
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
                <HStack gap={4}>
                  <LuLibrary size={28} color="#fbbf24" />
                  <Heading size="xl">Mes exercices</Heading>
                </HStack>
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
              <Box w="100%">
                <VStack gap={8} align="stretch">
                  {/* Section Échauffements Skeleton */}
                  <Box>
                    <HStack gap={3} mb={4}>
                      <SkeletonCircle size="6" />
                      <Skeleton height="32px" width="250px" />
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
                      {[...Array(4)].map((_, index) => (
                        <Box
                          key={index}
                          p={6}
                          borderTopWidth="3px"
                          borderTopColor="transparent"
                          borderRadius="xl"
                          bg="gray.800"
                          boxShadow="0 8px 24px rgba(0, 0, 0, 0.4)"
                        >
                          <VStack gap={3} align="stretch">
                            <SkeletonCircle size="16" alignSelf="center" />
                            <Skeleton height="24px" />
                            <Skeleton height="16px" />
                            <Skeleton height="16px" width="80%" />
                          </VStack>
                        </Box>
                      ))}
                    </Grid>
                  </Box>

                  {/* Section Exercices Skeleton */}
                  <Box>
                    <HStack gap={3} mb={4}>
                      <SkeletonCircle size="6" />
                      <Skeleton height="32px" width="200px" />
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
                      {[...Array(4)].map((_, index) => (
                        <Box
                          key={index}
                          p={6}
                          borderTopWidth="3px"
                          borderTopColor="transparent"
                          borderRadius="xl"
                          bg="gray.800"
                          boxShadow="0 8px 24px rgba(0, 0, 0, 0.4)"
                        >
                          <VStack gap={3} align="stretch">
                            <SkeletonCircle size="16" alignSelf="center" />
                            <Skeleton height="24px" />
                            <Skeleton height="16px" />
                            <Skeleton height="16px" width="80%" />
                          </VStack>
                        </Box>
                      ))}
                    </Grid>
                  </Box>
                </VStack>
              </Box>
            ) : (
              <>
                {/* Section Échauffements */}
                <Box>
                  <HStack gap={3} mb={4} justify="space-between">
                    <HStack gap={3}>
                      <LuFlame size={24} color="#fb923c" />
                      <Heading size="lg" color="orange.400">
                        Échauffements ({warmups.length})
                      </Heading>
                      <IconButton
                        aria-label={isWarmupExpanded ? "Réduire" : "Déplier"}
                        onClick={() => setIsWarmupExpanded(!isWarmupExpanded)}
                        variant="ghost"
                        colorPalette="orange"
                      >
                        {isWarmupExpanded ? <LuChevronUp size={20} /> : <LuChevronDown size={20} />}
                      </IconButton>
                    </HStack>
                  </HStack>

                  {isWarmupExpanded && (
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
                  )}
                </Box>

                {/* Section Exercices */}
                <Box>
                  <HStack gap={3} mb={4} justify="space-between">
                    <HStack gap={3}>
                      <LuDumbbell size={24} color="#fbbf24" />
                      <Heading size="lg" color="yellow.400">
                        Exercices ({workouts.length})
                      </Heading>
                      <IconButton
                        aria-label={isExerciseExpanded ? "Réduire" : "Déplier"}
                        onClick={() => setIsExerciseExpanded(!isExerciseExpanded)}
                        variant="ghost"
                        colorPalette="yellow"
                      >
                        {isExerciseExpanded ? <LuChevronUp size={20} /> : <LuChevronDown size={20} />}
                      </IconButton>
                    </HStack>
                  </HStack>

                  {isExerciseExpanded && (
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
                  )}
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
