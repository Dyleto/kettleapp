import { toaster } from '@/components/ui/toasterInstance';

/**
 * The undo safety net: the action goes through, and can be taken back.
 *
 * Kettle protected its deletions by asking first — "Supprimer la séance 3 ?".
 * That is a question asked a hundred times for the two occasions someone got
 * it wrong, and it only covers what was thought of: removing an exercise, the
 * editor's most frequent gesture, asked nothing at all.
 *
 * The net reverses the logic. The action happens at once, and a banner stays
 * a few seconds with the means to take it back. Free when you were right,
 * recoverable when you were wrong.
 *
 * This is not a pending deletion, and the difference matters: in the editor a
 * deletion is a structural change, so it goes to the server within the
 * second. Closing the app leaves nothing hanging — the deletion holds, which
 * is what the gesture said. "Annuler" does not wait, it puts the previous
 * state back, and autosave sends it like any other change.
 *
 * Hence the only rule to respect when using it: do the action first, call
 * this second, and provide the means to rebuild — never the means to
 * "confirm".
 */
export const annulable = ({
  titre,
  description,
  annuler,
}: {
  /** What has just happened, in the past tense: "Corde à sauter retiré". */
  titre: string;
  description?: string;
  /** Puts the previous state back. Called at most once. */
  annuler: () => void;
}) => {
  let repris = false;
  toaster.create({
    title: titre,
    description,
    // Longer than an ordinary message: you do not read a banner at the
    // moment it appears, you read it the second you realise your mistake.
    duration: 8000,
    action: {
      label: 'Annuler',
      onClick: () => {
        // Chakra closes the banner on click, and a click on the background
        // closes it too: without this lock, an unlucky finger could replay
        // the undo and put the removed exercise back twice.
        if (repris) return;
        repris = true;
        annuler();
      },
    },
  });
};
