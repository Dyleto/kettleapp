import { useQuery } from "@tanstack/react-query";
import api from "@/config/api";

interface ExerciseStats {
  warmupCount: number;
  exerciseCount: number;
}

/**
 * Hook pour récupérer le nombre d'exercices du coach
 *
 * @returns { data, isLoading, error, refetch }
 */
export const useExerciseStats = () => {
  return useQuery({
    queryKey: ["coach", "exercises", "stats"],
    queryFn: async () => {
      const response = await api.get<ExerciseStats>(
        "/api/coach/exercises/stats",
      );
      return response.data;
    },
  });
};
