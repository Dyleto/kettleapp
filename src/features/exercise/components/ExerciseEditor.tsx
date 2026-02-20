import { Field } from "@/components/ui/field";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  Box,
  Button,
  Card,
  Heading,
  HStack,
  Input,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuFlame, LuDumbbell, LuTrash2 } from "react-icons/lu";
import {
  NativeSelectField,
  NativeSelectRoot,
} from "@/components/ui/native-select";
import VideoPlayer from "@/components/VideoPlayer";
import { Exercise } from "@/types";

interface ExerciseEditorProps {
  initialData?: Partial<Exercise>;
  isEditing?: boolean;
  isLoading?: boolean;
  onSave: (data: Partial<Exercise>) => void;
  onDelete?: () => void;
  onCancel?: () => void;
}

export const ExerciseEditor = ({
  initialData,
  isEditing = false,
  isLoading = false,
  onSave,
  onDelete,
  onCancel,
}: ExerciseEditorProps) => {
  const colors = useThemeColors();

  const [formData, setFormData] = useState<Partial<Exercise>>({
    name: "",
    description: "",
    videoUrl: "",
    type: "workout",
    ...initialData,
  });

  // Mise à jour si les données initiales changent (ex: chargement asynchrone)
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const typeColor =
    formData.type === "warmup" ? colors.secondaryHex : colors.primaryHex;
  const TypeIcon = formData.type === "warmup" ? LuFlame : LuDumbbell;
  const typeBg =
    formData.type === "warmup" ? colors.secondaryBg : colors.primaryBg;
  const typeBorder =
    formData.type === "warmup" ? colors.secondaryBorder : colors.primaryBorder;

  return (
    <form onSubmit={handleSubmit}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Card.Root>
          <Card.Body>
            <HStack gap={3}>
              <Box
                p={3}
                bg={typeBg}
                borderRadius="md"
                borderWidth="1px"
                borderColor={typeBorder}
              >
                <TypeIcon size={32} color={typeColor} />
              </Box>
              <Heading size="xl">
                {isEditing ? "Modifier" : "Créer"}{" "}
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
                        type: e.target.value as "warmup" | "workout",
                      })
                    }
                    items={[
                      {
                        value: "warmup",
                        label: "Échauffement",
                        icon: <LuFlame size={20} color={colors.secondaryHex} />,
                        color: colors.secondary,
                      },
                      {
                        value: "workout",
                        label: "Exercice",
                        icon: (
                          <LuDumbbell size={20} color={colors.primaryHex} />
                        ),
                        color: colors.primary,
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
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Annuler
            </Button>
          )}
          {isEditing && onDelete && (
            <Button
              variant="outline"
              colorPalette="red"
              onClick={onDelete}
              loading={isLoading}
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
            loading={isLoading}
          >
            {isEditing ? "Enregistrer" : "Créer"}
          </Button>
        </HStack>
      </VStack>
    </form>
  );
};
