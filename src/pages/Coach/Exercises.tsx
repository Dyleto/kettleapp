import ClickableCard from "@/components/ClickableCard";
import { ExerciseSectionSkeleton } from "@/components/skeletons";
import { SlidePanel } from "@/components/SlidePanel";
import api from "@/config/api";
import { GRID_LAYOUTS } from "@/constants/layouts";
import { useThemeColors } from "@/hooks/useThemeColors";
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
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
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
import { toaster } from "@/components/ui/toaster";
import { useExercises } from "@/hooks/queries/useExercises";
import { getErrorMessage } from "@/utils/errorMessages";

interface Exercise {
  _id: string;
  name: string;
  description?: string;
  videoUrl?: string;
  type: "warmup" | "exercise";
}

const Exercises = () => {
  const navigate = useNavigate();
  const colors = useThemeColors();

  const { data: exercises = [], isLoading, error } = useExercises();

  const [searchQuery, setSearchQuery] = useState("");
  const [isWarmupExpanded, setIsWarmupExpanded] = useState(true);
  const [isExerciseExpanded, setIsExerciseExpanded] = useState(true);

  useEffect(() => {
    if (error) {
      toaster.create({
        title: "Impossible de charger vos exercices",
        description: getErrorMessage(error, "Chargement des exercices"),
        type: "error",
      });
    }
  }, [error]);

  const filteredExercises = useMemo(
    () =>
      exercises.filter((ex) =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [exercises, searchQuery],
  );

  const warmups = useMemo(
    () => filteredExercises.filter((ex) => ex.type === "warmup"),
    [filteredExercises],
  );

  const workouts = useMemo(
    () => filteredExercises.filter((ex) => ex.type === "exercise"),
    [filteredExercises],
  );

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
                  <LuLibrary size={28} color={colors.primaryHex} />
                  <Heading size="xl">Mes exercices</Heading>
                </HStack>
              </HStack>
            </HStack>

            {/* Barre de recherche */}
            <Box>
              <HStack
                w="100%"
                bg="gray.800"
                borderRadius="md"
                borderWidth="1px"
                borderColor="gray.700"
                px={3}
              >
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

            {isLoading ? (
              <Box w="100%">
                <VStack gap={8} align="stretch">
                  {/* Section Échauffements Skeleton */}
                  <ExerciseSectionSkeleton titleWidth="250px" count={4} />

                  {/* Section Exercices Skeleton */}
                  <ExerciseSectionSkeleton titleWidth="250px" count={4} />
                </VStack>
              </Box>
            ) : (
              <>
                {/* Section Échauffements */}
                <Box>
                  <HStack gap={3} mb={4} justify="space-between">
                    <HStack gap={3}>
                      <LuFlame size={24} color={colors.secondaryHex} />
                      <Heading size="lg" color={colors.secondary}>
                        Échauffements ({warmups.length})
                      </Heading>
                      <IconButton
                        aria-label={isWarmupExpanded ? "Réduire" : "Déplier"}
                        onClick={() => setIsWarmupExpanded(!isWarmupExpanded)}
                        variant="ghost"
                        color={colors.secondary}
                      >
                        {isWarmupExpanded ? (
                          <LuChevronUp size={20} />
                        ) : (
                          <LuChevronDown size={20} />
                        )}
                      </IconButton>
                    </HStack>
                  </HStack>

                  {isWarmupExpanded && (
                    <Grid templateColumns={GRID_LAYOUTS.fourColumns} gap={4}>
                      {/* Bloc d'ajout en première position */}
                      <Box
                        p={6}
                        borderWidth="2px"
                        borderStyle="dashed"
                        borderColor={colors.secondary}
                        borderRadius="xl"
                        cursor="pointer"
                        transition="all 0.3s ease"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        minH="200px"
                        _hover={{
                          borderColor: colors.secondaryHover,
                          bg: colors.secondaryBg,
                          transform: "translateY(-2px)",
                        }}
                        onClick={() =>
                          navigate("/coach/exercises/new?type=warmup")
                        }
                      >
                        <VStack gap={3} color={colors.secondary}>
                          <Box
                            p={3}
                            bg={colors.secondaryBg}
                            borderRadius="full"
                            borderWidth="2px"
                            borderStyle="dashed"
                            borderColor={colors.secondary}
                          >
                            <LuPlus size={32} />
                          </Box>
                          <Box
                            fontWeight="bold"
                            fontSize="md"
                            textAlign="center"
                          >
                            Ajouter un échauffement
                          </Box>
                        </VStack>
                      </Box>

                      {/* Liste des échauffements */}
                      {warmups.map((exercise) => (
                        <ClickableCard
                          key={exercise._id}
                          onClick={() =>
                            navigate(`/coach/exercises/${exercise._id}`)
                          }
                          p={6}
                          color={colors.secondary}
                        >
                          <VStack gap={3} align="stretch">
                            {/* Icône */}
                            <Box
                              p={3}
                              bg={colors.secondaryBg}
                              borderRadius="md"
                              borderWidth="1px"
                              borderColor={colors.secondaryBorder}
                              alignSelf="center"
                            >
                              <LuFlame size={28} color={colors.secondaryHex} />
                            </Box>

                            {/* Nom */}
                            <Box
                              fontWeight="bold"
                              fontSize="lg"
                              textAlign="center"
                              color="white"
                            >
                              {exercise.name}
                            </Box>

                            {/* Description courte */}
                            {exercise.description && (
                              <Box
                                fontSize="sm"
                                color="gray.400"
                                lineClamp={2}
                                textAlign="center"
                              >
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
                      <LuDumbbell size={24} color={colors.primaryHex} />
                      <Heading size="lg" color={colors.primary}>
                        Exercices ({workouts.length})
                      </Heading>
                      <IconButton
                        aria-label={isExerciseExpanded ? "Réduire" : "Déplier"}
                        onClick={() =>
                          setIsExerciseExpanded(!isExerciseExpanded)
                        }
                        variant="ghost"
                        color={colors.primary}
                      >
                        {isExerciseExpanded ? (
                          <LuChevronUp size={20} />
                        ) : (
                          <LuChevronDown size={20} />
                        )}
                      </IconButton>
                    </HStack>
                  </HStack>

                  {isExerciseExpanded && (
                    <Grid templateColumns={GRID_LAYOUTS.fourColumns} gap={4}>
                      {/* Bloc d'ajout en première position */}
                      <Box
                        p={6}
                        borderWidth="2px"
                        borderStyle="dashed"
                        borderColor={colors.primary}
                        borderRadius="xl"
                        cursor="pointer"
                        transition="all 0.3s ease"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        minH="200px"
                        _hover={{
                          borderColor: colors.primaryHover,
                          bg: colors.primaryBg,
                          transform: "translateY(-2px)",
                        }}
                        onClick={() =>
                          navigate("/coach/exercises/new?type=exercise")
                        }
                      >
                        <VStack gap={3} color={colors.primary}>
                          <Box
                            p={3}
                            bg={colors.primaryBg}
                            borderRadius="full"
                            borderWidth="2px"
                            borderStyle="dashed"
                            borderColor={colors.primary}
                          >
                            <LuPlus size={32} />
                          </Box>
                          <Box
                            fontWeight="bold"
                            fontSize="md"
                            textAlign="center"
                          >
                            Ajouter un exercice
                          </Box>
                        </VStack>
                      </Box>

                      {/* Liste des exercices */}
                      {workouts.map((exercise) => (
                        <ClickableCard
                          key={exercise._id}
                          onClick={() =>
                            navigate(`/coach/exercises/${exercise._id}`)
                          }
                          p={6}
                        >
                          <VStack gap={3} align="stretch">
                            {/* Icône */}
                            <Box
                              p={3}
                              bg={colors.primaryBg}
                              borderRadius="md"
                              borderWidth="1px"
                              borderColor={colors.primaryBorder}
                              alignSelf="center"
                            >
                              <LuDumbbell size={28} color={colors.primaryHex} />
                            </Box>

                            {/* Nom */}
                            <Box
                              fontWeight="bold"
                              fontSize="lg"
                              textAlign="center"
                              color="white"
                            >
                              {exercise.name}
                            </Box>

                            {/* Description courte */}
                            {exercise.description && (
                              <Box
                                fontSize="sm"
                                color="gray.400"
                                lineClamp={2}
                                textAlign="center"
                              >
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
