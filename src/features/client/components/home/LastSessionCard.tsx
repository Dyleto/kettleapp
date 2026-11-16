import { Box, HStack, Text } from '@chakra-ui/react';
import type { CompletedSession } from '@/shared/types';
import { EFFORT_ZONE_COLOR } from '../../constants';
import { getEffortSummary } from '../../format';
import { pastDayLabel } from '../../home';
import { openingTitle } from '../../guided/outline';
import { useCoachVoice } from '../../coach';
import { Card } from '@/kit';

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
  const title = openingTitle({
    order: completed.sessionOrder,
    name: completed.sessionName,
  });
  const day = pastDayLabel(new Date(completed.completedAt));
  const note = completed.clientNotes?.trim();
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
        {(note || !completed.viewedByCoach) && (
          <Text fontSize="sm" color="fg.muted" mt="10px">
            {note && <>«&nbsp;{note}&nbsp;»</>}
            {note && !completed.viewedByCoach && ' · '}
            {!completed.viewedByCoach &&
              `${coach.opening} ne l'a pas encore lue.`}
          </Text>
        )}
      </Box>
    </Card>
  );
};
