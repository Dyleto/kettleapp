import { toaster } from "@/components/ui/toaster";
import api from "@/config/api";
import { queryKeys } from "@/config/queryKeys";
import { Session } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateProgramSessions = (clientId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessions: Session[]) => {
      const formattedSessions = sessions.map((session) => ({
        ...session,
        blocks: session.blocks.map((block) => ({
          ...block,
          exercises: block.exercises.map(({ exercise, ...rest }) => ({
            ...rest,
            exerciseId: exercise._id,
          })),
        })),
      }));

      const { data } = await api.put(
        `/api/coach/clients/${clientId}/program/sessions`,
        { sessions: formattedSessions },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.coach.clients.detail(clientId),
      });
      toaster.create({ title: "Programme sauvegardé", type: "success" });
    },
    onError: () => {
      toaster.create({
        title: "Erreur lors de la sauvegarde du programme",
        type: "error",
      });
    },
  });
};
