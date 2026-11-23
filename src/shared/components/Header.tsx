import { useState, type ReactNode } from 'react';
import { useAuth } from '@/shared/contexts/useAuth';
import {
  Box,
  Menu,
  Avatar,
  Portal,
  HStack,
  Text,
  Button,
  VStack,
  chakra,
} from '@chakra-ui/react';
import {
  LuArrowLeftRight,
  LuChevronUp,
  LuLogOut,
  LuUser,
} from 'react-icons/lu';
import { Chip, hitArea, Sheet } from '@/kit';
import { useLocation, useNavigate } from 'react-router';
import {
  getAccountRoute,
  otherSpaces,
  type Space,
} from '@/shared/config/routes';
import { useSheetDismiss } from '@/shared/hooks/useSheetDismiss';

interface HeaderProps {
  variant?: 'rail' | 'compact';
  /** Le rail replié en icônes : l'avatar seul, sans le prénom. */
  collapsed?: boolean;
  /**
   * Ce qui attend dans un autre espace : « 6 à lire » à côté de « Passer à
   * l'espace coach ». La coque de l'espace le sait ; le menu, dans
   * `shared`, ne lit aucune fonctionnalité.
   */
  waiting?: Partial<Record<Space, string>>;
}

/** Une entrée du menu : la même sur téléphone et sur grand écran. */
interface Entry {
  key: string;
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  badge?: string;
  danger?: boolean;
}

/** La feuille du menu, sur téléphone : l'identité, puis les entrées. */
const AccountSheet = ({
  avatar,
  fullName,
  email,
  entries,
  onClose,
}: {
  avatar: ReactNode;
  fullName: string;
  email?: string;
  entries: Entry[];
  onClose: () => void;
}) => {
  useSheetDismiss(true, onClose);
  return (
    <Portal>
      <Sheet label="Menu du compte" onDismiss={onClose}>
        <HStack gap="14px" data-account-sheet-identity>
          {avatar}
          <VStack align="start" gap="2px" minW={0}>
            {fullName && (
              <Text fontWeight="800" fontSize="18px" lineClamp={1}>
                {fullName}
              </Text>
            )}
            <Text fontSize="sm" color="fg.muted" lineClamp={1}>
              {email}
            </Text>
          </VStack>
        </HStack>
        <Box bg="surface.card" borderRadius="card" overflow="hidden">
          {entries.map((entry) => (
            <chakra.button
              key={entry.key}
              type="button"
              onClick={() => {
                onClose();
                entry.onSelect();
              }}
              display="flex"
              alignItems="center"
              gap="12px"
              w="full"
              minH="52px"
              px="16px"
              textAlign="left"
              color={entry.danger ? 'app.error.fg' : 'fg'}
              borderTopWidth="1px"
              borderColor="line"
              _first={{ borderTopWidth: 0 }}
              _hover={{ bg: 'bg.raised' }}
            >
              <Box aria-hidden display="flex">
                {entry.icon}
              </Box>
              <Text as="span" flex={1}>
                {entry.label}
              </Text>
              {entry.badge && <Chip tone="amber">{entry.badge}</Chip>}
            </chakra.button>
          ))}
        </Box>
      </Sheet>
    </Portal>
  );
};

/**
 * Le compte connecté, et ce qu'on peut faire depuis lui.
 *
 * Deux formes pour les mêmes entrées : sur téléphone, une feuille du kit,
 * sous le pouce ; sur grand écran, un menu qui monte de l'avatar, en bas du
 * rail. Sur téléphone, c'était le même petit menu flottant qu'au bureau,
 * accroché à un avatar en haut de l'écran, loin de la main.
 *
 * Trois sortes d'entrées : « Mon compte » ; un passage vers chaque autre
 * espace du compte, et seulement pour un compte qui en porte plusieurs ;
 * « Se déconnecter », au même nom que sur l'écran « Mon compte ». Il
 * disait « Vue Client », « Vue Coach », « Vue Admin », espace courant
 * compris, et « Déconnexion ».
 */
export const Header = ({
  variant = 'compact',
  collapsed = false,
  waiting,
}: HeaderProps) => {
  // Le prénom n'a la place qu'au rail large, et jamais replié — la règle du
  // rail lui-même (`NavRail`).
  const named = { base: 'none', xl: collapsed ? 'none' : 'flex' } as const;
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const accountRoute = getAccountRoute(user, location.pathname);
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  const triggerLabel = `Menu du compte de ${user?.firstName ?? 'mon compte'}`;

  const entries: Entry[] = [
    ...(accountRoute
      ? [
          {
            key: 'account',
            label: 'Mon compte',
            icon: <LuUser size={18} />,
            onSelect: () => navigate(accountRoute),
          },
        ]
      : []),
    ...otherSpaces(user, location.pathname).map((other) => ({
      key: other.space,
      label: other.label,
      icon: <LuArrowLeftRight size={18} />,
      badge: waiting?.[other.space],
      onSelect: () => navigate(other.to, { replace: true }),
    })),
    {
      key: 'logout',
      label: 'Se déconnecter',
      icon: <LuLogOut size={18} />,
      danger: true,
      onSelect: () => {
        logout();
        navigate('/login', { replace: true });
      },
    },
  ];

  const avatar = (size: 'sm' | 'lg') => (
    <Avatar.Root size={size} cursor="pointer" flexShrink={0}>
      <Avatar.Fallback name={fullName} />
      <Avatar.Image alt="" src={user?.picture} />
    </Avatar.Root>
  );

  if (variant === 'compact') {
    return (
      <>
        {/* `role="group"` posé ici écrasait le rôle du bouton : l'avatar
            sortait de l'ordre de tabulation, et la feuille devenait
            inatteignable au clavier — sur téléphone, c'est le chemin vers
            la déconnexion. C'est un bouton, et il porte son nom. */}
        <Box
          as="button"
          aria-label={triggerLabel}
          aria-haspopup="dialog"
          onClick={() => setSheetOpen(true)}
          cursor="pointer"
          w="fit-content"
          display="flex"
          borderRadius="full"
          css={hitArea(44)}
        >
          {avatar('sm')}
        </Box>
        {sheetOpen && (
          <AccountSheet
            avatar={avatar('lg')}
            fullName={fullName}
            email={user?.email}
            entries={entries}
            onClose={() => setSheetOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <Box zIndex={2} borderTopWidth="1px" borderColor="whiteAlpha.200">
      <Menu.Root positioning={{ placement: 'top-start' }}>
        <Menu.Trigger asChild>
          <Button
            aria-label={triggerLabel}
            cursor="pointer"
            w="100%"
            justifyContent={{
              base: 'center',
              xl: collapsed ? 'center' : 'flex-start',
            }}
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
            {avatar('sm')}
            <Text
              display={named}
              fontSize="sm"
              fontWeight="medium"
              lineClamp={1}
              flex={1}
              textAlign="left"
            >
              {user?.firstName}
            </Text>
            <Box as="span" display={named}>
              <LuChevronUp />
            </Box>
          </Button>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content
              bg="bg.surface"
              borderWidth="1px"
              borderRadius="xl"
              padding={1}
              minW="260px"
            >
              {/* Lu par le lecteur d'écran à l'ouverture, via le nom du
                  déclencheur : le répéter en premier élément du menu dirait
                  deux fois la même chose avant la première action. */}
              <HStack p={2} aria-hidden="true">
                {avatar('sm')}
                <VStack align="start" gap={0} ml={2} minW={0}>
                  <Text fontSize="sm" fontWeight="bold" color="fg">
                    {fullName}
                  </Text>
                  <Text fontSize="sm" color="fg.muted" lineClamp={1}>
                    {user?.email}
                  </Text>
                </VStack>
              </HStack>
              <Menu.Separator bg="whiteAlpha.200" />
              {entries.map((entry) => (
                <Menu.Item
                  key={entry.key}
                  value={entry.key}
                  cursor="pointer"
                  onClick={entry.onSelect}
                  color={entry.danger ? 'app.error.fg' : 'fg.muted'}
                  _hover={{
                    color: entry.danger ? 'app.error.fg' : 'fg',
                    bg: 'whiteAlpha.100',
                  }}
                  borderRadius="md"
                >
                  <HStack gap={2} flex={1}>
                    {entry.icon}
                    <Text flex={1}>{entry.label}</Text>
                    {entry.badge && <Chip tone="amber">{entry.badge}</Chip>}
                  </HStack>
                </Menu.Item>
              ))}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </Box>
  );
};
