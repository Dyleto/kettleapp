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
import { authService } from '@/services/authService';
import { useAuth } from '@/contexts/useAuth';
import { getDefaultRoleRoute } from '@/config/routes';
import { LEGAL } from '@/config/legal';
import storage from '@/utils/storage';
import { toaster } from '@/components/ui/toasterInstance';

/** Temps mini avant redirection, pour ne pas faire clignoter l'écran. */
const MINIMUM_DISPLAY_TIME_MS = 800;

/**
 * Pourquoi la connexion n'a pas abouti.
 *
 * La distinction n'est pas cosmétique : elle décide de ce que la personne
 * peut faire. Un réseau muet se retente, un refus de Google ne se retente pas
 * à l'identique, une panne de notre côté ne dépend pas d'elle du tout. Les
 * trois disaient « Impossible de vous connecter. Veuillez réessayer. »
 */
type Cause = 'reseau' | 'refus' | 'serveur' | 'lien';

const MESSAGES: Record<Cause, { titre: string; texte: string }> = {
  reseau: {
    titre: "La connexion n'a pas abouti",
    texte:
      "Le serveur n'a pas répondu. Vérifie ta connexion internet, puis recommence.",
  },
  refus: {
    titre: 'Google n’a pas validé cette connexion',
    texte:
      'Le lien de connexion a expiré ou a déjà servi — il ne vaut que quelques minutes. Recommence depuis la page de connexion.',
  },
  serveur: {
    titre: 'Nous n’avons pas pu terminer la connexion',
    texte:
      'Le problème vient de chez nous, pas de toi. Réessaie dans un moment ; si ça persiste, écris-nous.',
  },
  lien: {
    titre: 'Il manque quelque chose dans ce lien',
    texte:
      'L’adresse de retour est incomplète. Recommence depuis la page de connexion.',
  },
};

/**
 * Le serveur renvoie 401 quand Google a refusé le code, et 5xx quand c'est
 * lui qui a échoué. Une absence de réponse ne porte aucun statut : c'est le
 * réseau. On ne montre un échec que sur une réponse, jamais sur une attente.
 */
const causeDe = (err: unknown): Cause => {
  const axiosErr = err as AxiosError;
  if (!axiosErr?.response) return 'reseau';
  const status = axiosErr.response.status;
  if (status === 401 || status === 400) return 'refus';
  return 'serveur';
};

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [echec, setEchec] = useState<Cause | null>(null);

  const recommencer = useCallback(() => {
    // Le jeton d'invitation n'est effacé qu'en cas de succès : recommencer
    // garde donc le rattachement au coach.
    navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    // Garde contre le double appel du mode strict en développement.
    let monte = true;

    const traiter = async () => {
      const code = searchParams.get('code');
      const erreurGoogle = searchParams.get('error');

      if (erreurGoogle) return setEchec('refus');
      if (!code) return setEchec('lien');

      try {
        const debut = Date.now();
        const redirectUri = `${window.location.origin}/auth/callback`;
        const invitationToken = storage.getItem('invitation_token');

        const data = await authService.googleLogin(
          code,
          redirectUri,
          invitationToken || undefined
        );

        if (invitationToken) storage.removeItem('invitation_token');
        if (!monte) return;

        setUser(data.user);
        toaster.create({ title: 'Connexion réussie !', type: 'success' });

        const reste = Math.max(0, MINIMUM_DISPLAY_TIME_MS - (Date.now() - debut));
        setTimeout(() => {
          navigate(getDefaultRoleRoute(data.user), { replace: true });
        }, reste);
      } catch (err) {
        if (monte) setEchec(causeDe(err));
      }
    };

    traiter();
    return () => {
      monte = false;
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
      {echec === null ? (
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
              {MESSAGES[echec].titre}
            </Heading>
            <Text fontSize="sm" color="fg.muted" lineHeight="1.7">
              {MESSAGES[echec].texte}
            </Text>
          </VStack>
          <Button
            bg="app.primary"
            color="bg.canvas"
            fontWeight="bold"
            minH="48px"
            w="100%"
            onClick={recommencer}
          >
            Recommencer la connexion
          </Button>
          {echec === 'serveur' && (
            <Link
              href={`mailto:${LEGAL.editeur.contactEmail}`}
              fontSize="xs"
              color="fg.muted"
              textDecoration="underline"
            >
              {LEGAL.editeur.contactEmail}
            </Link>
          )}
        </VStack>
      )}
    </Box>
  );
};

export default AuthCallback;
