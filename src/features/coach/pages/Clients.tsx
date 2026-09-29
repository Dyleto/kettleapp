import { useCallback, useState } from 'react';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import {
  Box,
  Button,
  Container,
  Grid,
  HStack,
  Text,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import { LuCheck, LuUserPlus } from 'react-icons/lu';
import {
  ClientPreview,
  ClientsList,
  COACH_CONTENT_MAX_W,
} from '@/features/coach';
import { Client } from '@/shared/types';
import { useClients } from '@/features/coach/hooks/useClients';
import { useGenerateInvitation } from '@/features/coach/hooks/useGenerateInvitation';
import { useActiveInvitation } from '@/features/coach/hooks/useActiveInvitation';
import { InvitationLinkDialog } from '@/features/coach/components/InvitationLinkDialog';
import {
  linkExpiry,
  invitationLink,
  deliverLink,
} from '@/features/coach/invitation';
import { toaster } from '@/shared/components/ui/toasterInstance';

const Clients = () => {
  const { data: clients = [] } = useClients();
  const { mutate: generateInvitation, isPending } = useGenerateInvitation();
  // Chargé à l'ouverture de la liste : le lien doit être en main *avant* le
  // clic, sinon l'aller-retour réseau coûte l'activation utilisateur dont le
  // partage et le presse-papiers ont tous deux besoin.
  const { data: pending } = useActiveInvitation();
  const [isCopied, setIsCopied] = useState(false);
  const [toShow, setToShow] = useState<{
    link: string;
    expiresAt?: string;
  } | null>(null);

  /**
   * L'aperçu n'existe que là où il y a la place.
   *
   * Sous 1280 px la liste prend déjà toute la largeur : ajouter une colonne
   * la réduirait à un filet. Un clic ouvre alors directement l'atelier, comme
   * avant.
   */
  const withPreview = useBreakpointValue({ base: false, xl: true }) ?? false;
  const [preview, setPreview] = useState<Client | null>(null);
  useDocumentTitle('Mes clients');

  /**
   * Ce qui se passe une fois le lien en main.
   *
   * L'ordre suit ce que le coach veut réellement faire : envoyer le lien à
   * quelqu'un. Là où le téléphone sait ouvrir sa feuille de partage, c'est
   * elle qui s'ouvre ; sinon on copie ; et si le navigateur refuse les deux,
   * on écrit le lien dans une fenêtre qui attend qu'on la ferme.
   *
   * C'est ce dernier cas qui manquait. Kettle affichait le lien dans un
   * bandeau de vingt secondes, après quoi il n'était plus nulle part.
   */
  const sendOut = useCallback(async (link: string, expiresAt?: string) => {
    const outcome = await deliverLink(link);
    if (outcome === 'cancelled') return;
    if (outcome === 'failed') {
      setToShow({ link, expiresAt });
      return;
    }
    if (outcome === 'copied') {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
    const expiry = linkExpiry(expiresAt);
    toaster.create({
      type: 'success',
      title:
        outcome === 'shared'
          ? "Lien d'invitation partagé"
          : "Lien d'invitation copié",
      description: [
        outcome === 'shared'
          ? 'Votre client rejoindra votre suivi.'
          : 'Envoyez-le à votre client : il rejoindra votre suivi.',
        expiry,
      ]
        .filter(Boolean)
        .join(' '),
    });
  }, []);

  /**
   * Inviter est une seule action : obtenir un lien et le faire sortir.
   *
   * Cela passait par un tiroir latéral dont tout le corps était un bouton —
   * deux clics et un panneau pour une opération qui n'a aucun réglage. Le
   * bouton fait maintenant ce qu'il dit.
   *
   * Le chemin court — un lien déjà en cache — n'attend rien : le partage
   * part du clic même, son activation intacte. Le chemin long ne sert qu'au
   * tout premier client, et c'est là que la fenêtre de repli gagne sa place.
   */
  const invite = () => {
    if (pending) {
      void sendOut(invitationLink(pending.token), pending.expiresAt);
      return;
    }
    generateInvitation(undefined, {
      onSuccess: ({ link, expiresAt }) => {
        void sendOut(link, expiresAt);
      },
    });
  };

  return (
    <Container
      maxW={withPreview ? '1400px' : COACH_CONTENT_MAX_W}
      py={8}
      px={4}
    >
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

        {/* Pas de ligne d'état. Elle prenait en permanence deux lignes
            avant le premier client, pour une information — la date
            d'expiration — et une action — « Recopier » — que le bouton
            « Inviter » couvre déjà : l'API recycle un lien encore valide, donc
            recliquer copie le même. */}

        {/* Entre 30 et 55 % de la fenêtre restait vide : la liste s'arrêtait
            à 720 px et le reste ne servait à rien. Le coach devait ouvrir
            l'atelier — et donc perdre la liste — pour savoir ce qui attendait
            chez un client, puis revenir pour passer au suivant. */}
        {withPreview ? (
          <Grid
            templateColumns="minmax(0, 1fr) 420px"
            gap={8}
            alignItems="start"
          >
            <ClientsList onPreview={setPreview} selectedId={preview?._id} />
            <Box position="sticky" top="24px" minW={0}>
              <ClientPreview client={preview} />
            </Box>
          </Grid>
        ) : (
          <ClientsList />
        )}
      </VStack>

      <InvitationLinkDialog
        link={toShow?.link ?? null}
        expiresAt={toShow?.expiresAt}
        onClose={() => setToShow(null)}
      />
    </Container>
  );
};

export default Clients;
