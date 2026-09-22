import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, Grid, Link, Spinner, VStack } from '@chakra-ui/react';
import { useAuth } from '@/contexts/useAuth';
import {
  getDefaultRoleRoute,
  isPublicRoute,
  NO_ROLE_ROUTES,
} from '@/config/routes';
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
      {/* The page's first focusable element: with a keyboard, one tab is
          enough to skip the navigation. Invisible until it has focus, but
          never taken out of the flow — display:none would make it
          unreachable. */}
      <Link
        href="#contenu"
        position="absolute"
        left={3}
        top={3}
        zIndex={100}
        px={4}
        py={2}
        /* It is reached with a keyboard, but it is also clicked — and
           nothing requires an accessibility shortcut to be the smallest
           target on the page. */
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
        A fixed backdrop against Safari's rubber-band scroll.
        Guarantees that even when the page bounces, this background shows and
        not the green GPU layer.
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
