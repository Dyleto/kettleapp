import {
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from 'react-router-dom';
import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react';
import { LuCompass, LuTriangleAlert } from 'react-icons/lu';
import { useAuth } from '@/contexts/useAuth';
import { getDefaultRoleRoute } from '@/config/routes';

/**
 * Deux écrans, parce que ce sont deux situations.
 *
 * Une adresse qui n'existe pas n'est pas une panne : proposer « Recharger la
 * page » y était doublement faux — ça ne peut pas marcher, et ça laisse
 * croire que l'application est cassée alors qu'il suffit de repartir de
 * l'accueil. Une vraie erreur d'exécution, elle, se recharge utilement.
 */
export function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();
  const { user } = useAuth();

  const introuvable = isRouteErrorResponse(error) && error.status === 404;

  // Une adresse inconnue n'a rien à signaler : seules les vraies erreurs
  // méritent la console.
  if (!introuvable) console.error('Route error:', error);

  return (
    <Box
      minH="100dvh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      px={5}
      bg="bg.canvas"
    >
      <VStack gap={5} maxW="380px">
        <Box color={introuvable ? 'fg.muted' : 'app.error'}>
          {introuvable ? <LuCompass size={28} /> : <LuTriangleAlert size={28} />}
        </Box>

        <VStack gap={2}>
          <Heading as="h1" size="lg" lineHeight="1.3">
            {introuvable
              ? "Cette page n'existe pas"
              : "Oups ! Quelque chose s'est cassé."}
          </Heading>
          <Text fontSize="sm" color="fg.muted" lineHeight="1.7">
            {introuvable
              ? "L'adresse demandée ne correspond à aucun écran de Kettle. Elle a peut-être été tronquée en chemin, ou l'écran a changé d'adresse."
              : 'Une erreur inattendue s’est produite — peut-être une connexion qui a lâché pendant le chargement.'}
          </Text>
        </VStack>

        {introuvable ? (
          <Button
            bg="app.primary"
            color="bg.canvas"
            fontWeight="bold"
            minH="48px"
            w="100%"
            onClick={() => navigate(getDefaultRoleRoute(user), { replace: true })}
          >
            Retour à l'accueil
          </Button>
        ) : (
          <Button
            bg="app.primary"
            color="bg.canvas"
            fontWeight="bold"
            minH="48px"
            w="100%"
            onClick={() => window.location.reload()}
          >
            Recharger la page
          </Button>
        )}
      </VStack>
    </Box>
  );
}
