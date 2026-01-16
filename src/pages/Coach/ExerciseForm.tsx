import { SlidePanel } from "@/components/SlidePanel";
import { Field } from "@/components/ui/field";
import { toaster } from "@/components/ui/toaster";
import api from "@/config/api";
import { Box, Button, Card, Container, Heading, HStack, Input, Textarea, VStack, Spinner } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuArrowLeft, LuFlame, LuDumbbell } from "react-icons/lu";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { NativeSelectField, NativeSelectRoot } from "@/components/ui/native-select";

interface ExerciseFormData {
  name: string;
  description: string;
  videoUrl: string;
  type: "warmup" | "exercise";
}

const ExerciseForm = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [formData, setFormData] = useState<ExerciseFormData>({
    name: "",
    description: "",
    videoUrl: "",
    type: (searchParams.get("type") as "warmup" | "exercise") || "exercise",
  });

  const isEditMode = !!exerciseId;

  useEffect(() => {
    if (exerciseId) {
      fetchExercise();
    }
  }, [exerciseId]);

  const fetchExercise = async () => {
    try {
      setFetching(true);
      const response = await api.get(`/api/coach/exercises/${exerciseId}`);
      setFormData(response.data);
    } catch (error) {
      console.error("Error fetching exercise:", error);
      toaster.create({
        title: "Erreur",
        description: "Impossible de charger l'exercice",
        type: "error",
      });
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditMode) {
        await api.put(`/api/coach/exercises/${exerciseId}`, formData);
        toaster.create({
          title: "Succès",
          description: "Exercice modifié avec succès",
          type: "success",
        });
      } else {
        await api.post("/api/coach/exercises", formData);
        toaster.create({
          title: "Succès",
          description: "Exercice créé avec succès",
          type: "success",
        });
      }

      navigate("/coach/exercises");
    } catch (error) {
      console.error("Error saving exercise:", error);
      toaster.create({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

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
                <Button variant="ghost" onClick={handleClose} alignSelf="flex-start">
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
                        {formData.type === "warmup" ? "un échauffement" : "un exercice"}
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
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder={formData.type === "warmup" ? "Ex: Cardio léger" : "Ex: Squat goblet"}
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
                          onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </Field>
                    </VStack>
                  </Card.Body>
                </Card.Root>

                {/* Actions */}
                <HStack gap={4} justify="flex-end">
                  <Button variant="outline" onClick={handleClose}>
                    Annuler
                  </Button>
                  <Button type="submit" bg={typeColor} color="gray.900" fontWeight="bold" loading={loading}>
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
