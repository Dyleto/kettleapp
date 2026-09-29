import { Header } from '@/shared/components/Header';
import { useAuth } from '@/shared/contexts/useAuth';
import {
  useCreateCoach,
  useAdminStats,
  useAdminCoaches,
} from '@/features/admin';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/config/queryKeys';
import { AdminCoach } from '@/features/admin/admin.service';
import {
  Box,
  Button,
  Container,
  Drawer,
  Field,
  Grid,
  Heading,
  HStack,
  Input,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useState } from 'react';
import {
  LuChartBar,
  LuDumbbell,
  LuPlus,
  LuShield,
  LuTrendingUp,
  LuUsers,
  LuX,
  LuZap,
} from 'react-icons/lu';

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | undefined;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard = ({ label, value, sub, icon, color }: StatCardProps) => (
  <Box
    bg="whiteAlpha.50"
    borderRadius="xl"
    borderWidth="1px"
    borderColor="whiteAlpha.100"
    p={5}
    position="relative"
    overflow="hidden"
  >
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      h="2px"
      bg={color}
      opacity={0.7}
    />
    <HStack justify="space-between" align="start">
      <VStack align="start" gap={1}>
        <Text
          fontSize="xs"
          color="fg.muted"
          fontWeight="medium"
          textTransform="uppercase"
          letterSpacing="wider"
        >
          {label}
        </Text>
        {value === undefined ? (
          <Skeleton h="32px" w="60px" borderRadius="md" />
        ) : (
          <Text fontSize="3xl" fontWeight="bold" lineHeight="1" color="white">
            {value}
          </Text>
        )}
        {sub && (
          <Text fontSize="xs" color="fg.muted">
            {sub}
          </Text>
        )}
      </VStack>
      <Box p={2.5} bg={`${color}18`} borderRadius="lg" color={color}>
        {icon}
      </Box>
    </HStack>
  </Box>
);

// ─── Coach row ────────────────────────────────────────────────────────────────

const CoachRow = ({ coach }: { coach: AdminCoach }) => {
  const initials =
    `${coach.firstName?.[0] ?? ''}${coach.lastName?.[0] ?? ''}`.toUpperCase();
  const since = new Date(coach.createdAt).toLocaleDateString('fr-FR', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <HStack
      px={4}
      py={3.5}
      borderBottomWidth="1px"
      borderColor="whiteAlpha.100"
      gap={4}
      _last={{ borderBottom: 'none' }}
      _hover={{ bg: 'whiteAlpha.50' }}
      transition="background 0.15s"
    >
      {/* Avatar */}
      <Box
        w="36px"
        h="36px"
        borderRadius="full"
        bg="whiteAlpha.100"
        flexShrink={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
      >
        {coach.picture ? (
          <img
            src={coach.picture}
            alt={initials}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Text fontSize="xs" fontWeight="bold" color="fg.muted">
            {initials || '?'}
          </Text>
        )}
      </Box>

      {/* Nom + email */}
      <VStack align="start" gap={0} flex={1} minW={0}>
        <Text fontWeight="semibold" fontSize="sm" color="white" truncate>
          {coach.firstName} {coach.lastName}
        </Text>
        <Text fontSize="xs" color="fg.muted" truncate>
          {coach.email}
        </Text>
      </VStack>

      {/* Stats */}
      <HStack gap={{ base: 3, sm: 5 }} flexShrink={0}>
        <HStack gap={1.5} color="fg.muted" fontSize="xs">
          <LuUsers size={13} />
          <Text>
            {coach.clientCount} client{coach.clientCount !== 1 ? 's' : ''}
          </Text>
        </HStack>
        <HStack gap={1.5} color="fg.muted" fontSize="xs">
          <LuDumbbell size={13} />
          <Text>
            {coach.exerciseCount} exo{coach.exerciseCount !== 1 ? 's' : ''}
          </Text>
        </HStack>
        <Text
          fontSize="xs"
          color="fg.muted"
          display={{ base: 'none', md: 'block' }}
        >
          depuis {since}
        </Text>
      </HStack>
    </HStack>
  );
};

// ─── Create coach drawer ──────────────────────────────────────────────────────

interface CreateCoachDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateCoachDrawer = ({ isOpen, onClose }: CreateCoachDrawerProps) => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const queryClient = useQueryClient();
  const mutation = useCreateCoach();

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.firstName.trim()) e.firstName = 'Requis';
    if (!form.lastName.trim()) e.lastName = 'Requis';
    if (!form.email.trim()) e.email = 'Requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Email invalide';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate(form, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.coaches() });
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats() });
        setForm({ firstName: '', lastName: '', email: '' });
        onClose();
      },
    });
  };

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      size="sm"
    >
      <Drawer.Positioner>
        <Drawer.Content bg="bg.canvas">
          <Drawer.Header borderBottomWidth="1px" borderColor="whiteAlpha.100">
            <HStack justify="space-between">
              <HStack gap={2}>
                <LuShield size={18} color="var(--chakra-colors-app-primary)" />
                <Text fontWeight="bold">Créer un coach</Text>
              </HStack>
              <Button
                size="sm"
                variant="ghost"
                aria-label="Fermer"
                onClick={onClose}
              >
                <LuX />
              </Button>
            </HStack>
          </Drawer.Header>

          <Drawer.Body p={6}>
            <form onSubmit={handleSubmit}>
              <VStack gap={5} align="stretch">
                <Field.Root invalid={!!errors.firstName}>
                  <Field.Label fontSize="sm">Prénom</Field.Label>
                  <Input
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                    placeholder="Jean"
                    autoFocus
                  />
                  {errors.firstName && (
                    <Field.ErrorText>{errors.firstName}</Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root invalid={!!errors.lastName}>
                  <Field.Label fontSize="sm">Nom</Field.Label>
                  <Input
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                    placeholder="Dupont"
                  />
                  {errors.lastName && (
                    <Field.ErrorText>{errors.lastName}</Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root invalid={!!errors.email}>
                  <Field.Label fontSize="sm">Email</Field.Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="jean.dupont@example.com"
                  />
                  {errors.email && (
                    <Field.ErrorText>{errors.email}</Field.ErrorText>
                  )}
                </Field.Root>

                <Button
                  type="submit"
                  bg="app.primary"
                  color="bg.canvas"
                  fontWeight="bold"
                  loading={mutation.isPending}
                  mt={2}
                >
                  Créer le compte coach
                </Button>
              </VStack>
            </form>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const { user } = useAuth();
  const { data: stats } = useAdminStats();
  const { data: coaches = [], isLoading: coachesLoading } = useAdminCoaches();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <Container as="main" id="contenu" maxW="container.xl" py={8} px={4}>
      <VStack gap={8} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="start">
          <VStack align="start" gap={0.5}>
            <HStack gap={2}>
              <LuShield size={16} color="var(--chakra-colors-app-primary)" />
              <Text
                fontSize="xs"
                color="app.primary"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Administration
              </Text>
            </HStack>
            <Heading as="h1" size="xl">
              Bonjour, {user?.firstName}
            </Heading>
          </VStack>
          <Header />
        </HStack>

        {/* KPI */}
        <Grid
          templateColumns={{
            base: '1fr',
            sm: '1fr 1fr',
            lg: 'repeat(4, 1fr)',
          }}
          gap={4}
        >
          <StatCard
            label="Coachs"
            value={stats?.coachCount}
            icon={<LuShield size={18} />}
            color="app.primary"
          />
          <StatCard
            label="Clients"
            value={stats?.clientCount}
            icon={<LuUsers size={18} />}
            color="app.primary"
          />
          <StatCard
            label="Séances complétées"
            value={stats?.sessionCount}
            sub={
              stats?.sessionTodayCount
                ? `+${stats.sessionTodayCount} aujourd'hui`
                : undefined
            }
            icon={<LuZap size={18} />}
            color="app.primary"
          />
          <StatCard
            label="Exercices créés"
            value={stats?.exerciseCount}
            icon={<LuDumbbell size={18} />}
            color="app.primary"
          />
        </Grid>

        {/* Section coachs */}
        <VStack align="stretch" gap={0}>
          <HStack justify="space-between" mb={4} gap={3} flexWrap="wrap">
            <HStack gap={2}>
              <LuChartBar size={16} color="var(--chakra-colors-app-primary)" />
              <Heading size="md">Coachs</Heading>
              {coaches.length > 0 && (
                <Box
                  px={2}
                  py={0.5}
                  bg="whiteAlpha.100"
                  borderRadius="full"
                  fontSize="xs"
                  color="fg.muted"
                >
                  {coaches.length}
                </Box>
              )}
            </HStack>
            <Button
              size="sm"
              bg="app.primary"
              color="bg.canvas"
              fontWeight="bold"
              _hover={{ bg: 'app.primary.hover' }}
              onClick={() => setIsDrawerOpen(true)}
            >
              <LuPlus />
              Nouveau coach
            </Button>
          </HStack>

          <Box
            bg="whiteAlpha.50"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="whiteAlpha.100"
            overflow="hidden"
          >
            {coachesLoading ? (
              <VStack align="stretch" gap={0} p={4}>
                {[...Array(3)].map((_, i) => (
                  <HStack key={i} px={0} py={3} gap={4}>
                    <Skeleton
                      w="36px"
                      h="36px"
                      borderRadius="full"
                      flexShrink={0}
                    />
                    <VStack align="start" gap={1} flex={1}>
                      <Skeleton h="14px" w="140px" borderRadius="md" />
                      <Skeleton h="12px" w="180px" borderRadius="md" />
                    </VStack>
                    <Skeleton h="12px" w="80px" borderRadius="md" />
                  </HStack>
                ))}
              </VStack>
            ) : coaches.length === 0 ? (
              <Box py={12} textAlign="center">
                <LuTrendingUp
                  size={28}
                  color="var(--chakra-colors-fg-muted)"
                  style={{ margin: '0 auto 8px' }}
                />
                <Text color="fg.muted" fontSize="sm">
                  Aucun coach pour l'instant
                </Text>
                <Text color="fg.muted" fontSize="xs" mt={1}>
                  Créez le premier compte coach pour commencer
                </Text>
              </Box>
            ) : (
              coaches.map((coach) => <CoachRow key={coach._id} coach={coach} />)
            )}
          </Box>
        </VStack>
      </VStack>

      <CreateCoachDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </Container>
  );
};

export default AdminDashboard;
