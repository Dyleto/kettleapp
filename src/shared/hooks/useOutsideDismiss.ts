import { RefObject, useEffect } from 'react';

/**
 * Ferme un panneau quand on clique ailleurs, ou qu'on appuie sur Échap.
 *
 * Un panneau qui ne se ferme que par son propre bouton oblige à viser : on
 * croit l'avoir quitté en cliquant à côté, et il est toujours là.
 */
export const useOutsideDismiss = (
  ref: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onDismiss: () => void
) => {
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const node = ref.current;
      if (node && !node.contains(event.target as Node)) onDismiss();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };

    // `pointerdown` plutôt que `click` : le panneau s'efface à l'instant où
    // le doigt se pose, pas quand il se lève.
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref, isOpen, onDismiss]);
};
