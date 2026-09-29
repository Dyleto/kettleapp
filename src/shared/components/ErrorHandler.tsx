import { useEffect } from 'react';
import { toaster } from '@/shared/components/ui/toasterInstance';
import eventEmitter from '@/shared/utils/eventEmitter';

interface ErrorEventPayload {
  title: string;
  message: string;
}

/**
 * L'unique oreille des erreurs signalées hors de React.
 *
 * L'intercepteur HTTP n'est pas un composant : il n'a ni contexte ni accès
 * aux toasts. Il émet, ce composant écoute, et c'est le seul endroit où une
 * erreur venue du réseau devient quelque chose de visible.
 *
 * Il ne rend rien et se monte une seule fois, à la racine : deux montages
 * donneraient deux toasts pour une seule panne.
 */
export const ErrorHandler = () => {
  useEffect(() => {
    const unsubscribe = eventEmitter.on('error', (data) => {
      const error = data as ErrorEventPayload;
      toaster.create({
        title: error.title,
        description: error.message,
        type: 'error',
        duration: 5000,
      });
    });

    return unsubscribe;
  }, []);

  return null;
};
