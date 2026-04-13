import { useQuery } from "@tanstack/react-query";
import { coachService } from "@/services/coachService";
import { queryKeys } from "@/config/queryKeys";

export const useExercises = () => {
  return useQuery({
    queryKey: queryKeys.coach.exercises.lists(),
    queryFn: coachService.getExercises,
  });
};
