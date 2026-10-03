/**
 * Le lien d'invitation : une seule définition de son adresse, et un seul
 * chemin pour le faire sortir de l'application.
 *
 * Deux endroits le fabriquaient à partir d'un jeton, ce qui ne tenait qu'aussi
 * longtemps que l'un des deux servait.
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

/** Ce qu'une tentative de faire sortir le lien a donné. */
export type LinkDelivery = 'shared' | 'copied' | 'cancelled' | 'failed';

/**
 * Faire sortir le lien de l'application, par le meilleur chemin disponible.
 *
 * Un coach n'a jamais besoin d'un lien dans son presse-papiers : il a besoin
 * de l'envoyer à quelqu'un. Là où le téléphone sait le faire — la feuille de
 * partage d'Android et d'iOS — c'est elle qui doit s'ouvrir, et le coach
 * atterrit dans WhatsApp au lieu de chercher où coller.
 *
 * Les deux chemins exigent une « activation transitoire » : le navigateur
 * n'autorise ni le partage ni l'écriture dans le presse-papiers passé un
 * certain temps après le clic. Un aller-retour réseau suffit à la perdre sur
 * Safari. D'où la règle d'appel : n'appeler ceci qu'avec un lien déjà en
 * main, jamais après un `await` sur le réseau — et traiter `'failed'` comme
 * un cas normal, pas comme une erreur.
 *
 * `'cancelled'` n'est pas un échec : c'est le coach qui referme la feuille de
 * partage, et rien ne doit le lui reprocher.
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
      // Partage refusé (activation perdue, ou une plateforme qui l'annonce
      // sans le servir) : on se rabat sur le presse-papiers plutôt que
      // d'abandonner.
    }
  }
  try {
    await navigator.clipboard.writeText(link);
    return 'copied';
  } catch {
    return 'failed';
  }
};
