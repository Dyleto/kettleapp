import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { LuInfo } from 'react-icons/lu';
import type { BlockExercise, SessionBlock } from '@/shared/types';
import { getBlockFreeName } from '@/domain/session/blocks';
import {
  blockChips,
  exerciseDose,
  exerciseSub,
  formatName,
  hasInstructions,
} from '@/domain/session/dose';
import type { LastPerformance } from '@/domain/history/lastPerformance';
import { BlockRhythm } from './BlockRhythm';
import { Bubble, Chip } from '@/kit';

interface BlockDetailCardProps {
  block: SessionBlock;
  lastPerformance?: Map<string, LastPerformance>;
  onOpenExercise: (exercise: BlockExercise) => void;
}

/**
 * Un bloc de la fiche : son format et ses réglages en tête, son dessin, puis
 * une ligne par exercice — la dose d'abord, en gros, le nom ensuite.
 *
 * Toute ligne s'ouvre, même sans consigne : la feuille montre alors la
 * dernière performance et le record, et c'est souvent ce qu'on venait
 * chercher. L'icône d'information ne dit que « il y a quelque chose à
 * lire ».
 */
export const BlockDetailCard = ({
  block,
  lastPerformance,
  onOpenExercise,
}: BlockDetailCardProps) => {
  const name = formatName(block.type);
  // Le nom libre, une fois retiré ce que le format dit déjà : un bloc AMRAP
  // nommé « AMRAP 12 » afficherait sinon « AMRAP · AMRAP 12 · 12 min ».
  const label = getBlockFreeName(block);
  const exercises = [...block.exercises].sort((a, b) => a.order - b.order);
  return (
    <VStack
      as="section"
      aria-label={label ? `${name} — ${label}` : name}
      align="stretch"
      gap={0}
      bg="surface.card"
      borderRadius="card"
      overflow="hidden"
    >
      <HStack px="18px" pt="16px" pb="10px" gap="6px" wrap="wrap">
        <Text
          as="h2"
          fontSize="13px"
          fontWeight="800"
          letterSpacing="0.12em"
          textTransform="uppercase"
          mr={1}
        >
          {name}
        </Text>
        {label && <Chip tone="outline">{label}</Chip>}
        {blockChips(block).map((chip) => (
          <Chip key={chip}>{chip}</Chip>
        ))}
      </HStack>
      {block.notes?.trim() && (
        <Bubble size="sm" mx="18px" mb="10px">
          {block.notes}
        </Bubble>
      )}
      <Box px="18px" pb="12px">
        <BlockRhythm block={block} />
      </Box>
      {exercises.map((entry) => {
        const dose = exerciseDose(block, entry);
        const sub = exerciseSub(
          block,
          entry,
          lastPerformance?.get(entry.exercise._id)
        );
        return (
          <HStack
            key={entry.order}
            as="button"
            w="full"
            textAlign="left"
            gap={3}
            px="18px"
            py="13px"
            borderTop="1px solid"
            borderColor="line"
            aria-label={`${entry.exercise.name}${dose ? `, ${dose}` : ''} — voir la consigne`}
            onClick={() => onOpenExercise(entry)}
            _hover={{ bg: 'whiteAlpha.50' }}
            data-exercise-line
          >
            {dose && (
              <Text
                fontSize="24px"
                fontWeight="800"
                lineHeight="1.1"
                color="app.primary.fg"
                minW="74px"
                fontVariantNumeric="tabular-nums"
                whiteSpace="nowrap"
                data-dose
              >
                {dose}
              </Text>
            )}
            <VStack align="start" gap={1} flex={1} minW={0}>
              <Text fontSize="16px" fontWeight="bold" lineHeight="1.25">
                {entry.exercise.name}
              </Text>
              {sub && (
                <Text fontSize="sm" color="fg.muted">
                  {sub}
                </Text>
              )}
            </VStack>
            {hasInstructions(entry) && (
              <Box color="fg.muted" flexShrink={0} aria-hidden data-info>
                <LuInfo size={20} />
              </Box>
            )}
          </HStack>
        );
      })}
    </VStack>
  );
};
