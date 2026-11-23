import { useEffect } from 'react';
import GoogleLoginButton from '@/features/auth/components/GoogleLoginButton';
import { useJoinCoach, useVerifyInviteToken } from '@/features/auth';
import { authService } from '@/features/auth/auth.service';
import { useAuth } from '@/shared/contexts/useAuth';
import { toaster } from '@/shared/components/ui/toasterInstance';
import { CLIENT_ROUTES } from '@/shared/config/routes';
import {
  Avatar,
  Box,
  Container,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useNavigate, useSearchParams } from 'react-router';
import { LegalFooter } from '@/shared/components/LegalFooter';
import { ActionButton, EmptyState, ErrorState } from '@/kit';
import { isRefusal } from '@/shared/utils/queryState';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

/**
 * La sortie d'un lien qui ne marche pas.
 *
 * C'est le tout premier écran d'un nouveau client, et son état d'échec ne
 * proposait rien : ni connexion, ni retour. On ne peut pas réparer le lien à
 * sa place, mais on peut au moins ne pas le laisser sur une page noire.
 *
 * Il s'appelle « J'ai déjà un compte » et non « Se connecter » : c'est la
 * seule raison de quitter cet écran sans lien valide, et le dire évite à
 * quelqu'un qui n'en a pas d'en créer un sans coach.
 */
const DeadEndExit = () => (
  <ActionButton
    tone="ghost"
    size="md"
    onClick={() => {
      window.location.href = '/login';
    }}
  >
    J'ai déjà un compte
  </ActionButton>
);

/**
 * L'attente, dessinée comme ce qui va arriver.
 *
 * Un tourniquet ne dit pas ce qu'on attend. Le contour de la carte
 * d'invitation, si — et quand elle se remplit, rien ne bouge.
 */
const Waiting = () => (
  <VStack gap={3} w="100%" aria-busy="true" aria-label="Vérification du lien">
    <Skeleton w="96px" h="96px" borderRadius="full" mb={2} />
    <Skeleton w="140px" h="11px" borderRadius="full" />
    <Skeleton w="80%" h="24px" borderRadius="md" />
    <Skeleton w="60%" h="24px" borderRadius="md" />
    <Skeleton w="90%" h="34px" borderRadius="md" mt={2} />
    <Skeleton w="100%" h="44px" borderRadius="md" mt={2} />
  </VStack>
);

/**
 * Le lien tronqué.
 *
 * C'est le cas réel : les messageries coupent les URL longues, et le jeton
 * est à la fin. On redirigeait alors vers la connexion sans un mot — d'où un
 * compte créé sans coach rattaché, qui est la boucle de l'entrée A1.
 */
const IncompleteLink = () => (
  <EmptyState
    mood="oops"
    headingLevel="h1"
    title="Il manque un bout à ce lien"
    line="Les messageries coupent parfois les liens longs. Demande à ton coach de te le renvoyer en entier."
    action={<DeadEndExit />}
  />
);

/**
 * Le lien que le serveur refuse : expiré, remplacé, ou jamais émis.
 *
 * Trois écrans distinguaient ces cas, avec trois titres. La personne qui
 * ouvre le lien n'y peut rien dans aucun des trois, et le geste est le
 * même : en demander un autre. Un seul écran, donc, qui dit quoi faire.
 */
const DeadLink = () => (
  <EmptyState
    mood="oops"
    headingLevel="h1"
    title="Ce lien ne marche plus"
    line="Il a expiré, ou il a été remplacé. Demande à ton coach de t'en envoyer un nouveau."
    action={<DeadEndExit />}
  />
);

/**
 * L'écran d'un lien d'invitation : qui invite, et de quoi le rejoindre.
 *
 * Sans session, « Rejoindre avec Google » crée le compte et le rattache.
 * Avec une session (F9b), deux cas que Google ne savait pas distinguer —
 * le lien renvoyait chez lui pour la même adresse :
 *
 * - un client qui suit déjà ce coach va droit à son accueil, avec « Tu es
 *   déjà avec Julie » : il n'a rien à rejoindre ;
 * - tout autre compte se voit demander « Rejoindre Julie avec ce compte ? »
 *   avant d'être rattaché. Rattacher sans demander aurait fait d'un lien
 *   ouvert par erreur — sur le téléphone d'un autre, dans la session d'un
 *   coach — un rattachement. « Utiliser un autre compte » ferme la session
 *   et revient au même lien.
 */
const Join = () => {
  useDocumentTitle('Invitation');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('token') ?? undefined;
  const { user, isLoading: authLoading } = useAuth();
  const join = useJoinCoach();

  const { data, isLoading, error, refetch, isRefetching } =
    useVerifyInviteToken(invitationToken);

  const coachName = data?.coach
    ? `${data.coach.firstName ?? ''} ${data.coach.lastName ?? ''}`.trim()
    : '';
  // Le prénom dans le titre, le nom entier dans la précision qui suit : on
  // est invité par quelqu'un, et rattaché à un compte. Sans nom du tout, le
  // titre commençait par une espace : « ton coach ».
  const coachFirstName = data?.coach.firstName?.trim() || coachName;
  const who = coachFirstName || 'ton coach';
  const Who = coachFirstName || 'Ton coach';
  const alreadyLinked = !!user && !!data?.alreadyLinked;

  useEffect(() => {
    if (!alreadyLinked) return;
    toaster.create({ type: 'info', title: `Tu es déjà avec ${who}` });
    navigate(CLIENT_ROUTES.today, { replace: true });
  }, [alreadyLinked, who, navigate]);

  const otherAccount = async () => {
    try {
      await authService.logout();
    } finally {
      window.location.href = `/join?token=${encodeURIComponent(
        invitationToken ?? ''
      )}`;
    }
  };

  const getContent = () => {
    if (!invitationToken) return <IncompleteLink />;
    if (isLoading || authLoading || alreadyLinked) return <Waiting />;

    if (error) {
      // Seul un refus du serveur dit quelque chose du lien. Une coupure de
      // réseau donnait le même écran « lien invalide », et renvoyait le
      // client réclamer à son coach un lien qui marchait très bien.
      return isRefusal(error) ? (
        <DeadLink />
      ) : (
        <ErrorState
          headingLevel="h1"
          line="Ton lien n'est pas en cause. Vérifie ta connexion, puis réessaie."
          onRetry={() => void refetch()}
          isRetrying={isRefetching}
        />
      );
    }

    return (
      <VStack gap={3} w="100%">
        <Avatar.Root size="2xl" mb={2}>
          <Avatar.Fallback name={coachName} />
          <Avatar.Image alt="" src={data?.coach.picture} />
        </Avatar.Root>
        <Text
          fontSize="11px"
          letterSpacing="1.5px"
          textTransform="uppercase"
          fontWeight="800"
          color="app.primary.fg"
        >
          Invitation
        </Text>
        {/* « vous invite à le rejoindre » accordait le coach au masculin
            sans le connaître. La tournure ne s'accorde plus avec personne. */}
        <Text
          as="h1"
          fontSize="32px"
          fontWeight="800"
          textAlign="center"
          lineHeight="1.05"
          letterSpacing="-0.01em"
          fontStretch="88%"
          maxW="14ch"
        >
          {user
            ? `Rejoindre ${who} avec ce compte ?`
            : `${Who} t'invite sur Kettle`}
        </Text>
        <Text
          color="fg.muted"
          fontSize="15px"
          textAlign="center"
          maxW="30ch"
          mb={2}
        >
          {user
            ? `Le compte ouvert ici : ${user.email}.`
            : 'Crée ton compte pour recevoir ton programme et suivre tes séances.'}
        </Text>
        {user ? (
          <VStack w="100%" gap="10px">
            {join.isError && (
              <Text role="alert" fontSize="sm" color="fg.muted">
                Le rattachement n'a pas abouti : rien n'a changé. Réessaie.
              </Text>
            )}
            <ActionButton
              w="full"
              loading={join.isPending}
              onClick={() =>
                join.mutate(invitationToken, {
                  onSuccess: () =>
                    navigate(CLIENT_ROUTES.today, { replace: true }),
                })
              }
            >
              Rejoindre {who}
            </ActionButton>
            <ActionButton
              tone="ghost"
              size="md"
              w="full"
              disabled={join.isPending}
              onClick={() => void otherAccount()}
            >
              Utiliser un autre compte
            </ActionButton>
          </VStack>
        ) : (
          <GoogleLoginButton
            text="Rejoindre avec Google"
            invitationToken={invitationToken}
          />
        )}
      </VStack>
    );
  };

  return (
    <Box
      as="main"
      id="contenu"
      display="flex"
      alignItems="center"
      justifyContent="center"
      minH="100vh"
    >
      <Container centerContent py={12}>
        <VStack gap={7} w="100%" maxW="380px">
          <Text
            fontSize="13px"
            fontWeight="800"
            letterSpacing="4px"
            color="fg.muted"
          >
            KETTLE
          </Text>

          {getContent()}

          {/* « Rien d'autre à créer » ne vaut que pour qui n'a pas de
              compte. */}
          {invitationToken && !isLoading && !error && !user && (
            <Text fontSize="xs" color="fg.muted" textAlign="center" maxW="32ch">
              Ton compte sera rattaché à {coachName}. Rien d'autre à créer.
            </Text>
          )}

          {/* L'autre endroit où un compte se crée : rejoindre un coach,
              c'est en créer un. Les mêmes pages, lisibles avant
              d'accepter. */}
          <LegalFooter />
        </VStack>
      </Container>
    </Box>
  );
};

export default Join;
