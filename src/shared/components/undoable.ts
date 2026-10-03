import { toaster } from '@/shared/components/ui/toasterInstance';

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
export const undoable = ({
  title,
  description,
  undo,
}: {
  /** What has just happened, in the past tense: "Corde à sauter retiré". */
  title: string;
  description?: string;
  /** Remet l'état précédent. Appelé au plus une fois. */
  undo: () => void;
}) => {
  let taken = false;
  toaster.create({
    title: title,
    description,
    // Plus long qu'un message ordinaire : on ne lit pas un bandeau au moment
    // où il apparaît, on le lit à la seconde où l'on réalise son erreur.
    duration: 8000,
    action: {
      label: 'Annuler',
      onClick: () => {
        // Chakra ferme la bannière au clic, et un clic sur le fond la ferme
        // aussi : sans ce verrou, un doigt malchanceux pourrait rejouer
        // l'annulation et remettre deux fois l'exercice retiré.
        if (taken) return;
        taken = true;
        undo();
      },
    },
  });
};
