import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import type { CompletedSession, FeedbackTag } from '@/shared/types';
import { PillButton } from '@/kit';
import { EFFORT_ZONE_COLOR } from '@/domain/history/effort';
import {
  recentZones,
  rhythmLine,
  streakHeadline,
  tagCountLabel,
  tagCounts,
} from '@/domain/history/journal';
import { EffortDots } from '../components/EffortDots';

interface JournalSummaryProps {
  history: CompletedSession[];
  /** Les séances que la semaine attend : « 2 sur 3 cette semaine ». */
  target: number;
  /** Faux quand l'historique reçu s'arrête à une page. */
  complete: boolean;
  sharesHealthData: boolean;
  /** « Sarah » ; sans prénom, « Ce client ». */
  firstName?: string;
  tag: FeedbackTag | null;
  onTag: (tag: FeedbackTag | null) => void;
}

/**
 * Le résumé des ressentis : cinq points, une phrase, le rythme et les
 * étiquettes de santé.
 *
 * L'ancien journal n'en avait pas, et c'est pourtant ce qu'un coach vient
 * chercher avant un rendez-vous : où en est le client, à quelle cadence, et
 * ce qui revient. La liste dessous reste là pour le détail.
 *
 * Une étiquette filtre la liste : « Douleur × 1 » ne laisse que la séance
 * qui la porte. Sans partage des données de santé, la carte le dit au lieu
 * de se taire — sans quoi un client qui n'a pas le droit d'écrire passerait
 * pour un client qui n'écrit pas.
 */
export const JournalSummary = ({
  history,
  target,
  complete,
  sharesHealthData,
  firstName,
  tag,
  onTag,
}: JournalSummaryProps) => {
  const headline = streakHeadline(history);
  const tags = tagCounts(history);
  return (
    <VStack
      align="stretch"
      gap="10px"
      bg="bg.surface"
      borderRadius="18px"
      p="18px"
      data-journal-summary
    >
      <HStack gap="12px">
        <EffortDots zones={recentZones(history)} size="lg" />
        <Text
          fontWeight="800"
          color={headline.tone ? EFFORT_ZONE_COLOR[headline.tone] : 'fg.muted'}
        >
          {headline.text}
        </Text>
      </HStack>
      <Text fontSize="sm" color="fg.muted">
        {rhythmLine(history, { target, complete })}
      </Text>
      {!sharesHealthData ? (
        <Text fontSize="sm" color="fg.muted" data-no-health-data>
          {firstName ?? 'Ce client'} ne partage pas ses données de santé : ses
          ressentis n’ont ni étiquette ni mot.
        </Text>
      ) : (
        tags.length > 0 && (
          <Box>
            <HStack
              gap="6px"
              wrap="wrap"
              role="group"
              aria-label="Filtrer par étiquette"
            >
              {tags.map((count) => {
                const pressed = tag === count.tag;
                return (
                  <PillButton
                    key={count.tag}
                    pressed={pressed}
                    onClick={() => onTag(pressed ? null : count.tag)}
                    {...(count.tag === 'pain' && !pressed
                      ? { color: 'effort.hard' }
                      : {})}
                    data-tag={count.tag}
                  >
                    {tagCountLabel(count)}
                  </PillButton>
                );
              })}
            </HStack>
          </Box>
        )
      )}
    </VStack>
  );
};
