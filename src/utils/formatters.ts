import {
  blockSupportsRepsOnly,
  blockSupportsSets,
  blockDefinesOwnMetrics,
} from '@/features/program/constants';
import { BlockExercise, BlockType, SessionBlock } from '@/types';
import { formatDuration } from './duration';

/**
 * Strips accents and diacritics from a string (é→e, à→a, ç→c…).
 */
export const stripAccents = (str: string): string =>
  str.normalize('NFD').replace(/[̀-ͯ]/g, '');

export { formatCountdown, formatDuration } from './duration';

/**
 * An exercise's prescription, as it shows to the right of its name.
 *
 * `block` is optional for callers that only have the type, but providing it
 * changes how Tabata / On-Off blocks render: their work is defined once for
 * the whole block (`workDuration`) and not on each exercise. Without it these
 * lines showed bare while guided mode showed "20s" — the same data read two
 * ways depending on the screen.
 */
export const formatExerciseMetric = (
  ex: BlockExercise,
  blockType: BlockType,
  block?: Pick<SessionBlock, 'workDuration' | 'repsScheme'>
): string => {
  /*
   * What the line asks for, when it is the block that says it.
   *
   * From the UX audit: a pyramid showed "PYRAMIDE 2-4-6-8-6-4-2" then "Goblet
   * Squat" with the right column EMPTY — the very column the client scans to
   * know what is being asked. With one exercise you can guess; with three,
   * not at all.
   *
   * Those blocks hold their rungs on the block and not on the exercise
   * (`blockDefinesOwnMetrics`), so the line had nothing to write. It now
   * writes the series, where the others write "15 reps".
   */
  const paliers =
    blockDefinesOwnMetrics(blockType) && block?.repsScheme?.length
      ? `${block.repsScheme.join('\u00B7')}\u00A0reps`
      : '';

  const fallback =
    paliers ||
    (blockSupportsRepsOnly(blockType) && block?.workDuration !== undefined
      ? formatDuration(block.workDuration)
      : '');

  // Same rule as for durations: a non-breaking space before the unit. A
  // number split from its letter at the end of a line is read twice.
  const effort = ex.reps
    ? `${ex.reps}\u00A0reps`
    : ex.duration
      ? formatDuration(ex.duration)
      : ex.customMetric
        ? `${ex.customMetric.value}\u00A0${ex.customMetric.unit}`
        : fallback;

  if (!effort) return '';
  if (blockSupportsSets(blockType) && ex.sets && ex.sets > 1) {
    return `${ex.sets} × ${effort}`;
  }
  return effort;
};
