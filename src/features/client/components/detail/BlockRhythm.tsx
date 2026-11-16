import { Box, HStack } from '@chakra-ui/react';
import type { SessionBlock } from '@/shared/types';
import {
  BLOCK_ACCENT_COLOR,
  blockSupportsRepsOnly,
  getBlockAccent,
} from '@/features/program/constants';
import { setsOfBlock } from '../../guidedSteps';

/** Au-delà, les traits deviennent trop fins pour se compter : on montre le
 * rythme, pas un inventaire. */
const MAX_BARS = 12;

/**
 * Le dessin d'un bloc : un trait par tour ou par série.
 *
 * Le Tabata et le On / Off alternent un trait de travail et un trait de
 * repos plus bas ; l'échelle fait suivre la hauteur de ses traits à ses
 * paliers, pour qu'une échelle qui monte se voie monter. Le reste aligne des
 * traits égaux. Le dessin est muet : la carte dit la même chose en mots.
 *
 * Écrit pour l'écran d'ouverture de la séance guidée, et repris tel quel par
 * la fiche : le même bloc ne doit pas avoir deux dessins.
 */
export const BlockRhythm = ({
  block,
  height = 18,
}: {
  block: SessionBlock;
  height?: number;
}) => {
  const alternates =
    blockSupportsRepsOnly(block.type) && (block.restDuration ?? 0) > 0;
  // Quand le dessin alterne, le trait haut est l'effort et le trait bas le
  // repos : l'accent du format — sarcelle pour un Tabata — peignait les deux
  // de la même couleur, et l'alternance ne se voyait plus.
  const color = alternates
    ? BLOCK_ACCENT_COLOR.work
    : BLOCK_ACCENT_COLOR[getBlockAccent(block.type)];
  const scheme =
    block.type === 'ladder' && block.repsScheme?.length
      ? block.repsScheme.slice(0, MAX_BARS)
      : undefined;
  const top = scheme ? Math.max(...scheme) : 1;
  const count = scheme
    ? scheme.length
    : Math.min(
        MAX_BARS,
        Math.max(
          1,
          ['emom', 'every', 'tabata', 'onoff'].includes(block.type)
            ? (block.rounds ?? 1)
            : setsOfBlock(block).length
        )
      );

  return (
    <HStack
      gap="3px"
      h={`${height}px`}
      align="flex-end"
      aria-hidden
      data-rhythm
    >
      {Array.from({ length: count }, (_, i) => (
        <HStack key={i} gap="3px" flex={1} h="full" align="flex-end">
          <Box
            flex={2}
            h={scheme ? `${Math.max(18, (scheme[i] / top) * 100)}%` : 'full'}
            borderRadius="3px"
            bg={color}
            data-bar="work"
          />
          {alternates && (
            <Box
              flex={1}
              h="55%"
              borderRadius="3px"
              bg="session.rest"
              opacity={0.8}
              data-bar="rest"
            />
          )}
        </HStack>
      ))}
    </HStack>
  );
};
