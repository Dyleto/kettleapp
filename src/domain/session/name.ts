import type { Session } from '@/shared/types';

/**
 * Comment s'appelle une séance, à une seule adresse.
 *
 * Une séance se répète, et son rang se répétait avec elle : un client lisait
 * « Séance 1 · Séance 1 · Séance 1 » dans son historique, le coach la même
 * chose dans le journal, et le rail de l'éditeur alignait cinq S1…S5
 * anonymes. Le rang dit où la séance se trouve dans le programme, jamais ce
 * qu'elle contient.
 *
 * Il y a eu ensuite deux noms : « Séance 2 — Haut du corps » dans
 * l'historique, le journal et la fin de séance, « Haut du corps » sur
 * l'accueil et à l'ouverture. La maquette n'en garde qu'un, le nom que le
 * coach a donné : le rang se pose à côté de lui, là où l'ordre compte — le
 * rail du coach, le sur-titre de l'ouverture —, jamais devant.
 */

/** Le nom que le coach a donné, sinon le rang : « Haut du corps »,
 * « Séance 3 ». Un coach qui n'a rien nommé ne perd rien. */
export const sessionName = (session: Pick<Session, 'order' | 'name'>): string =>
  session.name?.trim() || sessionRank(session.order);

/** « Séance 2 » : la place dans le programme, pour les écrans qui la posent
 * à côté du nom. */
export const sessionRank = (order: number): string => `Séance ${order}`;
