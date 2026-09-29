/**
 * What a session is called, at a single address.
 *
 * A session repeats, and its rank repeated with it: a client read "Séance 1 ·
 * Séance 1 · Séance 1" in their history, the coach the same in the journal,
 * and the editor's rail lined up five anonymous S1…S5. The rank says where
 * the session sits in the programme, never what it contains.
 *
 * The name does not replace the rank, it adds to it: "Séance 2 — Haut du
 * corps". Order still matters — it is the session you do after the first —
 * and a coach who named nothing loses nothing.
 *
 * Eight screens wrote this title each on their own. They now all write it
 * here, so that the day the rule changes, it changes once.
 */

/** "Séance 2" or "Séance 2 — Haut du corps". */
export const sessionTitle = (order: number, name?: string): string => {
  const libre = name?.trim();
  return libre ? `Séance ${order} — ${libre}` : `Séance ${order}`;
};

/**
 * Les deux moitiés, quand un écran veut les dessiner séparément — le rang en
 * gras, le nom en retrait, comme un bloc et son nom libre.
 */
export const sessionTitleParts = (
  order: number,
  name?: string
): { rang: string; libre?: string } => ({
  rang: `Séance ${order}`,
  libre: name?.trim() || undefined,
});
