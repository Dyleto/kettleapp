import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Box, Grid } from "@chakra-ui/react";

const RootLayout: React.FC = () => {
  const location = useLocation();

  // Vérifier si le token est présent
  const token = localStorage.getItem("id_token");
  const isAuthenticated = !!token;

  if (!isAuthenticated && location.pathname !== "/login") {
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
