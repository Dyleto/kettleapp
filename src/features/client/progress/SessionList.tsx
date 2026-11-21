import { chakra, Portal, Text, VStack } from '@chakra-ui/react';
import { LuChevronRight } from 'react-icons/lu';
import type { CompletedSession, Session } from '@/shared/types';
import { EffortPill, Eyebrow, Sheet } from '@/kit';
import { useSheetDismiss } from '@/features/workshop';
import { rowDate } from '@/domain/history/journal';
import { sessionMentions } from '@/domain/history/sessionRow';
import { formatDayLabel } from '@/domain/week/dates';
import { sessionName } from '@/domain/session/name';

const SessionRow = ({
  completed,
  sessions,
  open,
  onOpen,
}: {
  completed: CompletedSession;
  sessions: readonly Session[];
  open: boolean;
  onOpen: () => void;
}) => {
  const mentions = sessionMentions(completed, sessions);
  return (
    <chakra.button
      type="button"
      onClick={onOpen}
      display="flex"
      alignItems="center"
      gap="12px"
      w="full"
      textAlign="left"
      px="16px"
      py="13px"
      borderTopWidth="1px"
      borderColor="line"
      _first={{ borderTopWidth: 0 }}
      bg={open ? 'bg.raised' : undefined}
      _hover={{ bg: 'bg.raised' }}
      aria-current={open ? 'true' : undefined}
      data-session-row={completed._id}
    >
      <VStack align="start" gap="2px" flex={1} minW={0}>
        <Text fontWeight="700" truncate maxW="full">
          {completed.sessionName ||
            sessionName({
              order: completed.sessionOrder,
              name: completed.sessionName,
            })}
        </Text>
        <Text fontSize="sm" color="fg.muted">
          {[rowDate(completed.completedAt), ...mentions].join(' · ')}
        </Text>
      </VStack>
      <EffortPill effort={completed.feedback?.effort} />
      <chakra.span color="fg.muted" aria-hidden flexShrink={0}>
        <LuChevronRight size={18} />
      </chakra.span>
    </chakra.button>
  );
};

const Rows = ({
  history,
  sessions,
  openId = null,
  onOpen,
}: {
  history: readonly CompletedSession[];
  sessions: readonly Session[];
  openId?: string | null;
  onOpen: (completed: CompletedSession) => void;
}) => (
  <VStack
    align="stretch"
    gap={0}
    bg="surface.card"
    borderRadius="card"
    overflow="hidden"
    data-session-list
  >
    {history.map((completed) => (
      <SessionRow
        key={completed._id}
        completed={completed}
        sessions={sessions}
        open={completed._id === openId}
        onOpen={() => onOpen(completed)}
      />
    ))}
  </VStack>
);

/**
 * « Tes séances » : une ligne par séance faite, la plus récente d'abord —
 * son nom du jour, sa date et ce qu'il y a à savoir avant de l'ouvrir
 * (« Julie a répondu », « modifiée depuis »…), son ressenti.
 *
 * Elle remplace des cartes qui écrivaient les formats de la séance et
 * cachaient tout le reste derrière « Voir le détail » ; une réponse du
 * coach ne se voyait qu'une fois la séance ouverte.
 *
 * `openId` marque la ligne dont le détail est ouvert à côté, sur grand
 * écran : sans elle, rien ne disait laquelle le panneau montrait.
 */
export const SessionList = ({
  history,
  sessions,
  openId,
  onOpen,
}: {
  history: readonly CompletedSession[];
  sessions: readonly Session[];
  openId?: string | null;
  onOpen: (completed: CompletedSession) => void;
}) => (
  <VStack align="stretch" gap="8px">
    <Eyebrow>Tes séances</Eyebrow>
    <Rows
      history={history}
      sessions={sessions}
      openId={openId}
      onOpen={onOpen}
    />
  </VStack>
);

/**
 * Les séances d'un jour qui en a deux : la pastille du calendrier ouvre
 * cette liste, au lieu de choisir l'une et de faire disparaître l'autre.
 */
export const DaySheet = ({
  day,
  history,
  sessions,
  onOpen,
  onClose,
}: {
  /** « 2026-08-30 ». */
  day: string;
  history: readonly CompletedSession[];
  sessions: readonly Session[];
  onOpen: (completed: CompletedSession) => void;
  onClose: () => void;
}) => {
  useSheetDismiss(true, onClose);
  const title = formatDayLabel(day);
  const label = title.charAt(0).toUpperCase() + title.slice(1);
  return (
    <Portal>
      <Sheet label={label} onDismiss={onClose}>
        <Text as="h2" fontWeight="800" fontSize="22px">
          {label}
        </Text>
        <Rows history={history} sessions={sessions} onOpen={onOpen} />
      </Sheet>
    </Portal>
  );
};
