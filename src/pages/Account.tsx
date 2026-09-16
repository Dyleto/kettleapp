import { useMemo, useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Heading,
  HStack,
  Link,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { LuChevronRight, LuTrash2 } from 'react-icons/lu';
import { useAuth } from '@/contexts/useAuth';
import { useAccount } from '@/features/account/hooks/useAccount';
import { HealthConsentCard } from '@/features/account/components/HealthConsentCard';
import { DeleteAccountDialog } from '@/features/account/components/DeleteAccountDialog';
import { BackLink } from '@/components/BackLink';
import { LEGAL, LEGAL_ROUTES } from '@/config/legal';
import { CLIENT_ROUTES, COACH_ROUTES } from '@/config/routes';

const LE_JOUR = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section = ({ title, children }: SectionProps) => (
  <VStack align="stretch" gap={2.5}>
    <Text
      as="h2"
      fontSize="xs"
      fontWeight="bold"
      color="fg.muted"
      textTransform="uppercase"
      letterSpacing="wider"
    >
      {title}
    </Text>
    {children}
  </VStack>
);

const Carte = ({ children }: { children: React.ReactNode }) => (
  <Box
    bg="bg.card"
    borderWidth="1px"
    borderColor="whiteAlpha.100"
    borderRadius="xl"
    p={4}
  >
    {children}
  </Box>
);

interface Props {
  /** L'espace d'où l'on vient : le retour y ramène. */
  space: 'client' | 'coach';
}

/**
 * « Mon compte » : qui je suis, à qui je suis rattaché, ce que je partage, et
 * comment m'en aller.
 *
 * Le même écran sert au coach et au client — un compte peut tenir les deux
 * rôles. Chaque section n'apparaît que si le rôle correspondant existe, et
 * seul le client voit celle des données de santé : le coach n'en déclare pas.
 */
const Account = ({ space }: Props) => {
  useDocumentTitle('Mon compte');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useAccount();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const tu = space === 'client';
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  const consequences = useMemo(() => {
    if (!data) return [];
    const lignes: string[] = [
      tu ? 'Ton compte et ton accès à Kettle' : 'Votre compte et votre accès à Kettle',
    ];

    if (data.asClient) {
      const n = data.asClient.completedCount;
      lignes.push(
        n > 0
          ? `${tu ? 'Tes' : 'Vos'} ${n} séance${n > 1 ? 's' : ''} et toutes ${tu ? 'tes' : 'vos'} charges`
          : `${tu ? 'Ton' : 'Votre'} programme`
      );
      const noms = data.asClient.coaches
        .map((c) => `${c.firstName} ${c.lastName}`.trim())
        .filter(Boolean);
      if (noms.length > 0) {
        lignes.push(
          `${tu ? 'Ton' : 'Votre'} lien avec ${noms.join(', ')} — ${noms.length > 1 ? 'ils ne verront' : 'il ou elle ne verra'} plus rien`
        );
      }
    }

    if (data.asCoach) {
      const n = data.asCoach.clientCount;
      lignes.push(
        `${tu ? 'Ta' : 'Votre'} bibliothèque d'exercices et ${tu ? 'tes' : 'vos'} programmes`
      );
      if (n > 0) {
        lignes.push(
          `Le lien avec ${tu ? 'tes' : 'vos'} ${n} client${n > 1 ? 's' : ''} — leurs séances déjà réalisées leur restent`
        );
      }
    }

    return lignes;
  }, [data, tu]);

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="60vh"
      >
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box
      w="100%"
      maxW="620px"
      px={{ base: 4, md: 8 }}
      pt={{ base: 4, md: 6 }}
      pb={{ base: 'calc(env(safe-area-inset-bottom, 0px) + 40px)', md: 10 }}
    >
      <VStack align="stretch" gap={7}>
        <VStack align="stretch" gap={1.5}>
          <BackLink
            label={tu ? "Aujourd'hui" : 'Mes clients'}
            onClick={() =>
              navigate(tu ? CLIENT_ROUTES.today : COACH_ROUTES.clients)
            }
          />
          <Heading as="h1" size="lg" fontWeight="bold">
            Mon compte
          </Heading>
        </VStack>

        {/* ── Identité ───────────────────────────────────────────────── */}
        <Section title="Identité">
          <Carte>
            <HStack gap={3.5}>
              <Avatar.Root size="lg" flexShrink={0}>
                <Avatar.Fallback name={fullName} />
                <Avatar.Image alt="" src={user?.picture} />
              </Avatar.Root>
              <VStack align="start" gap={0.5} minW={0}>
                <Text fontSize="sm" fontWeight="semibold">
                  {fullName}
                </Text>
                <Text fontSize="xs" color="fg.muted" lineClamp={1}>
                  {user?.email}
                </Text>
              </VStack>
            </HStack>
          </Carte>
          <Text fontSize="xs" color="fg.muted" lineHeight="1.6">
            Ces informations viennent {tu ? 'de ton' : 'de votre'} compte
            Google. Pour les changer, {tu ? 'passe' : 'passez'} par Google.
          </Text>
        </Section>

        {/* ── Rattachement au coach ──────────────────────────────────── */}
        {data?.asClient && data.asClient.coaches.length > 0 && (
          <Section
            title={data.asClient.coaches.length > 1 ? 'Tes coachs' : 'Ton coach'}
          >
            <VStack align="stretch" gap={2}>
              {data.asClient.coaches.map((coach) => {
                const nom = `${coach.firstName} ${coach.lastName}`.trim();
                return (
                  <Carte key={`${nom}-${coach.linkedAt}`}>
                    <HStack gap={3.5}>
                      <Avatar.Root size="md" flexShrink={0}>
                        <Avatar.Fallback name={nom} />
                        <Avatar.Image alt="" src={coach.picture} />
                      </Avatar.Root>
                      <VStack align="start" gap={0.5} minW={0}>
                        <Text fontSize="sm" fontWeight="semibold">
                          {nom}
                        </Text>
                        <Text fontSize="xs" color="fg.muted">
                          rattaché depuis le{' '}
                          <Text as="span" fontFamily="mono">
                            {LE_JOUR.format(new Date(coach.linkedAt))}
                          </Text>
                        </Text>
                      </VStack>
                    </HStack>
                  </Carte>
                );
              })}
            </VStack>
          </Section>
        )}

        {/* ── Données de santé — côté client seulement ───────────────── */}
        {data?.asClient && (
          <Section title="Tes données de santé">
            <HealthConsentCard
              consent={data.asClient.healthConsent}
              healthDataCount={data.asClient.healthDataCount}
            />
          </Section>
        )}

        {/* ── Espace coach ───────────────────────────────────────────── */}
        {data?.asCoach && (
          <Section title={tu ? 'Ton espace coach' : 'Votre espace coach'}>
            <Carte>
              <VStack align="start" gap={2}>
                <HStack gap={2} align="baseline">
                  <Text fontSize="2xl" fontWeight="bold" fontFamily="mono">
                    {data.asCoach.clientCount}
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    client{data.asCoach.clientCount > 1 ? 's' : ''} rattaché
                    {data.asCoach.clientCount > 1 ? 's' : ''}
                  </Text>
                </HStack>
                <Text fontSize="xs" color="fg.muted">
                  Espace ouvert le{' '}
                  <Text as="span" fontFamily="mono">
                    {LE_JOUR.format(new Date(data.asCoach.since))}
                  </Text>
                </Text>
              </VStack>
            </Carte>
          </Section>
        )}

        {/* ── Informations légales ───────────────────────────────────── */}
        <Section title="Informations légales">
          <Box
            bg="bg.card"
            borderWidth="1px"
            borderColor="whiteAlpha.100"
            borderRadius="xl"
            overflow="hidden"
          >
            {[
              {
                label: 'Politique de confidentialité',
                to: LEGAL_ROUTES.confidentialite,
              },
              { label: 'Mentions légales', to: LEGAL_ROUTES.mentions },
            ].map(({ label, to }, index) => (
              <Box key={label}>
                {index > 0 && <Box h="1px" bg="whiteAlpha.100" />}
                <Link
                  as={RouterLink}
                  {...{ to }}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={3}
                  px={4}
                  minH="48px"
                  color="fg"
                  fontSize="sm"
                  _hover={{ bg: 'whiteAlpha.50', textDecoration: 'none' }}
                  _focusVisible={{
                    outlineOffset: '-2px',
                  }}
                >
                  <Text as="span">{label}</Text>
                  <Box color="fg.muted" display="flex">
                    <LuChevronRight size={16} />
                  </Box>
                </Link>
              </Box>
            ))}
          </Box>
          <Text fontSize="xs" color="fg.muted" lineHeight="1.6">
            Pour recevoir une copie de {tu ? 'tes' : 'vos'} données,{' '}
            {tu ? 'écris' : 'écrivez'} à{' '}
            <Link
              href={`mailto:${LEGAL.editeur.contactEmail}`}
              color="app.primary"
              textDecoration="underline"
            >
              {LEGAL.editeur.contactEmail}
            </Link>
            . Réponse sous un mois.
          </Text>
        </Section>

        {/* ── Suppression ────────────────────────────────────────────── */}
        <VStack
          align="stretch"
          gap={2.5}
          pt={6}
          borderTopWidth="1px"
          borderColor="whiteAlpha.100"
        >
          <Text fontSize="sm" color="fg.muted" lineHeight="1.6">
            La suppression efface {tu ? 'ton' : 'votre'} compte,{' '}
            {tu ? 'tes' : 'vos'} séances et {tu ? 'tes' : 'vos'} rattachements.
            Elle est définitive.
          </Text>
          <Box
            as="button"
            onClick={() => setConfirmOpen(true)}
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={2}
            w="100%"
            minH="48px"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="app.error"
            color="app.error"
            fontSize="sm"
            fontWeight="semibold"
            _hover={{ bg: 'app.error/12' }}
          >
            <LuTrash2 size={17} />
            <Text as="span">Supprimer mon compte</Text>
          </Box>
        </VStack>
      </VStack>

      <DeleteAccountDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        consequences={consequences}
        tutoiement={tu}
      />
    </Box>
  );
};

export default Account;
