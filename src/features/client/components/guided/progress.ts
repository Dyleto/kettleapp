import { type GuidedStep } from '../../guidedSteps';
import { writeProgress, readProgress } from '../../sessionProgress';

// This is the only screen used while training, the one where losing your
// place is least affordable: an incoming call, or a screen locked too long,
// must not send you back to step 1 of a session that has forty.
//
// The position joins the loads in a single durable record — see
// `sessionProgress`. They used to be separate, filed in two memories with
// different lifetimes: the app kept what can be found again and lost what
// cannot.
export const readSavedIndex = (sessionId: string): number =>
  readProgress(sessionId)?.step ?? 0;

export const writeSavedIndex = (sessionId: string, index: number) =>
  writeProgress(sessionId, { step: index });

/**
 * The steps grouped by block, in order.
 *
 * Thirty two-pixel dashes cannot be read: you know neither where you are nor
 * how much is left. Three segments — warm-up, EMOM, AMRAP — read at a glance,
 * and the client reasons in blocks, not in pages.
 *
 * Each segment's width follows its step count: a twelve-page EMOM is wider
 * than a two-page warm-up. Equal segments would lie about what is left.
 */
/**
 * What a step weighs in the bar: the time it asks for.
 *
 * It used to weigh pages, and it lied by a factor of ten. Measured on the
 * test session: the twelve-minute AMRAP got 24 px, the EMOM 239 — the bar
 * announced the session was 85 % done by the end of the EMOM, when in lived
 * time the two blocks are even. A client looking at it after the EMOM thought
 * they had finished.
 *
 * The coach gives the duration where it is part of the format: a round's
 * interval, an AMRAP's length. We take it as given. Elsewhere — a set, a rung
 * — they do not give it, and we count one minute per set. That is an
 * approximation, and a deliberate one: an EMOM interval IS a minute, and a
 * set with its rest is worth about as much. It is infinitely better than
 * counting how many times someone taps "Suivant".
 */
export const weightOf = (step: GuidedStep): number => {
  if (step.type === 'rest') return step.duration / 60;
  if (step.type === 'round')
    return (step.workSeconds ?? 60) / 60 + (step.restSeconds ?? 0) / 60;
  // A loop carries its duration; a list, its sets.
  if (step.shape === 'loop')
    return Math.max(1, step.block.durationMinutes ?? step.sets.length);
  return Math.max(1, step.sets.length);
};

export const splitIntoBlockRuns = (steps: GuidedStep[]) => {
  const blockRuns: {
    label: string;
    start: number;
    /** Number of steps — what makes the fill advance. */
    size: number;
    /** What the block represents — what makes the segment's width. */
    weight: number;
  }[] = [];
  steps.forEach((step, i) => {
    const dernier = blockRuns[blockRuns.length - 1];
    if (dernier && dernier.label === step.blockLabel) {
      dernier.size += 1;
      dernier.weight += weightOf(step);
      return;
    }
    blockRuns.push({
      label: step.blockLabel,
      start: i,
      size: 1,
      weight: weightOf(step),
    });
  });
  return blockRuns;
};
