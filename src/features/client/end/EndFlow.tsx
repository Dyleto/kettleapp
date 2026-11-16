import { useMemo } from 'react';
import type {
  CompletedSession,
  PerformedValues,
  Session,
} from '@/shared/types';
import type { LastPerformance } from '@/domain/history/lastPerformance';
import { highlightOf } from '@/domain/history/records';
import { sessionName } from '@/domain/session/name';
import type { useClientSessions } from '@/features/client/common/useClientSessions';
import { readProgress } from '@/features/client/guided/sessionProgress';
import { buildGuidedSteps } from '@/features/client/guided/steps';
import { Celebration } from './Celebration';
import { Feeling } from './Feeling';
import { Loads } from './Loads';
import { Week } from './Week';
import type { EndFlowAction, EndFlowState } from './flow';
import { buildRecap } from './recap';
import {
  toLadderDone,
  toPerformedEntries,
  toRoundsDone,
  weekAfter,
} from './sending';

interface EndFlowProps {
  flow: EndFlowState;
  dispatch: (action: EndFlowAction) => void;
  session: Session;
  sessions: readonly Session[];
  history: readonly CompletedSession[];
  lastPerformance?: Map<string, LastPerformance>;
  performed: Record<string, PerformedValues>;
  onPerformedChange: (key: string, next: PerformedValues) => void;
  isSubmitting: boolean;
  submit: ReturnType<typeof useClientSessions>['handleSubmitLog'];
  /** La semaine vue : l'accueil. */
  onLeave: () => void;
}

/**
 * Les écrans de la fin, un à la fois, selon l'étape où `flow` en est.
 *
 * Chacun se pose en plein écran par-dessus la fiche, qui attend dessous :
 * revenir de la saisie d'une séance déclarée, ou fermer le ressenti, y
 * ramène sans rien envoyer.
 */
export const EndFlow = ({
  flow,
  dispatch,
  session,
  sessions,
  history,
  lastPerformance,
  performed,
  onPerformedChange,
  isSubmitting,
  submit,
  onLeave,
}: EndFlowProps) => {
  const { stage } = flow;

  /**
   * Le récapitulatif, calculé à l'ouverture de la fin.
   *
   * Il n'existe que si la séance a été menée en mode guidé : sans état
   * enregistré il n'y a rien à constater, et un récapitulatif vide vaudrait
   * moins que pas de récapitulatif.
   */
  const recap = useMemo(() => {
    if (stage === 'idle') return undefined;
    const saved = readProgress(session._id);
    if (!saved || (saved.done.length === 0 && saved.startedAt === undefined))
      return undefined;
    return buildRecap({
      session,
      steps: buildGuidedSteps(session),
      step: saved.step,
      performed,
      done: saved.done,
      rounds: saved.rounds,
      startedAt: saved.startedAt,
    });
  }, [session, stage, performed]);

  if (stage === 'celebrate' && recap) {
    return (
      <Celebration
        title={sessionName(session)}
        recap={recap}
        highlight={highlightOf(session, performed, history, lastPerformance)}
        onContinue={() => dispatch({ type: 'continue' })}
        onCompleteLoads={() => dispatch({ type: 'completeLoads' })}
      />
    );
  }

  if (stage === 'loads' || stage === 'record') {
    return (
      <Loads
        session={session}
        performed={performed}
        onPerformedChange={onPerformedChange}
        lastPerformance={lastPerformance}
        from={stage === 'loads' ? 'end' : 'declared'}
        onDone={() => dispatch({ type: 'loadsDone' })}
        onBack={() => dispatch({ type: 'loadsBack' })}
      />
    );
  }

  if (stage === 'review') {
    return (
      <Feeling
        date={flow.declaredDate}
        isSending={isSubmitting}
        failed={flow.sendFailed}
        onClose={() => dispatch({ type: 'closeFeeling' })}
        onSubmit={(feedback, notes, completedAt) => {
          dispatch({ type: 'sending' });
          // L'écran reste jusqu'à la réponse : réussi, la semaine qui
          // avance ; manqué, il le dit et l'on réessaie d'une touche.
          const saved = readProgress(session._id);
          submit(
            feedback,
            notes,
            completedAt,
            toPerformedEntries(performed),
            toRoundsDone(saved?.rounds),
            toLadderDone(saved?.ladder),
            {
              onError: () => dispatch({ type: 'sendFailed' }),
              onSuccess: () =>
                dispatch({
                  type: 'sent',
                  week: weekAfter(history, sessions, completedAt),
                }),
            }
          );
        }}
      />
    );
  }

  if (stage === 'week' && flow.week) {
    return <Week {...flow.week} onFinish={onLeave} />;
  }

  return null;
};
