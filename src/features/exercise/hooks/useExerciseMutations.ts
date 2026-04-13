import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/config/api";
import { toaster } from "@/components/ui/toaster";
import { Exercise } from "@/types";
import { queryKeys } from "@/config/queryKeys";

/**
 * Hook pour créer un exercice
 */
export const useCreateExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Exercise>) =>
      api.post("/api/coach/exercises", data),

    onSuccess: (response, variables) => {
      const itemType =
        variables.type === "warmup" ? "échauffement" : "exercice";

      // Invalide le cache → Refetch automatique
      queryClient.invalidateQueries({
        queryKey: queryKeys.coach.exercises.all(),
      });

      toaster.create({
        title: "Succès",
        description: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} créé avec succès`,
        type: "success",
      });
    },

    onError: (error, variables) => {
      const itemType =
        variables.type === "warmup" ? "échauffement" : "exercice";

      toaster.create({
        title: "Erreur",
        description: `Une erreur est survenue lors de la création de l'${itemType}`,
        type: "error",
      });
    },
  });
};

/**
 * Hook pour modifier un exercice
 */
export const useUpdateExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Exercise> }) =>
      api.put(`/api/coach/exercises/${id}`, data),

    onSuccess: (response, variables) => {
      const itemType =
        variables.data.type === "warmup" ? "échauffement" : "exercice";

      // Invalide le cache
      queryClient.invalidateQueries({
        queryKey: queryKeys.coach.exercises.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.coach.exercises.detail(variables.id),
      });

      toaster.create({
        title: "Succès",
        description: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} modifié avec succès`,
        type: "success",
      });
    },

    onError: (error, variables) => {
      const itemType =
        variables.data.type === "warmup" ? "échauffement" : "exercice";

      toaster.create({
        title: "Erreur",
        description: `Une erreur est survenue lors de la modification de l'${itemType}`,
        type: "error",
      });
    },
  });
};

/**
 * Hook pour supprimer un exercice
 */
export const useDeleteExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/coach/exercises/${id}`),

    onSuccess: () => {
      // Invalide le cache
      queryClient.invalidateQueries({
        queryKey: queryKeys.coach.exercises.all(),
      });

      toaster.create({
        title: "Succès",
        description: "Exercice supprimé avec succès",
        type: "success",
      });
    },

    onError: () => {
      toaster.create({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        type: "error",
      });
    },
  });
};
