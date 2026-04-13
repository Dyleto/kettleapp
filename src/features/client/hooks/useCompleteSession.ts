import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toaster } from "@/components/ui/toaster";
import { clientService } from "@/services/clientService";
import { queryKeys } from "@/config/queryKeys";
import { SessionMetrics } from "@/types";

export const useCompleteSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      metrics,
      clientNotes,
    }: {
      sessionId: string;
      metrics: SessionMetrics;
      clientNotes?: string;
    }) => clientService.completeSession(sessionId, { metrics, clientNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.client.history.all(),
      });
    },
    onError: () => {
      toaster.create({
        title: "Erreur",
        description: "Impossible de valider la séance, réessaie.",
        type: "error",
      });
    },
  });
};
