import { useEffect, useRef } from 'react';

/** La marque posée dans l'historique, et le seul mot qui identifie nos repères. */
const REPERE = 'kettleCouche';

/**
 * Le bouton retour du téléphone referme la couche du dessus, au lieu de
 * quitter la page.
 *
 * Sur Android, le retour matériel est le geste d'annulation universel : on
 * ouvre un tiroir, on se trompe, on appuie sur retour. Aucune des couches de
 * l'application ne posait de repère dans l'historique — le retour ne trouvait
 * donc rien à défaire au-dessus de la page, et quittait la page. Un coach au
 * milieu de sa séance se retrouvait sur la liste de ses clients, et le vivait
 * comme une annulation.
 *
 * Le remède tient en une ligne d'historique. À l'ouverture on pose un repère
 * sans changer d'adresse — la route ne bouge pas, rien ne se recharge. Le
 * retour le consomme, `popstate` se déclenche, et on ferme.
 *
 * L'état existant est recopié plutôt qu'écrasé : le routeur y range son propre
 * repère de position, et le lui retirer lui ferait perdre le fil de ses
 * allers-retours.
 *
 * La fermeture par un autre chemin — la croix, un clic dehors, un choix fait —
 * doit retirer ce repère, sinon il faudrait deux retours pour quitter une page
 * dont la couche est déjà fermée. D'où le `history.back()` du nettoyage,
 * conditionné au fait que le repère soit encore là : quand c'est le retour qui
 * a fermé, il est déjà consommé et il n'y a rien à retirer.
 */
export const useBackDismiss = (isOpen: boolean, onDismiss: () => void) => {
  // La fermeture est relue au moment où le retour survient, pas figée à
  // l'ouverture : le parent peut se redessiner entre les deux.
  const fermeture = useRef(onDismiss);
  useEffect(() => {
    fermeture.current = onDismiss;
  });

  useEffect(() => {
    if (!isOpen) return;

    window.history.pushState(
      { ...window.history.state, [REPERE]: true },
      ''
    );

    const surRetour = () => fermeture.current();
    window.addEventListener('popstate', surRetour);

    return () => {
      window.removeEventListener('popstate', surRetour);
      // Le repère est encore là : c'est donc une fermeture ordinaire, et
      // c'est à nous de le retirer. L'écouteur est déjà décroché, ce retour
      // ne rappellera personne.
      if (window.history.state?.[REPERE]) window.history.back();
    };
  }, [isOpen]);
};
