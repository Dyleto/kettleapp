import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import {
  Box,
  Container,
  Grid,
  HStack,
  Skeleton,
  Text,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import { LuCheck, LuPlus } from 'react-icons/lu';
import { ClientPreview, COACH_CONTENT_MAX_W } from '@/features/coach';
import { Client } from '@/shared/types';
import { useClients } from '@/features/coach/hooks/useClients';
import { useGenerateInvitation } from '@/features/coach/hooks/useGenerateInvitation';
import { useActiveInvitation } from '@/features/coach/hooks/useActiveInvitation';
import { InvitationLinkDialog } from '@/features/coach/components/InvitationLinkDialog';
import { ClientTiles } from '@/features/coach/clients/ClientTiles';
import { ClientRow } from '@/features/coach/clients/ClientRow';
import { ClientSearch, SortMenu } from '@/features/coach/clients/ClientSearch';
import {
  linkExpiry,
  invitationLink,
  deliverLink,
} from '@/features/coach/invitation';
import {
  matchesQuery,
  passesFilter,
  sortClients,
  tileCounts,
  type ClientFilter,
  type ClientSort,
} from '@/domain/clients/roster';
import { ActionButton, EmptyState, LoadFailure } from '@/kit';
import { isUnavailable } from '@/shared/utils/queryState';
import { COACH_ROUTES } from '@/shared/config/routes';
import { toaster } from '@/shared/components/ui/toasterInstance';

/**
 * Clients : la liste, triée par ce qui demande de l'attention, et trois
 * chiffres en tête qui disent où regarder.
 *
 * Les tuiles filtrent ce qu'elles comptent ; la recherche et le menu de tri
 * se cumulent avec elles. Une ligne ouvre l'atelier du client — ou, à partir
 * de 1 280 px, son aperçu à côté de la liste, l'atelier restant au
 * double-clic.
 *
 * La recherche et le tri n'apparaissaient qu'au-delà de cinq clients, et en
 * trois pastilles : la maquette pose la recherche toujours, et range le tri
 * dans un menu.
 */
const Clients = () => {
  const navigate = useNavigate();
  const clientsQuery = useClients();
  const { data: clients = [], isLoading } = clientsQuery;
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<ClientSort>('triage');
  const [filter, setFilter] = useState<ClientFilter | null>(null);
  const now = new Date();
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
  // Le client choisi, par son identifiant : la liste se recharge (au retour
  // sur l'onglet), et un objet gardé ici montrerait ses chiffres d'avant.
  const [previewId, setPreviewId] = useState<string | null>(null);
  useDocumentTitle('Clients');

  const counts = tileCounts(clients, now);
  const visible = sortClients(
    clients.filter(
      (c) => matchesQuery(c, query) && (!filter || passesFilter(c, filter, now))
    ),
    sort,
    now
  );
  // Toujours l'atelier, jamais le journal : le geste qu'un ressenti appelle
  // — alléger la séance — se fait dans l'atelier, qui montre déjà ce même
  // ressenti à côté du programme qu'il commente.
  const openProgram = (client: Client) =>
    navigate(COACH_ROUTES.clientSession(client._id, 1));
  const open = (client: Client) =>
    withPreview ? setPreviewId(client._id) : openProgram(client);
  // Sans choix, le panneau montre le premier de la liste — le prochain à
  // traiter : un panneau vide à côté d'une liste ne sert à rien.
  const preview =
    clients.find((c) => c._id === previewId) ?? visible[0] ?? null;

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
  const sendOut = async (link: string, expiresAt?: string) => {
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
          ? 'Le compte de ton client sera rattaché au tien.'
          : 'Envoie-le à ton client : son compte sera rattaché au tien.',
        expiry,
      ]
        .filter(Boolean)
        .join(' '),
    });
  };

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

  const list = isLoading ? (
    <VStack
      align="stretch"
      gap={0}
      bg="surface.card"
      borderRadius="card"
      overflow="hidden"
      aria-busy="true"
      aria-label="Chargement de tes clients"
    >
      {[...Array(6)].map((_, index) => (
        <HStack
          key={index}
          gap="12px"
          px="16px"
          py="13px"
          borderTopWidth={index ? '1px' : 0}
          borderColor="line"
        >
          <Skeleton w="34px" h="34px" borderRadius="full" />
          <Skeleton h="14px" w="40%" />
        </HStack>
      ))}
    </VStack>
  ) : isUnavailable(clientsQuery) ? (
    // L'écran dit la panne, et lui seul : un toast l'annonçait en même
    // temps, la même phrase deux fois.
    <LoadFailure
      query={clientsQuery}
      line="Tes clients n'ont pas bougé. Vérifie ta connexion, puis réessaie."
    />
  ) : clients.length === 0 ? (
    // L'état vide propose l'action au lieu de la décrire.
    <EmptyState
      mood="hello"
      title="Invite ton premier client"
      line="Un lien suffit : la personne crée son compte et apparaît ici. Tu pourras alors écrire son programme."
      action={
        <ActionButton size="md" onClick={invite} loading={isPending}>
          Obtenir le lien d’invitation
        </ActionButton>
      }
    />
  ) : (
    <VStack align="stretch" gap="12px">
      <ClientTiles counts={counts} filter={filter} onFilter={setFilter} />
      <HStack gap="8px">
        <ClientSearch value={query} onChange={setQuery} />
        <SortMenu sort={sort} onSort={setSort} />
      </HStack>
      {visible.length === 0 ? (
        <VStack gap="10px" py="32px" textAlign="center" data-no-match>
          <Text as="h2" fontWeight="800" fontSize="20px">
            {query.trim()
              ? `Aucun client ne s’appelle « ${query.trim()} »`
              : 'Aucun client ici'}
          </Text>
          <Text color="fg.muted">
            Vérifie l’orthographe, ou invite cette personne.
          </Text>
          <ActionButton
            tone="ghost"
            size="md"
            onClick={() => {
              setQuery('');
              setFilter(null);
            }}
          >
            Effacer la recherche
          </ActionButton>
        </VStack>
      ) : (
        <VStack
          align="stretch"
          gap={0}
          bg="surface.card"
          borderRadius="card"
          overflow="hidden"
          data-client-list
        >
          {visible.map((client) => (
            <ClientRow
              key={client._id}
              client={client}
              now={now}
              selected={withPreview && client._id === preview?._id}
              onOpen={() => open(client)}
              onOpenProgram={() => openProgram(client)}
            />
          ))}
        </VStack>
      )}
    </VStack>
  );

  return (
    <Container
      maxW={withPreview ? '1400px' : COACH_CONTENT_MAX_W}
      py={{ base: 6, md: 8 }}
      px={4}
    >
      <VStack align="stretch" gap="16px">
        <HStack gap="12px" align="center">
          <Text
            as="h1"
            fontWeight="800"
            fontSize={{ base: '26px', md: '32px' }}
            lineHeight="1.05"
          >
            Clients
          </Text>
          {clients.length > 0 && (
            <Text color="fg.muted" data-client-count>
              {clients.length} client{clients.length > 1 ? 's' : ''}
            </Text>
          )}
          {/* « Lien copié » deux secondes et demie : le bouton dit ce qui
              vient de se passer, à l'endroit où on a touché. */}
          <Box ml="auto">
            <ActionButton
              size="sm"
              onClick={invite}
              loading={isPending}
              aria-label={isCopied ? 'Lien copié' : 'Inviter un client'}
            >
              {isCopied ? <LuCheck size={16} /> : <LuPlus size={16} />}
              {isCopied ? (
                'Lien copié'
              ) : (
                <span>
                  Inviter
                  <Text as="span" display={{ base: 'none', md: 'inline' }}>
                    {' un client'}
                  </Text>
                </span>
              )}
            </ActionButton>
          </Box>
        </HStack>

        {withPreview ? (
          <Grid
            templateColumns="minmax(0, 1fr) 360px"
            gap="24px"
            alignItems="start"
          >
            {list}
            <Box
              as="aside"
              aria-label="Aperçu du client"
              position="sticky"
              top="24px"
              maxH="calc(100dvh - 48px)"
              overflowY="auto"
              minW={0}
              bg="bg.surface"
              borderRadius="18px"
              p="20px"
            >
              <ClientPreview client={preview} />
            </Box>
          </Grid>
        ) : (
          list
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
