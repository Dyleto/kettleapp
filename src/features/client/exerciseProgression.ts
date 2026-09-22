import { CompletedSession, PerformedSet } from '@/types';
import { truncateAtFirstEmpty } from './performedFormat';

export type ProgressionMetric = 'weight' | 'reps' | 'duration';

export interface ProgressionPoint {
  value: number;
  completedAt: Date;
}

export interface ExerciseProgression {
  exerciseId: string;
  name: string;
  metric: ProgressionMetric;
  points: ProgressionPoint[];
  /** The last point's date: used to put recent exercises first. */
  lastAt: Date;
}

// Repetitions and seconds are totalled across the session: the wording says
// so, so a total is not read as one set's value.
export const METRIC_UNIT: Record<ProgressionMetric, string> = {
  weight: 'kg',
  reps: 'reps au total',
  duration: 's au total',
};

// A single value is not a progression, and beyond five points the line
// stops being readable: we keep the last five, the most telling.
const MIN_POINTS = 2;
const MAX_POINTS = 5;

const exerciseIdOf = (exercise: Record<string, unknown>): string | null => {
  const id = exercise?._id;
  return typeof id === 'string' ? id : null;
};

const nameOf = (exercise: Record<string, unknown>): string => {
  const name = exercise?.name;
  return typeof name === 'string' ? name : 'Exercice';
};

type SessionTotals = { weight?: number; reps?: number; duration?: number };

/**
 * An exercise done over several sets gives one point per session, not one per
 * set: the heaviest load held that day, and the volume — the total reps or
 * seconds. That is what answers "how much do I use next time?".
 */
export const sessionTotals = (sets: PerformedSet[]): SessionTotals | null => {
  const kept = truncateAtFirstEmpty(sets);
  if (kept.length === 0) return null;

  const weights = kept
    .map((s) => s.weight)
    .filter((w): w is number => w !== undefined);
  const reps = kept
    .map((s) => s.reps)
    .filter((r): r is number => r !== undefined);
  const durations = kept
    .map((s) => s.duration)
    .filter((d): d is number => d !== undefined);

  const totals: SessionTotals = {};
  if (weights.length > 0) totals.weight = Math.max(...weights);
  if (reps.length > 0) totals.reps = reps.reduce((a, b) => a + b, 0);
  if (durations.length > 0)
    totals.duration = durations.reduce((a, b) => a + b, 0);

  return Object.keys(totals).length > 0 ? totals : null;
};

/**
 * "Goblet Squat: 20 → 24 → 26 kg", per exercise, across the whole history.
 *
 * The client saw their sessions one by one: to know whether they were adding
 * load you had to open three wrap-ups and remember. The data is already
 * there, in the snapshots — all that was missing was a vertical reading.
 *
 * One quantity per exercise, the most recent attempt's: mixing kilos and
 * repetitions on the same arrow would mean nothing.
 */
export const buildExerciseProgressions = (
  history: CompletedSession[]
): ExerciseProgression[] => {
  const chronological = [...history].sort(
    (a, b) =>
      new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );

  const byExercise = new Map<
    string,
    { name: string; entries: (SessionTotals & { at: Date })[] }
  >();

  chronological.forEach((completed) => {
    const at = new Date(completed.completedAt);
    completed.blocks.forEach((block) => {
      block.exercises.forEach((ex) => {
        if (!ex.performed) return;
        const totals = sessionTotals(ex.performed.sets ?? []);
        if (!totals) return;
        const id = exerciseIdOf(ex.exercise);
        if (!id) return;
        const bucket = byExercise.get(id) ?? {
          name: nameOf(ex.exercise),
          entries: [],
        };
        bucket.name = nameOf(ex.exercise);
        bucket.entries.push({ at, ...totals });
        byExercise.set(id, bucket);
      });
    });
  });

  const progressions: ExerciseProgression[] = [];

  byExercise.forEach((bucket, exerciseId) => {
    const latest = bucket.entries[bucket.entries.length - 1];
    const metric: ProgressionMetric | null =
      latest.weight !== undefined
        ? 'weight'
        : latest.reps !== undefined
          ? 'reps'
          : latest.duration !== undefined
            ? 'duration'
            : null;
    if (!metric) return;

    const points = bucket.entries
      .filter((e) => e[metric] !== undefined)
      .map((e) => ({ value: e[metric] as number, completedAt: e.at }));

    if (points.length < MIN_POINTS) return;

    progressions.push({
      exerciseId,
      name: bucket.name,
      metric,
      points: points.slice(-MAX_POINTS),
      lastAt: points[points.length - 1].completedAt,
    });
  });

  // Most recently worked first: that is the one the question "how much do I
  // use next time?" is being asked about.
  return progressions.sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
};

/** `true` when the last point is strictly above the previous one. */
export const isRising = (progression: ExerciseProgression): boolean => {
  const { points } = progression;
  return points[points.length - 1].value > points[points.length - 2].value;
};
