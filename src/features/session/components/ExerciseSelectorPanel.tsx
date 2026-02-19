import {
  Drawer,
  Input,
  VStack,
  Box,
  Text,
  HStack,
  Button,
  Spinner,
  Grid,
} from "@chakra-ui/react";
import { useExercises } from "@/hooks/queries/useExercises";
import { useState, useMemo } from "react";
import { LuSearch, LuPlus, LuX } from "react-icons/lu";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Exercise } from "@/types";
import { CreateExerciseCard, ExerciseLibraryCard } from "@/features/exercise";
import { GRID_LAYOUTS } from "@/constants/layouts";

interface ExerciseSelectorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  type: "warmup" | "workout";
  onSelect: (exercise: Exercise) => void;
}

export const ExerciseSelectorPanel = ({
  isOpen,
  onClose,
  type,
  onSelect,
}: ExerciseSelectorPanelProps) => {
  const { data: exercises = [], isLoading } = useExercises();
  const [searchQuery, setSearchQuery] = useState("");
  const colors = useThemeColors();

  // Filtrage des exercices
  const filteredExercises = useMemo(() => {
    return exercises.filter(
      (ex) =>
        (type === "warmup" ? ex.type === "warmup" : ex.type === "exercise") &&
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [exercises, searchQuery, type]);

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      size={{ base: "full", md: "md", lg: "lg", xl: "xl" }}
      modal={false}
      preventScroll={false}
    >
      <Drawer.Positioner pointerEvents="none">
        <Drawer.Content bg="gray.900">
          <Drawer.Header borderBottomWidth="1px" borderColor="whiteAlpha.100">
            <HStack justify="space-between">
              <Drawer.Title>
                Ajouter un {type === "warmup" ? "échauffement" : "exercice"}
              </Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <Button size="sm" variant="ghost" onClick={onClose}>
                  <LuX />
                </Button>
              </Drawer.CloseTrigger>
            </HStack>
          </Drawer.Header>
          <Drawer.Body p={4}>
            <VStack gap={4} align="stretch" h="full">
              {/* Barre de Recherche */}
              <Box position="relative">
                <Input
                  placeholder={`Rechercher un ${type === "warmup" ? "échauffement" : "exercice"}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  pl={10}
                  bg="whiteAlpha.50"
                  border="none"
                />
                <Box
                  position="absolute"
                  left={3}
                  top="50%"
                  transform="translateY(-50%)"
                  color="gray.400"
                >
                  <LuSearch />
                </Box>
              </Box>

              {/* Liste des résultats */}
              {isLoading ? (
                <Box textAlign="center" py={10}>
                  <Spinner />
                </Box>
              ) : (
                <Grid
                  templateColumns={{
                    base: "repeat(2, 1fr)",
                    lg: "repeat(3, 1fr)",
                  }}
                  gap={4}
                >
                  {filteredExercises.map((exercise) => (
                    <ExerciseLibraryCard
                      key={exercise._id}
                      exercise={exercise}
                      onClick={() => onSelect(exercise)}
                      type={type}
                    />
                  ))}
                </Grid>
              )}
            </VStack>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
};
