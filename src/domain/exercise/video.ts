import { parseYouTubeUrl, type YouTubeVideo } from '@/shared/utils/videoUtils';

/**
 * Le lien vidéo d'un exercice, lu une fois pour la saisie comme pour
 * l'affichage.
 *
 * Seul YouTube était accepté. Vimeo l'avait été par une fonction et refusé
 * par une autre — le coach enregistrait son lien, puis la fiche affichait
 * « Lien YouTube non reconnu » —, et la règle était devenue : un seul
 * analyseur, qui ne lit que YouTube. La maquette veut davantage, sans
 * revenir à deux lectures : YouTube se joue dans la fiche, tout autre
 * adresse s'ouvre ailleurs par « Ouvrir la vidéo ». Ce qui est accepté à la
 * saisie est encore exactement ce qui s'affiche.
 */
export type VideoLink =
  ({ kind: 'youtube' } & YouTubeVideo) | { kind: 'link'; url: string };

/** Une adresse web : un schéma, puis un hôte qui porte un point. */
const WEB_ADDRESS = /^https?:\/\/[^\s/.]+(\.[^\s/.]+)+(\/\S*)?$/i;

/**
 * Lire un lien : YouTube, une autre adresse, ou rien. `null` pour un lien
 * vide comme pour un lien illisible — l'affichage n'a rien à montrer dans
 * les deux cas ; la saisie, elle, distingue avec `videoLinkError`.
 */
export const readVideoLink = (url?: string): VideoLink | null => {
  const value = url?.trim();
  if (!value) return null;
  const youtube = parseYouTubeUrl(value);
  if (youtube) return { kind: 'youtube', ...youtube };
  return WEB_ADDRESS.test(value) ? { kind: 'link', url: value } : null;
};

/**
 * Le refus d'un lien saisi, ou `null` s'il passe. Vider le champ passe :
 * c'est retirer la vidéo.
 *
 * Un lien illisible était enregistré, et le coach découvrait plus tard que
 * sa vidéo ne s'ouvrait pas ; il est refusé à la saisie, en disant pourquoi.
 */
export const videoLinkError = (value: string): string | null =>
  value.trim() === '' || readVideoLink(value)
    ? null
    : 'Ce lien ne ressemble pas à une adresse.';
