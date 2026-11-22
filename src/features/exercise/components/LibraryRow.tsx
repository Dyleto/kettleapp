import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { LuPlay, LuVideo } from 'react-icons/lu';
import type { Exercise } from '@/shared/types';
import { usageLine } from '@/domain/exercise/choices';

/**
 * Une ligne de la bibliothèque : la vignette, le nom, la consigne sur une
 * ligne, l'usage.
 *
 * La vignette dit d'un coup d'œil quels mouvements ont une vidéo — noire
 * avec la lecture quand il y en a une, grise sinon. Avant, une icône de
 * douze pixels collée au compteur le disait à qui la cherchait ; or c'est
 * la question que le coach se pose en ouvrant cet écran : lesquels me
 * reste-t-il à filmer ?
 *
 * Le sélecteur de l'atelier garde sa ligne dense (`ExerciseRow`) : on y
 * choisit un mouvement en tapant, on ne compte pas les vidéos.
 */
export const LibraryRow = ({
  exercise,
  selected,
  onOpen,
}: {
  exercise: Exercise;
  selected: boolean;
  onOpen: () => void;
}) => {
  const hasVideo = !!exercise.videoUrl?.trim();
  const description = exercise.description?.trim();
  const usage = usageLine(exercise);
  return (
    <HStack
      as="button"
      // Le nom de la ligne porte ce que la vignette et le compteur disent à
      // l'œil : muets pour un lecteur d'écran, ils seraient perdus.
      aria-label={[exercise.name, usage, hasVideo && 'vidéo']
        .filter(Boolean)
        .join(' — ')}
      aria-current={selected ? 'true' : undefined}
      data-exercise-row={exercise._id}
      w="full"
      textAlign="left"
      gap="12px"
      px="14px"
      py="10px"
      minH="66px"
      borderTopWidth="1px"
      borderColor="line"
      _first={{ borderTopWidth: 0 }}
      bg={selected ? 'bg.raised' : 'transparent'}
      boxShadow={selected ? 'inset 3px 0 0 {colors.app.primary}' : undefined}
      _hover={{ bg: 'bg.raised' }}
      _focusVisible={{ outlineOffset: '-2px' }}
      onClick={onOpen}
    >
      <Box
        w="46px"
        h="46px"
        borderRadius="13px"
        bg={hasVideo ? 'black' : 'bg.raised'}
        color={hasVideo ? 'fg' : 'fg.muted'}
        display="grid"
        placeItems="center"
        flexShrink={0}
        data-thumb={hasVideo ? 'video' : 'none'}
        aria-hidden
      >
        {hasVideo ? (
          <LuPlay size={18} fill="currentColor" />
        ) : (
          <LuVideo size={18} />
        )}
      </Box>
      <VStack align="stretch" gap="2px" flex={1} minW={0} aria-hidden>
        <Text fontWeight="700" lineClamp={1}>
          {exercise.name}
        </Text>
        {description && (
          <Text fontSize="sm" color="fg.muted" truncate data-description>
            {description}
          </Text>
        )}
      </VStack>
      <Text
        fontSize="sm"
        color="fg.muted"
        whiteSpace="nowrap"
        flexShrink={0}
        aria-hidden
        data-usage
      >
        {usage}
      </Text>
    </HStack>
  );
};
