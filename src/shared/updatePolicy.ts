/** Ce qu'on fait d'une nouvelle version qui attend. */
export type UpdateDecision = 'reload' | 'ask' | 'wait';

interface Circumstances {
  /** Une nouvelle version est installée et attend la main. */
  needRefresh: boolean;
  /** Quelque chose n'est pas encore enregistré. */
  unsaved: boolean;
  /** L'onglet est au premier plan. */
  visible: boolean;
}

/**
 * Faut-il recharger maintenant, demander, ou attendre ?
 *
 * Extrait du hook pour être éprouvé sans navigateur : c'est une décision, et
 * les décisions se testent sans monter de composant.
 *
 * Trois règles, dans cet ordre :
 *
 * 1. Rien n'attend : on ne fait rien. C'est le cas courant.
 * 2. Du travail n'est pas enregistré : on demande. Recharger ici coûterait
 *    les dernières secondes de saisie — l'enregistrement automatique a un
 *    délai, et l'état de l'éditeur vit en mémoire.
 * 3. Sinon on recharge, mais seulement si l'onglet est au premier plan.
 *    Recharger un onglet caché ferait retrouver au retour une page remise à
 *    zéro — panneau refermé, défilement perdu — sans que rien n'explique
 *    pourquoi. On attend donc le retour, où le rechargement se lit comme un
 *    chargement normal.
 */
export const decideUpdate = ({
  needRefresh,
  unsaved,
  visible,
}: Circumstances): UpdateDecision => {
  if (!needRefresh) return 'wait';
  if (unsaved) return 'ask';
  return visible ? 'reload' : 'wait';
};
