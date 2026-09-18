/**
 * Comment une séance s'appelle, à une seule adresse.
 *
 * Une séance se répète, et son rang se répétait avec elle : un client lisait
 * « Séance 1 · Séance 1 · Séance 1 » dans son historique, le coach la même
 * chose dans le journal, et le rail de l'atelier alignait cinq S1…S5 anonymes.
 * Le rang dit où la séance se trouve dans le programme, jamais ce qu'elle
 * contient.
 *
 * Le nom ne remplace pas le rang, il s'y ajoute : « Séance 2 — Haut du corps ».
 * L'ordre compte encore — c'est la séance qu'on fait après la 1 — et un coach
 * qui n'a rien nommé ne perd rien.
 *
 * Huit écrans écrivaient ce titre chacun de leur côté. Ils l'écrivent
 * maintenant tous ici, pour que le jour où la règle change, elle change une
 * fois.
 */

/** « Séance 2 » ou « Séance 2 — Haut du corps ». */
export const sessionTitle = (order: number, name?: string): string => {
  const libre = name?.trim();
  return libre ? `Séance ${order} — ${libre}` : `Séance ${order}`;
};

/**
 * Les deux moitiés, quand l'écran veut les dessiner séparément — le rang en
 * gras, le nom en retrait, comme un bloc et son nom libre.
 */
export const sessionTitleParts = (
  order: number,
  name?: string
): { rang: string; libre?: string } => ({
  rang: `Séance ${order}`,
  libre: name?.trim() || undefined,
});
