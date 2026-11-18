import { Box, HStack } from '@chakra-ui/react';

/** Ce qu'un trait représente : un effort, un repos, ou un temps qui ne
 * compte pas. */
export interface StrokeShape {
  kind: 'work' | 'rest' | 'idle';
  /** En part du plus haut (0 à 1). */
  height: number;
  /** En part des autres traits. */
  weight: number;
}

const COLOR: Record<StrokeShape['kind'], string> = {
  work: 'block.work',
  rest: 'session.rest',
  // Le gris du texte secondaire, atténué : le filet des cartes, qu'emploie
  // la maquette, disparaissait sur le fond d'une tuile.
  idle: 'fg.muted',
};
const OPACITY: Record<StrokeShape['kind'], number> = {
  work: 1,
  rest: 0.8,
  idle: 0.3,
};

/**
 * Une suite de traits peints : le dessin d'un format, ou d'un rythme.
 *
 * Le kit peint, il ne décide pas : ce que les traits montrent — combien,
 * quelle hauteur — se décide dans le domaine (`formatSketch`). Le dessin est
 * muet pour un lecteur d'écran : la tuile qui le porte dit la même chose en
 * mots.
 */
export const Strokes = ({
  strokes,
  height = 26,
}: {
  strokes: readonly StrokeShape[];
  height?: number;
}) => (
  <HStack gap="3px" h={`${height}px`} align="flex-end" aria-hidden data-strokes>
    {strokes.map((stroke, i) => (
      <Box
        key={i}
        flex={stroke.weight}
        h={`${Math.round(stroke.height * 100)}%`}
        borderRadius="3px"
        bg={COLOR[stroke.kind]}
        opacity={OPACITY[stroke.kind]}
        data-stroke={stroke.kind}
      />
    ))}
  </HStack>
);
