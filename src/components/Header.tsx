import { useAuth } from "@/contexts/AuthContext";
import {
  Box,
  Menu,
  Button,
  Avatar,
  Portal,
  HStack,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import {
  LuDumbbell,
  LuWrench,
  LuLogOut,
  LuClipboardCheck,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const roles = [user?.isClient, user?.isCoach, user?.isAdmin].filter(Boolean);
  const hasMultipleRoles = roles.length > 1;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleSwitchClientView = () => {
    navigate("/client", { replace: true });
  };

  const handleSwitchAdminView = () => {
    navigate("/admin", { replace: true });
  };

  const handleSwitchCoachView = () => {
    navigate("/coach", { replace: true });
  };

  return (
    <Box position="fixed" top={0} right={0} p={4} zIndex={2}>
      <Menu.Root positioning={{ placement: "right-start" }}>
        <Menu.Context>
          {(menu) => (
            <>
              <Menu.Trigger asChild>
                {/* <Button variant="ghost" p={0} _focusVisible={{ outline: "none" }}> */}
                <Box
                  role="group"
                  position="relative"
                  boxShadow="lg"
                  borderRadius="full"
                >
                  <svg
                    style={{
                      position: "absolute",
                      top: "-3px",
                      left: "-3px",
                      width: "calc(100% + 6px)",
                      height: "calc(100% + 6px)",
                      pointerEvents: "none",
                      transform: menu.open
                        ? "rotate(160deg)"
                        : "rotate(-120deg)", // ← Rotation animée
                      transition: "transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)", // ← Animation de rotation
                    }}
                  >
                    <circle
                      cx="50%"
                      cy="50%"
                      r="calc(50% - 2px)"
                      fill="none"
                      stroke="var(--chakra-colors-yellow-400)"
                      strokeWidth="3"
                      strokeDasharray={menu.open ? "295 295" : "80 295"}
                      strokeLinecap="round"
                      style={{
                        transition:
                          "stroke-dasharray 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                  </svg>
                  <Avatar.Root size="md" cursor="pointer">
                    <Avatar.Fallback
                      name={`${user?.firstName} ${user?.lastName}`}
                    />
                    <Avatar.Image src={user?.picture} />
                  </Avatar.Root>
                </Box>
                {/* </Button> */}
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content>
                    {hasMultipleRoles && (
                      <>
                        {user?.isClient && (
                          <Menu.Item
                            value="change-client"
                            cursor="pointer"
                            onClick={handleSwitchClientView}
                          >
                            <HStack gap={2}>
                              <LuDumbbell /> <Text>Vue Client</Text>
                            </HStack>
                          </Menu.Item>
                        )}
                        {user?.isCoach && (
                          <Menu.Item
                            value="change-coach"
                            cursor="pointer"
                            onClick={handleSwitchCoachView}
                          >
                            <HStack gap={2}>
                              <LuClipboardCheck /> <Text>Vue Coach</Text>
                            </HStack>
                          </Menu.Item>
                        )}
                        {user?.isAdmin && (
                          <Menu.Item
                            value="change-admin"
                            cursor="pointer"
                            onClick={handleSwitchAdminView}
                          >
                            <HStack gap={2}>
                              <LuWrench /> <Text>Vue Admin</Text>
                            </HStack>
                          </Menu.Item>
                        )}

                        {(user?.isClient || user?.isCoach || user?.isAdmin) && (
                          <Menu.Separator />
                        )}
                      </>
                    )}
                    <Menu.Item
                      value="logout"
                      onClick={handleLogout}
                      color="fg.error"
                      cursor="pointer"
                      _hover={{ bg: "bg.error", color: "fg.error" }}
                    >
                      <HStack gap={2}>
                        <LuLogOut />
                        <Text>Déconnexion</Text>
                      </HStack>
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </>
          )}
        </Menu.Context>
      </Menu.Root>
    </Box>
  );
};
