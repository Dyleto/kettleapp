import { PerformedSet, PerformedValues, Session } from '@/types';
import { LastPerformance, performedKey } from './lastPerformance';
import { GuidedStep, setsOfBlock } from './guidedSteps';

/**
 * What the client has just done, said in numbers.
 *
 * The arc of a session used to be: forty minutes of effort, then a form,
 * then a toast, then the home screen. We asked twice before giving
 * anything. The recap reverses the order — a statement of fact first, the
 * question second.
 *
 * It is only possible because recording happens during the session: the two
 * pieces hold each other up, and that is deliberate. Noting as you go stops
 * being a chore and becomes what buys the recap — and the "fill in what you
 * remember" screen disappears for anyone who did.
 */
export interface Recap {
  /** Minutes elapsed since guided mode opened. Absent when unknown. */
  durationMinutes?: number;
  setsDone: number;
  setsTotal: number;
  /** Sum of weight × reps actually recorded. Zero when there are none. */
  tonnage: number;
  /** Rounds completed, all blocks together. */
  rounds: number;
  comparisons: Comparison[];
}

/** A movement, what went into it today, and what that changes. */
export interface Comparison {
  name: string;
  /** The heaviest load of the day on this movement. */
  load: number;
  /**
   * The gap with last time. `undefined` when there is no last time: we do not
   * compare against nothing, and "+26 kg" on a first attempt would be a
   * flattering lie.
   */
  delta?: number;
}

const heaviest = (sets: PerformedSet[] = []): number | undefined => {
  const loads = sets
    .map((s) => s.weight)
    .filter((w): w is number => typeof w === 'number' && w > 0);
  return loads.length > 0 ? Math.max(...loads) : undefined;
};

/**
 * What may legitimately count as repetitions, set by set.
 *
 * Keyed "block:exercise:rank", that is, the address of one precise set. Only
 * the sets the client ticked off appear here: the prescribed dose only holds
 * for what was actually done.
 */
export const allowedReps = (
  session: Session,
  done: string[]
): Map<string, number> => {
  const allowed = new Map<string, number>();
  const ticked = new Set(done);
  session.blocks.forEach((block) =>
    setsOfBlock(block).forEach((s) => {
      if (ticked.has(s.key) && typeof s.reps === 'number')
        allowed.set(s.key, s.reps);
    })
  );
  return allowed;
};

/**
 * Tonnage: what was actually moved.
 *
 * A set only counts when we know both its weight AND its repetitions. The
 * repetitions come first from what the client typed; failing that, from the
 * prescribed dose — but only for a set they ticked as done, because ticking
 * is precisely the claim that they did what was written. Without that second
 * case the number would always be zero in guided mode, where only a weight
 * is entered.
 *
 * What stays excluded: a set weighed but never done. Inventing it would
 * inflate a number the client reads back from one session to the next.
 */
export const tonnageOf = (
  performed: Record<string, PerformedValues>,
  prescribedReps?: Map<string, number>
): number =>
  Object.entries(performed).reduce(
    (total, [key, value]) =>
      total +
      (value.sets ?? []).reduce((n, s, i) => {
        if (typeof s.weight !== 'number') return n;
        const reps =
          typeof s.reps === 'number'
            ? s.reps
            : prescribedReps?.get(`${key}:${i + 1}`);
        return n + (typeof reps === 'number' ? s.weight * reps : 0);
      }, 0),
    0
  );

/**
 * What was done, and what there was to do.
 *
 * Two units live together in a session and have to be counted together: the
 * sets of a list block, ticked one by one, and the rounds of a timed block,
 * which are not ticked — the clock leads them, and you go through them.
 * Counting only the ticked ones would tell someone who just did the whole
 * session, Tabata included, "7 sets out of 15": a statement that accuses.
 *
 * A round is therefore done as soon as you have gone past it. A loop does not
 * enter this count: its own unit is the completed round, and it has its own
 * figure.
 */
export const countSets = (
  steps: GuidedStep[],
  step: number,
  done: string[]
): { total: number; done: number } => {
  let total = 0;
  let achieved = done.length;
  steps.forEach((s, i) => {
    if (s.type === 'round') {
      total += 1;
      if (i < step) achieved += 1;
    } else if (s.type === 'block') {
      total += s.sets.length;
    }
  });
  return { total, done: Math.min(achieved, total) };
};

/**
 * The movements we can say something about, biggest gap first.
 *
 * Three at most: a recap listing twelve lines is no longer a statement, it is
 * a table. What we want to show is what moved.
 */
export const comparisonsOf = (
  session: Session,
  performed: Record<string, PerformedValues>,
  lastPerformance?: Map<string, LastPerformance>,
  maximum = 3
): Comparison[] => {
  const rows: Comparison[] = [];

  session.blocks.forEach((block) => {
    block.exercises.forEach((ex) => {
      const load = heaviest(
        performed[performedKey(block.order, ex.order)]?.sets
      );
      if (load === undefined) return;
      const before = heaviest(lastPerformance?.get(ex.exercise._id)?.sets);
      rows.push({
        name: ex.exercise.name,
        load,
        delta: before === undefined ? undefined : load - before,
      });
    });
  });

  // What progressed first, then what held, then what has no past: a gap of
  // zero is still information — "I held my load".
  return rows
    .sort((a, b) => Math.abs(b.delta ?? -1) - Math.abs(a.delta ?? -1))
    .slice(0, maximum);
};

export const buildRecap = ({
  session,
  steps,
  step,
  performed,
  done,
  rounds,
  lastPerformance,
  startedAt,
  now = Date.now(),
}: {
  session: Session;
  steps: GuidedStep[];
  step: number;
  performed: Record<string, PerformedValues>;
  done: string[];
  rounds: Record<string, number>;
  lastPerformance?: Map<string, LastPerformance>;
  startedAt?: number;
  now?: number;
}): Recap => {
  const counts = countSets(steps, step, done);
  const elapsed = startedAt === undefined ? -1 : now - startedAt;
  return {
    // A session opened yesterday and finished today would give an absurd
    // number. Past six hours we would rather say nothing.
    durationMinutes:
      elapsed > 0 && elapsed < 6 * 3600_000
        ? Math.max(1, Math.round(elapsed / 60_000))
        : undefined,
    setsDone: counts.done,
    setsTotal: counts.total,
    tonnage: tonnageOf(performed, allowedReps(session, done)),
    rounds: Object.values(rounds).reduce((n, r) => n + r, 0),
    comparisons: comparisonsOf(session, performed, lastPerformance),
  };
};
