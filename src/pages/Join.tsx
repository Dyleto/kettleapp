import GoogleLoginButton from '@/components/GoogleLoginButton';
import { useVerifyInviteToken } from '@/features/auth';
import {
  Avatar,
  Box,
  Button,
  Container,
  Heading,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { LuUnlink } from 'react-icons/lu';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { LegalFooter } from '@/components/LegalFooter';

/**
 * The way out of a link that does not work.
 *
 * This is a new client's very first screen, and its failure state offered
 * nothing: no sign-in, no way back. We cannot repair the link for them, but
 * we can at least not leave them on a black page.
 */
const DeadEndExit = () => (
  <Button
    mt={2}
    w="100%"
    minH="48px"
    variant="outline"
    borderColor="whiteAlpha.300"
    color="fg"
    onClick={() => {
      window.location.href = '/login';
    }}
  >
    Se connecter
  </Button>
);

/**
 * The wait, drawn as what is about to arrive.
 *
 * A spinner does not say what you are waiting for. The invitation card's
 * outline does — and when it fills in, nothing moves.
 */
const Attente = () => (
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
 * The truncated link.
 *
 * This is the real case: messaging apps cut long URLs, and the token is at
 * the end. We then redirected to sign-in without a word — hence an account
 * created with no coach attached, which is the loop of entry A1.
 */
const LienIncomplet = () => (
  <VStack gap={3} w="100%">
    <Box color="app.error" mb={1}>
      <LuUnlink size={26} />
    </Box>
    <Heading
      as="h1"
      fontSize="24px"
      fontWeight="800"
      textAlign="center"
      maxW="20ch"
    >
      Il manque quelque chose dans ce lien
    </Heading>
    <Text color="fg.muted" fontSize="sm" textAlign="center" maxW="32ch">
      L'adresse est incomplète — les messageries coupent souvent les liens
      longs. Demandez à votre coach de vous le renvoyer en entier.
    </Text>
    <DeadEndExit />
  </VStack>
);

const Join = () => {
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('token') ?? undefined;

  const { data, isLoading, error } = useVerifyInviteToken(invitationToken);

  const coachName = data?.coach
    ? `${data.coach.firstName} ${data.coach.lastName}`
    : '';

  const getContent = () => {
    if (!invitationToken) return <LienIncomplet />;
    if (isLoading) return <Attente />;

    if (error) {
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;

      if (status === 410) {
        return (
          <VStack gap={3} w="100%">
            <Avatar.Root
              size="2xl"
              mb={2}
              opacity={0.6}
              style={{ filter: 'grayscale(100%)' }}
            >
              <Avatar.Fallback name={coachName} />
              <Avatar.Image alt="" src={data?.coach.picture} />
            </Avatar.Root>
            <Heading
              as="h1"
              fontSize="24px"
              fontWeight="800"
              textAlign="center"
              maxW="20ch"
            >
              Lien d'invitation expiré
            </Heading>
            <Text color="fg.muted" fontSize="sm" textAlign="center" maxW="30ch">
              Ce lien n'est plus valide. Demandez à votre coach de vous en
              envoyer un nouveau.
            </Text>
            <DeadEndExit />
          </VStack>
        );
      }

      return (
        <VStack gap={3} w="100%">
          <Box fontSize="26px" color="app.error" mb={1}>
            ⊘
          </Box>
          <Heading
            as="h1"
            fontSize="24px"
            fontWeight="800"
            textAlign="center"
            maxW="20ch"
          >
            Lien d'invitation invalide
          </Heading>
          <Text color="fg.muted" fontSize="sm" textAlign="center" maxW="30ch">
            Le lien que vous avez ouvert n'existe pas ou est incorrect.
            Vérifiez-le auprès de votre coach.
          </Text>
          <DeadEndExit />
        </VStack>
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
          color="app.primary"
        >
          Invitation coaching
        </Text>
        <Heading
          as="h1"
          fontSize="24px"
          fontWeight="800"
          textAlign="center"
          lineHeight="1.25"
          maxW="22ch"
        >
          {coachName}
          <br />
          <Box as="span" color="app.primary">
            vous invite
          </Box>{' '}
          à le rejoindre
        </Heading>
        <Text
          color="fg.muted"
          fontSize="sm"
          textAlign="center"
          maxW="30ch"
          mb={2}
        >
          Créez votre compte pour accéder à votre programme personnalisé et
          suivre vos séances.
        </Text>
        <GoogleLoginButton
          text="Rejoindre avec Google"
          invitationToken={invitationToken}
        />
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

          {invitationToken && !isLoading && !error && (
            <Text fontSize="xs" color="fg.muted" textAlign="center" maxW="32ch">
              Vous serez automatiquement rattaché à {coachName} — aucun autre
              compte à créer.
            </Text>
          )}

          {/* The other place where an account is created: joining a coach
              is creating one. The same pages, readable before accepting. */}
          <LegalFooter />
        </VStack>
      </Container>
    </Box>
  );
};

export default Join;
