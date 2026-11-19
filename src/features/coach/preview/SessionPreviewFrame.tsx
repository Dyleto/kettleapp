import { useEffect, useState } from 'react';
import { ScenePreview } from '@/features/client';
import {
  isPreviewMessage,
  type PreviewMessage,
  type PreviewReady,
} from './messages';

/**
 * La page que l'iframe de l'aperçu charge : la scène guidée, et rien
 * autour.
 *
 * Elle ne charge rien elle-même : l'atelier lui envoie la séance telle
 * qu'elle est à l'écran, frappe comprise, et elle la montre. Elle n'écoute
 * que sa propre origine et la fenêtre qui la porte — une page d'un autre
 * site qui l'encadrerait ne pourrait rien lui faire afficher.
 */
const SessionPreviewFrame = () => {
  const [shown, setShown] = useState<Omit<PreviewMessage, 'type'> | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== window.parent) return;
      if (!isPreviewMessage(event.data)) return;
      setShown({
        session: event.data.session,
        blockOrder: event.data.blockOrder,
      });
    };
    window.addEventListener('message', onMessage);
    const ready: PreviewReady = { type: 'kettle:preview-ready' };
    window.parent.postMessage(ready, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  if (!shown) return null;
  return <ScenePreview session={shown.session} blockOrder={shown.blockOrder} />;
};

export default SessionPreviewFrame;
