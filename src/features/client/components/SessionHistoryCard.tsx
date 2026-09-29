import { Card } from '@/shared/components/Card';
import { CompletedSession } from '@/shared/types';
import {
  getCompletedSessionBlockTypes,
  getEffortSummary,
  getRelativeDate,
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
   * `journal` sur l'historique : la date exacte, et le commentaire s'il y en
   * a un — on est venu lire. `accueil` sur la page du jour : la date en forme
   * relative, parce qu'on y répond à « c'était quand », et pas de
   * commentaire, parce qu'on ne fait que passer.
   *
   * Le reste ne change pas, et c'est tout l'intérêt : l'accueil dessinait sa
   * propre carte, sans chevron ni libellé d'action, à côté d'une carte qui en
   * avait un. Deux cartes voisines qui ne suivent pas la même convention font
   * de la flèche absente un signe — alors qu'elle ne voulait rien dire.
   */
  variant?: 'journal' | 'accueil';
}

/**
 * Une séance terminée, en carte. Deux variantes, une seule convention.
 *
 * `journal` sur l'historique, `accueil` sur la page du jour : ce qui change
 * est ce qui se lit, jamais la forme. L'accueil dessinait autrefois sa propre
 * carte, sans chevron, à côté d'une carte qui en avait un — et la flèche
 * absente devenait un signe alors qu'elle ne voulait rien dire.
 */
export const SessionHistoryCard = ({
  completed,
  showUnseenIndicator = false,
  variant = 'journal',
}: SessionHistoryCardProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const completedDate =
    variant === 'accueil'
      ? getRelativeDate(completed.completedAt)
      : new Intl.DateTimeFormat('fr-FR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }).format(new Date(completed.completedAt));

  // Un mot que le client et le coach lisent de la même façon, au lieu d'un
  // nombre que ni l'un ni l'autre ne peut interpréter.
  const effort = getEffortSummary(completed);

  return (
    <Card
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

        {variant === 'journal' && completed.clientNotes && (
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
        editable
      />
    </Card>
  );
};
