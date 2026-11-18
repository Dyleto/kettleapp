/**
 * Le texte d'un compteur de navigation, ou rien.
 *
 * Zéro ne s'affiche pas : une pastille « 0 » attire l'œil vers ce qui ne
 * demande rien. Au-delà de 99, « 99+ » : la pastille tient dans un cercle de
 * 17 px sur téléphone, et un coach qui a cent séances à lire n'a pas besoin
 * du chiffre exact pour savoir où regarder.
 */
export const countLabel = (count: number | undefined): string | null => {
  if (count === undefined || !Number.isFinite(count) || count < 1) return null;
  return count > 99 ? '99+' : String(Math.floor(count));
};
