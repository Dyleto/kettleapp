import { RefObject, useEffect, useRef } from 'react';

/**
 * Ce qui est posé par-dessus la page : une boîte de dialogue, une
 * bannière « Annuler » — ou ce qui se déclare tel (`data-layer`) : la fiche
 * d'un exercice qui prend la place de l'aperçu, dans la page mais pour la
 * ligne ouverte.
 */
const LAYER = '[role="dialog"], [data-scope="toast"], [data-layer]';

/**
 * Le geste vient-il d'une couche posée par-dessus le panneau ?
 *
 * Toucher la fiche ouverte depuis une ligne de l'atelier, ou le « Annuler »
 * d'un changement d'unité, n'est pas cliquer à côté de la ligne : c'est
 * travailler dessus. Les compter comme « ailleurs » refermait la ligne
 * pendant qu'on revenait sur ce qu'on venait d'y faire. Un panneau qui vit
 * lui-même dans une couche garde la règle ordinaire à l'intérieur d'elle.
 */
const fromLayerAbove = (node: HTMLElement, target: EventTarget | null) => {
  const layer =
    target instanceof Element ? target.closest<HTMLElement>(LAYER) : null;
  return !!layer && !layer.contains(node);
};

/**
 * Ferme un panneau quand on clique ailleurs, ou qu'on appuie sur Échap.
 *
 * Un panneau qui ne se ferme que par son propre bouton oblige à viser : on
 * croit l'avoir quitté en cliquant à côté, et il est toujours là.
 *
 * Un Échap déjà consommé ne ferme rien : dans un champ, il rend la valeur
 * d'avant, et fermer le panneau du même coup ferait d'une annulation une
 * sortie.
 *
 * L'écouteur est posé à l'ouverture et ne bouge plus : `onDismiss` est lu
 * par une référence. Il se réabonnait à chaque rendu, puisque l'appelant
 * passe une fonction neuve à chaque fois ; or un écouteur ajouté pendant
 * qu'un événement se distribue ne reçoit pas cet événement. Deux panneaux
 * ouverts : le premier se fermait, React rendait entre deux écouteurs, et
 * le second, réabonné entre-temps, ne voyait jamais l'Échap.
 */
export const useOutsideDismiss = (
  ref: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onDismiss: () => void
) => {
  const dismissRef = useRef(onDismiss);
  useEffect(() => {
    dismissRef.current = onDismiss;
  });

  useEffect(() => {
    if (!isOpen) return;
    const onDismiss = () => dismissRef.current();

    const handlePointerDown = (event: PointerEvent) => {
      const node = ref.current;
      if (
        node &&
        !node.contains(event.target as Node) &&
        !fromLayerAbove(node, event.target)
      )
        onDismiss();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      const node = ref.current;
      if (
        event.key === 'Escape' &&
        !event.defaultPrevented &&
        !(node && fromLayerAbove(node, event.target))
      )
        onDismiss();
    };

    // `pointerdown` plutôt que `click` : le panneau s'efface à l'instant où
    // le doigt se pose, pas quand il se lève.
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref, isOpen]);
};
