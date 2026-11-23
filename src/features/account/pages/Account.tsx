import { useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  type BoxProps,
  chakra,
  HStack,
  Portal,
  Text,
  VStack,
} from '@chakra-ui/react';
import { LuChevronRight, LuLogOut } from 'react-icons/lu';
import { Link as RouterLink, useNavigate } from 'react-router';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { useAuth } from '@/shared/contexts/useAuth';
import { useAccount } from '@/features/account/hooks/useAccount';
import { isUnavailable } from '@/shared/utils/queryState';
import { HealthConsentCard } from '@/features/account/components/HealthConsentCard';
import { DeviceSettings } from '@/features/account/components/DeviceSettings';
import { DeleteAccountDialog } from '@/features/account/components/DeleteAccountDialog';
import { InviteSheet } from '@/features/auth';
import { useSheetDismiss } from '@/features/workshop';
import {
  ActionButton,
  BackLink,
  CopyField,
  Eyebrow,
  Sheet,
  LoadingShapes,
  ZoneFailure,
} from '@/kit';
import { LEGAL, LEGAL_ROUTES } from '@/shared/config/legal';
import { CLIENT_ROUTES, COACH_ROUTES } from '@/shared/config/routes';
import {
  coachLine,
  deleteConsequences,
  sharedWith,
} from '@/domain/account/summary';

const MONTH_FORMAT = new Intl.DateTimeFormat('fr-FR', {
  month: 'long',
  year: 'numeric',
});

/** Une carte de lignes : le fond, l'arrondi, un filet entre les lignes. */
const Rows = ({ children, ...rest }: BoxProps) => (
  <Box bg="surface.card" borderRadius="card" overflow="hidden" {...rest}>
    {children}
  </Box>
);

/** Une ligne d'information : un intitulé, et sa valeur à droite. */
const ValueRow = ({ label, value }: { label: string; value: string }) => (
  <HStack
    minH="52px"
    px="16px"
    gap="12px"
    borderTopWidth="1px"
    borderColor="line"
    _first={{ borderTopWidth: 0 }}
  >
    <Text flex={1}>{label}</Text>
    <Text fontWeight="700" fontVariantNumeric="tabular-nums">
      {value}
    </Text>
  </HStack>
);

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  w: 'full',
  minH: '52px',
  px: '16px',
  textAlign: 'left',
  color: 'fg',
  borderTopWidth: '1px',
  borderColor: 'line',
  _first: { borderTopWidth: 0 },
  _hover: { bg: 'bg.raised', textDecoration: 'none' },
  _focusVisible: { outlineOffset: '-2px' },
} as const;

/** Une ligne qui mène ailleurs : son nom, et le chevron. */
const LinkRow = ({ label, to }: { label: string; to: string }) => (
  <chakra.a asChild {...rowStyle}>
    <RouterLink to={to}>
      <Text as="span" flex={1}>
        {label}
      </Text>
      <Box color="fg.muted" aria-hidden>
        <LuChevronRight size={18} />
      </Box>
    </RouterLink>
  </chakra.a>
);

/** Une ligne qui ouvre une feuille. */
const SheetRow = ({ label, onOpen }: { label: string; onOpen: () => void }) => (
  <chakra.button
    type="button"
    aria-haspopup="dialog"
    onClick={onOpen}
    {...rowStyle}
  >
    <Text as="span" flex={1}>
      {label}
    </Text>
    <Box color="fg.muted" aria-hidden>
      <LuChevronRight size={18} />
    </Box>
  </chakra.button>
);

/**
 * « Recevoir une copie de mes données » : l'adresse à qui l'écrire, et le
 * délai. Elle vivait en petit sous les liens légaux, en `mailto:` — qui
 * n'ouvre rien sur un téléphone sans messagerie configurée.
 */
const DataCopySheet = ({ onClose }: { onClose: () => void }) => {
  useSheetDismiss(true, onClose);
  const title = 'Recevoir une copie de tes données';
  return (
    <Portal>
      <Sheet label={title} onDismiss={onClose}>
        <Text as="h2" fontWeight="800" fontSize="22px">
          {title}
        </Text>
        <Text color="fg.muted">
          Écris-nous à cette adresse depuis celle de ton compte : on t'envoie
          tout ce que Kettle garde sur toi. Réponse sous un mois.
        </Text>
        <CopyField value={LEGAL.publisher.contactEmail} />
      </Sheet>
    </Portal>
  );
};

/**
 * « Mon compte » : qui je suis, avec qui je m'entraîne, ce que je partage,
 * et comment partir.
 *
 * Le même écran sert les deux espaces, et seul le bloc du milieu change :
 * le coach du client et ses données de santé côté client, l'activité du
 * coach côté coach. Un compte qui porte les deux rôles lit le bloc de
 * l'espace où il se trouve — il les lisait tous les deux, l'un sous
 * l'autre, quel que soit le bouton qui l'avait mené là.
 *
 * Remis aux composants du kit, en une colonne de 640 px : intertitres,
 * cartes de lignes, interrupteurs. « Se déconnecter » est sur l'écran, et
 * plus seulement dans le menu du compte ; « Supprimer mon compte » est un
 * lien discret sous lui, et demande le mot avant d'agir.
 */
const Account = ({ space }: { space: 'client' | 'coach' }) => {
  useDocumentTitle('Mon compte');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const accountQuery = useAccount();
  const { data, isLoading } = accountQuery;
  // Le résumé qui ne répond pas : la panne prend la place du bloc du milieu,
  // et le reste — l'identité, les réglages, les liens, la déconnexion — ne
  // dépend pas de lui et reste à sa place. Les deux blocs disparaissaient
  // sans un mot, comme si le compte n'avait ni coach ni activité.
  const summaryDown = isUnavailable(accountQuery);
  const [deleting, setDeleting] = useState(false);
  const [sheet, setSheet] = useState<'copy' | 'invite' | null>(null);

  const inClientSpace = space === 'client';
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  const coaches = data?.asClient?.coaches ?? [];
  const consequences = useMemo(
    () => (data ? deleteConsequences(data) : []),
    [data]
  );

  if (isLoading) {
    // Les formes de l'écran plutôt qu'une roue seule au milieu d'une page
    // vide : la maquette des états, et la même règle partout (LoadingShapes).
    return (
      <Box px={{ base: 4, md: 8 }} pt={{ base: 4, md: 6 }} pb={8} maxW="704px">
        <LoadingShapes layout="column" />
      </Box>
    );
  }

  return (
    <Box
      w="100%"
      // 640 px de contenu, rembourrage compris : la maquette mesure la
      // colonne, pas la boîte.
      maxW={{ base: '672px', md: '704px' }}
      px={{ base: 4, md: 8 }}
      pt={{ base: 4, md: 6 }}
      pb={{ base: 'calc(env(safe-area-inset-bottom, 0px) + 40px)', md: 10 }}
    >
      <VStack align="stretch" gap="12px" data-account>
        <VStack align="stretch" gap="6px" mb="8px">
          <BackLink
            // L'accueil de l'espace, sous le nom de son onglet.
            label={inClientSpace ? "Aujourd'hui" : 'À lire'}
            onClick={() =>
              navigate(inClientSpace ? CLIENT_ROUTES.today : COACH_ROUTES.inbox)
            }
          />
          <Text
            as="h1"
            fontWeight="800"
            fontSize={{ base: '26px', md: '32px' }}
            lineHeight="1.05"
          >
            Mon compte
          </Text>
        </VStack>

        {/* L'identité vient de Google : elle se lit ici, elle se change
            là-bas. Sans nom, l'adresse seule. */}
        <HStack
          gap="14px"
          bg="surface.card"
          borderRadius="card"
          p="16px"
          data-account-identity
        >
          <Avatar.Root size="lg" flexShrink={0}>
            <Avatar.Fallback name={fullName || user?.email} />
            <Avatar.Image alt="" src={user?.picture} />
          </Avatar.Root>
          <VStack align="start" gap="2px" minW={0}>
            {fullName && (
              <Text fontWeight="800" fontSize="18px" lineClamp={1}>
                {fullName}
              </Text>
            )}
            <Text fontSize="sm" color="fg.muted" lineClamp={1}>
              {user?.email} · compte Google
            </Text>
          </VStack>
        </HStack>

        {summaryDown && (
          <Box pt="8px">
            <ZoneFailure
              line={
                inClientSpace
                  ? 'Ton coach et tes données de santé n’ont pas pu se charger. Rien n’a changé.'
                  : 'Ton activité n’a pas pu se charger. Rien n’a changé.'
              }
              onRetry={() => void accountQuery.refetch()}
              isRetrying={accountQuery.isRefetching}
            />
          </Box>
        )}

        {inClientSpace && data?.asClient && (
          <>
            <Box pt="8px">
              <Eyebrow>
                {coaches.length > 1 ? 'Tes coachs' : 'Ton coach'}
              </Eyebrow>
            </Box>
            {coaches.length > 0 ? (
              <Rows data-account-coaches>
                {coaches.map((coach) => {
                  const name = `${coach.firstName} ${coach.lastName}`.trim();
                  return (
                    <HStack
                      key={`${name}-${coach.linkedAt}`}
                      gap="12px"
                      px="16px"
                      py="12px"
                      borderTopWidth="1px"
                      borderColor="line"
                      _first={{ borderTopWidth: 0 }}
                    >
                      <Avatar.Root size="sm" w="38px" h="38px" aria-hidden>
                        <Avatar.Fallback name={name} />
                        <Avatar.Image alt="" src={coach.picture} />
                      </Avatar.Root>
                      <VStack align="start" gap="2px" minW={0}>
                        <Text fontWeight="700">{name}</Text>
                        <Text fontSize="sm" color="fg.muted">
                          {coachLine(
                            coach,
                            data.asClient!.completedCount,
                            coaches.length
                          )}
                        </Text>
                      </VStack>
                    </HStack>
                  );
                })}
              </Rows>
            ) : (
              <VStack
                align="stretch"
                gap="10px"
                bg="surface.card"
                borderRadius="card"
                p="16px"
                data-account-no-coach
              >
                {/* Ni « rattaché » ni « rattachée » : on ne connaît pas le
                    genre de la personne. */}
                <Text>Aucun coach pour l'instant.</Text>
                <Text fontSize="sm" color="fg.muted">
                  Ton programme arrive quand un coach t'invite : ouvre son lien,
                  ou colle-le ici.
                </Text>
                <ActionButton
                  tone="ghost"
                  size="md"
                  onClick={() => setSheet('invite')}
                >
                  J'ai reçu une invitation
                </ActionButton>
              </VStack>
            )}

            <Box pt="8px">
              <Eyebrow>Données de santé</Eyebrow>
            </Box>
            <HealthConsentCard
              consent={data.asClient.healthConsent}
              healthDataCount={data.asClient.healthDataCount}
              sharedWith={sharedWith(coaches)}
            />
          </>
        )}

        {!inClientSpace && data?.asCoach && (
          <>
            <Box pt="8px">
              <Eyebrow>Ton activité</Eyebrow>
            </Box>
            <Rows data-account-activity>
              <ValueRow
                label="Clients suivis"
                value={String(data.asCoach.clientCount)}
              />
              <ValueRow
                label="Coach depuis"
                value={MONTH_FORMAT.format(new Date(data.asCoach.since))}
              />
            </Rows>
          </>
        )}

        <Box pt="8px">
          <Eyebrow>Pendant la séance</Eyebrow>
        </Box>
        <Rows>
          <DeviceSettings />
        </Rows>

        <Rows mt="8px" data-account-legal>
          <LinkRow
            label="Politique de confidentialité"
            to={LEGAL_ROUTES.privacy}
          />
          <LinkRow label="Mentions légales" to={LEGAL_ROUTES.legalNotice} />
          <SheetRow
            label="Recevoir une copie de mes données"
            onOpen={() => setSheet('copy')}
          />
        </Rows>

        {/* Elle n'était que dans le menu du compte, au bout d'un avatar. Une
            séance en cours reste sur l'appareil. */}
        <ActionButton tone="ghost" size="md" w="full" mt="8px" onClick={logout}>
          <LuLogOut size={18} aria-hidden />
          Se déconnecter
        </ActionButton>
        {/* La suppression dit ce qui disparaît, avec les vrais nombres :
            sans le résumé, elle ne le peut pas. Elle revient avec lui. */}
        {data && (
          <chakra.button
            type="button"
            onClick={() => setDeleting(true)}
            alignSelf="center"
            minH="44px"
            px="12px"
            color="app.error.fg"
            fontSize="sm"
            fontWeight="600"
            _hover={{ textDecoration: 'underline' }}
          >
            Supprimer mon compte
          </chakra.button>
        )}
      </VStack>

      {sheet === 'copy' && <DataCopySheet onClose={() => setSheet(null)} />}
      {sheet === 'invite' && <InviteSheet onClose={() => setSheet(null)} />}
      <DeleteAccountDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        consequences={consequences}
      />
    </Box>
  );
};

export default Account;
