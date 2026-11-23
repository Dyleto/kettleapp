import { useSyncExternalStore } from 'react';

const subscribe = (onChange: () => void) => {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
};

/**
 * Le téléphone a-t-il du réseau ?
 *
 * `navigator.onLine` dit seulement qu'une interface réseau est active, pas
 * que le serveur répond : il peut dire « oui » sur un Wi-Fi sans Internet.
 * Mais quand il dit « non », c'est sûr — et c'est ce cas-là que le bandeau
 * annonce. Un serveur qui ne répond pas a ses propres messages.
 *
 * Lu par abonnement plutôt qu'à chaque rendu : un écran qui n'a rien
 * d'autre à redessiner doit tout de même voir le réseau partir et revenir.
 */
export const useOnline = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true
  );
