import { useRef, useState, type ReactNode } from 'react';
import { Box } from '@chakra-ui/react';

/** Au-delà, le geste est un choix et non un tremblement : un peu plus du
 * quart d'une carte sur téléphone. */
const THRESHOLD = 96;

/**
 * Glisser vers la gauche pour lire sans répondre.
 *
 * Le geste ne remplace rien : ouvrir une carte la marque lue aussi, et c'est
 * le chemin de qui n'a pas de doigt — clavier, souris, lecteur d'écran.
 * Glisser est le raccourci de qui trie vingt séances au pouce.
 *
 * `touch-action: pan-y` laisse le défilement vertical au navigateur : seul
 * un mouvement plus horizontal que vertical devient un glissement, sans quoi
 * faire défiler le fil marquerait des séances lues.
 *
 * Un glissement n'est pas un clic : le relâcher au-dessus de la carte ne
 * doit pas l'ouvrir.
 */
export const Swipeable = ({
  onSwipe,
  children,
}: {
  onSwipe: () => void;
  children: ReactNode;
}) => {
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const dragged = useRef(false);
  const offset = useRef(0);
  const [dx, setDx] = useState(0);

  const reset = () => {
    start.current = null;
    offset.current = 0;
    setDx(0);
  };

  return (
    <Box
      position="relative"
      style={{ touchAction: 'pan-y' }}
      data-swipeable
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        start.current = {
          x: event.clientX,
          y: event.clientY,
          id: event.pointerId,
        };
        dragged.current = false;
      }}
      onPointerMove={(event) => {
        const from = start.current;
        if (!from || from.id !== event.pointerId) return;
        const x = event.clientX - from.x;
        const y = event.clientY - from.y;
        if (!dragged.current && Math.abs(x) > 8 && Math.abs(x) > Math.abs(y)) {
          dragged.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
        }
        if (dragged.current) {
          offset.current = Math.min(0, x);
          setDx(offset.current);
        }
      }}
      onPointerUp={() => {
        const committed = dragged.current && offset.current <= -THRESHOLD;
        reset();
        if (committed) onSwipe();
      }}
      onPointerCancel={reset}
      onClickCapture={(event) => {
        if (!dragged.current) return;
        dragged.current = false;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <Box
        aria-hidden
        position="absolute"
        inset={0}
        borderRadius="card"
        bg="session.rest/18"
        color="session.rest.fg"
        fontWeight="700"
        display="flex"
        alignItems="center"
        justifyContent="flex-end"
        pr="22px"
        opacity={dx < 0 ? 1 : 0}
      >
        Lue
      </Box>
      <Box
        position="relative"
        transform={`translateX(${dx}px)`}
        transition={dx === 0 ? 'transform 0.2s ease-out' : 'none'}
        _motionReduce={{ transition: 'none' }}
      >
        {children}
      </Box>
    </Box>
  );
};
