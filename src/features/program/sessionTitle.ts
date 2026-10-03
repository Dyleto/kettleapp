/**
 * Comment s'appelle une séance, à une seule adresse.
 *
 * Une séance se répète, et son rang se répétait avec elle : un client lisait
 * « Séance 1 · Séance 1 · Séance 1 » dans son historique, le coach la même
 * chose dans le journal, et le rail de l'éditeur alignait cinq S1…S5
 * anonymes. Le rang dit où la séance se trouve dans le programme, jamais ce
 * qu'elle contient.
 *
 * Le nom ne remplace pas le rang, il s'y ajoute : « Séance 2 — Haut du
 * corps ». L'ordre compte toujours — c'est la séance qu'on fait après la
 * première — et un coach qui n'a rien nommé ne perd rien.
 *
 * Huit écrans écrivaient ce titre chacun de leur côté. Ils l'écrivent
 * maintenant tous ici, pour que le jour où la règle change, elle change une
 * fois.
 */

/** « Séance 2 », ou « Séance 2 — Haut du corps » quand le coach a nommé. */
export const sessionTitle = (order: number, name?: string): string => {
  const freeName = name?.trim();
  return freeName ? `Séance ${order} — ${freeName}` : `Séance ${order}`;
};

/**
 * Les deux moitiés, quand un écran veut les dessiner séparément — le rang en
 * gras, le nom en retrait, comme un bloc et son nom libre.
 */
export const sessionTitleParts = (
  order: number,
  name?: string
): { rank: string; freeName?: string } => ({
  rank: `Séance ${order}`,
  freeName: name?.trim() || undefined,
});
