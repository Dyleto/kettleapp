/**
 * Counting sessions, and saying what is being counted.
 *
 * Two screens showed a number of sessions done, with the same word and two
 * different meanings:
 *
 *   "Mon programme"  →  "3 complétées"   — three of the programme's sessions
 *                                           have been done at least once
 *                                           (the three cards marked
 *                                           "Terminée")
 *   "Mon journal"    →  "12 séances complétées" — twelve occurrences
 *
 * Neither was wrong, and the gap is not an edge case: a programme repeats
 * every week, so from the second week the two numbers diverge for everyone. A
 * client who reads "3" then "12" concludes that one of the screens is lying.
 *
 * So both sentences live here, side by side, and each says what it covers: a
 * proportion of the programme on one hand, a running total on the other. A
 * proportion cannot be read as a total — which is what stops the confusion
 * coming back.
 */

/** "3 séances sur 5 déjà faites" — how much of the programme is covered. */
export const avancementProgramme = (faites: number, total: number): string => {
  if (faites === 0) {
    return `${total} séance${total > 1 ? 's' : ''} · aucune encore faite`;
  }
  return `${faites} séance${faites > 1 ? 's' : ''} sur ${total} déjà faite${
    faites > 1 ? 's' : ''
  }`;
};

/** "12 séances faites depuis le début" — the journal's running total. */
export const cumulRealisations = (realisations: number): string =>
  `${realisations} séance${realisations > 1 ? 's' : ''} faite${
    realisations > 1 ? 's' : ''
  } depuis le début`;
