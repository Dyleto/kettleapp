import { useEffect, useRef } from 'react';

/** La marque laissée dans l'historique, et le seul mot qui identifie nos repères. */
const MARKER = 'kettleCouche';

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
 * Retour le consomme, `popstate` se déclenche, et on ferme la couche du
 * dessus.
 *
 * L'état existant est recopié plutôt qu'écrasé : le routeur y garde son
 * propre marqueur de position, et le lui retirer lui ferait perdre le fil de
 * ses propres allers-retours.
 *
 * ── Un repère pour toutes les couches, et non un par couche ───────────────
 *
 * La première version en posait un par couche et les retirait au nettoyage
 * par un `history.back()`. Son commentaire disait « l'écouteur est déjà
 * détaché, donc ce retour n'appellera personne » : vrai pour la couche qui se
 * ferme, faux dès que deux couches s'échangent dans le même rendu.
 *
 * C'est ce que fait cet écran. En mobile, créer un exercice depuis le
 * sélecteur ferme le sélecteur et ouvre la fiche du mouvement créé, en un
 * seul passage. Le nettoyage du premier mettait un retour en file, le second
 * poussait son repère, et l'historique se retrouvait deux crans sous le
 * repère de la couche ouverte : la fiche se refermait aussitôt, puis le
 * retour suivant quittait la page au lieu de fermer la fiche. Retour du
 * terrain : « en mode mobile le tiroir ne s'ouvre pas à la création ».
 *
 * D'où un registre : les couches ouvertes s'empilent ici, un seul repère vaut
 * pour la pile, et un retour ferme celle du dessus — puis repose un repère
 * s'il en reste. Un échange ne touche donc plus à l'historique du tout : la
 * pile passe de une à une, et le repère ne bouge pas.
 */
const layers: Array<() => void> = [];

/** Les retours que nous avons déclenchés et qui n'ont pas encore été vus. */
let ourBacks = 0;

let watching = false;

const marked = () => !!window.history.state?.[MARKER];

const mark = () =>
  window.history.pushState({ ...window.history.state, [MARKER]: true }, '');

const unmark = () => {
  ourBacks += 1;
  window.history.back();
};

/**
 * L'écouteur unique, posé à la première ouverture.
 *
 * Unique parce que la décision — quelle couche fermer — appartient à la pile
 * et non à chaque couche. Et parce qu'un retour que nous avons déclenché
 * nous-mêmes n'est pas un geste de l'utilisateur.
 */
const watch = () => {
  if (watching || typeof window === 'undefined') return;
  watching = true;
  window.addEventListener('popstate', () => {
    // Un retour que nous avons déclenché en retirant le repère : il ne ferme
    // rien.
    //
    // Aucune assertion ne le couvre, et c'est dit ici faute de pouvoir le
    // provoquer : `unmark()` ne part que la pile vide, et la pile vide est
    // déjà écartée par le `if (!top)` ci-dessous. Ce compteur ne sert donc
    // que si une couche s'ouvre entre notre `history.back()` et le `popstate`
    // qu'il déclenche — un clic traité dans cette fenêtre fermerait la couche
    // qui vient de s'ouvrir. Le sabotage qui retire ces trois lignes ne fait
    // tomber aucune assertion : c'est un garde de course, pas un mécanisme
    // éprouvé.
    if (ourBacks > 0) {
      ourBacks -= 1;
      return;
    }

    const top = layers[layers.length - 1];
    if (!top) return;
    top();

    // Il reste des couches sous celle qu'on vient de fermer : le repère
    // qu'elles partagent vient d'être consommé, il faut le reposer pour que
    // le retour suivant ferme la prochaine au lieu de quitter la page.
    // `layers` ne perdra la couche fermée qu'au nettoyage de son effet, d'où
    // le `> 1`.
    if (layers.length > 1) mark();
  });
};

/**
 * Ferme la couche du dessus au retour, tant que `isOpen`.
 *
 * `onDismiss` est relu au moment où le retour arrive, pas figé à
 * l'ouverture : le parent peut se redessiner entre-temps.
 */
export const useBackDismiss = (isOpen: boolean, onDismiss: () => void) => {
  const dismissRef = useRef(onDismiss);
  useEffect(() => {
    dismissRef.current = onDismiss;
  });

  useEffect(() => {
    if (!isOpen) return;
    watch();

    const dismiss = () => dismissRef.current();
    layers.push(dismiss);
    // Le repère vaut pour toute la pile : la première couche le pose, les
    // suivantes s'y adossent.
    if (layers.length === 1 && !marked()) mark();

    return () => {
      const at = layers.lastIndexOf(dismiss);
      if (at >= 0) layers.splice(at, 1);

      // Retiré dans une micro-tâche, parce qu'une couche qui se ferme en
      // ouvrant une autre — la création d'exercice en mobile — vide puis
      // remplit la pile dans le même rendu. Décider tout de suite reviendrait
      // à retirer un repère dont la couche suivante a besoin, et c'est le
      // défaut que ce registre répare.
      queueMicrotask(() => {
        if (layers.length === 0 && marked()) unmark();
      });
    };
  }, [isOpen]);
};
