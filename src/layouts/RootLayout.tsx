import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Box, Grid, Spinner } from "@chakra-ui/react";
import { useAuth } from "@/contexts/AuthContext";

const RootLayout: React.FC = () => {
  const location = useLocation();
  const { user, isLoading } = useAuth();

  const publicRoutes = ["/login"];

  if (isLoading) return <Spinner />;

  if (!user && !publicRoutes.includes(location.pathname)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
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
  );
};

export default RootLayout;
