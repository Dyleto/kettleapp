import { useQuery } from '@tanstack/react-query';
import { coachService } from '@/features/coach/coach.service';
import { queryKeys } from '@/shared/config/queryKeys';

export const useExercises = () => {
  return useQuery({
    queryKey: queryKeys.coach.exercises.lists(),
    queryFn: coachService.getExercises,
  });
};
