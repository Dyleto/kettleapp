import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/config/api';

import { toaster } from '@/components/ui/toasterInstance';
import { Exercise } from '@/types';
import { queryKeys } from '@/config/queryKeys';

/**
 * Creates an exercise.
 */
export const useCreateExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Exercise>) =>
      api.post('/api/coach/exercises', data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.coach.exercises.all(),
      });
      toaster.create({ title: 'Exercice créé', type: 'success' });
    },

    onError: () => {
      toaster.create({
        title: 'Erreur',
        description: "Impossible de créer l'exercice",
        type: 'error',
      });
    },
  });
};

/**
 * Updates an exercise.
 */
export const useUpdateExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Exercise> }) =>
      api.put(`/api/coach/exercises/${id}`, data),

    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.coach.exercises.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.coach.exercises.detail(variables.id),
      });
      toaster.create({ title: 'Exercice modifié', type: 'success' });
    },

    onError: () => {
      toaster.create({
        title: 'Erreur',
        description: "Impossible de modifier l'exercice",
        type: 'error',
      });
    },
  });
};

/**
 * Deletes an exercise.
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
        title: 'Succès',
        description: 'Exercice supprimé avec succès',
        type: 'success',
      });
    },

    onError: () => {
      toaster.create({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression',
        type: 'error',
      });
    },
  });
};
