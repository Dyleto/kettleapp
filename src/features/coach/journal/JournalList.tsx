import {
  Box,
  chakra,
  HStack,
  Text,
  VisuallyHidden,
  VStack,
} from '@chakra-ui/react';
import type { CompletedSession } from '@/shared/types';
import { EffortPill } from '@/kit';
import { rowDate } from '@/domain/history/journal';
import { sessionName } from '@/domain/session/name';

/**
 * Ce que la ligne dit à droite : le ressenti, « ancien bilan » quand la
 * séance date des cinq curseurs, et rien quand le client ne s'est pas
 * prononcé — « ancien bilan » sur une séance d'hier serait faux.
 */
export const Verdict = ({ completed }: { completed: CompletedSession }) => {
  if (completed.feedback?.effort !== undefined)
    return <EffortPill effort={completed.feedback.effort} />;
  if (completed.metrics)
    return (
      <Text as="span" fontSize="xs" color="fg.muted" flexShrink={0}>
        ancien bilan
      </Text>
    );
  return null;
};

/**
 * Une séance faite, en une ligne : son nom, sa date, le mot du client, son
 * ressenti.
 *
 * Le point ambre dit qu'elle n'est pas encore lue. Il tombe quand le coach
 * l'ouvre, et non plus quand il ouvre l'écran : l'ancien journal marquait
 * tout l'historique lu d'un coup, et un coach venu relire une séance
 * effaçait sans le savoir les trois arrivées depuis. Un lecteur d'écran
 * l'entend en mots, « à lire ».
 *
 * Sans mot, rien : « Aucun commentaire laissé par le client » sous une
 * ligne sur deux était du bruit.
 */
const JournalRow = ({
  completed,
  open,
  onOpen,
}: {
  completed: CompletedSession;
  open: boolean;
  onOpen: () => void;
}) => {
  const said = completed.clientNotes?.trim();
  const unread = !completed.viewedByCoach;
  return (
    <chakra.button
      type="button"
      onClick={onOpen}
      display="flex"
      alignItems="flex-start"
      gap="12px"
      w="full"
      textAlign="left"
      px="16px"
      py="14px"
      borderTopWidth="1px"
      borderColor="line"
      _first={{ borderTopWidth: 0 }}
      bg={open ? 'bg.raised' : 'transparent'}
      _hover={{ bg: 'bg.raised' }}
      aria-current={open ? 'true' : undefined}
      data-journal-row={completed._id}
      data-unread={unread || undefined}
    >
      <VStack align="stretch" gap="4px" flex={1} minW={0}>
        <HStack gap="8px">
          <Text fontWeight="700" truncate>
            {completed.sessionName ||
              sessionName({
                order: completed.sessionOrder,
                name: completed.sessionName,
              })}
          </Text>
          {unread && (
            <>
              <Box
                aria-hidden
                w="8px"
                h="8px"
                flexShrink={0}
                borderRadius="full"
                bg="app.primary"
                data-unread-dot
              />
              <VisuallyHidden>, à lire</VisuallyHidden>
            </>
          )}
        </HStack>
        <Text fontSize="sm" color="fg.muted">
          {rowDate(completed.completedAt)}
        </Text>
        {said && (
          <Text fontSize="sm" whiteSpace="pre-wrap" lineClamp={3}>
            « {said} »
          </Text>
        )}
      </VStack>
      <Verdict completed={completed} />
    </chakra.button>
  );
};

/** Les séances faites, de la plus récente à la plus ancienne. */
export const JournalList = ({
  history,
  openId,
  onOpen,
}: {
  history: CompletedSession[];
  openId: string | null;
  onOpen: (completed: CompletedSession) => void;
}) => (
  <VStack
    align="stretch"
    gap={0}
    bg="bg.surface"
    borderRadius="18px"
    overflow="hidden"
    data-journal-list
  >
    {history.map((completed) => (
      <JournalRow
        key={completed._id}
        completed={completed}
        open={completed._id === openId}
        onOpen={() => onOpen(completed)}
      />
    ))}
  </VStack>
);
