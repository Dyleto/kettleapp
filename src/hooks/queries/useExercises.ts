import { useQuery } from "@tanstack/react-query";
import api from "@/config/api";
import { Exercise } from "@/types";

/**
 * Hook pour récupérer la liste des exercices du coach
 *
 * @returns { data, isLoading, error, refetch }
 */
export const useExercises = () => {
  return useQuery({
    queryKey: ["coach", "exercises"],
    queryFn: async () => {
      const response = await api.get<Exercise[]>("/api/coach/exercises");
      return response.data;
    },
  });
};
