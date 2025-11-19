import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Box, Grid, Spinner } from "@chakra-ui/react";
import { useAuth } from "@/contexts/AuthContext";
import { isPublicRoute } from "@/config/routes";
import { Header } from "@/components/Header";
import { RoleBadge } from "@/components/RoleBadge";

const RootLayout: React.FC = () => {
  const location = useLocation();
  const { user, isLoading } = useAuth();

  if (isLoading) return <Spinner />;

  if (!user && !isPublicRoute(location.pathname)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
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
