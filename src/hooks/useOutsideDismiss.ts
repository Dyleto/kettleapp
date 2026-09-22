import { RefObject, useEffect } from 'react';

/**
 * Closes a panel when you click elsewhere, or press Escape.
 *
 * A panel that only closes with its own button forces you to aim: you think
 * you left it by clicking beside it, and it is still there.
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

    // `pointerdown` rather than `click`: the panel clears the moment the
    // finger lands, not when it lifts.
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref, isOpen, onDismiss]);
};
