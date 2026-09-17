import { PerformedValues, Session } from '@/types';
import { BlockCard } from '@/features/program/components/BlockCard';
import { Box, Skeleton, Text, VStack } from '@chakra-ui/react';
import { PerformedFields } from './PerformedFields';
import { prescribedSetLabels } from '@/features/program/constants';
import {
  formatLastPerformance,
  LastPerformance,
  performedKey,
} from '../lastPerformance';

/** Le bloc porteur et l'exercice : les deux décident du nombre de passages. */
const findExercise = (
  session: Session,
  blockOrder: number,
  exerciseOrder: number
) => {
  const block = session.blocks.find((b) => b.order === blockOrder);
  return {
    block,
    exercise: block?.exercises.find((e) => e.order === exerciseOrder),
  };
};

interface SessionDetailProps {
  session: Session;
  isLoading?: boolean;
  /** Saisie du réalisé. Absent = lecture seule, rendu inchangé. */
  performed?: Record<string, PerformedValues>;
  onPerformedChange?: (key: string, next: PerformedValues) => void;
  lastPerformance?: Map<string, LastPerformance>;
}

export const SessionDetail = ({
  session,
  isLoading,
  performed,
  onPerformedChange,
  lastPerformance,
}: SessionDetailProps) => {
  if (isLoading) {
    return (
      <VStack align="stretch" gap={3}>
        <Skeleton h="80px" borderRadius="lg" />
        <Skeleton h="200px" borderRadius="lg" />
      </VStack>
    );
  }

  const isRecording = !!performed && !!onPerformedChange;

  return (
    <VStack align="stretch" gap={4}>
      {session.notes && (
        <Box
          p={3}
          bg="whiteAlpha.50"
          borderRadius="md"
          borderLeft="3px solid"
          borderLeftColor="app.primary.border"
        >
          <Text fontSize="xs" color="fg.muted" mb={1} fontWeight="bold">
            Note du coach
          </Text>
          <Text fontSize="sm" color="fg" whiteSpace="pre-wrap">
            {session.notes}
          </Text>
        </Box>
      )}

      {session.blocks.map((block) => (
        <BlockCard
          key={block._id}
          block={block}
          renderExerciseExtra={({ blockOrder, exerciseOrder, exerciseId }) => {
            const last = formatLastPerformance(
              exerciseId ? lastPerformance?.get(exerciseId) : undefined
            );

            if (isRecording) {
              const key = performedKey(blockOrder, exerciseOrder);
              const { block: porteur, exercise: prescribed } = findExercise(
                session,
                blockOrder,
                exerciseOrder
              );
              return (
                <PerformedFields
                  value={performed[key] ?? { sets: [] }}
                  onChange={(next) => onPerformedChange(key, next)}
                  setLabels={
                    porteur && prescribed
                      ? prescribedSetLabels(porteur, prescribed)
                      : ['']
                  }
                  lastLabel={last}
                  isTimed={prescribed?.duration !== undefined}
                />
              );
            }

            // En lecture : pas de champ, mais ce qu'on avait mis la dernière
            // fois. Le mode guidé le rappelait déjà — tout le monde ne
            // l'utilise pas, et c'est justement au moment de charger la barre
            // qu'on cherche l'information.
            //
            // Sa hauteur est réservée même quand elle est vide. Présente sur
            // trois exercices sur sept, elle décalait les lignes voisines : la
            // liste devenait irrégulière et l'absence se lisait comme une
            // donnée manquante, alors qu'elle veut seulement dire « on n'a
            // encore rien noté ici ».
            return (
              <Text
                fontSize="xs"
                color="fg.muted"
                pl={4}
                opacity={0.8}
                aria-hidden={!last}
              >
                {last ? (
                  <>la dernière fois&nbsp;: {last}</>
                ) : (
                  '\u00A0'
                )}
              </Text>
            );
          }}
        />
      ))}
      {session.blocks.length === 0 && (
        <Box p={4} textAlign="center">
          <Text color="fg.muted" fontSize="sm">
            Aucun bloc pour cette séance.
          </Text>
        </Box>
      )}
    </VStack>
  );
};
