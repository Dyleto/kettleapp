import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { ReactNode, useState } from 'react';
import { LuChevronDown, LuVideo } from 'react-icons/lu';
import { formatDuration } from '@/shared/utils/duration';
import { BlockExercise, BlockType, SessionBlock } from '@/shared/types';
import {
  blockIndexPrefix,
  restBetweenSetsOf,
} from '@/features/program/constants';
import { formatExerciseMetric } from '@/shared/utils/formatters';
import VideoPlayer from '@/shared/components/VideoPlayer';
import { hitArea } from '@/shared/components/hitArea';

interface BlockExerciseRowProps {
  exercise: BlockExercise;
  blockType: BlockType;
  /** Le bloc parent : en Tabata et On-Off, c'est lui qui définit le travail,
   * pas l'exercice. */
  block?: Pick<SessionBlock, 'workDuration' | 'repsScheme'>;
  index: number;
  /** Inséré sous la ligne : ce qui a été réalisé, ou le rappel de la
   * dernière fois. */
  extra?: ReactNode;
}

/**
 * Une ligne d'exercice en lecture — le jumeau exact de celle de l'éditeur.
 *
 * Même colonne de gauche pour le nom, même colonne de droite en chiffres
 * tabulaires pour la prescription, même filet de séparation. La seule chose
 * qu'elle a en plus : la consigne et la vidéo de l'exercice se déplient au
 * clic, ce qui n'a de sens qu'en faisant la séance.
 */
export const BlockExerciseRow = ({
  exercise,
  blockType,
  block,
  index,
  extra,
}: BlockExerciseRowProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const metric = formatExerciseMetric(exercise, blockType, block);
  const restSeconds = restBetweenSetsOf({ type: blockType }, exercise);
  const rest = restSeconds ? `${formatDuration(restSeconds)} repos` : null;

  const ex = exercise.exercise;
  // Deux niveaux de consigne, qu'il ne faut pas empiler sans les
  // distinguer. `exercise.note` est ce que le coach a écrit pour ce
  // placement, dans cette séance ; `ex.description` décrit le mouvement en
  // général et vient de la bibliothèque, partagée par tous ses clients.
  const consigne = exercise.note?.trim();
  const hasNote = !!consigne;
  const hasDescription = !!ex.description?.trim();
  const hasVideo = !!ex.videoUrl?.trim();
  const hasDetail = hasNote || hasDescription || hasVideo;

  // Toute ligne se déplie, même vide.
  //
  // N'ouvrir que les exercices documentés créait un silence ambigu : on tape
  // un nom, rien ne bouge, et rien ne dit si on a manqué la cible, si l'écran
  // est cassé, ou s'il n'y a simplement rien à lire. Le dépliement répond
  // dans les trois cas.

  return (
    <Box borderTopWidth="1px" borderColor="whiteAlpha.100">
      <HStack
        as="button"
        data-exercise-row
        w="full"
        textAlign="left"
        aria-expanded={isOpen}
        aria-label={
          hasDetail
            ? `${ex.name} — voir la consigne`
            : `${ex.name} — aucune consigne`
        }
        onClick={() => setIsOpen((v) => !v)}
        py={1.5}
        minH="44px"
        gap={3}
        rowGap={1}
        flexWrap="wrap"
        align="center"
        css={hitArea(44)}
        _hover={{ color: 'fg' }}
        transition="color 0.12s"
      >
        <HStack gap={1} flex="1 1 auto" minW={0}>
          {blockIndexPrefix(blockType) && (
            <Text fontSize="sm" color="fg.muted" flexShrink={0}>
              {index + 1} ·
            </Text>
          )}
          <Text fontSize="sm" color="fg.muted" lineClamp={2}>
            {ex.name}
          </Text>
          {/* Un pictogramme de la taille d'un caractère, dans la couleur du
              texte : un client qui ne l'a jamais remarqué ne sait pas que
              l'application contient des vidéos. Un exercice sur sept en porte
              une — il y a la place de le dire. */}
          {hasVideo && (
            <HStack gap={1} color="app.primary" flexShrink={0}>
              <LuVideo size={13} />
              <Text fontSize="2xs" fontWeight="bold" letterSpacing="wide">
                vidéo
              </Text>
            </HStack>
          )}
        </HStack>

        {/* La prescription et le chevron ne font qu'un élément flexible :
            séparés, ils se repliaient indépendamment et le chevron se
            retrouvait seul sur la ligne du dessous. */}
        <HStack gap={3} flexShrink={0} ml="auto" align="center">
          {(metric || rest) && (
            <VStack gap={0} align="end" flexShrink={0}>
              {metric && (
                <Text
                  fontSize="sm"
                  color="fg"
                  fontWeight="semibold"
                  fontFamily="mono"
                >
                  {metric}
                </Text>
              )}
              {rest && (
                <Text fontSize="xs" color="fg.muted">
                  {rest}
                </Text>
              )}
            </VStack>
          )}

          {/* Pas de chevron quand il n'y a rien en dessous : son absence
              devient une information juste, au lieu d'une déception à chaque
              ouverture. La ligne reste cliquable pour autant — taper un nom
              sans réponse ne dit pas si on a manqué la cible, si l'écran est
              cassé, ou s'il n'y a rien à lire ; le dépliement répond « ton
              coach n'a pas laissé de consigne ». */}
          {hasDetail && (
            <Box
              color="fg.muted"
              flexShrink={0}
              transition="transform 0.2s"
              transform={isOpen ? 'rotate(180deg)' : 'none'}
            >
              <LuChevronDown size={13} />
            </Box>
          )}
        </HStack>
      </HStack>

      {extra && <Box pb={1.5}>{extra}</Box>}

      {isOpen && (
        <VStack align="stretch" gap={3} pb={3}>
          {/* Ce que le coach a écrit pour toi vient en premier,
              reconnaissable à la barre ambre — la même que sa note de séance.
              Ce qui vient de la bibliothèque reste du texte simple, en
              dessous. */}
          {hasNote && (
            <Box
              p={3}
              bg="whiteAlpha.50"
              borderRadius="md"
              borderLeft="2px solid"
              borderLeftColor="app.primary.border"
            >
              <Text
                fontSize="2xs"
                color="fg.muted"
                fontWeight="bold"
                letterSpacing="wide"
                textTransform="uppercase"
                mb={1}
              >
                Consigne du coach
              </Text>
              <Text
                fontSize="xs"
                color="fg"
                lineHeight="tall"
                whiteSpace="pre-wrap"
              >
                {consigne}
              </Text>
            </Box>
          )}
          {hasDescription && (
            <Box>
              {/* Le titre n'apparaît que lorsqu'il y a deux textes à
                  distinguer : seule, celle de la bibliothèque n'a pas besoin
                  qu'on dise d'où elle vient. */}
              {hasNote && (
                <Text
                  fontSize="2xs"
                  color="fg.muted"
                  fontWeight="bold"
                  letterSpacing="wide"
                  textTransform="uppercase"
                  mb={1}
                >
                  Le mouvement
                </Text>
              )}
              <Text
                fontSize="xs"
                color="fg.muted"
                lineHeight="tall"
                whiteSpace="pre-wrap"
              >
                {ex.description}
              </Text>
            </Box>
          )}
          {hasVideo && <VideoPlayer url={ex.videoUrl!} />}
          {!hasDetail && (
            <Text fontSize="xs" color="fg.muted" fontStyle="italic">
              Ton coach n'a pas laissé de consigne pour cet exercice.
            </Text>
          )}
        </VStack>
      )}
    </Box>
  );
};
