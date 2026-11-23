import { createToaster } from '@chakra-ui/react';

/** Combien de temps un message reste : trois secondes, la maquette des
 * états. Une panne reste le double — elle dit ce qui n'est pas parti, et on
 * la lit en entier. */
export const MESSAGE_DURATION = 3000;
const FAILURE_DURATION = 6000;

/**
 * L'instance de toasts, à part du composant qui les dessine.
 *
 * `toaster.create` s'appelle depuis un intercepteur HTTP, un service, un
 * gestionnaire d'événement — des endroits qui n'ont pas de contexte React.
 * La séparer du composant `<Toaster>` est ce qui rend cet appel possible
 * sans faire remonter un hook jusque-là.
 */
export const toaster = createToaster({
  placement: 'bottom-end',
  pauseOnPageIdle: true,
});

const createOne = toaster.create.bind(toaster);

/**
 * Un seul message à la fois : le nouveau remplace celui qui est là.
 *
 * Ils s'empilaient — une suppression, une autre, un message d'erreur —, et
 * la colonne finissait par cacher le bas de l'écran, là où se tiennent les
 * onglets et les boutons. L'option `max` de Chakra ne remplace pas : elle
 * met en file, et un message arrivait alors des secondes après son geste.
 *
 * Une bannière « Annuler » remplacée devient définitive : l'action a déjà
 * eu lieu, c'est seulement la possibilité de la reprendre qui part — ce
 * que la maquette demande, une suppression nouvelle chasse la précédente.
 *
 * Mettre à jour un message par son identifiant ne remplace rien : c'est le
 * même message qui change.
 *
 * Toute l'application passe par `toaster.create`, et nulle part par
 * `toaster.success` ou ses voisins, qui contourneraient la règle.
 */
toaster.create = (data) => {
  const updating =
    data.id !== undefined &&
    toaster.getVisibleToasts().some((toast) => toast.id === data.id);
  if (!updating) toaster.remove();
  return createOne({
    ...data,
    duration:
      data.duration ??
      (data.type === 'error' ? FAILURE_DURATION : MESSAGE_DURATION),
  });
};
