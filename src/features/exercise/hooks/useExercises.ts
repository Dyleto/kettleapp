import { useQuery } from '@tanstack/react-query';
import { exerciseService } from '@/features/exercise/exercise.service';
import { queryKeys } from '@/shared/config/queryKeys';

/**
 * Toute la bibliothèque du coach.
 *
 * Sert aussi bien la page de la bibliothèque que le sélecteur de l'atelier :
 * une seule clé de cache pour les deux, donc un exercice créé depuis
 * l'atelier apparaît dans la liste sans qu'on ait à y penser.
 */
export const useExercises = () =>
  useQuery({
    queryKey: queryKeys.coach.exercises.lists(),
    queryFn: exerciseService.list,
  });
