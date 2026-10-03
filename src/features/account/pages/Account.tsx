import { useMemo, useState } from 'react';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
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
import { useAuth } from '@/shared/contexts/useAuth';
import { useAccount } from '@/features/account/hooks/useAccount';
import { HealthConsentCard } from '@/features/account/components/HealthConsentCard';
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
 * La règle d'adresse : Kettle tutoie le client et vouvoie le coach, et c'est
 * l'espace où l'on se trouve qui décide — pas le sujet de la section. Un
 * compte portant les deux rôles lisait ses sections « client » au tutoiement
 * alors qu'il était dans l'espace coach, parce que trois titres avaient été
 * écrits en dur. D'où la règle : aucune phrase de cette page ne s'adresse au
 * lecteur sans passer par `informal`. Les textes qui ne le peuvent pas — ceux que
 * la carte de consentement partage avec l'accueil du client — sont écrits à
 * la première personne, qui est de toute façon la voix d'un consentement.
 */
const Account = ({ space }: Props) => {
  useDocumentTitle('Mon compte');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useAccount();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const informal = space === 'client';
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  const consequences = useMemo(() => {
    if (!data) return [];
    const lines: string[] = [
      informal
        ? 'Ton compte et ton accès à Kettle'
        : 'Votre compte et votre accès à Kettle',
    ];

    if (data.asClient) {
      const n = data.asClient.completedCount;
      lines.push(
        n > 0
          ? `${informal ? 'Tes' : 'Vos'} ${n} séance${n > 1 ? 's' : ''} et toutes ${informal ? 'tes' : 'vos'} charges`
          : `${informal ? 'Ton' : 'Votre'} programme`
      );
      const coachNames = data.asClient.coaches
        .map((c) => `${c.firstName} ${c.lastName}`.trim())
        .filter(Boolean);
      if (coachNames.length > 0) {
        lines.push(
          `${informal ? 'Ton' : 'Votre'} lien avec ${coachNames.join(', ')} — ${coachNames.length > 1 ? 'ils ne verront' : 'il ou elle ne verra'} plus rien`
        );
      }
    }

    if (data.asCoach) {
      const n = data.asCoach.clientCount;
      lines.push(
        `${informal ? 'Ta' : 'Votre'} bibliothèque d'exercices et ${informal ? 'tes' : 'vos'} programmes`
      );
      if (n > 0) {
        lines.push(
          `Le lien avec ${informal ? 'tes' : 'vos'} ${n} client${n > 1 ? 's' : ''} — leurs séances déjà réalisées leur restent`
        );
      }
    }

    return lines;
  }, [data, informal]);

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
            label={informal ? "Aujourd'hui" : 'Mes clients'}
            onClick={() =>
              navigate(informal ? CLIENT_ROUTES.today : COACH_ROUTES.clients)
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
            Ces informations viennent {informal ? 'de ton' : 'de votre'} compte
            Google. Pour les changer, {informal ? 'passe' : 'passez'} par
            Google.
          </Text>
        </Section>

        {/* ── Rattachement au coach ──────────────────────────────────── */}
        {data?.asClient && data.asClient.coaches.length > 0 && (
          <Section
            title={
              data.asClient.coaches.length > 1
                ? informal
                  ? 'Tes coachs'
                  : 'Vos coachs'
                : informal
                  ? 'Ton coach'
                  : 'Votre coach'
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
                          rattaché depuis le{' '}
                          <Text as="span" fontFamily="mono">
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
          <Section
            title={informal ? 'Tes données de santé' : 'Vos données de santé'}
          >
            <HealthConsentCard
              consent={data.asClient.healthConsent}
              healthDataCount={data.asClient.healthDataCount}
            />
          </Section>
        )}

        {/* ── Espace coach ───────────────────────────────────────────── */}
        {data?.asCoach && (
          <Section title={informal ? 'Ton espace coach' : 'Votre espace coach'}>
            <InfoCard>
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
            Pour recevoir une copie de {informal ? 'tes' : 'vos'} données,{' '}
            {informal ? 'écris' : 'écrivez'} à{' '}
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
            La suppression efface {informal ? 'ton' : 'votre'} compte,{' '}
            {informal ? 'tes' : 'vos'} séances et {informal ? 'tes' : 'vos'}{' '}
            rattachements. Elle est définitive.
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
        informal={informal}
      />
    </Box>
  );
};

export default Account;
