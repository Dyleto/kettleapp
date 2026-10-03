import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import {
  Box,
  Button,
  Heading,
  Link,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { LuTriangleAlert } from 'react-icons/lu';
import { authService } from '@/features/auth/auth.service';
import { useAuth } from '@/shared/contexts/useAuth';
import { getDefaultRoleRoute } from '@/shared/config/routes';
import { LEGAL } from '@/shared/config/legal';
import storage from '@/shared/utils/storage';
import { toaster } from '@/shared/components/ui/toasterInstance';

/** Attente minimale avant la redirection, pour que l'écran ne clignote pas. */
const MINIMUM_DISPLAY_TIME_MS = 800;

/**
 * Pourquoi la connexion n'est pas passée.
 *
 * La distinction n'est pas cosmétique : elle décide de ce que la personne
 * peut faire. Un réseau muet vaut la peine d'être réessayé, un refus de
 * Google ne vaut pas la peine d'être réessayé à l'identique, une panne de
 * notre côté ne dépend pas d'elle du tout. Les trois disaient « Impossible de
 * vous connecter. Veuillez réessayer. »
 */
type Cause = 'network' | 'refused' | 'server' | 'link';

const MESSAGES: Record<Cause, { title: string; body: string }> = {
  network: {
    title: "La connexion n'a pas abouti",
    body: "Le serveur n'a pas répondu. Vérifie ta connexion internet, puis recommence.",
  },
  refused: {
    title: 'Google n’a pas validé cette connexion',
    body: 'Le lien de connexion a expiré ou a déjà servi — il ne vaut que quelques minutes. Recommence depuis la page de connexion.',
  },
  server: {
    title: 'Nous n’avons pas pu terminer la connexion',
    body: 'Le problème vient de chez nous, pas de toi. Réessaie dans un moment ; si ça persiste, écris-nous.',
  },
  link: {
    title: 'Il manque quelque chose dans ce lien',
    body: 'L’adresse de retour est incomplète. Recommence depuis la page de connexion.',
  },
};

/**
 * Le serveur renvoie 401 quand Google a refusé le code, et 5xx quand c'est
 * lui qui a échoué. Une absence de réponse ne porte aucun statut : c'est le
 * réseau. On ne signale un échec que sur une réponse, jamais sur une attente.
 */
const causeOf = (err: unknown): Cause => {
  const axiosErr = err as AxiosError;
  if (!axiosErr?.response) return 'network';
  const status = axiosErr.response.status;
  if (status === 401 || status === 400) return 'refused';
  return 'server';
};

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [failure, setFailure] = useState<Cause | null>(null);

  const retry = useCallback(() => {
    // Le jeton d'invitation n'est effacé qu'en cas de succès : recommencer
    // garde le lien vers le coach.
    navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    // Garde contre le double appel du mode strict en développement : sans
    // lui, l'échange du code part deux fois et le second part sur un code
    // déjà consommé — donc un échec affiché sur une connexion réussie.
    let mounted = true;

    const exchangeCode = async () => {
      const code = searchParams.get('code');
      const googleError = searchParams.get('error');

      if (googleError) return setFailure('refused');
      if (!code) return setFailure('link');

      try {
        const startedAt = Date.now();
        const redirectUri = `${window.location.origin}/auth/callback`;
        const invitationToken = storage.getItem('invitation_token');

        const data = await authService.googleLogin(
          code,
          redirectUri,
          invitationToken || undefined
        );

        if (invitationToken) storage.removeItem('invitation_token');
        if (!mounted) return;

        setUser(data.user);
        toaster.create({ title: 'Connexion réussie !', type: 'success' });

        const wait = Math.max(
          0,
          MINIMUM_DISPLAY_TIME_MS - (Date.now() - startedAt)
        );
        setTimeout(() => {
          navigate(getDefaultRoleRoute(data.user), { replace: true });
        }, wait);
      } catch (err) {
        if (mounted) setFailure(causeOf(err));
      }
    };

    exchangeCode();
    return () => {
      mounted = false;
    };
  }, [searchParams, navigate, setUser]);

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minH="100dvh"
      bg="bg.canvas"
      px={5}
    >
      {failure === null ? (
        <VStack gap={4}>
          <Spinner size="xl" color="app.primary" />
          <Heading size="md">Connexion en cours…</Heading>
        </VStack>
      ) : (
        <VStack gap={5} maxW="380px" textAlign="center">
          <Box color="app.error">
            <LuTriangleAlert size={28} />
          </Box>
          <VStack gap={2}>
            <Heading as="h1" size="md" lineHeight="1.3">
              {MESSAGES[failure].title}
            </Heading>
            <Text fontSize="sm" color="fg.muted" lineHeight="1.7">
              {MESSAGES[failure].body}
            </Text>
          </VStack>
          <Button
            bg="app.primary"
            color="bg.canvas"
            fontWeight="bold"
            minH="48px"
            w="100%"
            onClick={retry}
          >
            Recommencer la connexion
          </Button>
          {failure === 'server' && (
            <Link
              href={`mailto:${LEGAL.publisher.contactEmail}`}
              fontSize="xs"
              color="fg.muted"
              textDecoration="underline"
            >
              {LEGAL.publisher.contactEmail}
            </Link>
          )}
        </VStack>
      )}
    </Box>
  );
};

export default AuthCallback;
