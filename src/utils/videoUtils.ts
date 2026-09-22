/**
 * Reading an exercise's video link.
 *
 * Only YouTube is read. Vimeo was accepted on input by one function and
 * refused on display by another: the coach saved their link, validation let
 * it through, then the card showed "Lien YouTube non reconnu". Two parsers
 * for the same URL, and they disagreed.
 *
 * There is only one now. What is accepted is exactly what is read.
 */
export interface YouTubeVideo {
  id: string;
  /** A Short plays vertically on a phone. */
  isShort: boolean;
}

export const parseYouTubeUrl = (url: string): YouTubeVideo | null => {
  if (!url?.trim()) return null;

  // Shorts first: their address contains `/shorts/`, which the general
  // pattern does not recognise.
  const shorts = url.match(/youtube\.com\/shorts\/([^"&?/\s]+)/);
  if (shorts) return { id: shorts[1], isShort: true };

  const standard = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  );
  if (standard) return { id: standard[1], isShort: false };

  return null;
};
