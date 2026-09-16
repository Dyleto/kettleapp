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
    // Le journal est un écran de lecture à deux colonnes, pas un formulaire :
    // à partir de 2xl il prend la largeur que demandent deux mois de
    // calendrier côte à côte, sinon la liste se réduit à un filet de texte.
    <Box
      maxW={{ base: COACH_CONTENT_MAX_W, '2xl': '1400px' }}
      mx="auto"
      px={4}
      py={8}
    >
      <VStack align="stretch" gap={1} mb={6}>
        {/* Le repère d'identité est dans le titre, pas dans la sortie.
            C'était l'inverse : « Journal complet » en titre, le nom du client
            dans le bouton de retour. Sur un écran qu'on consulte client après
            client, on lisait donc le nom de celui qu'on quitte pour savoir
            celui qu'on regarde.

            Le retour, lui, n'a plus besoin de le répéter : il dit simplement
            où il ramène. */}
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
