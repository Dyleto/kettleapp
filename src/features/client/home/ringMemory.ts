import { useEffect, useState } from 'react';
import {
  parseSeenRing,
  ringStart,
  weekKey,
  type SeenRing,
} from '@/domain/week/ring';
import storage from '@/shared/utils/storage';

/** La mémoire de l'anneau, sur cet appareil. */
export const RING_SEEN_KEY = 'kettle:week-ring';

/**
 * Retenir ce que la personne vient de voir de sa semaine.
 *
 * L'écran de fin l'écrit aussi : il vient de montrer l'anneau se remplir de
 * la séance qu'on a faite. Sans cela, l'accueil, juste derrière, le
 * remplissait une seconde fois avec la même séance.
 */
export const rememberRing = (part: number, today: Date = new Date()) => {
  const seen: SeenRing = { week: weekKey(today), part };
  storage.setItem(RING_SEEN_KEY, JSON.stringify(seen));
};

/**
 * D'où l'anneau de l'accueil part : la part que la personne a vue la
 * dernière fois, si elle a changé depuis — sinon rien, il est à sa place.
 *
 * Quand la semaine a avancé sans que l'écran de fin l'ait montré — une
 * séance déclarée faite, envoyée d'un autre appareil, un jour que le coach a
 * ajouté —, c'est ici qu'on la voit avancer (`ringStart`).
 *
 * Lue une fois, au montage : si la semaine change encore sous les yeux, la
 * transition de l'anneau s'en charge. Retenue aussitôt, pour que la visite
 * suivante ne raconte pas la même séance.
 *
 * `null` : pas d'anneau, la semaine n'a pas d'objectif. Rien à retenir.
 */
export const useRingStart = (part: number | null): number | undefined => {
  const [from] = useState(() =>
    part === null
      ? undefined
      : ringStart(parseSeenRing(storage.getItem(RING_SEEN_KEY)), {
          week: weekKey(new Date()),
          part,
        })
  );
  useEffect(() => {
    if (part !== null) rememberRing(part);
  }, [part]);
  return from;
};
