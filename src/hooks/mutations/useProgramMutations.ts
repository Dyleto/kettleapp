import { toaster } from "@/components/ui/toaster";
import api from "@/config/api";
import { queryKeys } from "@/config/queryKeys";
import { Session } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateProgramSessions = (clientId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessions: Partial<Session>[]) => {
      const formattedSessions = sessions.map((session) => ({
        ...session,
        notes: session.notes || "",
        warmup: {
          ...session.warmup,
          exercises: session.warmup?.exercises.map((ex) => ({
            ...ex,
            exerciseId: ex.exercise?._id,
            exercise: undefined,
          })),
        },
        workout: {
          ...session.workout,
          exercises: session.workout?.exercises.map((ex) => ({
            ...ex,
            exerciseId: ex.exercise?._id,
            exercise: undefined,
          })),
        },
      }));

      const { data } = await api.put(
        `/api/coach/clients/${clientId}/program/sessions`,
        { sessions: formattedSessions },
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.coach.clients.detail(clientId),
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            program: {
              ...old.program,
              sessions: data,
            },
          };
        },
      );

      queryClient.invalidateQueries({
        queryKey: queryKeys.coach.clients.detail(clientId),
      });

      toaster.create({
        title: "Programme sauvegardé",
        type: "success",
      });
    },
    onError: () => {
      toaster.create({
        title: "Erreur lors de la sauvegarde du programme",
        type: "error",
      });
    },
  });
};
