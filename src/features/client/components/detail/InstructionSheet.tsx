import { Box, HStack, Text } from '@chakra-ui/react';
import type { BlockExercise } from '@/shared/types';
import { Chip, Sheet } from '@/kit';
import VideoPlayer from '@/shared/components/VideoPlayer';
import { formatWeight } from '../../guided/load';
import {
  formatLastPerformance,
  type LastPerformance,
} from '../../lastPerformance';
import { CoachBubble } from '../CoachBubble';

/**
 * La consigne d'un exercice, en feuille basse sur la fiche.
 *
 * Dans cet ordre : la vidéo si elle existe, le mot du coach pour cette
 * séance, la description de la bibliothèque, puis ce qui a été fait — la
 * dernière fois et le record. Le mot du coach passe devant la description
 * parce qu'il est écrit pour ce jour-là ; la description vaut pour toutes
 * les séances.
 *
 * Une feuille et non un plein écran : on lit la consigne d'un mouvement en
 * gardant la séance sous les yeux, assombrie, et on la referme d'un geste.
 */
export const InstructionSheet = ({
  entry,
  last,
  record,
  onClose,
}: {
  entry: BlockExercise;
  last?: LastPerformance;
  /** La charge la plus lourde jamais notée sur ce mouvement. */
  record?: number;
  onClose: () => void;
}) => {
  const video = entry.exercise.videoUrl?.trim();
  const note = entry.note?.trim();
  const description = entry.exercise.description?.trim();
  const lastLine = formatLastPerformance(last);
  return (
    <Sheet label={entry.exercise.name} onDismiss={onClose}>
      {video && (
        <Box borderRadius="20px" overflow="hidden">
          <VideoPlayer url={video} />
        </Box>
      )}
      <Text as="h2" fontSize="22px" fontWeight="800" lineHeight="1.2">
        {entry.exercise.name}
      </Text>
      {note && <CoachBubble tone="raised">{note}</CoachBubble>}
      {description && (
        <Text color="fg.muted" whiteSpace="pre-wrap">
          {description}
        </Text>
      )}
      {(lastLine || record !== undefined) && (
        <HStack gap="6px" wrap="wrap">
          {lastLine && (
            <Chip tone="teal">La dernière fois&nbsp;: {lastLine}</Chip>
          )}
          {record !== undefined && (
            <Chip tone="amber">
              Record&nbsp;: {formatWeight(record)}&nbsp;kg
            </Chip>
          )}
        </HStack>
      )}
      {!note && !description && !video && !lastLine && (
        <Text color="fg.muted">
          Pas de consigne pour ce mouvement, et pas encore de charge notée.
        </Text>
      )}
    </Sheet>
  );
};
