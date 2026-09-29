import { useEffect, useRef } from 'react';

/** The mark left in history, and the only word identifying our landmarks. */
const REPERE = 'kettleCouche';

/**
 * The phone's back button closes the top layer instead of leaving the page.
 *
 * On Android, hardware back is the universal undo gesture: you open a drawer,
 * you get it wrong, you press back. None of the app's layers put a landmark
 * in history — so back found nothing to undo above the page, and left the
 * page. A coach in the middle of a session ended up on their client list, and
 * experienced it as a cancellation.
 *
 * The remedy is one history entry. On opening we push a landmark without
 * changing address — the route does not move, nothing reloads. Back consumes
 * it, `popstate` fires, and we close.
 *
 * The existing state is copied rather than overwritten: the router keeps its
 * own position marker there, and taking it away would make it lose track of
 * its own back-and-forth.
 *
 * Closing by another path — the cross, a click outside, a choice made — has
 * to remove that landmark, otherwise it would take two backs to leave a page
 * whose layer is already closed. Hence the `history.back()` on cleanup,
 * conditional on the landmark still being there: when back is what closed, it
 * has already been consumed and there is nothing to remove.
 */
export const useBackDismiss = (isOpen: boolean, onDismiss: () => void) => {
  // The close handler is read back at the moment back happens, not frozen on
  // opening: the parent may re-render in between.
  const fermeture = useRef(onDismiss);
  useEffect(() => {
    fermeture.current = onDismiss;
  });

  useEffect(() => {
    if (!isOpen) return;

    window.history.pushState({ ...window.history.state, [REPERE]: true }, '');

    const surRetour = () => fermeture.current();
    window.addEventListener('popstate', surRetour);

    return () => {
      window.removeEventListener('popstate', surRetour);
      // The landmark is still there: this is an ordinary close, and it is
      // up to us to remove it. The listener is already detached, so this back
      // will call nobody.
      if (window.history.state?.[REPERE]) window.history.back();
    };
  }, [isOpen]);
};
