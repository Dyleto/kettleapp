import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { clientService } from "@/services/clientService";
import { queryKeys } from "@/config/queryKeys";
import { useCompleteSession } from "./useCompleteSession";
import { SessionMetrics } from "@/types";

export const useCycleProgress = () => {
  const programQuery = useQuery({
    queryKey: queryKeys.client.program.get(),
    queryFn: clientService.getProgram,
  });

  const historyQuery = useQuery({
    queryKey: queryKeys.client.history.all(),
    queryFn: clientService.getHistory,
  });

  const completeSession = useCompleteSession();

  const sessions = programQuery.data?.sessions ?? [];
  const completed = historyQuery.data ?? [];

  const history = useMemo(
    () =>
      [...completed].sort(
        (a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
      ),
    [completed],
  );

  const { currentCycleNumber, sessionsDoneInCurrentCycle, nextSession } =
    useMemo(() => {
      const currentProgramSessionIds = sessions.map((s) => s._id);
      const currentProgramHistory = history.filter((c) =>
        currentProgramSessionIds.includes(c.originalSessionId),
      );

      const totalCompletedInProgram = currentProgramHistory.length;
      const completedCycles = Math.floor(
        totalCompletedInProgram / (sessions.length || 1),
      );

      const lastCompleted = currentProgramHistory[0];
      const next = lastCompleted
        ? sessions.find(
            (s) =>
              s.order ===
              (lastCompleted.sessionOrder % sessions.length) + 1,
          )
        : sessions[0];

      return {
        currentCycleNumber: completedCycles + 1,
        sessionsDoneInCurrentCycle: totalCompletedInProgram % (sessions.length || 1),
        nextSession: next,
      };
    }, [history, sessions]);

  const handleSubmitLog = useCallback(
    (metrics: SessionMetrics, clientNotes: string) => {
      if (!nextSession) return;
      completeSession.mutate({
        sessionId: nextSession._id,
        metrics,
        clientNotes,
      });
    },
    [nextSession, completeSession],
  );

  return {
    sessions,
    nextSession,
    history,
    currentCycleNumber,
    sessionsDoneInCurrentCycle,
    handleSubmitLog,
    isLoading: programQuery.isLoading || historyQuery.isLoading,
    isError: programQuery.isError || historyQuery.isError,
    isSubmitting: completeSession.isPending,
  };
};
