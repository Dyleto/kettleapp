import {
  Drawer,
  Input,
  VStack,
  Box,
  HStack,
  Button,
  Spinner,
  Grid,
} from "@chakra-ui/react";
import { useExercises } from "@/hooks/queries/useExercises";
import { useState, useMemo } from "react";
import { LuSearch, LuX } from "react-icons/lu";
import { Exercise } from "@/types";
import {
  CreateExerciseCard,
  ExerciseEditor,
  ExerciseLibraryCard,
} from "@/features/exercise";
import { useCreateExercise } from "@/hooks/mutations/useExerciseMutations";

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
  const [onCreateMode, setOnCreateMode] = useState(false);

  const createMutation = useCreateExercise();

  // Filtrage des exercices
  const filteredExercises = useMemo(() => {
    return exercises.filter(
      (ex) =>
        type === ex.type &&
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [exercises, searchQuery, type]);

  const handleSave = (exercise: Partial<Exercise>) => {
    createMutation.mutate(exercise, {
      onSuccess: (response) => {
        onSelect(response.data);
        setOnCreateMode(false);
      },
    });
  };

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
            {onCreateMode ? (
              <ExerciseEditor
                initialData={{ type }}
                onSave={handleSave}
                onCancel={() => setOnCreateMode(false)}
              />
            ) : (
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
                    <CreateExerciseCard
                      type={type}
                      onClick={() => setOnCreateMode(true)}
                    />

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
            )}
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
};
