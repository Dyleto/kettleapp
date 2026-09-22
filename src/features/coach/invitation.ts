/**
 * The invitation link: a single definition of its address, and a single path
 * for getting it out of the application.
 *
 * Two places used to build it from a token, which only held up as long as
 * one of the two was in use.
 */
export const invitationLink = (token: string) =>
  `${window.location.origin}/join?token=${token}`;

/** "Valable jusqu'au 24 septembre". Empty when the expiry is unknown. */
export const linkExpiry = (expiresAt?: string) =>
  expiresAt
    ? `Valable jusqu'au ${new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
      }).format(new Date(expiresAt))}.`
    : '';

/** What an attempt at sending the link out came to. */
export type LinkDelivery = 'shared' | 'copied' | 'cancelled' | 'failed';

/**
 * Get the link out of the application, by the best path available.
 *
 * A coach never needs a link in their clipboard: they need to send it to
 * someone. Where the phone knows how to do that — the Android and iOS share
 * sheet — that is what should open, and the coach ends up in WhatsApp
 * instead of hunting for somewhere to paste.
 *
 * Both paths require "transient activation": the browser allows neither
 * sharing nor writing to the clipboard once too much time has passed since
 * the click. One network round-trip is enough to lose it on Safari. Hence
 * the calling rule: only call this with a link already in hand, never after
 * an `await` on the network — and treat `'failed'` as a normal case, not as
 * an error.
 *
 * `'cancelled'` is not a failure: it is the coach closing the share sheet
 * again, and nothing should hold it against them.
 */
export const deliverLink = async (link: string): Promise<LinkDelivery> => {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: 'Rejoindre mon suivi sur Kettle',
        url: link,
      });
      return 'shared';
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return 'cancelled';
      // Share refused (activation lost, or a platform that advertises it
      // without serving it): we fall back to the clipboard rather than
      // giving up.
    }
  }
  try {
    await navigator.clipboard.writeText(link);
    return 'copied';
  } catch {
    return 'failed';
  }
};
