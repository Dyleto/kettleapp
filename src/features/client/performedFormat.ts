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

/** The work done — repetitions, or time. `null` when neither was recorded. */
const workOf = (set: PerformedSet): string | null => {
  const parts: string[] = [];
  if (set.reps !== undefined) parts.push(`${set.reps} reps`);
  if (set.duration !== undefined) parts.push(`${set.duration}s`);
  return parts.length > 0 ? parts.join(' · ') : null;
};

/** The load. `null` when none was recorded. */
const loadOf = (set: PerformedSet): string | null =>
  set.weight !== undefined ? `${set.weight} kg` : null;

/**
 * What was performed, on one line. `null` when there is nothing to say.
 *
 * The work comes first, the load second — « 9 reps · 12 kg », the way it is
 * said out loud. The load used to lead, which read as « 12 kg × 9 »: the
 * number you actually did came last, behind the number you chose.
 *
 * Four shapes, from the most common to the rarest:
 *   one set                      « 12 reps · 26 kg »
 *   several identical sets       « 3 × 12 reps · 26 kg »
 *   same load, fewer reps        « 12 + 10 + 8 reps · 26 kg »
 *   everything else              « 12 × 26 kg · 10 × 24 kg »
 *
 * The first three cover what people usually write; the last does not try to
 * be short, it tries to stay unambiguous.
 *
 * The word « reps » is what keeps it so. Now that a number before the load
 * means repetitions, a bare count before it would collide with the set count:
 * « 3 × 26 kg » could be three sets or three repetitions. Spelling the unit
 * costs five characters and removes the doubt everywhere at once.
 */
export const formatPerformedSets = (sets: PerformedSet[]): string | null => {
  const kept = truncateAtFirstEmpty(sets);
  if (kept.length === 0) return null;

  const uniform = uniformSet(kept);
  if (uniform) {
    const work = workOf(uniform);
    const load = loadOf(uniform);
    if (!work && !load) return null;
    if (kept.length === 1) return [work, load].filter(Boolean).join(' · ');
    // With no work to count, the count has to name its own unit: « 3 × 26 kg »
    // would read as three repetitions at 26 kg, which is not what happened.
    if (!work) return `${kept.length} séries · ${load}`;
    return [`${kept.length} × ${work}`, load].filter(Boolean).join(' · ');
  }

  const weights = kept.map((s) => s.weight);
  const sameWeight =
    weights[0] !== undefined && weights.every((w) => w === weights[0]);
  if (sameWeight && kept.every((s) => s.duration === undefined)) {
    const reps = kept.map((s) => (s.reps === undefined ? '—' : String(s.reps)));
    return `${reps.join(' + ')} reps · ${weights[0]} kg`;
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
      const load = loadOf(set);
      if (!load) return work || '—';
      return work ? `${work} × ${load}` : load;
    })
    .join(' · ');
};

export const formatPerformed = (performed?: PerformedValues): string | null =>
  performed ? formatPerformedSets(performed.sets) : null;
