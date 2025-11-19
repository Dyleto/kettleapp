import { useAuth } from "@/contexts/AuthContext";
import InvitationBlock from "@/features/Coach/InvitationBlock";
import {
  Container,
  VStack,
  HStack,
  Heading,
  Button,
  Box,
  Text,
  Avatar,
  Icon,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Portal,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Separator,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const CoachDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleSelectRole = () => {
    navigate("/select-role");
  };

  return (
    <Container maxW="container.lg" py={8}>
      <HStack justify="space-between" w="100%" p={4}>
        <Text fontSize="xl" fontWeight="bold">
          Bonjour {user?.firstName},
        </Text>
        <Menu.Root positioning={{ placement: "right-start" }}>
          <Menu.Trigger asChild>
            <Button variant="ghost" p={0}>
              <Avatar.Root size="md" cursor="pointer">
                <Avatar.Fallback
                  name={`${user?.firstName} ${user?.lastName}`}
                />
                <Avatar.Image src={user?.picture} />
              </Avatar.Root>
            </Button>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.Item
                  value="change-role"
                  onClick={() => navigate("/select-role")}
                >
                  🔄 Changer de rôle
                </Menu.Item>

                <Menu.Separator />

                <Menu.Item
                  value="logout"
                  onClick={handleLogout}
                  color="red.500"
                >
                  🚪 Déconnexion
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      </HStack>
    </Container>
  );
};

export default CoachDashboard;
