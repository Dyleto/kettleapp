import { Outlet } from 'react-router';
import { Container } from '@chakra-ui/react';
import { CLIENT_CONTENT_MAX_W, useClientSessions } from '@/features/client';
import { ErrorState } from '@/shared/components/ErrorState';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

/** L'écran de panne de l'espace client. Un composant à part pour que le
 * titre de l'onglet ne change que lorsqu'il s'affiche. */
const ProgramUnavailable = ({
  onRetry,
  isRetrying,
}: {
  onRetry: () => void;
  isRetrying: boolean;
}) => {
  useDocumentTitle('Kettle ne répond pas');
  return (
    <Container maxW={CLIENT_CONTENT_MAX_W} py={8} px={4}>
      <ErrorState
        headingLevel="h1"
        line="Ton programme n'a pas bougé. Vérifie ta connexion, puis réessaie."
        onRetry={onRetry}
        isRetrying={isRetrying}
      />
    </Container>
  );
};

/**
 * La porte par laquelle passe tout écran qui lit le programme du client.
 *
 * Elle charge le programme et l'historique, et ne laisse monter une page que
 * si elle a de quoi l'afficher. Avant elle, chaque page lisait une liste de
 * séances qui valait `[]` aussi bien pour « le coach n'a rien écrit » que
 * pour « le serveur n'a pas répondu » : l'accueil, le programme et
 * l'historique concluaient tous au programme vide, et la fiche d'une séance
 * annonçait qu'elle avait été supprimée.
 *
 * La garde est ici et non dans chaque page, parce qu'une garde par page est
 * une garde qu'on oublie à la page suivante — c'est exactement ce qui s'était
 * produit, quatre fois. Une page placée sous cette route ne peut pas se
 * tromper ; une page placée ailleurs ne reçoit pas de programme du tout, et
 * le voit au premier rendu.
 *
 * « Mon compte » reste dehors : on doit pouvoir s'y rendre, et s'y
 * déconnecter, quand le programme ne répond pas.
 */
const ClientProgramBoundary = () => {
  const clientSessions = useClientSessions();

  if (clientSessions.isUnavailable) {
    return (
      <ProgramUnavailable
        onRetry={clientSessions.retry}
        isRetrying={clientSessions.isRetrying}
      />
    );
  }

  return <Outlet context={clientSessions} />;
};

export default ClientProgramBoundary;
