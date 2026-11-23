import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router';
import { Container, Skeleton, VStack } from '@chakra-ui/react';
import type { PerformedValues } from '@/shared/types';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { CLIENT_ROUTES } from '@/shared/config/routes';
import { ActionButton, EmptyState, SlowNotice } from '@/kit';
import { CLIENT_CONTENT_MAX_W } from '@/features/client/shell/layout';
import type { useClientSessions } from '@/features/client/common/useClientSessions';
import { GuidedSession } from '@/features/client/guided/GuidedSession';
import {
  countRecorded,
  readProgress,
  writeProgress,
} from '@/features/client/guided/sessionProgress';
import { EndFlow } from '@/features/client/end/EndFlow';
import { endFlowReducer, initialEndFlow } from '@/features/client/end/flow';
import { SessionSheet } from './SessionSheet';

type ClientSessionsData = ReturnType<typeof useClientSessions>;

/**
 * L'écran d'une séance : la fiche, la séance guidée par-dessus, puis la fin.
 *
 * Il faisait les trois à la fois, en 568 lignes et sept états. La fiche est
 * dans `SessionSheet`, la fin dans `EndFlow` et son réducteur ; il reste ici
 * ce qui les relie — d'où l'on vient, ce qui a été noté, et le passage de
 * l'une à l'autre.
 */
const SessionScreen = () => {
  const navigate = useNavigate();
  const {
    sessions,
    activeSession,
    handleSubmitLog,
    sendPending,
    isLoading,
    isSubmitting,
    lastPerformance,
    history,
    coach,
  } = useOutletContext<ClientSessionsData>();
  const location = useLocation();
  // « Démarrer » ou « Reprendre » sur l'accueil arrive ici avec
  // `guided: 'start'` : la séance guidée s'ouvre d'emblée — sur son
  // ouverture, ou sur l'étape gardée si elle est commencée — et la fiche
  // attend dessous. Une touche au lieu de trois avant le premier exercice.
  const [isGuidedOpen, setIsGuidedOpen] = useState(
    () => (location.state as { guided?: string } | null)?.guided === 'start'
  );
  // La demande est lue une fois puis effacée de l'historique : revenir sur
  // la fiche par « Précédent », ou la recharger, ne doit pas relancer la
  // séance.
  useEffect(() => {
    const asked = location.state as { guided?: string; end?: string } | null;
    if (asked?.guided || asked?.end)
      navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);
  useDocumentTitle(activeSession ? `Séance ${activeSession.order}` : undefined);

  // D'où l'on vient, lu une fois : l'état de navigation est effacé dès
  // qu'une séance guidée demandée depuis l'accueil s'est ouverte.
  const [cameFrom] = useState(
    () => (location.state as { from?: string } | null)?.from
  );

  const [flow, dispatch] = useReducer(endFlowReducer, initialEndFlow);

  // « Dire comment c'était » sur l'accueil arrive ici avec `end: 'review'` :
  // le ressenti s'ouvre d'emblée, une fois. Après la remise à zéro qui suit
  // l'arrivée de la séance, d'où l'effet plutôt que l'état initial.
  const reviewAsked = useRef(
    (location.state as { end?: string } | null)?.end === 'review'
  );
  useEffect(() => {
    if (!reviewAsked.current || !activeSession) return;
    reviewAsked.current = false;
    dispatch({ type: 'resumeFeeling' });
  }, [activeSession]);

  // Ce qui a été noté ne vit plus dans la seule mémoire.
  //
  // C'était un `useState` nu : un rechargement, un appel entrant qui tue
  // l'onglet, et quarante minutes de charges disparaissaient. L'application
  // retenait pourtant scrupuleusement à quelle étape on en était. Elle
  // gardait ce qui se retrouve et perdait ce qui ne se retrouve pas.
  const [performed, setPerformed] = useState<Record<string, PerformedValues>>(
    () =>
      activeSession ? (readProgress(activeSession._id)?.performed ?? {}) : {}
  );

  // La saisie appartient à une séance précise : passer à une autre depuis
  // le programme ne doit pas traîner les charges de la précédente dans le
  // bilan. Chacune retrouve les siennes, là où elle les a laissées.
  const [performedFor, setPerformedFor] = useState(activeSession?._id);
  if (activeSession?._id !== performedFor) {
    setPerformedFor(activeSession?._id);
    setPerformed(
      activeSession ? (readProgress(activeSession._id)?.performed ?? {}) : {}
    );
    dispatch({ type: 'reset' });
  }

  const handlePerformedChange = useCallback(
    (key: string, next: PerformedValues) =>
      setPerformed((prev) => {
        const updated = { ...prev, [key]: next };
        // À la frappe plutôt qu'à la perte du focus : ce qu'on cherche à
        // couvrir, c'est l'application qui disparaît sans prévenir.
        if (activeSession)
          writeProgress(activeSession._id, { performed: updated });
        return updated;
      }),
    [activeSession]
  );

  if (isLoading) {
    return (
      <Container maxW={CLIENT_CONTENT_MAX_W} py={8} px={4}>
        <VStack align="stretch" gap={4}>
          <Skeleton h="20px" w="120px" borderRadius="md" />
          <Skeleton h="80px" borderRadius="lg" />
          <Skeleton h="200px" borderRadius="lg" />
          <SlowNotice />
        </VStack>
      </Container>
    );
  }

  if (sessions.length === 0) {
    return (
      <Container maxW={CLIENT_CONTENT_MAX_W} py={8} px={4}>
        <EmptyState
          mood="sleep"
          title="Ton programme arrive"
          line={`${coach.opening} prépare tes séances. Tu n'as rien à faire : elles apparaîtront ici.`}
        />
      </Container>
    );
  }

  // La séance demandée n'est pas dans le programme : un lien périmé, ou une
  // séance que le coach a retirée. Le programme, lui, est bien là — la porte
  // au-dessus ne laisse pas monter cet écran sans lui.
  if (!activeSession) {
    return (
      <Container maxW={CLIENT_CONTENT_MAX_W} py={8} px={4}>
        <EmptyState
          mood="oops"
          headingLevel="h1"
          title="Cette séance n'existe plus"
          line={`${coach.opening} l'a peut-être retirée de ton programme.`}
          action={
            <ActionButton
              tone="ghost"
              size="md"
              onClick={() => navigate(CLIENT_ROUTES.program)}
            >
              Voir mon programme
            </ActionButton>
          }
        />
      </Container>
    );
  }

  // Une séance commencée sur ce téléphone : le bouton dit « Reprendre », et
  // la séance guidée rouvre l'étape gardée. Recommencer se décide sur
  // l'accueil, qui le demande d'abord.
  const saved = readProgress(activeSession._id);
  const started = !!saved && (saved.step > 0 || saved.done.length > 0);
  // Finie et pas encore envoyée, la fiche ne propose plus de la reprendre :
  // elle propose ce qui reste à faire — dire comment c'était, ou laisser
  // partir le ressenti gardé.
  const ending = saved?.pending
    ? { label: 'Envoyer maintenant', onClick: () => void sendPending() }
    : saved?.finishedAt !== undefined
      ? {
          label: 'Dire comment c’était',
          onClick: () => dispatch({ type: 'resumeFeeling' }),
        }
      : undefined;

  return (
    <>
      <SessionSheet
        session={activeSession}
        backLabel={cameFrom === 'today' ? "Aujourd'hui" : 'Programme'}
        onBack={() =>
          navigate(
            cameFrom === 'today' ? CLIENT_ROUTES.today : CLIENT_ROUTES.program
          )
        }
        lastPerformance={lastPerformance}
        history={history}
        started={started}
        ending={ending}
        onStart={() => setIsGuidedOpen(true)}
        onDeclared={(date) => dispatch({ type: 'declared', date })}
      />

      {isGuidedOpen && (
        <GuidedSession
          session={activeSession}
          onExit={() => setIsGuidedOpen(false)}
          onFinish={() => {
            setIsGuidedOpen(false);
            const hasProgress = !!readProgress(activeSession._id);
            // Finie, la séance est « à valider » tant que le ressenti n'est
            // pas parti : l'accueil ne la propose plus de reprendre.
            writeProgress(activeSession._id, { finishedAt: Date.now() });
            dispatch({
              type: 'guidedFinished',
              hasProgress,
              recordedCount: countRecorded(performed),
            });
          }}
          lastPerformance={lastPerformance}
          performed={performed}
          onPerformedChange={handlePerformedChange}
        />
      )}

      <EndFlow
        flow={flow}
        dispatch={dispatch}
        session={activeSession}
        sessions={sessions}
        history={history}
        lastPerformance={lastPerformance}
        performed={performed}
        onPerformedChange={handlePerformedChange}
        isSubmitting={isSubmitting}
        submit={handleSubmitLog}
        onLeave={() => navigate(CLIENT_ROUTES.today)}
      />
    </>
  );
};
export default SessionScreen;
