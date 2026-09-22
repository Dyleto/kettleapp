/**
 * How durations are written, at a single address.
 *
 * This module imports nothing, and that is the point: `utils/formatters`
 * needs the block constants, and the block constants need to write durations.
 * Housing the rule in either created a cycle — and a cycle here would have
 * ended in a second copy of the rule.
 */

/**
 * A prescribed duration, in the app's single convention.
 *
 * Four spellings existed for the same quantity — "2min", "1min", "120 s",
 * "119s" — two of them on the same screen. The coach could not rely on what
 * they read to know what their client would read.
 *
 * The rule: under a minute, bare seconds; above, minutes, and the leftover
 * second only when there is one. Always a non-breaking space before the unit
 * — "45" and "s" do not split at the end of a line, and a number glued to its
 * letter reads as a word.
 */
const NBSP = '\u00A0';

export const formatDuration = (seconds: number): string => {
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return `${total}${NBSP}s`;

  const minutes = Math.floor(total / 60);
  const reste = total % 60;

  if (minutes < 60) {
    return reste === 0
      ? `${minutes}${NBSP}min`
      : `${minutes}${NBSP}min${NBSP}${reste}${NBSP}s`;
  }

  const heures = Math.floor(minutes / 60);
  const mins = minutes % 60;
  // "1 h 1" reads badly; an hour is spoken with its two digits of minutes.
  return mins === 0
    ? `${heures}${NBSP}h`
    : `${heures}${NBSP}h${NBSP}${String(mins).padStart(2, '0')}`;
};

/**
 * The same quantity, but running.
 *
 * The only exception allowed to the rule above, and for a reason: a stopwatch
 * in the gym answers "how much do I have left", and "119 s" forces mental
 * division mid-effort. Above a minute we therefore write m:ss, the convention
 * of every stopwatch; below, `formatDuration` itself, so the two spellings
 * meet where they can.
 */
export const formatCountdown = (seconds: number): string => {
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return formatDuration(total);
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, '0')}`;
};
