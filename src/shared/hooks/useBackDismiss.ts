import { useEffect, useRef } from 'react';

/** La marque laissée dans l'historique, et le seul mot qui identifie nos repères. */
const REPERE = 'kettleCouche';

/**
 * Le bouton retour du téléphone ferme la couche du dessus au lieu de quitter
 * la page.
 *
 * Sur Android, le retour matériel est le geste d'annulation universel : on
 * ouvre un tiroir, on se trompe, on appuie sur retour. Aucune des couches de
 * l'application ne posait de repère dans l'historique — retour ne trouvait
 * donc rien à annuler au-dessus de la page, et quittait la page. Un coach au
 * milieu d'une séance se retrouvait sur sa liste de clients, et le vivait
 * comme une annulation.
 *
 * Le remède tient en une entrée d'historique. À l'ouverture on pousse un
 * repère sans changer d'adresse — la route ne bouge pas, rien ne recharge.
 * Retour le consomme, `popstate` se déclenche, et on ferme.
 *
 * L'état existant est recopié plutôt qu'écrasé : le routeur y garde son
 * propre marqueur de position, et le lui retirer lui ferait perdre le fil de
 * ses propres allers-retours.
 *
 * Fermer par un autre chemin — la croix, un clic à l'extérieur, un choix fait
 * — doit retirer ce repère, sans quoi il faudrait deux retours pour quitter
 * une page dont la couche est déjà fermée. D'où le `history.back()` au
 * nettoyage, conditionné à la présence du repère : quand c'est retour qui a
 * fermé, il est déjà consommé et il n'y a rien à retirer.
 */
export const useBackDismiss = (isOpen: boolean, onDismiss: () => void) => {
  // Le gestionnaire de fermeture est relu au moment où le retour arrive, pas
  // figé à l'ouverture : le parent peut se redessiner entre-temps.
  const fermeture = useRef(onDismiss);
  useEffect(() => {
    fermeture.current = onDismiss;
  });

  useEffect(() => {
    if (!isOpen) return;

    window.history.pushState({ ...window.history.state, [REPERE]: true }, '');

    const surRetour = () => fermeture.current();
    window.addEventListener('popstate', surRetour);

    return () => {
      window.removeEventListener('popstate', surRetour);
      // Le repère est toujours là : c'est une fermeture ordinaire, et c'est à
      // nous de le retirer. L'écouteur est déjà détaché, donc ce retour
      // n'appellera personne.
      if (window.history.state?.[REPERE]) window.history.back();
    };
  }, [isOpen]);
};
