/**
 * Counting sessions, and saying what is being counted.
 *
 * Two screens used to show a number of sessions done, with the same word and
 * two different meanings: "Mon programme" counted how many of the
 * programme's sessions had been done at least once, "Mon journal" counted
 * occurrences. A programme repeats every week, so from the second week the
 * two numbers diverge for everyone, and a client reading "3" then "12"
 * concludes one of the screens is lying.
 *
 * The programme's proportion is gone — it answered a question nobody asked,
 * and it was built on an id that survives an edit, so it could read "7
 * séances sur 2 déjà faites" once the coach had reworked the programme. Each
 * session now says when it was last done. Only the running total is left,
 * and it names what it covers.
 */

/** "12 séances faites depuis le début" — the journal's running total. */
export const lifetimeTotal = (completions: number): string =>
  `${completions} séance${completions > 1 ? 's' : ''} faite${
    completions > 1 ? 's' : ''
  } depuis le début`;
