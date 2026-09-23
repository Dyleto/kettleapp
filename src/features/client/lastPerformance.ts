import { CompletedSession, PerformedValues } from '@/types';
import { formatPerformedSets, truncateAtFirstEmpty } from './performedFormat';

export interface LastPerformance extends PerformedValues {
  completedAt: Date;
}

/**
 * An exercise's address inside a session snapshot — "block order : exercise
 * order". It is exactly the key the API expects for what was performed, and
 * the only one used on the front end.
 */
export const performedKey = (blockOrder: number, exerciseOrder: number) =>
  `${blockOrder}:${exerciseOrder}`;

const exerciseIdOf = (exercise: Record<string, unknown>): string | null => {
  const id = exercise?._id;
  return typeof id === 'string' ? id : null;
};

const hasAnyValue = (p: PerformedValues) =>
  truncateAtFirstEmpty(p.sets ?? []).length > 0;

/**
 * The last known `performed` for each exercise, across all sessions.
 *
 * Indexed by exercise id and not by position: "how much did I use?" is about
 * the movement, not about the slot it happened to occupy in that day's
 * session.
 *
 * Computed entirely from the history already loaded — no request.
 */
export const buildLastPerformanceIndex = (
  history: CompletedSession[]
): Map<string, LastPerformance> => {
  const index = new Map<string, LastPerformance>();

  // Oldest to newest: the last write wins, so every exercise ends up on its
  // most recent attempt.
  const chronological = [...history].sort(
    (a, b) =>
      new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );

  chronological.forEach((completed) => {
    completed.blocks.forEach((block) => {
      block.exercises.forEach((ex) => {
        if (!ex.performed || !hasAnyValue(ex.performed)) return;
        const id = exerciseIdOf(ex.exercise);
        if (!id) return;
        index.set(id, {
          ...ex.performed,
          completedAt: new Date(completed.completedAt),
        });
      });
    });
  });

  return index;
};

/**
 * « 3 × 12 reps · 26 kg » — only the sets actually filled in, never a padding
 * zero. `null` when there is nothing to say.
 */
export const formatLastPerformance = (
  last: LastPerformance | undefined
): string | null => (last ? formatPerformedSets(last.sets ?? []) : null);
