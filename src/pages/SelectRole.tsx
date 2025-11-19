import { useAuth } from "@/contexts/AuthContext";
import { Button, Container, Heading, Spinner, VStack } from "@chakra-ui/react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SelectRole = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const roles = [
    { name: "Coach", path: "/coach", enabled: user?.isCoach },
    { name: "Client", path: "/client", enabled: user?.isClient },
    { name: "Admin", path: "/admin", enabled: user?.isAdmin },
  ].filter((role) => role.enabled);

  // Si un seul rôle est disponible, rediriger automatiquement
  useEffect(() => {
    if (roles.length === 1) {
      navigate(roles[0].path, { replace: true });
    }
  }, [roles, navigate]);

  if (roles.length === 1) return <Spinner />;

  return (
    <Container centerContent py={20}>
      <VStack gap={4}>
        <Heading>Choisissez votre rôle</Heading>
        {roles.map((role) => (
          <Button
            colorPalette="yellow"
            key={role.path}
            w="100%"
            onClick={() => navigate(role.path)}
          >
            {role.name}
          </Button>
        ))}
      </VStack>
    </Container>
  );
};

export default SelectRole;
