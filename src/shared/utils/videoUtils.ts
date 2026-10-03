/**
 * La lecture du lien vidéo d'un exercice.
 *
 * Seul YouTube est lu. Vimeo était accepté à la saisie par une fonction et
 * refusé à l'affichage par une autre : le coach enregistrait son lien, la
 * validation le laissait passer, puis la carte affichait « Lien YouTube non
 * reconnu ». Deux analyseurs pour la même URL, et ils n'étaient pas
 * d'accord.
 *
 * Il n'y en a plus qu'un. Ce qui est accepté est exactement ce qui est lu.
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
