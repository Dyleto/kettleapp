import { HStack, Text, VStack } from '@chakra-ui/react';
import type { SessionMetrics } from '@/shared/types';
import { LEGACY_METRIC_LABELS } from '@/domain/history/tags';
import { Eyebrow } from './Eyebrow';

/**
 * Les cinq axes d'un ancien bilan, en lecture seule : stress, humeur,
 * énergie, sommeil, douleurs, chacun sur cinq.
 *
 * Le bilan d'avant l'échelle d'effort n'a pas de ressenti, et l'on n'en
 * invente pas : pas de visage, pas de moyenne, les cinq réponses telles
 * qu'elles ont été données. Elle vivait dans le détail du journal du
 * coach ; le détail du client la reçoit (F3b), et les deux lisent la même
 * chose.
 */
export const LegacyMetrics = ({ metrics }: { metrics: SessionMetrics }) => (
  <VStack align="stretch" gap="8px">
    <Eyebrow>Ancien bilan</Eyebrow>
    <VStack
      align="stretch"
      gap={0}
      bg="bg.raised"
      borderRadius="14px"
      data-legacy-metrics
    >
      {(
        Object.keys(
          LEGACY_METRIC_LABELS
        ) as (keyof typeof LEGACY_METRIC_LABELS)[]
      ).map((key) => (
        <HStack
          key={key}
          justify="space-between"
          px="16px"
          py="10px"
          borderTopWidth="1px"
          borderColor="line"
          _first={{ borderTopWidth: 0 }}
        >
          <Text>{LEGACY_METRIC_LABELS[key]}</Text>
          <Text fontWeight="700" fontVariantNumeric="tabular-nums">
            {metrics[key]}/5
          </Text>
        </HStack>
      ))}
    </VStack>
  </VStack>
);
