import { useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { clientService } from '@/features/client/common/client.service';
import { queryKeys } from '@/shared/config/queryKeys';
import { CLIENT_ROUTES } from '@/shared/config/routes';
import { toaster } from '@/shared/components/ui/toasterInstance';
import { useCompleteSession } from '@/features/client/common/useCompleteSession';
import type { PerformedValues, SessionFeedback } from '@/shared/types';
import { buildLastPerformanceIndex } from '@/domain/history/lastPerformance';
import { getSessionForToday } from '@/domain/week/plan';
import {
  forgetProgress,
  readProgress,
} from '@/features/client/guided/sessionProgress';
import { completionPayload } from '@/features/client/end/sending';
import { queueFeeling, usePendingSends } from '@/features/client/end/pending';
import { sendKeyFor } from '@/features/client/end/sendKey';
import { coachVoice } from '@/features/client/common/coach';
import {
  isNetworkCut,
  isUnavailable as hasNothingToShow,
} from '@/shared/utils/queryState';

/**
 * Les deux lectures sur lesquelles reposent les écrans du client : ce que
 * tirer l'accueil ou le programme vers le bas fait repartir.
 */
export const CLIENT_SCREEN = [
  queryKeys.client.program.get(),
  queryKeys.client.history.all(),
] as const;

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
  // Comment nommer le coach : « Julie », ou « ton coach » tant qu'on ne sait
  // pas — pendant le chargement, ou quand le client en suit plusieurs.
  const coach = useMemo(
    () => coachVoice(programQuery.data?.coaches),
    [programQuery.data]
  );
  const sendPending = usePendingSends(sessions, coach);
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

  // « Combien j'ai mis la dernière fois ? » se répond depuis l'historique
  // déjà chargé : aucune requête, aucune route de plus.
  const lastPerformance = useMemo(
    () => buildLastPerformanceIndex(history),
    [history]
  );

  const isLoading = programQuery.isLoading || historyQuery.isLoading;

  // L'historique compte autant que le programme : sans lui, « la prochaine »
  // retombe sur la séance 1, et l'accueil affirmerait quelque chose de faux.
  // Mieux vaut dire que rien ne répond.
  const isUnavailable =
    hasNothingToShow(programQuery) || hasNothingToShow(historyQuery);
  const { refetch: refetchProgram } = programQuery;
  const { refetch: refetchHistory } = historyQuery;
  const retry = useCallback(() => {
    void refetchProgram();
    void refetchHistory();
  }, [refetchProgram, refetchHistory]);

  // `/client/session` redirige maintenant vers l'identifiant de la prochaine
  // séance : l'écran a une source unique, l'URL.
  const activeSession = sessionId
    ? sessions.find((s) => s._id === sessionId)
    : undefined;
  const isManualSelection = !!sessionId && sessionId !== nextSession?._id;

  // Un identifiant qui ne correspond à aucune séance (un lien périmé, une
  // séance que le coach a supprimée) ramène au programme plutôt que de rester
  // bloqué.
  //
  // Seulement quand le programme est là. Sans cette garde, une panne de
  // réseau donnait une liste vide, donc « Séance introuvable — cette séance
  // n'existe plus dans ton programme », suivi d'une redirection : l'écran
  // accusait le coach d'avoir supprimé une séance qu'il n'avait pas pu lire.
  const isProgramKnown = programQuery.data !== undefined;
  useEffect(() => {
    if (isProgramKnown && !isLoading && sessionId && !activeSession) {
      toaster.create({
        title: 'Séance introuvable',
        description: "Cette séance n'existe plus dans ton programme.",
        type: 'info',
      });
      navigate(CLIENT_ROUTES.program, { replace: true });
    }
  }, [isProgramKnown, isLoading, sessionId, activeSession, navigate]);

  const handleSubmitLog = useCallback(
    (
      feeling: {
        feedback: SessionFeedback;
        clientNotes: string;
        completedAt?: string;
      },
      // Ce qui a été noté, tel que l'écran le tient : il fait foi quand le
      // stockage est refusé. Le reste — tours, échelles, chipper — vient de
      // l'appareil, par `completionPayload`, comme pour un envoi différé.
      performed: Record<string, PerformedValues>,
      // L'écran du ressenti reste ouvert jusqu'à la réponse : c'est lui qui
      // dit qu'un envoi n'est pas parti, ou qu'il partira au retour du
      // réseau. Réussi, c'est à lui de dire où aller — la semaine qui
      // avance.
      callbacks: {
        onSuccess?: () => void;
        onError?: () => void;
        onQueued?: () => void;
      } = {}
    ) => {
      if (!activeSession) return;
      const sessionId = activeSession._id;
      // Posée avant tout envoi, gardée avec le ressenti s'il attend : le
      // renvoi portera la même, et le serveur reconnaîtra ce qu'il a déjà.
      const sendKey = sendKeyFor(sessionId);
      // Sans réseau, rien ne part : la requête attendrait en mémoire, et
      // quitter l'écran la perdrait. Le ressenti est gardé, il partira seul.
      if (!navigator.onLine) {
        queueFeeling(sessionId, feeling);
        callbacks.onQueued?.();
        return;
      }
      completeSession.mutate(
        {
          sessionId,
          ...completionPayload(
            readProgress(sessionId),
            feeling,
            performed,
            sendKey
          ),
        },
        {
          onSuccess: () => {
            // La séance est sur le serveur : l'enregistrement local n'a plus
            // aucune raison d'exister. C'est le seul moment où l'on efface —
            // quitter le mode guidé ne doit rien coûter, et sortir pour
            // répondre au téléphone non plus.
            forgetProgress(activeSession._id);
            if (callbacks.onSuccess) {
              callbacks.onSuccess();
              return;
            }
            // Le seul endroit du parcours client où quelque chose partait
            // sans accusé de réception : on se retrouvait sur l'accueil, et
            // rien ne disait que le bilan était parti.
            toaster.create({
              title: 'Séance enregistrée',
              description: `${coach.opening} la verra.`,
              type: 'success',
              // La durée par défaut tombe sous deux secondes et demie : trop
              // court pour un accusé de réception qui arrive en même temps
              // qu'un changement d'écran.
              duration: 4500,
            });
            navigate(CLIENT_ROUTES.today);
          },
          // Une coupure en route est une affaire de réseau : le ressenti est
          // gardé, il repartira seul. Un serveur qui a répondu non, ou mal,
          // se dit, et l'écran le refait d'une touche.
          onError: (error) => {
            if (!isNetworkCut(error)) {
              callbacks.onError?.();
              return;
            }
            queueFeeling(sessionId, feeling);
            callbacks.onQueued?.();
          },
        }
      );
    },
    [activeSession, completeSession, navigate, coach]
  );

  return {
    sessions,
    coach,
    nextSession,
    activeSession,
    isManualSelection,
    history,
    lastPerformance,
    handleSubmitLog,
    sendPending,
    isLoading,
    isUnavailable,
    retry,
    isRetrying: programQuery.isRefetching || historyQuery.isRefetching,
    isSubmitting: completeSession.isPending,
  };
};
