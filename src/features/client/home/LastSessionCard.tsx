import { useEffect, useRef, useState } from 'react';
import { Box, HStack, Text } from '@chakra-ui/react';
import type { CompletedSession } from '@/shared/types';
import { EFFORT_ZONE_COLOR } from '@/domain/history/effort';
import { getEffortSummary } from '@/domain/history/effort';
import { pastDayLabel } from '@/features/client/home/focus';
import { useCoachVoice } from '@/features/client/common/coach';
import { Bubble, Card, Chip } from '@/kit';
import { hasUnread, latestReply, replyLine } from '@/domain/inbox/reply';
import { useReadReplies } from '@/features/client/common/useReadReplies';
import { sessionName } from '@/domain/session/name';

/**
 * La dernière séance faite, et où en est ce qu'on en a dit.
 *
 * La liste « Séances récentes » se réduit à elle : les autres sont dans
 * Progrès, et trois cartes identiques à l'accueil repoussaient ce qu'il y a
 * à faire sous le pli. Celle-ci reste parce qu'elle porte une question
 * ouverte — le coach a-t-il lu ? — et c'est ici qu'on revient la poser.
 *
 * Un bilan d'avant l'échelle d'effort n'a pas de pastille : on n'invente
 * pas un ressenti qu'on n'a jamais demandé.
 *
 * Quand le coach a répondu, sa réponse remplace la question : la bulle,
 * avec « Nouveau » tant que le client ne l'a pas vue. La montrer, c'est
 * l'avoir lue — c'est ce qui fait lire au coach « lue par Sarah ». La
 * pastille, elle, se décide à l'arrivée et tient le temps de la visite :
 * l'éteindre à la seconde où la lecture part la ferait disparaître sous
 * les yeux de celui qu'elle prévient.
 *
 * La bulle est sous le bouton et non dedans : le bouton porte son propre
 * nom, et un lecteur d'écran n'aurait jamais lu la réponse.
 */
export const LastSessionCard = ({
  completed,
  onOpen,
}: {
  completed: CompletedSession;
  onOpen: () => void;
}) => {
  const coach = useCoachVoice();
  const effort = getEffortSummary(completed);
  // Le nom que le coach a donné, sinon le rang : « Dimanche · Full body A ».
  const title = sessionName({
    order: completed.sessionOrder,
    name: completed.sessionName,
  });
  const day = pastDayLabel(new Date(completed.completedAt));
  const note = completed.clientNotes?.trim();
  const reply = latestReply(completed.replies);
  const [fresh] = useState(() => hasUnread(completed.replies));
  const { mutate: markRead } = useReadReplies();
  const asked = useRef<string | null>(null);
  useEffect(() => {
    if (!hasUnread(completed.replies) || asked.current === completed._id)
      return;
    asked.current = completed._id;
    markRead(completed._id);
  }, [completed, markRead]);
  return (
    <Card label="Ta dernière séance" gap="10px" p={0}>
      <Box
        as="button"
        textAlign="left"
        p="18px"
        borderRadius="card"
        aria-label={`Voir ta dernière séance — ${day}, ${title}`}
        onClick={onOpen}
        _hover={{ bg: 'whiteAlpha.50' }}
      >
        <HStack gap={2} align="center">
          <Text fontWeight="bold" lineClamp={1}>
            {day} · {title}
          </Text>
          {reply && fresh && <Chip tone="amber">Nouveau</Chip>}
          {effort && (
            <Box
              as="span"
              ml="auto"
              flexShrink={0}
              px="11px"
              py="5px"
              borderRadius="full"
              bg="bg.surface"
              color={EFFORT_ZONE_COLOR[effort.zone]}
              fontSize="13px"
              fontWeight="600"
              whiteSpace="nowrap"
            >
              {effort.label}
            </Box>
          )}
        </HStack>
        {!reply && (note || !completed.viewedByCoach) && (
          <Text fontSize="sm" color="fg.muted" mt="10px">
            {note && <>«&nbsp;{note}&nbsp;»</>}
            {note && !completed.viewedByCoach && ' · '}
            {!completed.viewedByCoach &&
              `${coach.opening} ne l'a pas encore lue.`}
          </Text>
        )}
      </Box>
      {reply && (
        <Box px="18px" pb="18px" mt="-8px">
          <Bubble from={reply.firstName || coach.opening} data-reply>
            {replyLine(reply)}
          </Bubble>
        </Box>
      )}
    </Card>
  );
};
