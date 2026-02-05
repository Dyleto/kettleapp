import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Box, Grid, Spinner, VStack } from "@chakra-ui/react";
import { useAuth } from "@/contexts/AuthContext";
import { isPublicRoute } from "@/config/routes";
import { Header } from "@/components/Header";
import { RoleBadge } from "@/components/RoleBadge";
import { getDefaultRoleRoute } from "@/utils/navigation";
import { useThemeColors } from "@/hooks/useThemeColors";

const RootLayout: React.FC = () => {
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const colors = useThemeColors();

  if (isLoading)
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="100vh"
        bg="bg.muted"
      >
        <VStack gap={4}>
          <Spinner size="xl" color={colors.primary} />
        </VStack>
      </Box>
    );

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
        minH="100vh"
      >
        <Box gridArea={"content"}>
          <Outlet />
        </Box>
      </Grid>
    </>
  );
};

export default RootLayout;
