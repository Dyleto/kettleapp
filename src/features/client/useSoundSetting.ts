import { useSyncExternalStore } from 'react';
import { isSoundEnabled, setSoundEnabled, subscribeToSound } from './sound';

/**
 * Le réglage du son, tel qu'un écran l'affiche et le change.
 *
 * Il se lit hors de React — l'horloge de la séance le consulte au moment de
 * sonner — et se montre à deux endroits. `useSyncExternalStore` plutôt qu'un
 * état local : un état par composant aurait laissé l'icône de la séance et
 * la ligne de « Mon compte » se contredire.
 */
export const useSoundSetting = (): [boolean, (enabled: boolean) => void] => {
  const enabled = useSyncExternalStore(subscribeToSound, isSoundEnabled);
  return [enabled, setSoundEnabled];
};
