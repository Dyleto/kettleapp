import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, Grid, Link, Spinner, VStack } from '@chakra-ui/react';
import { useAuth } from '@/shared/contexts/useAuth';
import {
  getDefaultRoleRoute,
  isPublicRoute,
  NO_ROLE_ROUTES,
} from '@/shared/config/routes';
import { Suspense } from 'react';

const PageLoader = () => {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minH="50vh">
      <VStack gap={4}>
        <Spinner size="xl" color="app.primary" />
      </VStack>
    </Box>
  );
};

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
