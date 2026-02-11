import { useQuery } from "@tanstack/react-query";
import { coachService } from "@/services/coachService";
import { queryKeys } from "@/config/queryKeys";

export const useExerciseStats = () => {
  return useQuery({
    queryKey: queryKeys.coach.exercises.stats(),
    queryFn: coachService.getExerciseStats,
  });
};
