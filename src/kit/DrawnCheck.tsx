import { chakra } from '@chakra-ui/react';
import { MOTION } from './motion';

/** Un chemin SVG qui prend les props de style, `animation` comprise. */
const Path = chakra('path');

interface DrawnCheckProps {
  size: number;
  strokeWidth?: number;
  /** Tracer la coche en arrivant. Faux : elle est déjà là, entière. */
  draw?: boolean;
}

/**
 * Une coche qui se dessine : le trait part du coin gauche et remonte.
 *
 * C'est le même tracé que la coche des icônes (`LuCheck`), réécrit pour
 * pouvoir le tirer : une icône toute faite ne donne pas la main sur son
 * chemin. `pathLength` ramène le trait à une longueur de 1, quelle que soit
 * la taille — sans lui, le décalage du tiret dépendrait du dessin.
 *
 * `draw` est au choix de l'appelant : lui seul sait si la coche vient d'être
 * gagnée ou si elle l'était déjà (`useJustDone`).
 */
export const DrawnCheck = ({
  size,
  strokeWidth = 2,
  draw = true,
}: DrawnCheckProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    data-check={draw ? 'drawn' : 'still'}
  >
    <Path
      d="M20 6 9 17l-5-5"
      pathLength={1}
      strokeDasharray={1}
      animation={draw ? `checkDraw ${MOTION.checkDraw} both` : undefined}
      _motionReduce={{ animation: 'none' }}
    />
  </svg>
);
