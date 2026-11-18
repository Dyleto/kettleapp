import { useState } from 'react';
import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { ActionButton, AutoResizeTextarea, Chip } from '@/kit';
import type { InboxItem } from '@/shared/types';
import { toaster } from '@/shared/components/ui/toasterInstance';
import { myLastReply, type Reaction } from '@/domain/inbox/reply';
import { useReply } from '@/features/coach/hooks/useInboxActions';
import { Reactions } from './Reactions';

/** Les quatre réponses toutes faites de la maquette. */
const QUICK_REPLIES = [
  'Bien joué',
  'J’allège la prochaine',
  'On monte la charge',
  'Repose-toi',
];

/**
 * Répondre : quatre réponses toutes faites, un champ libre, les réactions.
 *
 * Le brouillon part de la réponse que le coach peut encore modifier — la
 * sienne, pas encore lue : la rouvrir la retrouve, au lieu d'en commencer
 * une seconde qui remplacerait la première sans le dire.
 *
 * Une réponse toute faite remplit le champ s'il est vide, et s'ajoute à ce
 * qui y est sinon : elle sert à commencer, pas à effacer ce qu'on a tapé.
 */
export const ReplyComposer = ({
  item,
  coachId,
  onSent,
}: {
  item: InboxItem;
  coachId: string | undefined;
  onSent?: () => void;
}) => {
  const mine = myLastReply(item.completed.replies, coachId);
  const editable = mine && !mine.readAt ? mine : undefined;
  const [text, setText] = useState(editable?.text ?? '');
  const [reaction, setReaction] = useState<Reaction | undefined>(
    editable?.reaction
  );
  const reply = useReply();
  const name = item.client.firstName?.trim();
  const empty = !text.trim() && !reaction;

  const send = () =>
    reply.mutate(
      {
        completedId: item.completed._id,
        body: { text: text.trim() || null, reaction: reaction ?? null },
      },
      {
        onSuccess: () => onSent?.(),
        onError: () =>
          toaster.create({
            type: 'error',
            title: 'Ta réponse n’est pas partie',
            description: 'Ton texte est toujours là : renvoie-la d’une touche.',
          }),
      }
    );

  return (
    <VStack align="stretch" gap="12px">
      <HStack gap="6px" wrap="wrap">
        {QUICK_REPLIES.map((quick) => (
          <Box
            key={quick}
            as="button"
            onClick={() =>
              setText((was) => (was.trim() ? `${was.trim()} ${quick}` : quick))
            }
          >
            <Chip tone="outline">{quick}</Chip>
          </Box>
        ))}
      </HStack>
      <AutoResizeTextarea
        aria-label={name ? `Répondre à ${name}` : 'Ta réponse'}
        placeholder={name ? `Répondre à ${name}…` : 'Ta réponse…'}
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={2000}
      />
      <HStack gap="10px" justify="space-between" wrap="wrap">
        <Reactions
          active={reaction}
          onPick={(key) =>
            setReaction((was) => (was === key ? undefined : key))
          }
        />
        <ActionButton
          size="md"
          onClick={send}
          disabled={empty || reply.isPending}
          loading={reply.isPending}
        >
          {name ? `Envoyer à ${name}` : 'Envoyer'}
        </ActionButton>
      </HStack>
      {editable && (
        <Text fontSize="xs" color="fg.muted">
          Pas encore lue : tu peux encore la modifier.
        </Text>
      )}
    </VStack>
  );
};
