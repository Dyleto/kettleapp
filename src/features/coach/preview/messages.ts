import type { Session } from '@/shared/types';

/**
 * Ce que l'atelier et son aperçu se disent, d'une fenêtre à l'autre.
 *
 * L'aperçu vit dans une iframe : c'est la seule façon de lui donner la
 * taille d'un téléphone. Les scènes de la séance guidée lisent la taille de
 * la fenêtre — 59 fois —, et rendues dans un cadre réduit de l'écran du
 * coach, elles prenaient leur mise en page large : le coach aurait relu un
 * écran que son client ne voit jamais.
 */

/** L'atelier envoie la séance et le bloc à montrer. */
export interface PreviewMessage {
  type: 'kettle:preview';
  session: Session;
  blockOrder: number;
}

/** L'aperçu dit qu'il écoute : l'atelier lui renvoie alors ce qu'il a. Sans
 * cela, un premier envoi parti avant que l'iframe ait chargé se perdait. */
export interface PreviewReady {
  type: 'kettle:preview-ready';
}

export const isPreviewMessage = (data: unknown): data is PreviewMessage =>
  typeof data === 'object' &&
  data !== null &&
  (data as { type?: unknown }).type === 'kettle:preview';

export const isPreviewReady = (data: unknown): data is PreviewReady =>
  typeof data === 'object' &&
  data !== null &&
  (data as { type?: unknown }).type === 'kettle:preview-ready';
