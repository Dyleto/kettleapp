import { CompletedSession, PerformedSet } from '@/shared/types';
import { truncateAtFirstEmpty } from './performedFormat';

/** Ce qu'on suit sur un exercice : une charge, des répétitions, ou du temps
 * — jamais deux à la fois sur la même flèche. */
export type ProgressionMetric = 'weight' | 'reps' | 'duration';

/** Un point de la courbe : une séance, et ce qu'on y a mis. */
export interface ProgressionPoint {
  value: number;
  completedAt: Date;
}

/** Un mouvement et ses cinq derniers points, prêts à être lus de gauche à
 * droite. */
export interface ExerciseProgression {
  exerciseId: string;
  name: string;
  metric: ProgressionMetric;
  points: ProgressionPoint[];
  /** La date du dernier point : elle sert à mettre devant les exercices
   * récemment travaillés. */
  lastAt: Date;
}

// Les répétitions et les secondes se totalisent sur la séance : le libellé
// le dit, pour qu'un total ne se lise pas comme la valeur d'une série.
export const METRIC_UNIT: Record<ProgressionMetric, string> = {
  weight: 'kg',
  reps: 'reps au total',
  duration: 's au total',
};

// Une valeur unique n'est pas une progression, et au-delà de cinq points la
// ligne cesse d'être lisible : on garde les cinq derniers, les plus
// parlants.
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
 * Un exercice fait sur plusieurs séries donne un point par séance, et non un
 * par série : la charge la plus lourde tenue ce jour-là, et le volume — le
 * total des répétitions ou des secondes. C'est ce qui répond à « combien je
 * mets la prochaine fois ? ».
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

  // Pas de second garde sur `totals` vide : au-delà du `return` ci-dessus,
  // `kept` porte au moins une série non vide, donc au moins une des trois
  // quantités. Le `Object.keys(totals).length > 0 ? totals : null` qui vivait
  // ici disait la même chose que le premier garde — deux gardes pour une
  // règle, et aucun sabotage ne pouvait les faire tomber tous les deux.
  return totals;
};

/**
 * « Goblet Squat : 20 → 24 → 26 kg », par exercice, sur tout l'historique.
 *
 * Le client voyait ses séances une à une : pour savoir s'il ajoutait de la
 * charge, il fallait ouvrir trois bilans et se souvenir. La donnée est déjà
 * là, dans les instantanés — il ne manquait qu'une lecture verticale.
 *
 * Une seule quantité par exercice, celle de la tentative la plus récente :
 * mêler des kilos et des répétitions sur la même flèche ne voudrait rien
 * dire.
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

  // Le plus récemment travaillé d'abord : c'est celui-là dont on se demande
  // « combien je mets la prochaine fois ? ».
  return progressions.sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
};

/** `true` quand le dernier point est strictement au-dessus du
 * précédent. */
export const isRising = (progression: ExerciseProgression): boolean => {
  const { points } = progression;
  return points[points.length - 1].value > points[points.length - 2].value;
};
