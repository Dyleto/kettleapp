/**
 * Un lien d'invitation collé à la main, dans la feuille « J'ai reçu une
 * invitation » de la connexion.
 *
 * Le client qui l'a perdu de vue dans sa messagerie le recopie ; on en tire
 * le jeton et l'on ouvre l'écran d'invitation, qui fait le reste — vérifier
 * le jeton auprès du serveur, nommer le coach, créer le compte.
 */

/**
 * Le jeton d'un lien d'invitation, ou `null` si le texte n'en a pas l'air.
 *
 * L'adresse peut venir sans `https://` — une messagerie l'affiche souvent
 * ainsi — et de n'importe quel hôte : un lien de la version de production
 * ouvert sur une autre doit mener au même jeton. Le jeton se reconnaît à sa
 * forme (de l'hexadécimal, seize caractères au moins) sans exiger sa
 * longueur complète : un lien coupé en route mène à l'écran qui dit « Ce
 * lien ne marche plus » et quoi faire, plutôt qu'à un bouton qui ne
 * s'active pas sans dire pourquoi.
 */
export const invitationTokenFrom = (text: string): string | null => {
  const value = text.trim();
  if (!value || /\s/.test(value)) return null;
  let url: URL;
  try {
    url = new URL(/^[a-z]+:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  if (!url.pathname.replace(/\/+$/, '').endsWith('/join')) return null;
  const token = url.searchParams.get('token') ?? '';
  return /^[0-9a-f]{16,}$/i.test(token) ? token : null;
};
