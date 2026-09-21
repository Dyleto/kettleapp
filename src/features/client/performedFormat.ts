import { PerformedSet, PerformedValues } from '@/types';

export const isEmptySet = (set: PerformedSet): boolean =>
  set.weight === undefined &&
  set.reps === undefined &&
  set.duration === undefined;

export const sameSet = (a: PerformedSet, b: PerformedSet): boolean =>
  a.weight === b.weight && a.reps === b.reps && a.duration === b.duration;

/**
 * A set left empty means the exercise stopped there: the following ones did
 * not happen. An empty set therefore truncates the list, it is not skipped —
 * the same rule the server applies.
 */
export const truncateAtFirstEmpty = (sets: PerformedSet[]): PerformedSet[] => {
  const stop = sets.findIndex(isEmptySet);
  return stop === -1 ? sets : sets.slice(0, stop);
};

/** The set common to all of them, or `null` if they differ. */
export const uniformSet = (sets: PerformedSet[]): PerformedSet | null =>
  sets.length > 0 && sets.every((s) => sameSet(s, sets[0])) ? sets[0] : null;

const setParts = (set: PerformedSet): string[] => {
  const parts: string[] = [];
  if (set.weight !== undefined) parts.push(`${set.weight} kg`);
  if (set.reps !== undefined) parts.push(`${set.reps} reps`);
  if (set.duration !== undefined) parts.push(`${set.duration}s`);
  return parts;
};

/**
 * What was performed, on one line. `null` when there is nothing to say.
 *
 * Four shapes, from the most common to the rarest:
 *   one set                      « 26 kg · 12 reps »
 *   several identical sets       « 26 kg · 3 × 12 reps »
 *   same load, fewer reps        « 26 kg · 12 + 10 + 8 »
 *   everything else              « 26 kg × 12 · 24 kg × 10 »
 *
 * The first three cover what people usually write; the last does not try to
 * be short, it tries to stay unambiguous.
 */
export const formatPerformedSets = (sets: PerformedSet[]): string | null => {
  const kept = truncateAtFirstEmpty(sets);
  if (kept.length === 0) return null;

  const uniform = uniformSet(kept);
  if (uniform) {
    const parts = setParts(uniform);
    if (parts.length === 0) return null;
    if (kept.length === 1) return parts.join(' · ');
    // The set count goes before the work, never before the load:
    // « 3 × 26 kg » would read as a total weight.
    const weight = uniform.weight !== undefined ? `${uniform.weight} kg` : null;
    const work = setParts({ reps: uniform.reps, duration: uniform.duration });
    if (work.length === 0) return `${kept.length} × ${weight}`;
    return [weight, `${kept.length} × ${work.join(' · ')}`]
      .filter(Boolean)
      .join(' · ');
  }

  const weights = kept.map((s) => s.weight);
  const sameWeight =
    weights[0] !== undefined && weights.every((w) => w === weights[0]);
  if (sameWeight && kept.every((s) => s.duration === undefined)) {
    const reps = kept.map((s) => (s.reps === undefined ? '—' : String(s.reps)));
    return `${weights[0]} kg · ${reps.join(' + ')}`;
  }

  // In a list of sets the « × » already says these are repetitions:
  // repeating the word on every set adds nothing and lengthens everything.
  return kept
    .map((set) => {
      const work = [
        set.reps !== undefined ? String(set.reps) : null,
        set.duration !== undefined ? `${set.duration}s` : null,
      ]
        .filter(Boolean)
        .join(' · ');
      const weight = set.weight !== undefined ? `${set.weight} kg` : null;
      if (!weight) return work || '—';
      return work ? `${weight} × ${work}` : weight;
    })
    .join(' · ');
};

export const formatPerformed = (performed?: PerformedValues): string | null =>
  performed ? formatPerformedSets(performed.sets) : null;
