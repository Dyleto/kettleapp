import { useQuery } from '@tanstack/react-query';
import { exerciseService } from '@/features/exercise/exercise.service';
import { queryKeys } from '@/shared/config/queryKeys';

/**
 * Un exercice, par son identifiant.
 *
 * `enabled` plutôt qu'un appel conditionnel : le hook est appelé depuis la
 * bibliothèque, où l'identifiant vient de l'URL et n'existe que lorsqu'une
 * fiche est ouverte. Sans lui, refermer la fiche relancerait une requête sans
 * identifiant — React interdisant d'appeler un hook selon une condition.
 */
export const useExercise = (id?: string) =>
  useQuery({
    queryKey: queryKeys.coach.exercises.detail(id ?? ''),
    queryFn: () => exerciseService.get(id as string),
    enabled: !!id,
  });
