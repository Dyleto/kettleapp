import { Box } from '@chakra-ui/react';
import { LuVolume2, LuVolumeX } from 'react-icons/lu';
import { useSoundSetting } from '../useSoundSetting';
import { unlockSound } from '../sound';

/**
 * Couper ou remettre les bips, depuis la séance elle-même.
 *
 * C'est là qu'on en a besoin : la salle est calme, le voisin regarde, et
 * personne ne quitte sa séance pour aller chercher un réglage dans son
 * compte. Le même réglage se retrouve dans « Mon compte », pour qui veut le
 * poser une fois pour toutes.
 *
 * Le nom dit ce que la touche fera, pas l'état actuel : « Couper le son »
 * quand il est actif. `aria-pressed` porte l'état, et l'icône le montre.
 */
export const SoundToggle = ({ color = 'fg.muted' }: { color?: string }) => {
  const [enabled, setEnabled] = useSoundSetting();

  return (
    <Box
      as="button"
      aria-label={enabled ? 'Couper le son' : 'Remettre le son'}
      aria-pressed={!enabled}
      display="grid"
      placeItems="center"
      minW="44px"
      minH="44px"
      borderRadius="field"
      color={color}
      opacity={enabled ? 1 : 0.6}
      onClick={() => {
        // Remettre le son est un geste : c'est le moment d'ouvrir la sortie,
        // sans quoi le premier bip suivant serait refusé par le navigateur.
        if (!enabled) unlockSound();
        setEnabled(!enabled);
      }}
    >
      {enabled ? <LuVolume2 size={20} /> : <LuVolumeX size={20} />}
    </Box>
  );
};
