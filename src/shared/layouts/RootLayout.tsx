import { Navigate, Outlet, useLocation } from 'react-router';
import { Box, Grid, Link } from '@chakra-ui/react';
import { LoadingShapes } from '@/kit';
import { useAuth } from '@/shared/contexts/useAuth';
import {
  getDefaultRoleRoute,
  isPublicRoute,
  NO_ROLE_ROUTES,
} from '@/shared/config/routes';
import { Suspense } from 'react';

/**
 * Ce que montre l'application avant de savoir qui est là, et pendant qu'un
 * écran se charge à la demande : des formes, et non une roue ambre seule au
 * milieu de l'écran — la maquette des états n'en veut nulle part.
 */
const PageLoader = () => (
  <Box w="100%" maxW="704px" mx="auto" px={{ base: 4, md: 8 }} pt={6}>
    <LoadingShapes />
  </Box>
);

const RootLayout: React.FC = () => {
  const location = useLocation();
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;

  if (!user && !isPublicRoute(location.pathname)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && location.pathname === '/') {
    return <Navigate to={getDefaultRoleRoute(user)} replace />;
  }

  if (
    user &&
    !isPublicRoute(location.pathname) &&
    !user.isAdmin &&
    !user.isClient &&
    !user.isCoach &&
    location.pathname !== NO_ROLE_ROUTES.main
  ) {
    return <Navigate to={NO_ROLE_ROUTES.main} replace />;
  }

  return (
    <>
      {/* Le premier élément focalisable de la page : au clavier, une
          tabulation suffit à sauter la navigation. Invisible tant qu'il n'a
          pas le focus, mais jamais retiré du flux — `display:none` le rendrait
          inatteignable. */}
      <Link
        href="#contenu"
        position="absolute"
        left={3}
        top={3}
        zIndex={100}
        px={4}
        py={2}
        /* On l'atteint au clavier, mais on le clique aussi — et rien
                   n'oblige un raccourci d'accessibilité à être la plus petite cible
                   de la page. */
        minH="44px"
        display="flex"
        alignItems="center"
        borderRadius="md"
        bg="app.primary"
        color="bg.canvas"
        fontWeight="bold"
        fontSize="sm"
        transform="translateY(-150%)"
        _focusVisible={{ transform: 'translateY(0)' }}
        transition="transform 0.15s"
      >
        Aller au contenu
      </Link>

      {/*
        Un fond fixe contre le rebond de défilement de Safari.
        Garantit que même quand la page rebondit, c'est ce fond qui apparaît
        et non la couche GPU verte.
      */}
      <Box
        position="fixed"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg="surface.wall"
        zIndex={-1}
        pointerEvents="none"
      />

      <Grid
        bg="bg.canvas"
        color={'fg'}
        templateAreas={{ base: `'content' ` }}
        gridTemplateRows={{ base: '1fr' }}
        minH="100dvh"
        w="100%"
        isolation="isolate"
      >
        <Box gridArea={'content'} minW={0}>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </Box>
      </Grid>
    </>
  );
};

export default RootLayout;
