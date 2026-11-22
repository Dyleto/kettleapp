/**
 * La lecture d'une URL YouTube.
 *
 * Elle ne décide pas seule de ce qu'un lien vaut : `readVideoLink`
 * (domaine des exercices) l'appelle en premier, puis accepte toute autre
 * adresse, qui s'ouvre ailleurs. C'est cette fonction-là que la saisie et
 * l'affichage partagent — deux analyseurs pour la même URL avaient laissé
 * Vimeo accepté à la saisie et refusé à l'affichage.
 */
export interface YouTubeVideo {
  id: string;
  /** Un Short se joue à la verticale : le cadre de lecture n'est pas le
   * même, et le deviner d'après l'URL évite de demander à l'API YouTube. */
  isShort: boolean;
}

/**
 * L'unique lecture d'une URL YouTube — saisie comme affichage.
 *
 * Renvoie `null` plutôt que de lever : un lien invalide est une saisie
 * ordinaire, et l'appelant en fait un message plutôt qu'un écran d'erreur.
 */
export const parseYouTubeUrl = (url: string): YouTubeVideo | null => {
  if (!url?.trim()) return null;

  // Les Shorts d'abord : leur adresse contient `/shorts/`, que le motif
  // général ne reconnaît pas.
  const shorts = url.match(/youtube\.com\/shorts\/([^"&?/\s]+)/);
  if (shorts) return { id: shorts[1], isShort: true };

  const standard = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  );
  if (standard) return { id: standard[1], isShort: false };

  return null;
};
