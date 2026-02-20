import { SlidePanel } from "@/components/SlidePanel";
import { toaster } from "@/components/ui/toaster";
import { Container, Button, VStack, Box, Spinner } from "@chakra-ui/react";
import { useEffect } from "react";
import { LuArrowLeft } from "react-icons/lu";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useExercise } from "@/hooks/queries/useExercise";
import {
  useCreateExercise,
  useUpdateExercise,
  useDeleteExercise,
} from "@/hooks/mutations/useExerciseMutations";
import { Exercise } from "@/types";
import { ExerciseEditor } from "@/features/exercise/components/ExerciseEditor";

const ExerciseForm = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isEditMode = !!exerciseId;

  const {
    data: exercise,
    isLoading: fetching,
    error,
  } = useExercise(exerciseId);
  const createMutation = useCreateExercise();
  const updateMutation = useUpdateExercise();
  const deleteMutation = useDeleteExercise();

  // Afficher toast si erreur de chargement
  useEffect(() => {
    if (error) {
      toaster.create({
        title: "Erreur",
        description: "Impossible de charger l'exercice",
        type: "error",
      });
    }
  }, [error]);

  const handleSave = async (data: Partial<Exercise>) => {
    if (isEditMode) {
      updateMutation.mutate(
        { id: exerciseId!, data },
        {
          onSuccess: () => navigate("/coach/exercises"),
        },
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => navigate("/coach/exercises"),
      });
    }
  };

  const handleDelete = async () => {
    if (!exercise) return;

    const itemType = exercise.type === "warmup" ? "échauffement" : "exercice";

    if (
      !globalThis.confirm(
        `Êtes-vous sûr de vouloir supprimer cet ${itemType} ?`,
      )
    ) {
      return;
    }

    deleteMutation.mutate(exerciseId!, {
      onSuccess: () => navigate("/coach/exercises"),
    });
  };

  // Loading state for actions
  const isSavingOrDeleting =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  // Valeur par défaut pour le type si on crée
  const defaultType =
    (searchParams.get("type") as "warmup" | "workout") || "workout";

  return (
    <SlidePanel onClose={() => navigate("/coach/exercises")}>
      {(handleClose) => (
        <Container maxW="container.md" py={8}>
          {fetching ? (
            <Box display="flex" justifyContent="center" py={12}>
              <Spinner size="xl" />
            </Box>
          ) : (
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

              <ExerciseEditor
                initialData={isEditMode ? exercise : { type: defaultType }}
                isEditing={isEditMode}
                isLoading={isSavingOrDeleting}
                onSave={handleSave}
                onDelete={handleDelete}
                onCancel={handleClose}
              />
            </VStack>
          )}
        </Container>
      )}
    </SlidePanel>
  );
};

export default ExerciseForm;
