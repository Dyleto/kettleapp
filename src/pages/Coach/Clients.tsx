import { useCallback, useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button, Container, HStack, Text, VStack } from '@chakra-ui/react';
import { LuCheck, LuUserPlus } from 'react-icons/lu';
import { ClientsList, COACH_CONTENT_MAX_W } from '@/features/coach';
import { useClients } from '@/features/coach/hooks/useClients';
import { useGenerateInvitation } from '@/features/coach/hooks/useGenerateInvitation';
import { toaster } from '@/components/ui/toasterInstance';

const Clients = () => {
  const { data: clients = [] } = useClients();
  const { mutate: generateInvitation, isPending } = useGenerateInvitation();
  const [isCopied, setIsCopied] = useState(false);
  useDocumentTitle('Mes clients');

  const copy = useCallback(async (link: string, expiresAt?: string) => {
    // La date de validité se dit ici, au moment où le lien part — pas sur une
    // rangée permanente de l'écran. Un lien d'invitation se crée une fois par
    // client ; son échéance n'a d'intérêt qu'à cet instant-là.
    const echeance = expiresAt
      ? ` Valable jusqu'au ${new Intl.DateTimeFormat('fr-FR', {
          day: 'numeric',
          month: 'long',
        }).format(new Date(expiresAt))}.`
      : '';

    try {
      await navigator.clipboard.writeText(link);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      toaster.create({
        title: "Lien d'invitation copié",
        description: `Envoyez-le à votre client : il rejoindra votre suivi.${echeance}`,
        type: 'success',
      });
    } catch {
      // Presse-papier refusé (contexte non sécurisé, permission) : on
      // montre le lien plutôt que de laisser croire qu'il est copié.
      toaster.create({
        title: "Lien d'invitation",
        description: link,
        type: 'info',
        duration: 20000,
      });
    }
  }, []);

  /**
   * Inviter, c'est une seule action : fabriquer un lien et le copier.
   *
   * Elle passait par un tiroir latéral dont le corps entier était un bouton
   * — deux clics et un panneau pour une opération qui n'a aucun réglage. Le
   * bouton fait maintenant ce qu'il annonce.
   *
   * La copie est explicite plutôt que confiée à `useClipboard` : celui-ci
   * passe par une machine à états, et rien ne garantit que le `copy()` voie
   * la valeur posée juste avant. Un lien d'invitation copié vide ne se
   * remarque qu'au moment où le client dit qu'il n'a rien reçu.
   */
  const invite = () => {
    generateInvitation(undefined, {
      onSuccess: ({ link, expiresAt }) => {
        copy(link, expiresAt);
      },
    });
  };

  return (
    <Container maxW={COACH_CONTENT_MAX_W} py={8} px={4}>
      <VStack align="stretch" gap={6}>
        <HStack justify="space-between" align="center" gap={3}>
          <VStack align="start" gap={0} minW={0}>
            <Text as="h1" fontWeight="bold" fontSize="lg">
              Mes clients
            </Text>
            {clients.length > 0 && (
              <Text fontSize="xs" color="fg.muted">
                {clients.length} client{clients.length > 1 ? 's' : ''}
              </Text>
            )}
          </VStack>
          <Button
            size="sm"
            flexShrink={0}
            bg={isCopied ? 'app.success' : 'app.primary'}
            color="bg.canvas"
            fontWeight="bold"
            _hover={{
              bg: isCopied ? 'app.success.hover' : 'app.primary.hover',
            }}
            onClick={invite}
            loading={isPending}
          >
            {isCopied ? (
              <>
                <LuCheck /> Lien copié
              </>
            ) : (
              <>
                <LuUserPlus /> Inviter
              </>
            )}
          </Button>
        </HStack>

        {/* Pas de rangée de statut. Elle occupait en permanence deux lignes
            avant le premier client, pour une information — la date de validité
            — et une action — « Recopier » — que le bouton « Inviter » rend
            toutes deux : l'API recycle le lien encore valide, donc cliquer à
            nouveau recopie le même. */}

        <ClientsList />
      </VStack>
    </Container>
  );
};

export default Clients;
