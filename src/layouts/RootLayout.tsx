import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Box, Grid, Spinner, VStack } from "@chakra-ui/react";
import { useAuth } from "@/contexts/AuthContext";
import { isPublicRoute } from "@/config/routes";
import { Header } from "@/components/Header";
import { RoleBadge } from "@/components/RoleBadge";
import { getDefaultRoleRoute } from "@/utils/navigation";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Suspense } from "react";

const RootLayout: React.FC = () => {
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const colors = useThemeColors();

  const PageLoader = () => (
    <Box display="flex" justifyContent="center" alignItems="center" minH="50vh">
      <VStack gap={4}>
        <Spinner size="xl" color={colors.primary} />
      </VStack>
    </Box>
  );

  if (isLoading) return <PageLoader />;

  if (!user && !isPublicRoute(location.pathname)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && location.pathname === "/") {
    return <Navigate to={getDefaultRoleRoute(user)} replace />;
  }

  const hasMultipleRoles =
    [user?.isCoach, user?.isClient, user?.isAdmin].filter(Boolean).length > 1;

  const getCurrentRole = () => {
    if (location.pathname.startsWith("/coach")) return "coach";
    if (location.pathname.startsWith("/client")) return "client";
    if (location.pathname.startsWith("/admin")) return "admin";
    return null;
  };

  const currentRole = getCurrentRole();

  return (
    <>
      {user && hasMultipleRoles && currentRole && (
        <RoleBadge role={currentRole} />
      )}
      {user && <Header />}
      <Grid
        bg={"bg.muted"}
        color={"fg"}
        templateAreas={{ base: `'content' ` }}
        gridTemplateRows={{ base: "1fr" }}
        minH="100dvh"
        w="100%"
      >
        <Box gridArea={"content"}>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </Box>
      </Grid>
    </>
  );
};

export default RootLayout;
