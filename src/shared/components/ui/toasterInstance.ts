import { createToaster } from '@chakra-ui/react';

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
