import { useMemo, useState } from 'react';
import type { CompletedSession, PerformedValues } from '@/shared/types';
import { dayKey } from '@/domain/week/dates';
import {
  changedPerformed,
  recordedPerformed,
  snapshotSession,
} from '@/domain/history/correction';
import { useUpdateCompletedSession } from '@/features/client/common/useCompleteSession';
import { Feeling } from '@/features/client/end/Feeling';
import { Loads } from '@/features/client/end/Loads';
import { toaster } from '@/shared/components/ui/toasterInstance';

/**
 * « Corriger » : les écrans de la fin de séance, rouverts sur ce qui a été
 * enregistré — « Mes charges », puis le ressenti, date comprise.
 *
 * Le tiroir du bilan corrigeait sur place, avec des champs de série sous
 * chaque exercice et sa propre échelle d'effort : une seconde façon de
 * dire la même chose, que le client ne reconnaissait pas. La maquette
 * rouvre les écrans qu'il connaît déjà.
 *
 * Un ancien bilan, à cinq axes, ne propose pas de corriger son ressenti :
 * la question ne lui a jamais été posée, et y répondre aujourd'hui
 * inventerait une réponse. Ses charges, si.
 *
 * N'est envoyé que ce qui a changé : les mouvements dont les séries
 * diffèrent, la date si elle a bougé.
 */
export const CorrectFlow = ({
  completed,
  onClose,
}: {
  completed: CompletedSession;
  onClose: () => void;
}) => {
  const session = useMemo(() => snapshotSession(completed), [completed]);
  const original = useMemo(() => recordedPerformed(completed), [completed]);
  const [performed, setPerformed] = useState(original);
  const [stage, setStage] = useState<'loads' | 'feeling'>('loads');
  const update = useUpdateCompletedSession();
  const legacy = !completed.feedback;
  const recordedDay = dayKey(new Date(completed.completedAt));

  const save = (extra: Record<string, unknown> = {}) => {
    const changed = changedPerformed(original, performed);
    update.mutate(
      {
        completedId: completed._id,
        ...(changed.length > 0 ? { performed: changed } : {}),
        ...extra,
      },
      {
        onSuccess: onClose,
        // L'écran du ressenti dit lui-même un envoi raté ; « Mes charges »
        // n'a pas de quoi le dire, d'où le message.
        onError: legacy
          ? () =>
              toaster.create({
                title: 'La correction n’est pas partie',
                description: 'Ta séance n’a pas bougé : réessaie.',
                type: 'error',
              })
          : undefined,
      }
    );
  };

  if (stage === 'loads')
    return (
      <Loads
        session={session}
        performed={performed}
        onPerformedChange={(key: string, next: PerformedValues) =>
          setPerformed((was) => ({ ...was, [key]: next }))
        }
        from="declared"
        doneLabel={legacy ? 'Enregistrer' : 'Continuer'}
        onBack={onClose}
        onDone={() => {
          if (!legacy) return setStage('feeling');
          if (changedPerformed(original, performed).length > 0) save();
          else onClose();
        }}
      />
    );

  return (
    <Feeling
      title="Ton ressenti"
      line="Corrige ce qui doit l’être : le reste ne bouge pas."
      submitLabel="Enregistrer"
      failedLine="La correction n’est pas partie. Ta séance n’a pas bougé : réessaie d’une touche."
      closeLabel="Fermer sans corriger"
      date={recordedDay}
      initial={{
        effort: completed.feedback?.effort,
        tags: completed.feedback?.tags,
        notes: completed.clientNotes,
      }}
      isSending={update.isPending}
      failed={update.isError}
      queued={false}
      onClose={onClose}
      onLeave={onClose}
      onSubmit={(feedback, notes, _completedAt, day) =>
        save({
          feedback,
          clientNotes: notes,
          ...(day && day !== recordedDay ? { completedAt: day } : {}),
        })
      }
    />
  );
};
