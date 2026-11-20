import { Box, Text, VStack } from '@chakra-ui/react';
import { Bubble, Eyebrow } from '@/kit';
import type { InboxItem } from '@/shared/types';
import { replyLine, sentLabel } from '@/domain/inbox/reply';
import { ReplyComposer } from './ReplyComposer';

/**
 * « Ta réponse » : celles déjà parties, avec leur état, puis le champ.
 *
 * L'état — « lue par Sarah », « pas encore lue » — dit au coach s'il peut
 * encore modifier la sienne. Sorti du panneau de « À lire » pour que les
 * ressentis d'un client répondent avec la même pièce : deux champs de
 * réponse auraient fini par ne plus suivre la même règle de modification.
 */
export const ReplyThread = ({
  item,
  coachId,
}: {
  item: InboxItem;
  coachId: string | undefined;
}) => {
  const mine = item.completed.replies.filter(
    (reply) => reply.coachId === coachId
  );
  return (
    <VStack align="stretch" gap="8px" data-reply-thread>
      <Eyebrow>Ta réponse</Eyebrow>
      {mine.map((reply) => (
        <Box key={reply.sentAt} data-reply>
          <Bubble tone="raised">{replyLine(reply)}</Bubble>
          <Text fontSize="xs" color="fg.muted" mt="4px">
            {sentLabel(reply, item.client.firstName)}
          </Text>
        </Box>
      ))}
      <ReplyComposer item={item} coachId={coachId} />
    </VStack>
  );
};
