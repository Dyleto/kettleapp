import { useMutation, useQueryClient } from '@tanstack/react-query';
import { exerciseService } from '@/features/exercise/exercise.service';
import { toaster } from '@/shared/components/ui/toasterInstance';
import { Exercise } from '@/shared/types';
import { queryKeys } from '@/shared/config/queryKeys';

/**
 * Créer un exercice.
 *
 * Invalide toute la branche `exercises` et pas seulement la liste : un
 * exercice neuf n'a pas de fiche en cache, mais le sélecteur de l'atelier et
 * la bibliothèque lisent la même branche, et l'un des deux restait en retard.
 */
export const useCreateExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (exercise: Partial<Exercise>) =>
      exerciseService.create(exercise),

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
 * Modifier un exercice.
 *
 * Deux invalidations et non une : la liste porte le nom et le compteur, la
 * fiche porte la consigne et la vidéo. Ne rafraîchir que la liste laissait la
 * fiche ouverte afficher la valeur d'avant.
 *
 * Silencieux quand il réussit : la fiche s'enregistre à chaque champ
 * quitté, comme le programme, et « Exercice modifié » sortait pour chaque
 * frappe validée (F7b). Un échec, lui, se dit.
 */
export const useUpdateExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Exercise> }) =>
      exerciseService.update(id, data),

    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.coach.exercises.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.coach.exercises.detail(variables.id),
      });
    },

    onError: () => {
      toaster.create({
        title: 'La fiche n’a pas été enregistrée',
        description: 'L’exercice garde sa valeur d’avant. Réessaie.',
        type: 'error',
      });
    },
  });
};

/**
 * Supprimer un exercice.
 *
 * Le serveur refuse tant que l'exercice est placé dans un programme : c'est
 * lui qui décide, pas la fiche, qui ne fait que ne pas le proposer.
 *
 * Rien n'est dit quand il réussit : la bibliothèque offre « Annuler », et
 * c'est elle qui l'annonce — un « Succès » de plus aurait fait deux
 * bandeaux pour un geste.
 */
export const useDeleteExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => exerciseService.remove(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.coach.exercises.all(),
      });
    },

    onError: () => {
      toaster.create({
        title: 'L’exercice n’a pas été supprimé',
        description: 'Il est toujours dans ta bibliothèque. Réessaie.',
        type: 'error',
      });
    },
  });
};
