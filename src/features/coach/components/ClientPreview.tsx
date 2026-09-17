import { Avatar, Box, Button, HStack, Skeleton, Text, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { Client } from '@/types';
import { COACH_ROUTES } from '@/config/routes';
import { useClientHistory } from '@/features/coach/hooks/useClientHistory';
import { SessionHistoryCard } from '@/features/client';
import { EtatVide } from '@/components/EtatVide';

interface ClientPreviewProps {
  /** Le client survolé dans la liste, ou `null` si aucun n'est choisi. */
  client: Client | null;
}

/**
 * Ce qu'il y a à savoir d'un client, sans quitter la liste.
 *
 * Entre 30 et 55 % de la fenêtre restait vide sur cet écran : la liste
 * s'arrêtait à 720 px et le reste ne servait à rien. Le coach devait ouvrir
 * l'atelier — donc perdre la liste — pour lire ce que son client avait dit de
 * sa dernière séance, puis revenir pour passer au suivant.
 *
 * L'aperçu ne remplace pas l'atelier : il répond à « qu'est-ce qui m'attend
 * chez celui-là ? », qui est la question qu'on se pose en parcourant la
 * liste. Ouvrir reste un clic.
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
