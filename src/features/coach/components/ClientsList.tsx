import {
  Avatar,
  Box,
  Button,
  Grid,
  HStack,
  Input,
  SkeletonCircle,
  SkeletonText,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuSearch, LuX } from 'react-icons/lu';
import { useClients } from '@/features/coach/hooks/useClients';
import { useToastError } from '@/hooks/useToastError';
import { EFFORT_ZONE_COLOR, getEffortLevel } from '@/features/client/constants';
import { Card } from '@/components/Card';
import { hitArea } from '@/components/hitArea';
import { COACH_ROUTES } from '@/config/routes';
import { stripAccents } from '@/utils/formatters';
import { Client } from '@/types';

const SILENCE_THRESHOLD_DAYS = 14;

const daysSince = (date: Date | string) =>
  Math.floor((Date.now() - new Date(date).getTime()) / 86400000);

/**
 * How many days this client has done nothing.
 *
 * With no finished session we count from when they were linked: "never did a
 * session" and "dropped off" remain two different sentences on screen, but
 * for sorting they are two forms of the same inactivity, and the one signed
 * up three months ago who never started is the more urgent of the two.
 */
const inactivityDays = (client: Client): number =>
  daysSince(client.lastCompletedAt ?? client.linkedAt);

/**
 * One client row, in fixed cells.
 *
 * Four row anatomies coexisted: "Trop dure · il y a 3 jours", "rien depuis 3
 * sem.", "nouveau client", "jamais fait de séance" — plus an amber "3" with
 * no caption on the right. Scanning a column was impossible: you had to read
 * the seven rows one by one, and the "À traiter" sort order could be
 * reconstructed from none of them.
 *
 * The grammar is now fixed — status · age · what is waiting — and empty cells
 * stay empty in their place. What awaits the coach is spelled out: that is
 * what makes each client's rank self-explanatory.
 */
interface LigneClient {
  /** The status in one word: the last effort rating, or "Nouveau". */
  etat: string | null;
  /** Since when, when the next cell does not already say it. */
  anciennete: string | null;
  /** What awaits the coach, or nothing. */
  attente: string | null;
  /** An unread session calls for action; a silence merely goes on. */
  attenteEstAction: boolean;
}

/** "il y a 3 semaines", in a single grammar. */
const depuis = (days: number): string => {
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return 'hier';
  if (days < 14) return `il y a ${days} jours`;
  const weeks = Math.floor(days / 7);
  if (weeks < 9) return `il y a ${weeks} semaines`;
  const months = Math.floor(days / 30);
  return `il y a ${months} mois`;
};

const ligneClient = (client: Client, effortLabel?: string): LigneClient => {
  // Never started. Past the silence threshold this is no longer a new
  // client: it is someone signed up who has done nothing.
  if (!client.lastCompletedAt) {
    const days = daysSince(client.linkedAt);
    return days >= SILENCE_THRESHOLD_DAYS
      ? {
          // Age counts from when they were linked: it is what separates two
          // never-started clients in the "À traiter" sort.
          etat: null,
          anciennete: depuis(days),
          attente: 'jamais démarré',
          attenteEstAction: false,
        }
      : {
          etat: 'Nouveau',
          anciennete: depuis(days),
          attente: null,
          attenteEstAction: false,
        };
  }

  const days = daysSince(client.lastCompletedAt);
  const etat = effortLabel ?? null;

  // Sessions to read: the only cell that calls for action, and it outranks
  // silence — you cannot be silent and have written.
  if (client.unseenCount > 0) {
    const n = client.unseenCount;
    return {
      etat,
      anciennete: depuis(days),
      attente: `${n} séance${n > 1 ? 's' : ''} à lire`,
      attenteEstAction: true,
    };
  }

  // Silence. The age cell stays empty: the sentence already carries it, and
  // repeating it two centimetres away says nothing more.
  if (days >= SILENCE_THRESHOLD_DAYS) {
    return {
      etat,
      anciennete: null,
      attente: `rien ${depuis(days).replace('il y a', 'depuis')}`,
      attenteEstAction: false,
    };
  }

  return {
    etat,
    anciennete: depuis(days),
    attente: null,
    attenteEstAction: false,
  };
};

type ClientSort = 'triage' | 'alpha' | 'recent';

const CLIENT_SORTS: { value: ClientSort; label: string }[] = [
  { value: 'triage', label: 'À traiter' },
  { value: 'recent', label: 'Activité' },
  { value: 'alpha', label: 'A → Z' },
];

const byName = (a: Client, b: Client) =>
  `${a.firstName} ${a.lastName}`.localeCompare(
    `${b.firstName} ${b.lastName}`,
    'fr',
    { sensitivity: 'base' }
  );

// To handle first — the most unseen sessions — then the longest inactive,
// then alphabetical. The first name in the list is always the next one to
// handle, for one reason or the other.
const sortClients = (clients: Client[], sort: ClientSort): Client[] => {
  const list = [...clients];

  if (sort === 'alpha') return list.sort(byName);
  if (sort === 'recent')
    return list.sort(
      (a, b) => inactivityDays(a) - inactivityDays(b) || byName(a, b)
    );

  return list.sort((a, b) => {
    if (a.unseenCount !== b.unseenCount) return b.unseenCount - a.unseenCount;
    const gap = inactivityDays(b) - inactivityDays(a);
    if (gap !== 0) return gap;
    return byName(a, b);
  });
};

const matches = (client: Client, query: string): boolean => {
  const needle = stripAccents(query).toLowerCase().trim();
  if (!needle) return true;
  const haystack = stripAccents(
    `${client.firstName} ${client.lastName}`
  ).toLowerCase();
  return needle.split(/\s+/).every((word) => haystack.includes(word));
};

interface ClientRowProps {
  client: Client;
  onSelect: () => void;
  /** The client whose preview is shown alongside. */
  selected?: boolean;
}

const ClientRow = ({ client, onSelect, selected }: ClientRowProps) => {
  const effort = getEffortLevel(client.lastEffort);
  const ligne = ligneClient(client, effort?.label);

  return (
    <Card
      accentColor="app.primary"
      hoverEffect="border"
      withGlow={false}
      onClick={onSelect}
      p={3}
      bg={selected ? 'bg.surface' : undefined}
      aria-current={selected ? 'true' : undefined}
    >
      {/* Columns, not a sentence. On wide screens the five cells line up
          from row to row: you scan "what is waiting" without reading the
          names. On a phone the width is missing, but the reading order stays
          the same — status and age under the name, what is waiting on the
          right. */}
      <Grid
        alignItems="center"
        columnGap={3}
        rowGap={0}
        templateColumns={{
          base: '32px auto minmax(0, 1fr) auto',
          // 152 px: "rien depuis 3 semaines" is the longest sentence in
          // this column, and it truncated at 136.
          md: '32px minmax(0, 1fr) 84px 108px 152px',
        }}
        templateAreas={{
          base: `"avatar nom nom attente" "avatar etat anciennete attente"`,
          md: `"avatar nom etat anciennete attente"`,
        }}
      >
        <Avatar.Root size="sm" gridArea="avatar" flexShrink={0}>
          <Avatar.Fallback name={`${client.firstName} ${client.lastName}`} />
          {client.picture && <Avatar.Image alt="" src={client.picture} />}
        </Avatar.Root>

        <Text
          gridArea="nom"
          fontWeight="semibold"
          fontSize="sm"
          truncate
          minW={0}
        >
          {client.firstName} {client.lastName}
        </Text>

        {/* Empty cells stay empty, but in their place: that is what lets
            you compare two rows without rereading them. */}
        <Text
          gridArea="etat"
          fontSize="xs"
          fontWeight="bold"
          color={effort ? EFFORT_ZONE_COLOR[effort.zone] : 'fg.muted'}
          truncate
          minW={0}
        >
          {ligne.etat}
        </Text>

        <Text
          gridArea="anciennete"
          fontSize="xs"
          color="fg.muted"
          truncate
          minW={0}
        >
          {ligne.anciennete}
        </Text>

        {/* Spelled out, in place of the bare number. An amber "3" said
            neither what it counted nor what to do about it — and on the same
            row as the effort rating, the amber competed with a colour that
            means something else. Only an unread session calls for action, so
            only it carries the accent. */}
        <Text
          gridArea="attente"
          fontSize="xs"
          textAlign="end"
          whiteSpace="nowrap"
          fontWeight={ligne.attenteEstAction ? 'bold' : 'normal'}
          color={ligne.attenteEstAction ? 'app.primary' : 'fg.muted'}
          truncate
          minW={0}
        >
          {ligne.attente}
        </Text>
      </Grid>
    </Card>
  );
};

interface ClientsListProps {
  /**
   * When a preview accompanies the list, clicking selects rather than opens:
   * the preview answers, and the editor stays one button away. With no
   * preview — on a narrow screen — the click opens directly, as before.
   */
  onPreview?: (client: Client) => void;
  selectedId?: string;
}

export const ClientsList = ({ onPreview, selectedId }: ClientsListProps) => {
  const navigate = useNavigate();
  const { data: clients = [], isLoading, error, refetch } = useClients();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<ClientSort>('triage');

  useToastError(error, 'Impossible de charger vos clients');

  const visibleClients = useMemo(
    () =>
      sortClients(
        clients.filter((c) => matches(c, query)),
        sort
      ),
    [clients, query, sort]
  );

  // Always the editor, never the journal.
  //
  // Unseen sessions used to lead there: you arrived on the right client and
  // the right feedback — "too hard, I could not finish the last block" — on a
  // read-only screen. The gesture that feedback calls for, lightening the
  // session, happens in the editor, which already shows that same feedback
  // beside the programme it comments on. The journal remains the full
  // history, opened by its own button.
  const handleSelect = (client: Client) => {
    if (onPreview) return onPreview(client);
    navigate(COACH_ROUTES.clientSession(client._id, 1));
  };

  if (isLoading) {
    return (
      <VStack align="stretch" gap={2}>
        {[...Array(6)].map((_, index) => (
          <Card key={index} onClick={() => {}} p={3}>
            <HStack gap={3}>
              <SkeletonCircle size="8" />
              <SkeletonText noOfLines={1} width="140px" />
            </HStack>
          </Card>
        ))}
      </VStack>
    );
  }

  if (error) {
    return (
      <VStack gap={4} py={12} textAlign="center">
        <Text color="app.error" fontWeight="bold">
          Erreur de chargement
        </Text>
        <Text color="fg.muted" fontSize="sm">
          Impossible de récupérer la liste de vos clients.
        </Text>
        <Button bg="app.primary" color="bg.canvas" onClick={() => refetch()}>
          Réessayer
        </Button>
      </VStack>
    );
  }

  if (clients.length === 0) {
    return (
      <VStack gap={2} py={12} textAlign="center">
        <Text color="fg.muted">Aucun client pour le moment</Text>
        <Text color="fg.muted" fontSize="sm">
          Invitez votre premier client pour commencer.
        </Text>
      </VStack>
    );
  }

  return (
    <VStack align="stretch" gap={3}>
      {/* Search and sort only appear once the list no longer fits in a
          glance. Below that, the handling order is enough and two more
          controls would only clutter. */}
      {clients.length > 5 && (
        <VStack align="stretch" gap={2}>
          <HStack
            gap={2}
            px={2}
            py={1}
            borderBottomWidth="1px"
            borderColor="whiteAlpha.200"
            _focusWithin={{ borderColor: 'app.primary' }}
            transition="border-color 0.2s"
          >
            <LuSearch size={14} color="var(--chakra-colors-fg-muted)" />
            <Input
              placeholder="Chercher un client…"
              aria-label="Chercher un client"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              variant="subtle"
              bg="transparent"
              border="none"
              outline="none"
              size="sm"
              _focus={{ boxShadow: 'none', outline: 'none' }}
              _focusVisible={{ boxShadow: 'none', outline: 'none' }}
            />
            {query && (
              <Box
                as="button"
                aria-label="Effacer la recherche"
                color="fg.muted"
                _hover={{ color: 'fg' }}
                flexShrink={0}
                onClick={() => setQuery('')}
                css={hitArea(32)}
              >
                <LuX size={13} />
              </Box>
            )}
          </HStack>

          <HStack gap={1} role="group" aria-label="Trier les clients">
            {CLIENT_SORTS.map((option) => (
              <Box
                key={option.value}
                as="button"
                aria-pressed={sort === option.value}
                onClick={() => setSort(option.value)}
                px={2.5}
                py={1}
                borderRadius="full"
                fontSize="xs"
                fontWeight={sort === option.value ? 'bold' : 'normal'}
                color={sort === option.value ? 'bg.canvas' : 'fg.muted'}
                bg={sort === option.value ? 'app.primary' : 'whiteAlpha.100'}
                _hover={{
                  bg:
                    sort === option.value
                      ? 'app.primary.hover'
                      : 'whiteAlpha.200',
                }}
                css={hitArea(32)}
              >
                {option.label}
              </Box>
            ))}
          </HStack>
        </VStack>
      )}

      {visibleClients.length === 0 ? (
        <Text color="fg.muted" fontSize="sm" py={8} textAlign="center">
          Aucun client ne correspond à « {query} ».
        </Text>
      ) : (
        <VStack align="stretch" gap={2}>
          {visibleClients.map((client) => (
            <ClientRow
              key={client._id}
              client={client}
              onSelect={() => handleSelect(client)}
              selected={client._id === selectedId}
            />
          ))}
        </VStack>
      )}
    </VStack>
  );
};
