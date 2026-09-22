import { toaster } from '@/components/ui/toasterInstance';
import api from '@/config/api';
import { queryKeys } from '@/config/queryKeys';
import { Session } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Options {
  /**
   * The workshop saves itself: it owns its own state and has no use for a
   * confirmation message on every keystroke, nor for a background request
   * that would replace what the coach is in the middle of writing.
   */
  silent?: boolean;
}

export const useUpdateProgramSessions = (
  clientId: string,
  { silent = false }: Options = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessions: Session[]) => {
      const formattedSessions = sessions.map((session, si) => ({
        _id: session._id,
        order: si + 1,
        name: session.name?.trim(),
        notes: session.notes?.trim(),
        suggestedDays: session.suggestedDays ?? [],
        blocks: session.blocks.map((block, bi) => ({
          // The block id makes the round-trip: without it the API recreated
          // one on every save and the whole session was rebuilt on screen —
          // unbearable when you save on every edit.
          _id: block._id,
          // "Every" and EMOM name the same format now that an EMOM carries
          // its interval. Rather than a migration, the conversion happens on
          // the first save: the two have exactly the same fields and the
          // same rendering, so it goes unseen. The data converges at the
          // pace the coach touches their sessions.
          type: block.type === 'every' ? 'emom' : block.type,
          label: block.label || undefined,
          order: bi + 1,
          notes: block.notes?.trim(),
          durationMinutes: block.durationMinutes,
          intervalMinutes: block.intervalMinutes,
          rounds: block.rounds,
          restBetweenRounds: block.restBetweenRounds,
          workDuration: block.workDuration,
          restDuration: block.restDuration,
          repsScheme: block.repsScheme,
          exercises: block.exercises
            .filter((ex) => ex.exercise?._id)
            .map((ex, ei) => ({
              exerciseId: ex.exercise._id,
              order: ei + 1,
              sets: ex.sets,
              reps: ex.reps,
              duration: ex.duration,
              restBetweenSets: ex.restBetweenSets,
              customMetric: ex.customMetric,
              note: ex.note?.trim() || undefined,
            })),
        })),
      }));

      const { data } = await api.put<Session[]>(
        `/api/coach/clients/${clientId}/program/sessions`,
        { sessions: formattedSessions }
      );
      return data;
    },
    onSuccess: () => {
      // In silent mode the caller adopts the response itself: invalidating
      // the client detail would fire a request whose only effect would be to
      // rewrite the workshop over the typing in progress.
      if (!silent) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.coach.clients.detail(clientId),
        });
        toaster.create({ title: 'Programme sauvegardé', type: 'success' });
      }

      // The program as the client sees it, on the other hand, did change.
      queryClient.invalidateQueries({
        queryKey: queryKeys.client.program.get(),
      });
    },
    onError: () => {
      if (silent) return;
      toaster.create({
        title: 'Erreur lors de la sauvegarde du programme',
        type: 'error',
      });
    },
  });
};
