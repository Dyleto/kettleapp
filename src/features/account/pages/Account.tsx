import { useMemo, useState } from 'react';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { Link as RouterLink, useNavigate } from 'react-router';
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
import { useAuth } from '@/shared/contexts/useAuth';
import { useAccount } from '@/features/account/hooks/useAccount';
import { HealthConsentCard } from '@/features/account/components/HealthConsentCard';
import { SoundSetting } from '@/features/client/components/SoundSetting';
import { DeleteAccountDialog } from '@/features/account/components/DeleteAccountDialog';
import { BackLink } from '@/shared/components/BackLink';
import { LEGAL, LEGAL_ROUTES } from '@/shared/config/legal';
import { CLIENT_ROUTES, COACH_ROUTES } from '@/shared/config/routes';

const DAY_FORMAT = new Intl.DateTimeFormat('fr-FR', {
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

const InfoCard = ({ children }: { children: React.ReactNode }) => (
  <Box
    bg="surface.card"
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
 * comment partir.
 *
 * Le même écran sert le coach et le client — un compte peut porter les deux
 * rôles. Chaque section n'apparaît que si le rôle correspondant existe, et
 * seul le client voit celle des données de santé : un coach n'en déclare
 * aucune.
 *
 * Une seule voix : Kettle tutoie tout le monde. La page vouvoyait le coach
 * et tutoyait le client, selon l'espace d'où l'on venait, et chaque phrase
 * passait par une bascule — dix-huit en tout. Un compte portant les deux
 * rôles lisait donc la même page dans deux tons selon le bouton qui l'y
 * avait mené. L'espace ne décide plus que d'une chose : où ramène le lien de
 * retour.
 *
 * Les textes de la carte de consentement restent à la première personne, qui
 * est la voix d'un consentement.
 */
const Account = ({ space }: Props) => {
  useDocumentTitle('Mon compte');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useAccount();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const inClientSpace = space === 'client';
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  const consequences = useMemo(() => {
    if (!data) return [];
    const lines: string[] = ['Ton compte et ton accès à Kettle'];

    if (data.asClient) {
      const n = data.asClient.completedCount;
      lines.push(
        n > 0
          ? `Tes ${n} séance${n > 1 ? 's' : ''} et toutes tes charges`
          : `Ton programme`
      );
      const coachNames = data.asClient.coaches
        .map((c) => `${c.firstName} ${c.lastName}`.trim())
        .filter(Boolean);
      if (coachNames.length > 0) {
        lines.push(
          `Ton lien avec ${coachNames.join(', ')} — ce que tu fais ne ${coachNames.length > 1 ? 'leur' : 'lui'} sera plus montré`
        );
      }
    }

    if (data.asCoach) {
      const n = data.asCoach.clientCount;
      lines.push('Tes exercices et tes programmes');
      if (n > 0) {
        lines.push(
          `Le lien avec tes ${n} client${n > 1 ? 's' : ''} — leurs séances déjà réalisées leur restent`
        );
      }
    }

    return lines;
  }, [data]);

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
            label={inClientSpace ? "Aujourd'hui" : 'Clients'}
            onClick={() =>
              navigate(
                inClientSpace ? CLIENT_ROUTES.today : COACH_ROUTES.clients
              )
            }
          />
          <Heading as="h1" size="lg" fontWeight="bold">
            Mon compte
          </Heading>
        </VStack>

        {/* ── Identity ───────────────────────────────────────────────── */}
        <Section title="Identité">
          <InfoCard>
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
          </InfoCard>
          <Text fontSize="xs" color="fg.muted" lineHeight="1.6">
            Ces informations viennent de ton compte Google. Pour les changer,
            passe par Google.
          </Text>
        </Section>

        {/* ── Rattachement au coach ──────────────────────────────────── */}
        {data?.asClient && data.asClient.coaches.length > 0 && (
          <Section
            title={
              data.asClient.coaches.length > 1 ? 'Tes coachs' : 'Ton coach'
            }
          >
            <VStack align="stretch" gap={2}>
              {data.asClient.coaches.map((coach) => {
                const name = `${coach.firstName} ${coach.lastName}`.trim();
                return (
                  <InfoCard key={`${name}-${coach.linkedAt}`}>
                    <HStack gap={3.5}>
                      <Avatar.Root size="md" flexShrink={0}>
                        <Avatar.Fallback name={name} />
                        <Avatar.Image alt="" src={coach.picture} />
                      </Avatar.Root>
                      <VStack align="start" gap={0.5} minW={0}>
                        <Text fontSize="sm" fontWeight="semibold">
                          {name}
                        </Text>
                        <Text fontSize="xs" color="fg.muted">
                          ton coach depuis le{' '}
                          <Text as="span" fontVariantNumeric="tabular-nums">
                            {DAY_FORMAT.format(new Date(coach.linkedAt))}
                          </Text>
                        </Text>
                      </VStack>
                    </HStack>
                  </InfoCard>
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

        {/* ── Réglages de l'appareil — côté client seulement ─────────── */}
        {data?.asClient && (
          <Section title="Sur cet appareil">
            <SoundSetting />
          </Section>
        )}

        {/* ── Espace coach ───────────────────────────────────────────── */}
        {data?.asCoach && (
          <Section title="Ton espace coach">
            <InfoCard>
              <VStack align="start" gap={2}>
                <HStack gap={2} align="baseline">
                  <Text
                    fontSize="2xl"
                    fontWeight="bold"
                    fontVariantNumeric="tabular-nums"
                  >
                    {data.asCoach.clientCount}
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    client{data.asCoach.clientCount > 1 ? 's' : ''} rattaché
                    {data.asCoach.clientCount > 1 ? 's' : ''}
                  </Text>
                </HStack>
                <Text fontSize="xs" color="fg.muted">
                  Espace ouvert le{' '}
                  <Text as="span" fontVariantNumeric="tabular-nums">
                    {DAY_FORMAT.format(new Date(data.asCoach.since))}
                  </Text>
                </Text>
              </VStack>
            </InfoCard>
          </Section>
        )}

        {/* ── Legal information ──────────────────────────────────────── */}
        <Section title="Informations légales">
          <Box
            bg="surface.card"
            borderWidth="1px"
            borderColor="whiteAlpha.100"
            borderRadius="xl"
            overflow="hidden"
          >
            {[
              {
                label: 'Politique de confidentialité',
                to: LEGAL_ROUTES.privacy,
              },
              { label: 'Mentions légales', to: LEGAL_ROUTES.legalNotice },
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
            Pour recevoir une copie de tes données, écris à{' '}
            <Link
              href={`mailto:${LEGAL.publisher.contactEmail}`}
              color="app.primary"
              textDecoration="underline"
            >
              {LEGAL.publisher.contactEmail}
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
            La suppression efface ton compte, tes séances et tes rattachements.
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
      />
    </Box>
  );
};

export default Account;
