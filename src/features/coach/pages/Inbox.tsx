import { Box, Container, HStack, Text, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { COACH_ROUTES } from '@/shared/config/routes';
import { ActionButton, Card, Chip, EmptyState, LoadFailure } from '@/kit';
import { sessionName } from '@/domain/session/name';
import { useInbox } from '@/features/coach/hooks/useInbox';
import { COACH_CONTENT_MAX_W } from '@/features/coach/constants';
import type { InboxItem } from '@/shared/types';

/** « 3 séances », « 1 séance » : le compte du titre. */
const sessionsWord = (n: number): string => `${n} séance${n > 1 ? 's' : ''}`;

/** Le jour d'une séance, comme la liste le dit en attendant le fil (E2). */
const dayOf = (iso: string): string =>
  new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso));

/** Le nom d'un client, ou ce qu'on dit quand son compte n'en porte plus. */
const clientName = ({ client }: InboxItem): string =>
  `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim() ||
  'Client sans nom';

/**
 * « À lire » : ce que les clients ont fait depuis la dernière visite.
 *
 * L'espace coach s'ouvre ici, et non plus sur la liste des clients : le coach
 * y lisait « 3 séances à lire » ligne par ligne, puis ouvrait chaque journal.
 *
 * Cette page porte la navigation (E1) : un titre, le même compte que
 * l'onglet, et la liste nue. L'ordre de lecture, les cartes, les réactions
 * et « Déjà lues » sont la ligne suivante du plan (E2, E3).
 */
const Inbox = () => {
  useDocumentTitle('À lire');
  const navigate = useNavigate();
  const inbox = useInbox();
  const { data, isLoading } = inbox;

  if (inbox.isError)
    return (
      <Container maxW={COACH_CONTENT_MAX_W} py={8} px={4}>
        <LoadFailure query={inbox} />
      </Container>
    );

  const total = data?.total ?? 0;
  return (
    <Container maxW={COACH_CONTENT_MAX_W} py={8} px={4}>
      <VStack align="stretch" gap={4}>
        <HStack gap={3}>
          <Text as="h1" fontWeight="bold" fontSize="lg">
            À lire
          </Text>
          {total > 0 && <Chip tone="amber">{sessionsWord(total)}</Chip>}
        </HStack>

        {!isLoading && total === 0 && (
          <EmptyState
            mood="bravo"
            title="Tout est lu"
            line="Les prochaines séances de tes clients arriveront ici, la plus préoccupante en premier."
            action={
              <ActionButton
                tone="ghost"
                size="md"
                onClick={() => navigate(COACH_ROUTES.clients)}
              >
                Voir mes clients
              </ActionButton>
            }
          />
        )}

        {data?.items.map((item) => (
          <Card key={item.completed._id}>
            <Box>
              <Text fontWeight="700">{clientName(item)}</Text>
              <Text color="fg.muted" fontSize="sm">
                {item.completed.sessionName ||
                  sessionName({
                    order: item.completed.sessionOrder,
                    name: item.completed.sessionName,
                  })}{' '}
                · {dayOf(item.completed.completedAt)}
              </Text>
            </Box>
          </Card>
        ))}
      </VStack>
    </Container>
  );
};

export default Inbox;
