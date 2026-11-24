import type { ReactNode } from 'react';
import { Box } from '@chakra-ui/react';
import { LANDSCAPE, WIDE } from './media';
import { MOTION } from './motion';

interface RingProps {
  /** Ce qui reste, entre 0 et 1. */
  part: number;
  size: number;
  stroke?: number;
  color: string;
  /** La taille téléphone couché, où la hauteur manque. */
  landscapeSize?: number;
  /** La taille sur grand écran, lu à trois mètres. */
  wideSize?: number;
  /**
   * La part d'où l'anneau part en arrivant : il s'y montre, puis rejoint
   * `part` d'un geste. Sans elle, il est simplement à sa place.
   */
  from?: number;
  children?: ReactNode;
}

/**
 * Un anneau qui se vide : le temps qui reste, lisible de loin.
 *
 * Une barre sous un chiffre se lit à un mètre ; un anneau autour de lui se
 * lit à deux, téléphone posé au sol, et il dit en même temps combien il en
 * reste et combien il y en avait.
 */
export const Ring = ({
  part,
  size,
  stroke = 7,
  color,
  landscapeSize,
  wideSize,
  from,
  children,
}: RingProps) => {
  const radius = 50 - stroke / 2 - 1;
  const circumference = 2 * Math.PI * radius;
  const clamp = (value: number) => Math.max(0, Math.min(1, value));
  const clamped = clamp(part);
  const offset = (value: number) => circumference * (1 - value);
  return (
    <Box
      position="relative"
      w={`${size}px`}
      h={`${size}px`}
      flexShrink={0}
      css={{
        ...(landscapeSize
          ? {
              [LANDSCAPE]: {
                width: `${landscapeSize}px`,
                height: `${landscapeSize}px`,
              },
            }
          : {}),
        ...(wideSize
          ? { [WIDE]: { width: `${wideSize}px`, height: `${wideSize}px` } }
          : {}),
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        style={{ transform: 'rotate(-90deg)' }}
        aria-hidden
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth={stroke}
          stroke="rgba(255, 255, 255, 0.09)"
        />
        <Box
          as="circle"
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset(clamped)}
          transition="stroke-dashoffset 1s linear"
          // Le départ est une animation et non une transition. Une
          // transition demande que l'ancienne valeur ait été dessinée avant
          // la nouvelle : posée puis changée une image plus tard, elle
          // manquait parfois son départ — le banc l'a vu une fois sur deux.
          // Une animation part de `from` dès que l'anneau est à l'écran,
          // quel que soit le moment où il y arrive.
          animation={
            from === undefined ? undefined : `ringFill ${MOTION.ringFill}`
          }
          style={
            from === undefined
              ? undefined
              : ({
                  '--ring-from': offset(clamp(from)),
                  '--ring-to': offset(clamped),
                } as React.CSSProperties)
          }
          _motionReduce={{ transition: 'none', animation: 'none' }}
        />
      </svg>
      <Box
        position="absolute"
        inset={0}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={1}
        textAlign="center"
      >
        {children}
      </Box>
    </Box>
  );
};
