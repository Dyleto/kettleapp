import { useCallback, useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
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
import { Client } from '@/types';
import { useClients } from '@/features/coach/hooks/useClients';
import { useGenerateInvitation } from '@/features/coach/hooks/useGenerateInvitation';
import { useActiveInvitation } from '@/features/coach/hooks/useActiveInvitation';
import { LienInvitation } from '@/features/coach/components/LienInvitation';
import {
  echeanceLien,
  lienInvitation,
  sortirLien,
} from '@/features/coach/invitation';
import { toaster } from '@/components/ui/toasterInstance';

const Clients = () => {
  const { data: clients = [] } = useClients();
  const { mutate: generateInvitation, isPending } = useGenerateInvitation();
  // Chargé à l'ouverture de la liste : le lien doit être en main *avant* le
  // clic, sans quoi l'aller-retour réseau coûte l'activation dont le partage
  // et le presse-papier ont besoin.
  const { data: enCours } = useActiveInvitation();
  const [isCopied, setIsCopied] = useState(false);
  const [aMontrer, setAMontrer] = useState<{
    lien: string;
    expiresAt?: string;
  } | null>(null);

  /**
   * L'aperçu n'existe que là où il y a la place pour lui.
   *
   * En dessous de 1280 px, la liste occupe déjà toute la largeur : y ajouter
   * une colonne la réduirait à un filet. Le clic ouvre alors l'atelier
   * directement, comme avant.
   */
  const avecApercu = useBreakpointValue({ base: false, xl: true }) ?? false;
  const [apercu, setApercu] = useState<Client | null>(null);
  useDocumentTitle('Mes clients');

  /**
   * Ce qui se passe une fois le lien en main.
   *
   * L'ordre suit ce que le coach veut réellement faire : envoyer le lien à
   * quelqu'un. Là où le téléphone sait ouvrir sa feuille de partage, c'est
   * elle qui s'ouvre ; sinon on copie ; et si le navigateur refuse les deux,
   * on écrit le lien dans une fenêtre qui attend qu'on la ferme.
   *
   * C'est ce dernier cas qui manquait. Kettle affichait alors le lien dans un
   * bandeau de vingt secondes, puis il n'était plus nulle part.
   */
  const faireSortir = useCallback(async (lien: string, expiresAt?: string) => {
    const sortie = await sortirLien(lien);
    if (sortie === 'annule') return;
    if (sortie === 'echec') {
      setAMontrer({ lien, expiresAt });
      return;
    }
    if (sortie === 'copie') {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
    const echeance = echeanceLien(expiresAt);
    toaster.create({
      type: 'success',
      title:
        sortie === 'partage'
          ? "Lien d'invitation partagé"
          : "Lien d'invitation copié",
      description: [
        sortie === 'partage'
          ? 'Votre client rejoindra votre suivi.'
          : 'Envoyez-le à votre client : il rejoindra votre suivi.',
        echeance,
      ]
        .filter(Boolean)
        .join(' '),
    });
  }, []);

  /**
   * Inviter, c'est une seule action : obtenir un lien et le faire sortir.
   *
   * Elle passait par un tiroir latéral dont le corps entier était un bouton
   * — deux clics et un panneau pour une opération qui n'a aucun réglage. Le
   * bouton fait maintenant ce qu'il annonce.
   *
   * Le chemin court — un lien déjà en cache — n'attend rien : le partage part
   * dans la foulée du clic, avec son activation intacte. Le chemin long ne
   * sert qu'au tout premier client, et c'est là que la fenêtre de repli
   * gagne sa place.
   */
  const invite = () => {
    if (enCours) {
      void faireSortir(lienInvitation(enCours.token), enCours.expiresAt);
      return;
    }
    generateInvitation(undefined, {
      onSuccess: ({ link, expiresAt }) => {
        void faireSortir(link, expiresAt);
      },
    });
  };

  return (
    <Container maxW={avecApercu ? '1400px' : COACH_CONTENT_MAX_W} py={8} px={4}>
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

        {/* Entre 30 et 55 % de la fenêtre restait vide : la liste s'arrêtait à
            720 px et le reste ne servait à rien. Le coach devait ouvrir
            l'atelier — donc perdre la liste — pour savoir ce qui l'attendait
            chez un client, puis revenir pour passer au suivant. */}
        {avecApercu ? (
          <Grid
            templateColumns="minmax(0, 1fr) 420px"
            gap={8}
            alignItems="start"
          >
            <ClientsList onPreview={setApercu} selectedId={apercu?._id} />
            <Box position="sticky" top="24px" minW={0}>
              <ClientPreview client={apercu} />
            </Box>
          </Grid>
        ) : (
          <ClientsList />
        )}
      </VStack>

      <LienInvitation
        lien={aMontrer?.lien ?? null}
        expiresAt={aMontrer?.expiresAt}
        onClose={() => setAMontrer(null)}
      />
    </Container>
  );
};

export default Clients;
