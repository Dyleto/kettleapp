import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { ActionButton, Bubble, Chip, Eyebrow } from '@/kit';
import type { InboxItem } from '@/shared/types';
import { FEEDBACK_TAG_LABELS } from '@/domain/history/tags';
import { formatPerformed } from '@/domain/history/performedFormat';
import { sessionName } from '@/domain/session/name';
import { clientLabel, tagsInOrder, whenLabel } from '@/domain/inbox/feed';
import { sentLabel } from '@/domain/inbox/reply';
import { ClientAvatar, EffortPill } from './InboxCard';
import { REACTIONS } from './reactionList';
import { ReplyComposer } from './ReplyComposer';

const EMOJI = Object.fromEntries(REACTIONS.map((r) => [r.key, r.emoji]));

/**
 * Une séance ouverte : son détail et la réponse, au même endroit.
 *
 * En feuille sur téléphone, en panneau à droite sur grand écran — la même
 * pièce, posée différemment. Le coach y lit ce qui a été fait, exercice par
 * exercice, et répond sans changer d'écran ; « Ajuster » l'emmène dans
 * l'atelier quand la réponse ne suffit pas.
 *
 * Ses réponses déjà parties se lisent avec leur état — « lue par Sarah »,
 * « pas encore lue » : c'est ce qui dit s'il peut encore la modifier.
 */
export const InboxDetail = ({
  item,
  coachId,
  onAdjust,
}: {
  item: InboxItem;
  coachId: string | undefined;
  onAdjust: () => void;
}) => {
  const { completed, client } = item;
  const tags = tagsInOrder(completed.feedback?.tags);
  const said = completed.clientNotes?.trim();
  const mine = completed.replies.filter((reply) => reply.coachId === coachId);
  const title =
    completed.sessionName ||
    sessionName({ order: completed.sessionOrder, name: completed.sessionName });

  return (
    <VStack align="stretch" gap="16px" data-inbox-detail={completed._id}>
      <HStack gap="12px">
        <ClientAvatar client={client} />
        <Box minW={0}>
          <Text as="h2" fontWeight="800" fontSize="20px" truncate>
            {clientLabel(client)}
          </Text>
          <Text color="fg.muted" fontSize="sm">
            {title} · {whenLabel(completed.completedAt)}
          </Text>
        </Box>
      </HStack>

      <HStack gap="6px" wrap="wrap">
        <EffortPill item={item} />
        {tags.map((tag) => (
          <Chip key={tag} tone={tag === 'pain' ? 'coral' : 'neutral'}>
            {FEEDBACK_TAG_LABELS[tag]}
          </Chip>
        ))}
      </HStack>

      <VStack align="stretch" gap="8px">
        <Eyebrow>Son mot</Eyebrow>
        {said ? (
          <Bubble>{said}</Bubble>
        ) : (
          <Text color="fg.muted">Aucun mot.</Text>
        )}
      </VStack>

      <VStack align="stretch" gap="8px">
        <Eyebrow>Ta réponse</Eyebrow>
        {mine.map((reply) => (
          <Box key={reply.sentAt}>
            <Bubble tone="raised">
              {[reply.reaction && EMOJI[reply.reaction], reply.text]
                .filter(Boolean)
                .join(' ')}
            </Bubble>
            <Text fontSize="xs" color="fg.muted" mt="4px">
              {sentLabel(reply, client.firstName)}
            </Text>
          </Box>
        ))}
        <ReplyComposer item={item} coachId={coachId} />
      </VStack>

      <VStack align="stretch" gap="8px">
        <Eyebrow>Ce qui a été fait</Eyebrow>
        <VStack align="stretch" gap={0} bg="surface.card" borderRadius="card">
          {completed.blocks.flatMap((block) =>
            block.exercises.map((entry) => (
              <HStack
                key={`${block.order}:${entry.order}`}
                justify="space-between"
                px="16px"
                py="12px"
                borderTopWidth="1px"
                borderColor="line"
                _first={{ borderTopWidth: 0 }}
              >
                <Text fontWeight="600">
                  {typeof entry.exercise?.name === 'string'
                    ? entry.exercise.name
                    : 'Exercice'}
                </Text>
                <Text color="fg.muted" fontSize="sm" textAlign="right">
                  {formatPerformed(entry.performed) ?? 'rien de noté'}
                </Text>
              </HStack>
            ))
          )}
        </VStack>
      </VStack>

      <ActionButton tone="ghost" size="md" onClick={onAdjust}>
        Ajuster le programme
      </ActionButton>
    </VStack>
  );
};
