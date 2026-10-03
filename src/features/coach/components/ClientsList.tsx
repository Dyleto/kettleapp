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
import { useToastError } from '@/shared/hooks/useToastError';
import { EFFORT_ZONE_COLOR, getEffortLevel } from '@/features/client/constants';
import { Card } from '@/shared/components/Card';
import { hitArea } from '@/shared/components/hitArea';
import { COACH_ROUTES } from '@/shared/config/routes';
import { stripAccents } from '@/shared/utils/formatters';
import { Client } from '@/shared/types';

const SILENCE_THRESHOLD_DAYS = 14;

const daysSince = (date: Date | string) =>
  Math.floor((Date.now() - new Date(date).getTime()) / 86400000);

/**
 * Depuis combien de jours ce client n'a rien fait.
 *
 * Sans séance terminée, on compte depuis son rattachement : « n'a jamais fait
 * de séance » et « a décroché » restent deux phrases différentes à l'écran,
 * mais pour le tri ce sont deux formes de la même inactivité — et celui qui
 * s'est inscrit il y a trois mois sans jamais commencer est le plus urgent
 * des deux.
 */
const inactivityDays = (client: Client): number =>
  daysSince(client.lastCompletedAt ?? client.linkedAt);

/**
 * Une ligne de client, en cellules fixes.
 *
 * Quatre anatomies de ligne cohabitaient : « Trop dure · il y a 3 jours »,
 * « rien depuis 3 sem. », « nouveau client », « jamais fait de séance » — plus
 * un « 3 » ambre sans légende à droite. Balayer une colonne était impossible :
 * il fallait lire les sept lignes une à une, et l'ordre du tri « À traiter »
 * ne se reconstituait depuis aucune d'elles.
 *
 * La grammaire est maintenant fixe — état · ancienneté · ce qui attend — et
 * les cellules vides restent vides à leur place. Ce qui attend le coach est
 * écrit en toutes lettres : c'est ce qui rend le rang de chaque client
 * évident.
 */
interface RowCells {
  /** L'état en un mot : la dernière note d'effort, ou « Nouveau ». */
  status: string | null;
  /** Depuis quand, lorsque la cellule suivante ne le dit pas déjà. */
  since: string | null;
  /** Ce qui attend le coach, ou rien. */
  waiting: string | null;
  /** Une séance non lue appelle une action ; un silence ne fait que durer. */
  waitingIsAction: boolean;
}

/**
 * « il y a 3 semaines » — une seule grammaire pour toute la colonne.
 *
 * Quatre tournures cohabitaient, et balayer la colonne était impossible :
 * il fallait relire chaque ligne. Les paliers sont choisis pour que la
 * phrase reste courte sans jamais mentir — au-delà de deux mois on ne
 * compte plus les semaines, personne ne lit « il y a 11 semaines ».
 */
const agoLabel = (days: number): string => {
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return 'hier';
  if (days < 14) return `il y a ${days} jours`;
  const weeks = Math.floor(days / 7);
  if (weeks < 9) return `il y a ${weeks} semaines`;
  const months = Math.floor(days / 30);
  return `il y a ${months} mois`;
};

const rowCells = (client: Client, effortLabel?: string): RowCells => {
  // Jamais commencé. Passé le seuil de silence, ce n'est plus un nouveau
  // client : c'est quelqu'un d'inscrit qui n'a rien fait.
  if (!client.lastCompletedAt) {
    const days = daysSince(client.linkedAt);
    return days >= SILENCE_THRESHOLD_DAYS
      ? {
          // L'ancienneté se compte depuis le rattachement : c'est ce qui
          // sépare deux clients jamais commencés dans le tri « À traiter ».
          status: null,
          since: agoLabel(days),
          waiting: 'jamais démarré',
          waitingIsAction: false,
        }
      : {
          status: 'Nouveau',
          since: agoLabel(days),
          waiting: null,
          waitingIsAction: false,
        };
  }

  const days = daysSince(client.lastCompletedAt);
  const status = effortLabel ?? null;

  // Des séances à lire : la seule cellule qui appelle une action, et elle
  // prime sur le silence — on ne peut pas être silencieux et avoir écrit.
  if (client.unseenCount > 0) {
    const n = client.unseenCount;
    return {
      status,
      since: agoLabel(days),
      waiting: `${n} séance${n > 1 ? 's' : ''} à lire`,
      waitingIsAction: true,
    };
  }

  // Le silence. La cellule d'ancienneté reste vide : la phrase la porte
  // déjà, et la répéter à deux centimètres n'ajoute rien.
  if (days >= SILENCE_THRESHOLD_DAYS) {
    return {
      status,
      since: null,
      waiting: `rien ${agoLabel(days).replace('il y a', 'depuis')}`,
      waitingIsAction: false,
    };
  }

  return {
    status,
    since: agoLabel(days),
    waiting: null,
    waitingIsAction: false,
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

// À traiter d'abord — le plus de séances non lues — puis les plus
// longtemps inactifs, puis l'ordre alphabétique. Le premier nom de la liste
// est toujours le prochain à traiter, pour l'une ou l'autre raison.
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
  /** Le client dont l'aperçu s'affiche à côté. */
  selected?: boolean;
}

const ClientRow = ({ client, onSelect, selected }: ClientRowProps) => {
  const effort = getEffortLevel(client.lastEffort);
  const cells = rowCells(client, effort?.label);

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
      {/* Des colonnes, pas une phrase. Sur les écrans larges les cinq
          cellules s'alignent d'une ligne à l'autre : on balaye « ce qui
          attend » sans lire les noms. Sur un téléphone la largeur manque,
          mais l'ordre de lecture reste le même — l'état et l'ancienneté sous
          le nom, ce qui attend à droite. */}
      <Grid
        alignItems="center"
        columnGap={3}
        rowGap={0}
        templateColumns={{
          base: '32px auto minmax(0, 1fr) auto',
          // 152 px : « rien depuis 3 semaines » est la plus longue phrase de
          // cette colonne, et elle se tronquait à 136.
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

        {/* Les cellules vides restent vides, mais à leur place : c'est ce
            qui permet de comparer deux lignes sans les relire. */}
        <Text
          gridArea="etat"
          fontSize="xs"
          fontWeight="bold"
          color={effort ? EFFORT_ZONE_COLOR[effort.zone] : 'fg.muted'}
          truncate
          minW={0}
        >
          {cells.status}
        </Text>

        <Text
          gridArea="anciennete"
          fontSize="xs"
          color="fg.muted"
          truncate
          minW={0}
        >
          {cells.since}
        </Text>

        {/* Écrit en toutes lettres, à la place du nombre nu. Un « 3 » en
            ambre ne disait ni ce qu'il comptait ni quoi en faire — et sur la
            même ligne que la note d'effort, l'ambre entrait en concurrence
            avec une couleur qui veut dire autre chose. Seule une séance non
            lue appelle une action, donc seule elle porte l'accent. */}
        <Text
          gridArea="attente"
          fontSize="xs"
          textAlign="end"
          whiteSpace="nowrap"
          fontWeight={cells.waitingIsAction ? 'bold' : 'normal'}
          color={cells.waitingIsAction ? 'app.primary' : 'fg.muted'}
          truncate
          minW={0}
        >
          {cells.waiting}
        </Text>
      </Grid>
    </Card>
  );
};

interface ClientsListProps {
  /**
   * Quand un aperçu accompagne la liste, cliquer sélectionne au lieu
   * d'ouvrir : l'aperçu répond, et l'éditeur reste à un bouton. Sans aperçu —
   * sur un écran étroit — le clic ouvre directement, comme avant.
   */
  onPreview?: (client: Client) => void;
  selectedId?: string;
}

/**
 * La liste des clients, ordonnée par ce qu'il y a à faire.
 *
 * Ce n'est pas un annuaire : le premier nom est toujours le prochain à
 * traiter. L'ordre alphabétique n'arrive qu'en dernier recours, quand ni les
 * séances non lues ni le silence ne départagent.
 */
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

  // Toujours l'éditeur, jamais le journal.
  //
  // Les séances non lues y menaient : on arrivait sur le bon client et le bon
  // ressenti — « trop dur, je n'ai pas fini le dernier bloc » — sur un écran
  // en lecture seule. Le geste que ce ressenti appelle, alléger la séance, se
  // fait dans l'éditeur, qui montre déjà ce même ressenti à côté du programme
  // qu'il commente. Le journal reste l'historique complet, ouvert par son
  // propre bouton.
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
      {/* La recherche et le tri n'apparaissent qu'une fois que la liste
          ne tient plus d'un coup d'œil. En dessous, l'ordre de traitement
          suffit et deux commandes de plus ne feraient qu'encombrer. */}
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
