import { useAuth } from '@/contexts/useAuth';
import {
  Box,
  Menu,
  Avatar,
  Portal,
  HStack,
  Text,
  Button,
  VStack,
} from '@chakra-ui/react';
import {
  LuDumbbell,
  LuWrench,
  LuLogOut,
  LuClipboardCheck,
  LuChevronUp,
  LuUser,
} from 'react-icons/lu';
import { hitArea } from './hitArea';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAccountRoute } from '@/config/routes';

interface HeaderProps {
  variant?: 'rail' | 'compact';
}

export const Header = ({ variant = 'compact' }: HeaderProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const accountRoute = getAccountRoute(user, location.pathname);

  const roles = [user?.isClient, user?.isCoach, user?.isAdmin].filter(Boolean);
  const hasMultipleRoles = roles.length > 1;
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleSwitchClientView = () => {
    navigate('/client', { replace: true });
  };

  const handleSwitchAdminView = () => {
    navigate('/admin', { replace: true });
  };

  const handleSwitchCoachView = () => {
    navigate('/coach', { replace: true });
  };

  const avatar = (
    <Avatar.Root size="sm" cursor="pointer">
      <Avatar.Fallback name={fullName} />
      <Avatar.Image alt="" src={user?.picture} />
    </Avatar.Root>
  );

  return (
    <Box zIndex={2} borderTopWidth="1px" borderColor="whiteAlpha.200">
      <Menu.Root positioning={{ placement: 'left-end' }}>
        <Menu.Trigger asChild>
          {variant === 'rail' ? (
            <Button
              cursor="pointer"
              w="100%"
              justifyContent="flex-start"
              gap={2.5}
              px={2}
              py={7}
              mt={2}
              borderWidth="2px"
              borderColor="transparent"
              bg="transparent"
              color="fg.muted"
              _open={{
                color: 'app.primary',
                borderColor: 'app.primary',
                bg: 'app.primary.bg',
                outline: 'none',
              }}
              _hover={{
                color: 'app.primary',
                borderColor: 'app.primary',
                bg: 'app.primary.bg',
                outline: 'none',
              }}
              transition="color 0.15s"
              borderRadius="xl"
            >
              {avatar}
              <Text
                fontSize="sm"
                fontWeight="medium"
                lineClamp={1}
                flex={1}
                textAlign="left"
              >
                {user?.firstName}
              </Text>
              <LuChevronUp />
            </Button>
          ) : (
            // `role="group"` posé ici écrasait le rôle de gâchette du menu :
            // l'avatar sortait de l'ordre de tabulation et le menu devenait
            // inatteignable au clavier — sur mobile, c'était le seul chemin
            // vers la déconnexion. C'est un bouton, et il porte son nom.
            <Box
              as="button"
              aria-label={`Menu du compte de ${user?.firstName ?? 'mon compte'}`}
              cursor="pointer"
              w="fit-content"
              display="flex"
              borderRadius="full"
              css={hitArea(44)}
            >
              {avatar}
            </Box>
          )}
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content
              bg="bg.surface"
              borderWidth="1px"
              borderRadius="xl"
              padding={1}
            >
              {/* Relu par le lecteur d'écran à l'ouverture via le nom de la
                  gâchette : le répéter comme premier élément du menu ferait
                  entendre deux fois la même chose avant la première action. */}
              <HStack p={2} aria-hidden="true">
                {avatar}
                <VStack align="start" gap={0} ml={2}>
                  <Text fontSize="sm" fontWeight="bold" color="fg">
                    {user?.firstName} {user?.lastName}
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    {user?.email}
                  </Text>
                </VStack>
              </HStack>
              <Menu.Separator bg="whiteAlpha.200" />
              {accountRoute && (
                <Menu.Item
                  value="my-account"
                  cursor="pointer"
                  onClick={() => navigate(accountRoute)}
                  color="fg.muted"
                  _hover={{ color: 'fg', bg: 'whiteAlpha.100' }}
                  borderRadius="md"
                >
                  <HStack gap={2}>
                    <LuUser /> <Text>Mon compte</Text>
                  </HStack>
                </Menu.Item>
              )}
              {hasMultipleRoles && (
                <>
                  {user?.isClient && (
                    <Menu.Item
                      value="change-client"
                      cursor="pointer"
                      onClick={handleSwitchClientView}
                      color="fg.muted"
                      _hover={{ color: 'fg', bg: 'whiteAlpha.100' }}
                      borderRadius="md"
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
                      color="fg.muted"
                      _hover={{ color: 'fg', bg: 'whiteAlpha.100' }}
                      borderRadius="md"
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
                      color="fg.muted"
                      _hover={{ color: 'fg', bg: 'whiteAlpha.100' }}
                      borderRadius="md"
                    >
                      <HStack gap={2}>
                        <LuWrench /> <Text>Vue Admin</Text>
                      </HStack>
                    </Menu.Item>
                  )}

                  {(user?.isClient || user?.isCoach || user?.isAdmin) && (
                    <Menu.Separator bg="whiteAlpha.200" />
                  )}
                </>
              )}
              <Menu.Separator bg="whiteAlpha.200" />
              <Menu.Item
                value="logout"
                onClick={handleLogout}
                color="fg.error"
                cursor="pointer"
                _hover={{ bg: 'bg.error', color: 'fg.error' }}
                borderRadius="md"
              >
                <HStack gap={2}>
                  <LuLogOut />
                  <Text>Déconnexion</Text>
                </HStack>
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </Box>
  );
};
