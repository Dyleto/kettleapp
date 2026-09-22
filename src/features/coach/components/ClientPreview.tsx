import {
  Avatar,
  Box,
  Button,
  HStack,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { Client } from '@/types';
import { COACH_ROUTES } from '@/config/routes';
import { useClientHistory } from '@/features/coach/hooks/useClientHistory';
import { SessionHistoryCard } from '@/features/client';
import { EtatVide } from '@/components/EtatVide';

interface ClientPreviewProps {
  /** The client highlighted in the list, or `null` when none is chosen. */
  client: Client | null;
}

/**
 * What there is to know about a client, without leaving the list.
 *
 * Between 30 and 55 % of the window stayed empty on this screen: the list
 * stopped at 720 px and the rest served nothing. The coach had to open the
 * editor — and so lose the list — to read what their client had said about
 * their last session, then come back to move to the next one.
 *
 * The preview does not replace the editor: it answers "what is waiting for me
 * with this one?", which is the question you ask while scanning the list.
 * Opening is still one click.
 */
export const ClientPreview = ({ client }: ClientPreviewProps) => {
  const navigate = useNavigate();
  const { data: history = [], isLoading } = useClientHistory(client?._id ?? '');

  if (!client) {
    return (
      <Text fontSize="sm" color="fg.muted">
        Choisissez un client pour voir ses dernières séances.
      </Text>
    );
  }

  return (
    <VStack align="stretch" gap={4}>
      <HStack gap={3} align="center">
        <Avatar.Root size="md" flexShrink={0}>
          <Avatar.Fallback name={`${client.firstName} ${client.lastName}`} />
          {client.picture && <Avatar.Image alt="" src={client.picture} />}
        </Avatar.Root>
        <VStack align="start" gap={0} minW={0}>
          <Text fontWeight="bold" fontSize="sm" truncate maxW="100%">
            {client.firstName} {client.lastName}
          </Text>
          <Text fontSize="xs" color="fg.muted">
            {client.unseenCount > 0
              ? `${client.unseenCount} séance${client.unseenCount > 1 ? 's' : ''} à lire`
              : 'rien à lire'}
          </Text>
        </VStack>
      </HStack>

      <Button
        size="sm"
        bg="app.primary"
        color="bg.canvas"
        fontWeight="bold"
        _hover={{ bg: 'app.primary.hover' }}
        onClick={() => navigate(COACH_ROUTES.clientSession(client._id, 1))}
      >
        Ouvrir son programme
      </Button>

      <Box>
        <Text
          fontSize="xs"
          fontWeight="bold"
          color="fg.muted"
          textTransform="uppercase"
          letterSpacing="wider"
          mb={2}
        >
          Dernières séances
        </Text>
        {isLoading ? (
          <VStack align="stretch" gap={2}>
            <Skeleton h="72px" borderRadius="lg" />
            <Skeleton h="72px" borderRadius="lg" />
          </VStack>
        ) : history.length === 0 ? (
          <EtatVide
            titre="Aucune séance réalisée"
            phrase="Les séances qu'il termine apparaîtront ici, avec ce qu'il en a dit."
          />
        ) : (
          <VStack align="stretch" gap={2}>
            {history.slice(0, 3).map((completed) => (
              <SessionHistoryCard
                key={completed._id}
                completed={completed}
                variant="journal"
              />
            ))}
          </VStack>
        )}
      </Box>
    </VStack>
  );
};
