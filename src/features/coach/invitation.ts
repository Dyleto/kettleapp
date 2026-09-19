/**
 * Le lien d'invitation : une seule définition de son adresse, et un seul
 * chemin pour le faire sortir de l'application.
 *
 * Deux endroits le fabriquaient à partir d'un jeton, ce qui n'a tenu que tant
 * qu'un seul des deux servait.
 */
export const lienInvitation = (token: string) =>
  `${window.location.origin}/join?token=${token}`;

/** « Valable jusqu'au 24 septembre ». Vide si l'échéance est inconnue. */
export const echeanceLien = (expiresAt?: string) =>
  expiresAt
    ? `Valable jusqu'au ${new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
      }).format(new Date(expiresAt))}.`
    : '';

/** Ce qu'a donné une tentative de sortie du lien. */
export type SortieLien = 'partage' | 'copie' | 'annule' | 'echec';

/**
 * Faire sortir le lien de l'application, par le meilleur chemin disponible.
 *
 * Un coach n'a jamais besoin d'un lien dans son presse-papier : il a besoin
 * de l'envoyer à quelqu'un. Là où le téléphone sait le faire — la feuille de
 * partage d'Android et d'iOS —, c'est elle qui doit s'ouvrir, et le coach
 * finit dans WhatsApp au lieu de chercher où coller.
 *
 * Les deux chemins demandent une « activation transitoire » : le navigateur
 * n'autorise ni le partage ni l'écriture dans le presse-papier si trop de
 * temps s'est écoulé depuis le clic. Un aller-retour réseau suffit à la
 * perdre sur Safari. D'où la règle d'appel : n'appeler ceci qu'avec un lien
 * déjà en main, jamais après un `await` sur le réseau — et traiter `'echec'`
 * comme un cas normal, pas comme une erreur.
 *
 * `'annule'` n'est pas un échec : c'est le coach qui a refermé la feuille de
 * partage, et rien ne doit le lui reprocher.
 */
export const sortirLien = async (lien: string): Promise<SortieLien> => {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: 'Rejoindre mon suivi sur Kettle',
        url: lien,
      });
      return 'partage';
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return 'annule';
      // Partage refusé (activation perdue, plateforme qui l'annonce sans le
      // servir) : on retombe sur le presse-papier plutôt que d'abandonner.
    }
  }
  try {
    await navigator.clipboard.writeText(lien);
    return 'copie';
  } catch {
    return 'echec';
  }
};
