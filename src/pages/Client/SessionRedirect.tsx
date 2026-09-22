import { Navigate, useOutletContext } from 'react-router-dom';
import { Container, Skeleton, VStack } from '@chakra-ui/react';
import { CLIENT_CONTENT_MAX_W, useClientSessions } from '@/features/client';
import { CLIENT_ROUTES } from '@/config/routes';

type ClientSessionsData = ReturnType<typeof useClientSessions>;

/**
 * `/client/session` shows nothing any more: it redirects to the next
 * session's own address.
 *
 * Without this, two screens showed the same thing under two addresses of
 * which only one was reloadable — finishing a session then refreshing no
 * longer showed the same page. The same asymmetry removed on the coach side
 * with `/coach/clients/:id` → `/s/1`.
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

  // Empty programme: there is no session to address. The Programme screen
  // says exactly the same thing, word for word (see p3-3).
  if (!nextSession) {
    return <Navigate to={CLIENT_ROUTES.program} replace />;
  }

  return <Navigate to={CLIENT_ROUTES.sessionById(nextSession._id)} replace />;
};

export default SessionRedirect;
