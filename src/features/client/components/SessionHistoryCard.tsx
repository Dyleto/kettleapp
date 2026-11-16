import { LegacyCard } from '@/shared/components/LegacyCard';
import { CompletedSession } from '@/shared/types';
import {
  getCompletedSessionBlockTypes,
  getEffortSummary,
} from '@/features/client';
import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { LuChevronRight } from 'react-icons/lu';
import { useState } from 'react';
import { CompletedSessionDrawer } from './CompletedSessionDrawer';
import { EFFORT_ZONE_COLOR } from '@/features/client/constants';
import { sessionTitle } from '@/features/program/sessionTitle';

interface SessionHistoryCardProps {
  completed: CompletedSession;
  showUnseenIndicator?: boolean;
  /**
   * La carte est lue par le coach, pas par celui qui a fait la séance.
   *
   * L'aperçu d'un client la réutilisait telle quelle, et elle ouvrait donc
   * le bilan en mode modifiable : le coach y voyait « Modifier » et « Ton
   * commentaire » sur la séance de quelqu'un d'autre.
   */
  readOnly?: boolean;
}

/**
 * Une séance terminée, en carte : la date exacte et le commentaire, parce
 * qu'on est venu lire.
 *
 * Elle avait une variante pour l'accueil, à la date relative et sans
 * commentaire. L'accueil ne montre plus que la dernière séance, dans sa
 * propre carte (`LastSessionCard`) qui porte ce que celle-ci ne dit pas —
 * le coach a-t-il lu ? —, et la variante n'avait plus de lecteur.
 */
export const SessionHistoryCard = ({
  completed,
  showUnseenIndicator = false,
  readOnly = false,
}: SessionHistoryCardProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const completedDate = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(completed.completedAt));

  // Un mot que le client et le coach lisent de la même façon, au lieu d'un
  // nombre que ni l'un ni l'autre ne peut interpréter.
  const effort = getEffortSummary(completed);

  return (
    <LegacyCard
      accentColor="app.primary"
      hoverEffect="border"
      withGlow={false}
      onClick={() => setIsDrawerOpen(true)}
      p={4}
    >
      <VStack align="stretch" gap={2}>
        <HStack justify="space-between" align="center">
          <HStack gap={2}>
            <Text fontSize="sm" fontWeight="bold">
              {sessionTitle(completed.sessionOrder, completed.sessionName)}
            </Text>
            {showUnseenIndicator && (
              <Box
                px={2}
                py={0.5}
                borderRadius="full"
                bg="session.work/16"
                color="session.work.fg"
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Nouveau
              </Box>
            )}
          </HStack>
          {effort && (
            <Text
              fontSize="xs"
              fontWeight="bold"
              color={EFFORT_ZONE_COLOR[effort.zone]}
            >
              {effort.label}
            </Text>
          )}
        </HStack>

        <Text fontSize="xs" color="fg.muted">
          {completedDate} · {getCompletedSessionBlockTypes(completed)}
        </Text>

        {completed.clientNotes && (
          <Text fontSize="xs" color="fg.muted" fontStyle="italic" lineClamp={2}>
            "{completed.clientNotes}"
          </Text>
        )}

        <HStack gap={1} color="app.primary" justify="flex-end">
          <Text fontSize="xs" fontWeight="medium">
            Voir le détail
          </Text>
          <LuChevronRight size={13} color="var(--chakra-colors-app-primary)" />
        </HStack>
      </VStack>

      <CompletedSessionDrawer
        completed={completed}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        editable={!readOnly}
      />
    </LegacyCard>
  );
};
