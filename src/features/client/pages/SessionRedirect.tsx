import { Navigate, useOutletContext } from 'react-router';
import { Container, Skeleton, VStack } from '@chakra-ui/react';
import { CLIENT_CONTENT_MAX_W, useClientSessions } from '@/features/client';
import { CLIENT_ROUTES } from '@/shared/config/routes';

type ClientSessionsData = ReturnType<typeof useClientSessions>;

/**
 * `/client/session` n'affiche plus rien : elle redirige vers l'adresse propre
 * de la prochaine séance.
 *
 * Sans cela, deux écrans montraient la même chose sous deux adresses dont une
 * seule était rechargeable — terminer une séance puis rafraîchir ne montrait
 * plus la même page. La même asymétrie que celle retirée côté coach avec
 * `/coach/clients/:id` → `/s/1`.
 */
const SessionRedirect = () => {
  const { nextSession, isLoading } = useOutletContext<ClientSessionsData>();

  if (isLoading) {
    return (
      <Container maxW={CLIENT_CONTENT_MAX_W} py={8} px={4}>
        <VStack align="stretch" gap={4}>
          <Skeleton h="20px" w="120px" borderRadius="md" />
          <Skeleton h="80px" borderRadius="lg" />
          <Skeleton h="200px" borderRadius="lg" />
        </VStack>
      </Container>
    );
  }

  // Programme vide : il n'y a pas de séance à adresser. L'écran Programme
  // dit exactement la même chose, mot pour mot (voir p3-3).
  if (!nextSession) {
    return <Navigate to={CLIENT_ROUTES.program} replace />;
  }

  return <Navigate to={CLIENT_ROUTES.sessionById(nextSession._id)} replace />;
};

export default SessionRedirect;
