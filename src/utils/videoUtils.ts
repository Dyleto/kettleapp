/**
 * Lecture d'un lien vidéo d'exercice.
 *
 * Seul YouTube est lu. Vimeo était accepté à la saisie par une fonction, et
 * refusé à l'affichage par une autre : le coach enregistrait son lien, la
 * validation le laissait passer, puis sa fiche affichait « Lien YouTube non
 * reconnu ». Deux analyseurs pour la même URL, qui n'étaient pas d'accord.
 *
 * Il n'y en a plus qu'un. Ce qui est accepté est exactement ce qui se lit.
 */
export interface YouTubeVideo {
  id: string;
  /** Un Short se lit en vertical sur téléphone. */
  isShort: boolean;
}

export const parseYouTubeUrl = (url: string): YouTubeVideo | null => {
  if (!url?.trim()) return null;

  // Shorts d'abord : leur adresse contient `/shorts/`, que le motif général
  // ne reconnaît pas.
  const shorts = url.match(/youtube\.com\/shorts\/([^"&?/\s]+)/);
  if (shorts) return { id: shorts[1], isShort: true };

  const standard = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  );
  if (standard) return { id: standard[1], isShort: false };

  return null;
};
