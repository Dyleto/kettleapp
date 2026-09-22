import { useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { clientService } from '@/services/clientService';
import { queryKeys } from '@/config/queryKeys';
import { CLIENT_ROUTES } from '@/config/routes';
import { toaster } from '@/components/ui/toasterInstance';
import { useCompleteSession } from './useCompleteSession';
import { PerformedEntry, RoundsDoneEntry, SessionFeedback } from '@/types';
import { buildLastPerformanceIndex } from '../lastPerformance';
import { getSessionForToday } from '../weekPlan';
import { forgetProgress } from '../sessionProgress';

export const useClientSessions = () => {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();

  const programQuery = useQuery({
    queryKey: queryKeys.client.program.get(),
    queryFn: clientService.getProgram,
  });
  const historyQuery = useQuery({
    queryKey: queryKeys.client.history.all(),
    queryFn: clientService.getHistory,
  });
  const completeSession = useCompleteSession();

  const sessions = useMemo(
    () => programQuery.data?.sessions ?? [],
    [programQuery.data]
  );
  const history = useMemo(
    () =>
      [...(historyQuery.data ?? [])].sort(
        (a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      ),
    [historyQuery.data]
  );

  // The programme is a cycle: once the last session is done, we go back to
  // the first. There is no "end" of programme.
  const nextSession = useMemo(() => {
    const sortedSessions = [...sessions].sort((a, b) => a.order - b.order);
    if (sortedSessions.length === 0) return undefined;

    // A session suggested today comes ahead of the cycle — that is all the
    // suggested day changes. One "to do" for the whole app: home, the
    // programme badge and the /client/session redirect point at the same
    // session. With no suggested day anywhere, nothing changes:
    // `getSessionForToday` returns nothing and the cycle takes over again.
    const suggestedToday = getSessionForToday(sortedSessions, history);
    if (suggestedToday) return suggestedToday;

    const lastCompleted = history[0];
    if (!lastCompleted) return sortedSessions[0];

    const lastIndex = sortedSessions.findIndex(
      (s) => s._id === lastCompleted.originalSessionId
    );
    if (lastIndex === -1) return sortedSessions[0];

    return sortedSessions[(lastIndex + 1) % sortedSessions.length];
  }, [sessions, history]);

  // "How much did I use last time?" is answered from the history already
  // loaded: no request, no extra route.
  const lastPerformance = useMemo(
    () => buildLastPerformanceIndex(history),
    [history]
  );

  const isLoading = programQuery.isLoading || historyQuery.isLoading;

  // `/client/session` now redirects to the next session's id: the screen has
  // a single source, the URL.
  const activeSession = sessionId
    ? sessions.find((s) => s._id === sessionId)
    : undefined;
  const isManualSelection = !!sessionId && sessionId !== nextSession?._id;

  // An id matching no session (a stale link, a session the coach deleted)
  // leads back to the programme rather than getting stuck.
  useEffect(() => {
    if (!isLoading && sessionId && !activeSession) {
      toaster.create({
        title: 'Séance introuvable',
        description: "Cette séance n'existe plus dans ton programme.",
        type: 'info',
      });
      navigate(CLIENT_ROUTES.program, { replace: true });
    }
  }, [isLoading, sessionId, activeSession, navigate]);

  const handleSubmitLog = useCallback(
    (
      feedback: SessionFeedback,
      clientNotes: string,
      completedAt?: string,
      performed?: PerformedEntry[],
      roundsDone?: RoundsDoneEntry[]
    ) => {
      if (!activeSession) return;
      completeSession.mutate(
        {
          sessionId: activeSession._id,
          feedback,
          clientNotes,
          completedAt,
          ...(performed && performed.length > 0 ? { performed } : {}),
          ...(roundsDone && roundsDone.length > 0 ? { roundsDone } : {}),
        },
        {
          onSuccess: () => {
            // The session is on the server: the local record has no reason
            // to exist any more. This is the only moment we erase — leaving
            // guided mode must cost nothing, and nor must stepping out to
            // answer the phone.
            forgetProgress(activeSession._id);
            // The only place in the client's journey where something is
            // sent with no acknowledgement: you landed back on home, and
            // nothing said the wrap-up had left.
            toaster.create({
              title: 'Séance enregistrée',
              description: 'Ton coach la verra.',
              type: 'success',
              // The default duration falls under two and a half seconds:
              // too short for an acknowledgement that arrives at the same
              // time as a change of screen.
              duration: 4500,
            });
            navigate(CLIENT_ROUTES.today);
          },
        }
      );
    },
    [activeSession, completeSession, navigate]
  );

  return {
    sessions,
    nextSession,
    activeSession,
    isManualSelection,
    history,
    lastPerformance,
    handleSubmitLog,
    isLoading,
    isError: programQuery.isError || historyQuery.isError,
    isSubmitting: completeSession.isPending,
  };
};
