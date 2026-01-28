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
  Input,
  Textarea,
  VStack,
  Spinner,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuArrowLeft, LuFlame, LuDumbbell, LuTrash2 } from "react-icons/lu";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  NativeSelectField,
  NativeSelectRoot,
} from "@/components/ui/native-select";
import VideoPlayer from "@/components/VideoPlayer";
import { useExercise } from "@/hooks/queries/useExercise";
import {
  useCreateExercise,
  useUpdateExercise,
  useDeleteExercise,
} from "@/hooks/mutations/useExerciseMutations";
import { Exercise } from "@/types";

const ExerciseForm = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState<Partial<Exercise>>({
    name: "",
    description: "",
    videoUrl: "",
    type: (searchParams.get("type") as "warmup" | "exercise") || "exercise",
  });

  const isEditMode = !!exerciseId;

  // ✨ React Query hooks
  const {
    data: exercise,
    isLoading: fetching,
    error,
  } = useExercise(exerciseId);
  const createMutation = useCreateExercise();
  const updateMutation = useUpdateExercise();
  const deleteMutation = useDeleteExercise();

  // Remplir le formulaire quand les données arrivent
  useEffect(() => {
    if (exercise) {
      setFormData(exercise);
    }
  }, [exercise]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditMode) {
      updateMutation.mutate(
        { id: exerciseId!, data: formData },
        {
          onSuccess: () => navigate("/coach/exercises"),
        },
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => navigate("/coach/exercises"),
      });
    }
  };

  const handleDelete = async () => {
    const itemType = formData.type === "warmup" ? "échauffement" : "exercice";

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

  // Loading state global
  const loading =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const typeColor = formData.type === "warmup" ? "orange.400" : "yellow.400";
  const TypeIcon = formData.type === "warmup" ? LuFlame : LuDumbbell;

  return (
    <SlidePanel onClose={() => navigate("/coach/exercises")}>
      {(handleClose) => (
        <Container maxW="container.md" py={8}>
          {fetching ? (
            <Box display="flex" justifyContent="center" py={12}>
              <Spinner size="xl" />
            </Box>
          ) : (
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
                    <HStack gap={3}>
                      <Box
                        p={3}
                        bg={`${typeColor}/10`}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor={`${typeColor}/30`}
                      >
                        <TypeIcon size={32} color={typeColor} />
                      </Box>
                      <Heading size="xl">
                        {isEditMode ? "Modifier" : "Créer"}{" "}
                        {formData.type === "warmup"
                          ? "un échauffement"
                          : "un exercice"}
                      </Heading>
                    </HStack>
                  </Card.Body>
                </Card.Root>

                {/* Formulaire */}
                <Card.Root>
                  <Card.Body>
                    <VStack gap={5} align="stretch">
                      {/* Type */}
                      <Field label="Type" required>
                        <NativeSelectRoot>
                          <NativeSelectField
                            value={formData.type}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                type: e.target.value as "warmup" | "exercise",
                              })
                            }
                            items={[
                              {
                                value: "warmup",
                                label: "Échauffement",
                                icon: <LuFlame size={20} color="#fb923c" />,
                                color: "orange.400",
                              },
                              {
                                value: "exercise",
                                label: "Exercice",
                                icon: <LuDumbbell size={20} color="#fbbf24" />,
                                color: "yellow.400",
                              },
                            ]}
                          />
                        </NativeSelectRoot>
                      </Field>

                      {/* Nom */}
                      <Field label="Nom de l'exercice" required>
                        <Input
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder={
                            formData.type === "warmup"
                              ? "Ex: Cardio léger"
                              : "Ex: Squat goblet"
                          }
                          required
                        />
                      </Field>

                      {/* Description */}
                      <Field label="Description">
                        <Textarea
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          placeholder="Décrivez l'exercice, les consignes techniques, les points clés..."
                          rows={5}
                        />
                      </Field>

                      {/* URL Vidéo */}
                      <Field label="Lien vidéo (optionnel)">
                        <Input
                          type="url"
                          value={formData.videoUrl}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              videoUrl: e.target.value,
                            })
                          }
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </Field>

                      {/* Preview vidéo */}
                      {formData.videoUrl && (
                        <Box>
                          <Box
                            fontSize="sm"
                            fontWeight="medium"
                            mb={2}
                            color="fg.muted"
                          >
                            Aperçu de la vidéo
                          </Box>
                          <VideoPlayer url={formData.videoUrl} />
                        </Box>
                      )}
                    </VStack>
                  </Card.Body>
                </Card.Root>

                {/* Actions */}
                <HStack gap={4} justify="flex-end" w="100%">
                  {isEditMode && (
                    <Button
                      variant="outline"
                      colorPalette="red"
                      onClick={handleDelete}
                      loading={deleteMutation.isPending}
                    >
                      <LuTrash2 style={{ marginRight: "8px" }} />
                      Supprimer
                    </Button>
                  )}
                  <Button
                    type="submit"
                    bg={typeColor}
                    color="gray.900"
                    fontWeight="bold"
                    loading={loading}
                  >
                    {isEditMode ? "Enregistrer" : "Créer"}
                  </Button>
                </HStack>
              </VStack>
            </form>
          )}
        </Container>
      )}
    </SlidePanel>
  );
};

export default ExerciseForm;
