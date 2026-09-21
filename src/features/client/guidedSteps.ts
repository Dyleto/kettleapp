import { Session, SessionBlock, BlockExercise, BlockType } from '@/types';
import {
  getBlockLabel,
  blockSupportsRepsOnly,
  blockDefinesOwnMetrics,
  prescribedSetLabels,
  restBetweenSetsOf,
} from '@/features/program/constants';
import { formatDuration } from '@/utils/formatters';

/**
 * One set: a thing you do, and that can be done.
 *
 * Guided mode only ever had a model of "where the cursor is" — an index
 * advancing through a list of screens. That is the model of a slideshow. A
 * slideshow advances; a training log records. Hence every symptom: nothing
 * could be ticked, the progress bar counted pages, resuming spoke in "step 5
 * of 12", and the wrap-up opened on "fill in what you remember" — the
 * admission that the app had retained nothing.
 *
 * The set is the unit that was missing: one series, one rung of a pyramid,
 * one movement of a chipper. The client's job is to move them from "to do"
 * to "done", and it is the same gesture everywhere.
 */
export interface GuidedSet {
  /** Stable identity: it carries the state, and survives a reload. */
  key: string;
  blockOrder: number;
  exerciseOrder: number;
  /** 1-indexed, as it is spoken: "set 2 / 4", "rung 3". */
  rank: number;
  /** How many the exercise carries — the "/ 4". */
  total: number;
  name: string;
  /** What there is to do: "10 reps", or "8 reps" on a rung. */
  dose: string;
  /**
   * The prescribed repetitions, as a number — when there are any.
   *
   * The dose is text, made to be read. Tonnage needs the number: guided mode
   * only asks for a weight per set, never for reps, because ticking "done"
   * already says the prescribed work was done. Without this field, "so many
   * kilos lifted" could never appear on a session run in guided mode — that
   * is to say, almost never.
   */
  reps?: number;
  /** The rest prescribed after this set, if there is one. */
  restAfter?: number;
  /** The exercise it comes from — for its instructions and its video. */
  exercise: BlockExercise;
}

/**
 * Three shapes, and the block decides which.
 *
 *   timed — EMOM, Tabata, On/Off: the clock leads the round, it chains on.
 *   list  — classic, pyramid, chipper, warm-up: you tick things off.
 *   loop  — AMRAP: you do not tick a loop, you count its rounds.
 *
 * The shape also decides the primary button, always in the same place: the
 * clock presses it for timed, "Fait" for a list, "+1 tour" for a loop.
 */
export type BlockShape = 'timed' | 'list' | 'loop';

export type GuidedStep =
  | {
      /**
       * One round, with its clock.
       *
       * An EMOM is by definition on the minute: the minute starts, you chain
       * the movements of the round, and whatever is left of the minute is the
       * rest. Guided mode made something else entirely of it — one page per
       * movement, with no clock, then a "REST 1:00" page. The client never
       * saw the minute running, so could not know whether they were ahead;
       * and they took a full minute the coach had not prescribed. A ten-round
       * EMOM meant to last ten minutes lasted twenty.
       *
       * The unit is therefore the round, not the movement. That gives the
       * clock back to the format, it finally provides a "Round 3 / 10" to
       * display — ten rigorously identical screens were indistinguishable —
       * and it brings the test EMOM down from thirty steps to ten.
       */
      type: 'round';
      blockLabel: string;
      block: SessionBlock;
      /** 1-indexed, as it is spoken: "Round 3 / 10". */
      round: number;
      rounds: number;
      /** What there is to do in this round, in order. */
      exercises: BlockExercise[];
      /**
       * The round's time.
       *
       * EMOM: the whole interval — the rest is whatever is left of it, and
       * managing it is up to the client, as in the gym. Tabata / On-Off: the
       * work time alone, followed by `restSeconds`, both imposed.
       */
      workSeconds?: number;
      /** The rest imposed after the work. Absent on an EMOM: see above. */
      restSeconds?: number;
      /** What comes after the last round. `null` while rounds remain. */
      nextLabel: string | null;
    }
  | {
      /**
       * A whole block, read at once.
       *
       * From the field: "during the exercise we should see all the info at
       * once — not 7 reps back squat, then 120 s rest, then 6 reps… And when
       * I get to the AMRAP it is worse, I simply cannot see all the
       * movements, which blocks me if I have not written it on a notepad."
       *
       * An AMRAP is a list you loop, not a queue.
       */
      type: 'block';
      blockLabel: string;
      block: SessionBlock;
      /** `list` you tick, `loop` you count. Never `timed` here. */
      shape: Exclude<BlockShape, 'timed'>;
      /** Empty on a loop: an AMRAP is not ticked off, it is counted. */
      sets: GuidedSet[];
    }
  | {
      type: 'rest';
      /** The block this rest belongs to — it counts in its progress. */
      blockLabel: string;
      duration: number;
      nextExerciseName: string | null;
    };

/**
 * The blocks whose rounds are led by a timer: the interval for an EMOM, the
 * work/rest pair for a Tabata and an On-Off. They are the only ones where the
 * "one page per round" shape makes sense — elsewhere the client leads.
 */
const ROUND_BASED_TYPES: BlockType[] = ['emom', 'every', 'tabata', 'onoff'];

const sortByOrder = <T extends { order: number }>(items: T[]): T[] =>
  [...items].sort((a, b) => a.order - b.order);

/** A round's time, according to what the block imposes. */
const roundTime = (
  block: SessionBlock
): { workSeconds?: number; restSeconds?: number } => {
  // Tabata / On-Off: work and rest are both prescribed, to the second.
  if (blockSupportsRepsOnly(block.type)) {
    return { workSeconds: block.workDuration, restSeconds: block.restDuration };
  }
  // EMOM / Every: the interval is the budget for the whole round. It is one
  // minute unless stated otherwise — that is what "EMOM" means.
  return { workSeconds: (block.intervalMinutes ?? 1) * 60 };
};

/**
 * A movement's dose for *one* round — without the "n ×".
 *
 * The total is carried by "Round 3 / 10": repeating it on every line would
 * read as "10 × 15 reps" to someone who only has one round to do.
 */
export const roundDose = (block: SessionBlock, ex: BlockExercise): string => {
  if (ex.reps) return `${ex.reps} reps`;
  if (ex.duration) return formatDuration(ex.duration);
  if (ex.customMetric)
    return `${ex.customMetric.value} ${ex.customMetric.unit}`;
  // Tabata / On-Off: with no prescribed reps, the dose is the block's work
  // time — that is what says how much of it you do.
  if (blockSupportsRepsOnly(block.type) && block.workDuration !== undefined)
    return formatDuration(block.workDuration);
  return '';
};

/**
 * The prescribed repetitions for one set, as a number.
 *
 * A pyramid varies them from rung to rung — that is its whole principle;
 * everywhere else every set carries the same dose.
 */
export const repsOfSet = (
  block: Pick<SessionBlock, 'type' | 'repsScheme'>,
  ex: Pick<BlockExercise, 'reps'>,
  rank: number
): number | undefined => {
  if (blockDefinesOwnMetrics(block.type) && block.repsScheme?.length)
    return block.repsScheme[rank - 1];
  return ex.reps;
};

/**
 * A list block's sets, in the order they are done.
 *
 * The breakdown already existed — `prescribedSetLabels` gives it, and it has
 * always been what splits the wrap-up form. It simply was not used to guide:
 * we showed it, we did not walk it.
 */
export const setsOfBlock = (block: SessionBlock): GuidedSet[] => {
  const sets: GuidedSet[] = [];
  sortByOrder(block.exercises).forEach((ex) => {
    const rungs = prescribedSetLabels(block, ex);
    const own = roundDose(block, ex);
    // A pyramid prescribes a rest between its rungs, a set-based block
    // between its sets: it is the same moment under two names.
    const rest = blockDefinesOwnMetrics(block.type)
      ? block.restBetweenRounds
      : restBetweenSetsOf(block, ex);
    rungs.forEach((label, i) => {
      sets.push({
        key: `${block.order}:${ex.order}:${i + 1}`,
        blockOrder: block.order,
        exerciseOrder: ex.order,
        rank: i + 1,
        total: rungs.length,
        name: ex.exercise.name,
        // The rung carries its own dose; elsewhere it is the exercise's.
        dose: label || own,
        reps: repsOfSet(block, ex, i + 1),
        // No rest after the last one: the next exercise comes then, and the
        // coach prescribed nothing for that gap.
        restAfter: i < rungs.length - 1 ? rest : undefined,
        exercise: ex,
      });
    });
  });
  return sets;
};

export function buildGuidedSteps(session: Session): GuidedStep[] {
  const steps: GuidedStep[] = [];
  const sortedBlocks = sortByOrder(session.blocks);

  sortedBlocks.forEach((block, blockIndex) => {
    const blockLabel = getBlockLabel(block.type);
    const exercises = sortByOrder(block.exercises);
    const nextBlock = sortedBlocks[blockIndex + 1];
    const nextBlockFirstExerciseName =
      nextBlock?.exercises[0]?.exercise.name ?? null;

    // The shape follows the block. A rhythm led by a timer unfolds round by
    // round, the clock in the middle of the screen and your hands busy.
    // Everything else is a list, and reads as one.
    const timed =
      ROUND_BASED_TYPES.includes(block.type) && (block.rounds ?? 1) > 1;

    let blockSteps: GuidedStep[];

    if (timed) {
      const rounds = block.rounds ?? 1;
      const { workSeconds, restSeconds } = roundTime(block);
      blockSteps = Array.from({ length: rounds }, (_, i) => ({
        type: 'round' as const,
        blockLabel,
        block,
        round: i + 1,
        rounds,
        exercises,
        workSeconds,
        restSeconds,
        // While rounds remain, the counter is enough to say what comes next.
        nextLabel:
          i === rounds - 1
            ? nextBlock
              ? getBlockLabel(nextBlock.type)
              : null
            : null,
      }));
    } else {
      // An AMRAP is not ticked off: you loop the list until time runs out,
      // and what counts is the number of rounds. Everything else — classic,
      // pyramid, chipper, warm-up — is a series of sets done one by one.
      const shape = block.type === 'amrap' ? 'loop' : 'list';
      blockSteps = [
        {
          type: 'block',
          blockLabel,
          block,
          shape,
          sets: shape === 'list' ? setsOfBlock(block) : [],
        },
      ];
    }

    steps.push(...blockSteps);

    // Rest between two blocks: only when the coach actually defined a
    // duration, never an invented value. A timed block already carries its
    // rest inside its rounds — adding another would recreate the phantom
    // minute we just removed.
    const isLastBlock = blockIndex === sortedBlocks.length - 1;
    const interBlockRest = timed
      ? undefined
      : (block.restDuration ?? block.restBetweenRounds);

    if (!isLastBlock && interBlockRest) {
      // This rest is the tail of the block that has just ended — it is its
      // own duration — so it counts in that block's progress, not the next.
      steps.push({
        type: 'rest',
        blockLabel,
        duration: interBlockRest,
        nextExerciseName: nextBlockFirstExerciseName,
      });
    }
  });

  // A session does not end on a rest: the last round of the last block is
  // done, there is nothing left to catch your breath before.
  while (steps[steps.length - 1]?.type === 'rest') {
    steps.pop();
  }

  return steps;
}
