import type { ReactNode } from 'react';
import { Box } from '@chakra-ui/react';

interface RingProps {
  /** Ce qui reste, entre 0 et 1. */
  part: number;
  size: number;
  stroke?: number;
  color: string;
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
  children,
}: RingProps) => {
  const radius = 50 - stroke / 2 - 1;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, part));
  return (
    <Box position="relative" w={`${size}px`} h={`${size}px`} flexShrink={0}>
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
          strokeDashoffset={circumference * (1 - clamped)}
          transition="stroke-dashoffset 1s linear"
          _motionReduce={{ transition: 'none' }}
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
