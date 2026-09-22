import { useNavigate, useParams } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Box, Heading, Spinner, VStack } from '@chakra-ui/react';
import { useClientDetails } from '@/features/coach/hooks/useClientDetails';
import { useClientHistory } from '@/features/coach/hooks/useClientHistory';
import { ClientJournalTab } from '@/features/coach/components/ClientJournalTab';
import { COACH_ROUTES } from '@/config/routes';
import { COACH_CONTENT_MAX_W } from '@/features/coach';
import { BackLink } from '@/components/BackLink';

const ClientJournal = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const { data: client, isLoading } = useClientDetails(clientId!);
  useDocumentTitle(client ? `Journal de ${client.firstName}` : undefined);
  const { data: history = [], isLoading: isHistoryLoading } = useClientHistory(
    clientId!
  );

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="60vh"
      >
        <Spinner size="xl" />
      </Box>
    );
  }

  if (!client) return null;

  return (
    // The journal is a two-column reading screen, not a form: from 2xl it
    // takes the width two months of calendar side by side need, otherwise the
    // list shrinks to a thread of text.
    <Box
      maxW={{ base: COACH_CONTENT_MAX_W, '2xl': '1400px' }}
      mx="auto"
      px={4}
      py={8}
    >
      <VStack align="stretch" gap={1} mb={6}>
        {/* The identity marker is in the title, not in the exit. It
            used to be the other way round: "Journal complet" as the title,
            the client's name in the back button. On a screen you go through
            client after client, you therefore read the name of the one you
            are leaving to know the one you are looking at.

            The back link no longer needs to repeat it: it simply says where
            it takes you. */}
        <BackLink
          label="Programme"
          onClick={() => navigate(COACH_ROUTES.clientSession(clientId!, 1))}
        />
        <Heading as="h1" size="lg">
          Journal de {client.firstName}
        </Heading>
      </VStack>

      {isHistoryLoading ? (
        <Spinner size="lg" />
      ) : (
        <ClientJournalTab history={history} clientId={clientId!} />
      )}
    </Box>
  );
};

export default ClientJournal;
