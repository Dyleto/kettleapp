import { useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { clientService } from '@/features/client/client.service';
import { queryKeys } from '@/shared/config/queryKeys';
import { CLIENT_ROUTES } from '@/shared/config/routes';
import { toaster } from '@/shared/components/ui/toasterInstance';
import { useCompleteSession } from './useCompleteSession';
import {
  PerformedEntry,
  RoundsDoneEntry,
  SessionFeedback,
} from '@/shared/types';
import { buildLastPerformanceIndex } from '../lastPerformance';
import { getSessionForToday } from '../weekPlan';
import { forgetProgress } from '../sessionProgress';

/**
 * Le programme du client, et laquelle de ses séances vient maintenant.
 *
 * Un seul « à faire » pour toute l'application : l'accueil, la pastille du
 * programme et la redirection `/client/session` doivent désigner la même
 * séance, sans quoi le client lit trois réponses différentes à la même
 * question.
 */
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

  // Le programme est un cycle : une fois la dernière séance faite, on revient
  // à la première. Il n'y a pas de « fin » de programme.
  const nextSession = useMemo(() => {
    const sortedSessions = [...sessions].sort((a, b) => a.order - b.order);
    if (sortedSessions.length === 0) return undefined;

    // Une séance conseillée aujourd'hui passe devant le cycle — c'est tout ce
    // que change un jour conseillé. Un seul « à faire » pour toute
    // l'application : l'accueil, la pastille du programme et la redirection
    // /client/session pointent la même séance. Sans jour conseillé nulle
    // part, rien ne change : `getSessionForToday` ne rend rien et le cycle
    // reprend la main.
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

  // `/client/session` redirige maintenant vers l'identifiant de la prochaine
  // séance : l'écran a une source unique, l'URL.
  const activeSession = sessionId
    ? sessions.find((s) => s._id === sessionId)
    : undefined;
  const isManualSelection = !!sessionId && sessionId !== nextSession?._id;

  // Un identifiant qui ne correspond à aucune séance (un lien périmé, une
  // séance que le coach a supprimée) ramène au programme plutôt que de rester
  // bloqué.
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
            // La séance est sur le serveur : l'enregistrement local n'a plus
            // aucune raison d'exister. C'est le seul moment où l'on efface —
            // quitter le mode guidé ne doit rien coûter, et sortir pour
            // répondre au téléphone non plus.
            forgetProgress(activeSession._id);
            // Le seul endroit du parcours client où quelque chose partait
            // sans accusé de réception : on se retrouvait sur l'accueil, et
            // rien ne disait que le bilan était parti.
            toaster.create({
              title: 'Séance enregistrée',
              description: 'Ton coach la verra.',
              type: 'success',
              // La durée par défaut tombe sous deux secondes et demie : trop
              // court pour un accusé de réception qui arrive en même temps
              // qu'un changement d'écran.
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
