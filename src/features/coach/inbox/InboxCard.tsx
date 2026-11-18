import { Avatar, Box, HStack, Text } from '@chakra-ui/react';
import { Card, Chip, type ChipTone } from '@/kit';
import type { InboxItem } from '@/shared/types';
import { EFFORT_ZONE_COLOR, getEffortSummary } from '@/domain/history/effort';
import { FEEDBACK_TAG_LABELS } from '@/domain/history/tags';
import { sessionName } from '@/domain/session/name';
import {
  clientLabel,
  doneChips,
  noteOf,
  tagsInOrder,
  whenLabel,
  type DoneChip,
} from '@/domain/inbox/feed';

const DONE_TONE: Record<DoneChip['tone'], ChipTone> = {
  up: 'teal',
  down: 'neutral',
  score: 'neutral',
};

/** L'avatar d'un client : sa photo, ses initiales, ou « ? » sans nom. */
export const ClientAvatar = ({ client }: { client: InboxItem['client'] }) => {
  const name = clientLabel(client);
  return (
    <Avatar.Root size="sm" flexShrink={0}>
      {/* Sans nom, Chakra n'aurait rien à tirer : la maquette écrit « ? ». */}
      <Avatar.Fallback
        name={client.firstName || client.lastName ? name : undefined}
      >
        {client.firstName || client.lastName ? undefined : '?'}
      </Avatar.Fallback>
      {client.picture && <Avatar.Image alt="" src={client.picture} />}
    </Avatar.Root>
  );
};

/**
 * Le ressenti en pastille, à la couleur de sa zone — ou « ancien bilan »
 * quand la séance date d'avant l'échelle d'effort : on n'invente pas de
 * réponse à une question qui n'a pas été posée.
 */
const EffortPill = ({ item }: { item: InboxItem }) => {
  const effort = getEffortSummary(item.completed);
  return (
    <Box
      as="span"
      flexShrink={0}
      px="11px"
      py="5px"
      borderRadius="full"
      bg="bg.surface"
      color={effort ? EFFORT_ZONE_COLOR[effort.zone] : 'fg.muted'}
      fontSize="13px"
      fontWeight="600"
      whiteSpace="nowrap"
    >
      {effort ? effort.label : 'ancien bilan'}
    </Box>
  );
};

/**
 * Une séance à lire, lisible sans l'ouvrir : qui, quoi, quand, comment
 * c'était, ce qu'il en a dit, et ce qui a bougé.
 *
 * Avant ce fil, le coach lisait « 3 séances à lire » dans la liste de ses
 * clients et ouvrait chaque journal pour savoir de quoi il s'agissait.
 */
export const InboxCard = ({ item }: { item: InboxItem }) => {
  const { completed } = item;
  const note = noteOf(item);
  const { chips, more } = doneChips(item);
  const tags = tagsInOrder(completed.feedback?.tags);
  const title =
    completed.sessionName ||
    sessionName({ order: completed.sessionOrder, name: completed.sessionName });

  return (
    <Card gap="10px" data-inbox-card={completed._id}>
      <HStack gap="10px" align="center">
        <ClientAvatar client={item.client} />
        <Box flex={1} minW={0}>
          <Text fontWeight="700" fontSize="16px" truncate>
            {clientLabel(item.client)}
          </Text>
          <Text color="fg.muted" fontSize="sm" truncate>
            {title} · {whenLabel(completed.completedAt)}
          </Text>
        </Box>
        <EffortPill item={item} />
      </HStack>
      {note?.kind === 'quote' && (
        <Text fontSize="16px">«&nbsp;{note.text}&nbsp;»</Text>
      )}
      {note?.kind === 'hint' && <Text color="fg.muted">{note.text}</Text>}
      {(tags.length > 0 || chips.length > 0) && (
        <HStack gap="6px" wrap="wrap">
          {tags.map((tag) => (
            <Chip key={tag} tone={tag === 'pain' ? 'coral' : 'neutral'}>
              {FEEDBACK_TAG_LABELS[tag]}
            </Chip>
          ))}
          {chips.map((chip) => (
            <Chip key={chip.text} tone={DONE_TONE[chip.tone]}>
              {chip.text}
            </Chip>
          ))}
          {more > 0 && <Chip tone="outline">+ {more}</Chip>}
        </HStack>
      )}
    </Card>
  );
};
