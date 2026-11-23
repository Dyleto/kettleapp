import { useState } from 'react';
import {
  Avatar,
  Box,
  Flex,
  Grid,
  HStack,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { LuPlus, LuShield } from 'react-icons/lu';
import {
  ActionButton,
  EmptyState,
  LoadFailure,
  NavRail,
  SlowNotice,
} from '@/kit';
import { Header } from '@/shared/components/Header';
import { MobileTopBar } from '@/shared/components/MobileTopBar';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import type { AdminCoach } from '@/shared/types';
import { coachFacts, coachName, statTiles } from '@/domain/admin/coaches';
import { useAdminCoaches } from '../hooks/useAdminCoaches';
import { useAdminStats } from '../hooks/useAdminStats';
import { NewCoachDialog } from '../components/NewCoachDialog';

/** La seule destination de l'espace : le rail la nomme, comme l'écran. */
const ADMIN_NAV = [
  { to: '/admin', label: 'Administration', icon: LuShield, end: true },
];

/** Les colonnes d'une ligne de coach sur grand écran. */
const ROW_COLUMNS = '36px minmax(0, 1.4fr) 1fr 1fr 1fr';

/** Un coach : une ligne de tableau sur grand écran, une carte sur téléphone. */
const CoachRow = ({ coach }: { coach: AdminCoach }) => {
  const name = coachName(coach);
  const facts = coachFacts(coach);
  const avatar = (
    <Avatar.Root size="sm" w="36px" h="36px" flexShrink={0} aria-hidden>
      <Avatar.Fallback name={name} />
      <Avatar.Image alt="" src={coach.picture} />
    </Avatar.Root>
  );
  const identity = (
    <VStack align="start" gap="2px" minW={0}>
      <Text fontWeight="700" truncate maxW="full">
        {name}
      </Text>
      {name !== coach.email && (
        <Text fontSize="sm" color="fg.muted" truncate maxW="full">
          {coach.email}
        </Text>
      )}
    </VStack>
  );
  return (
    <Box
      as="li"
      listStyleType="none"
      data-coach={coach.email}
      borderTopWidth={{ base: 0, md: '1px' }}
      borderColor="line"
      _first={{ borderTopWidth: 0 }}
    >
      {/* Sur grand écran : les colonnes de la maquette. */}
      <Grid
        display={{ base: 'none', md: 'grid' }}
        templateColumns={ROW_COLUMNS}
        alignItems="center"
        gap="14px"
        minH="64px"
        px="16px"
      >
        {avatar}
        {identity}
        <Text>{facts.clients}</Text>
        <Text>{facts.exercises}</Text>
        <Text fontSize="sm" color="fg.muted" textAlign="right">
          {facts.since}
        </Text>
      </Grid>
      {/* Sur téléphone : une carte, les nombres en une ligne. */}
      <VStack
        display={{ base: 'flex', md: 'none' }}
        align="stretch"
        gap="10px"
        bg="surface.card"
        borderRadius="card"
        p="14px 16px"
      >
        <HStack gap="12px" minW={0}>
          {avatar}
          {identity}
        </HStack>
        <Text fontSize="sm" color="fg.muted">
          {facts.clients} · {facts.exercises} · {facts.since}
        </Text>
      </VStack>
    </Box>
  );
};

/**
 * L'administration : quatre nombres et la liste des coachs. Elle sert à
 * ouvrir un compte de coach.
 *
 * Remise aux composants du kit : le rail et la barre du haut des autres
 * espaces, les tuiles des clients, des lignes plutôt que des cartes à
 * liseré. Elle portait sa propre coque — un en-tête « Bonjour, Corentin »
 * et l'avatar posé à droite —, la seule de l'application.
 *
 * Rien de nominatif dans les nombres, et rien du contenu des séances dans
 * la liste : c'est ce que la politique de confidentialité annonce, et
 * l'API ne l'envoie pas.
 *
 * Sur téléphone, les tuiles passent sur deux colonnes et chaque coach
 * devient une carte : la ligne de cinq colonnes ne tenait pas.
 */
const AdminDashboard = () => {
  useDocumentTitle('Administration');
  const statsQuery = useAdminStats();
  const coachesQuery = useAdminCoaches();
  const [creating, setCreating] = useState(false);
  const stats = statsQuery.data;
  const coaches = coachesQuery.data ?? [];

  return (
    <Flex minH="100vh">
      <NavRail items={ADMIN_NAV} footer={<Header variant="rail" />} />
      <Box flex={1} minW={0}>
        <MobileTopBar />
        <Box
          as="main"
          id="contenu"
          w="100%"
          maxW="1180px"
          px={{ base: 4, md: 8 }}
          pt={{ base: 4, md: 8 }}
          pb={{ base: 'calc(env(safe-area-inset-bottom, 0px) + 40px)', md: 10 }}
        >
          <VStack align="stretch" gap={{ base: '16px', md: '20px' }}>
            {/* Le titre et le bouton ne tiennent pas côte à côte sur un
                téléphone de 390 px : la page débordait de six pixels. Le
                bouton passe dessous. */}
            <HStack justify="space-between" gap="12px" flexWrap="wrap">
              <Text
                as="h1"
                fontWeight="800"
                fontSize={{ base: '26px', md: '32px' }}
                lineHeight="1.05"
              >
                Administration
              </Text>
              <ActionButton
                size="md"
                aria-haspopup="dialog"
                onClick={() => setCreating(true)}
              >
                <LuPlus size={18} aria-hidden />
                Nouveau coach
              </ActionButton>
            </HStack>

            {statsQuery.isError ? (
              <LoadFailure
                query={statsQuery}
                line="Les nombres n’ont pas pu se charger."
              />
            ) : (
              <Grid
                templateColumns={{
                  base: 'repeat(2, minmax(0, 1fr))',
                  lg: 'repeat(4, minmax(0, 1fr))',
                }}
                gap={{ base: '8px', md: '14px' }}
                data-admin-stats
              >
                {(stats
                  ? statTiles(stats)
                  : Array.from({ length: 4 }, () => null)
                ).map((tile, index) => (
                  <VStack
                    key={tile?.key ?? index}
                    align="start"
                    gap="2px"
                    bg="surface.card"
                    borderRadius="22px"
                    px={{ base: '14px', md: '18px' }}
                    py={{ base: '12px', md: '16px' }}
                    minW={0}
                    data-stat={tile?.key}
                  >
                    {tile ? (
                      <>
                        <Text
                          fontFamily="heading"
                          fontWeight="800"
                          fontSize={{ base: '30px', md: '44px' }}
                          lineHeight="0.95"
                          fontVariantNumeric="tabular-nums"
                        >
                          {tile.count}
                        </Text>
                        <Text fontWeight="700">{tile.label}</Text>
                        {tile.sub && (
                          <Text fontSize="xs" color="app.success">
                            {tile.sub}
                          </Text>
                        )}
                      </>
                    ) : (
                      <>
                        <Skeleton h="40px" w="64px" borderRadius="10px" />
                        <Skeleton h="16px" w="90px" borderRadius="8px" />
                      </>
                    )}
                  </VStack>
                ))}
              </Grid>
            )}

            {coachesQuery.isError ? (
              <LoadFailure
                query={coachesQuery}
                line="La liste des coachs n’a pas pu se charger."
              />
            ) : coachesQuery.isLoading ? (
              <VStack align="stretch" gap="8px" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} h="64px" borderRadius="card" />
                ))}
                <SlowNotice />
              </VStack>
            ) : coaches.length === 0 ? (
              <EmptyState
                title="Aucun coach pour l’instant"
                line="« Nouveau coach » ouvre le premier compte."
              />
            ) : (
              <Box
                as="ul"
                aria-label="Coachs"
                display="flex"
                flexDirection="column"
                gap={{ base: '8px', md: 0 }}
                bg={{ base: 'transparent', md: 'surface.card' }}
                borderRadius="card"
                overflow="hidden"
                data-admin-coaches
              >
                {coaches.map((coach) => (
                  <CoachRow key={coach._id} coach={coach} />
                ))}
              </Box>
            )}
          </VStack>
        </Box>
      </Box>
      <NewCoachDialog open={creating} onClose={() => setCreating(false)} />
    </Flex>
  );
};

export default AdminDashboard;
