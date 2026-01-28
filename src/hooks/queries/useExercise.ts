import { useQuery } from "@tanstack/react-query";
import api from "@/config/api";
import { Exercise } from "@/types";

/**
 * Hook pour récupérer un exercice par son ID
 *
 * @param id - ID de l'exercice
 */
export const useExercise = (id: string | undefined) => {
  return useQuery({
    queryKey: ["coach", "exercise", id],
    queryFn: async () => {
      if (!id) throw new Error("No exercise ID provided");
      const response = await api.get<Exercise>(`/api/coach/exercises/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};
