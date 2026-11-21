/**
 * Le lien d'invitation : une seule définition de son adresse.
 *
 * Deux endroits le fabriquaient à partir d'un jeton, ce qui ne tenait qu'aussi
 * longtemps que l'un des deux servait.
 */
export const invitationLink = (token: string) =>
  `${window.location.origin}/join?token=${token}`;

/** « Valable jusqu'au 24 septembre ». Vide quand l'échéance est inconnue. */
export const linkExpiry = (expiresAt?: string) =>
  expiresAt
    ? `Valable jusqu’au ${new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
      }).format(new Date(expiresAt))}.`
    : '';
