import { useAuth } from "@/contexts/AuthContext";
import {
  Box,
  Button,
  Heading,
  HStack,
  Spinner,
  VStack,
} from "@chakra-ui/react";
import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

const AdminLayout = () => {
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user?.isAdmin) {
      navigate("/");
    }
  }, [isLoading, user?.isAdmin, navigate]);

  if (isLoading) return <Spinner />;
  if (!user?.isAdmin) return null;

  return (
    <HStack align="start" w="100%" h="100vh">
      {/* Sidebar */}
      <VStack w="205px" bg="yellow.400" p={4} h="100vh" gap={4}>
        <Heading size="md">Admin</Heading>

        <Button
          w="100%"
          variant={
            location.pathname === "/admin/create-coach" ? "solid" : "ghost"
          }
          onClick={() => navigate("/admin/create-coach")}
        >
          Créer un coach
        </Button>
      </VStack>

      <Box flex={1} p={6} overflowY="auto">
        <Outlet />
      </Box>
    </HStack>
  );
};

export default AdminLayout;
