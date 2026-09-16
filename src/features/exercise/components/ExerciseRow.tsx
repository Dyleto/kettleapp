import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { LuVideo } from 'react-icons/lu';
import { Exercise } from '@/types';

interface ExerciseRowProps {
  exercise: Exercise;
  onClick?: () => void;
  selected?: boolean;
  /** Commandes révélées au survol, à droite de la ligne. */
  extra?: ReactNode;
  /** Remplace la description : « déjà 3 fois dans ce programme », etc. */
  subtitle?: string;
}

/**
 * Une ligne d'exercice : du texte sur un filet, rien de plus.
 *
 * La bibliothèque affichait une carte arrondie par exercice, avec une
 * haltère identique sur chaque ligne et un chevron qui ne disait rien. Dix
 * exercices remplissaient l'écran pour dix mots. La même loi que l'atelier
 * s'applique ici : de la typographie et un filet, et l'accessoire ne se
 * montre que quand il porte une information — une vidéo, un compteur.
 */
export const ExerciseRow = ({
  exercise,
  onClick,
  selected,
  extra,
  subtitle,
}: ExerciseRowProps) => {
  const secondary = subtitle ?? exercise.description;
  const usage = exercise.usageCount ?? 0;

  // Les deux marques de droite sont muettes pour un lecteur d'écran : « 7 »
  // seul ne veut rien dire. On les décrit dans le nom de la ligne et on les
  // retire de l'arbre d'accessibilité.
  const label = [
    exercise.name,
    usage > 0 && `utilisé dans ${usage} séance${usage > 1 ? 's' : ''}`,
    exercise.videoUrl && 'vidéo',
  ]
    .filter(Boolean)
    .join(' — ');

  return (
    <HStack
      className="group"
      as={onClick ? 'button' : undefined}
      aria-label={onClick ? label : undefined}
      w="full"
      minH="44px"
      textAlign="left"
      gap={3}
      px={2}
      py={2}
      align="center"
      borderTopWidth="1px"
      borderColor="whiteAlpha.100"
      bg={selected ? 'app.primary/12' : 'transparent'}
      _hover={
        onClick
          ? { bg: selected ? 'app.primary/12' : 'whiteAlpha.50' }
          : undefined
      }
      _focusVisible={{
        outlineOffset: '-2px',
      }}
      transition="background-color 0.12s"
      onClick={onClick}
    >
      <VStack gap={0} align="stretch" flex={1} minW={0}>
        <Text
          fontSize="sm"
          fontWeight={selected ? 'semibold' : 'normal'}
          color={selected ? 'app.primary' : 'fg'}
          lineClamp={1}
        >
          {exercise.name}
        </Text>
        {secondary && (
          <Text fontSize="xs" color="fg.muted" lineClamp={1}>
            {secondary}
          </Text>
        )}
      </VStack>

      {/* Deux marques discrètes, et seulement quand elles existent. Le compte
          est suffixé : « 12 » collé à une icône vidéo se lisait comme douze
          vidéos. */}
      <HStack gap={2.5} flexShrink={0} color="fg.muted" aria-hidden>
        {exercise.videoUrl && <LuVideo size={12} />}
        {usage > 0 && (
          <Text as="span" fontSize="xs" whiteSpace="nowrap">
            <Text as="span" fontFamily="mono">
              {usage}
            </Text>{' '}
            séance{usage > 1 ? 's' : ''}
          </Text>
        )}
      </HStack>

      {extra && (
        <Box flexShrink={0} onClick={(e) => e.stopPropagation()}>
          {extra}
        </Box>
      )}
    </HStack>
  );
};
