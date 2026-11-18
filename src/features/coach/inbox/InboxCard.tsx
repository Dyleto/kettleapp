import { Avatar, Box, chakra, HStack, Text } from '@chakra-ui/react';
import { LuMessageCircle, LuSlidersHorizontal } from 'react-icons/lu';
import { activeReaction, toggledReaction } from '@/domain/inbox/reply';
import { useReply } from '@/features/coach/hooks/useInboxActions';
import { toaster } from '@/shared/components/ui/toasterInstance';
import { Reactions } from './Reactions';
import type { ReactNode } from 'react';
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
export const EffortPill = ({ item }: { item: InboxItem }) => {
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

/** Une action secondaire de la carte : « Répondre », « Ajuster ». */
const CardAction = ({
  onClick,
  icon,
  children,
  tone = 'neutral',
}: {
  onClick: () => void;
  icon: ReactNode;
  children: string;
  tone?: 'neutral' | 'amber';
}) => (
  <chakra.button
    type="button"
    onClick={onClick}
    display="inline-flex"
    alignItems="center"
    gap="6px"
    minH="40px"
    px="12px"
    borderRadius="full"
    fontSize="14px"
    fontWeight="600"
    bg={tone === 'amber' ? 'app.primary.bg' : 'bg.surface'}
    color={tone === 'amber' ? 'app.primary.fg' : 'fg'}
  >
    {icon}
    {children}
  </chakra.button>
);

/**
 * Une séance à lire, lisible sans l'ouvrir : qui, quoi, quand, comment
 * c'était, ce qu'il en a dit, et ce qui a bougé.
 *
 * Avant ce fil, le coach lisait « 3 séances à lire » dans la liste de ses
 * clients et ouvrait chaque journal pour savoir de quoi il s'agissait.
 *
 * Trois gestes en pied de carte. Une réaction part d'une touche, et la
 * séance est lue du même coup ; la toucher de nouveau la retire. « Répondre »
 * ouvre le champ, « Ajuster » l'atelier du client sur cette séance. Toucher
 * la carte elle-même l'ouvre — et la marque lue : c'est aussi le chemin de
 * qui ne peut pas glisser.
 */
export const InboxCard = ({
  item,
  coachId,
  onOpen,
  onReply,
  onAdjust,
}: {
  item: InboxItem;
  coachId?: string;
  onOpen?: () => void;
  onReply?: () => void;
  onAdjust?: () => void;
}) => {
  const { completed } = item;
  const note = noteOf(item);
  const { chips, more } = doneChips(item);
  const tags = tagsInOrder(completed.feedback?.tags);
  const title =
    completed.sessionName ||
    sessionName({ order: completed.sessionOrder, name: completed.sessionName });
  const reply = useReply();
  const reacted = activeReaction(completed.replies, coachId);

  const react = (key: Parameters<typeof toggledReaction>[1]) =>
    reply.mutate(
      {
        completedId: completed._id,
        body: { reaction: toggledReaction(reacted, key) },
      },
      {
        onError: () =>
          toaster.create({
            type: 'error',
            title: 'Ta réaction n’est pas partie',
            description:
              'La séance reste à lire : retouche-la quand le réseau revient.',
          }),
      }
    );

  return (
    <Card gap="10px" data-inbox-card={completed._id}>
      <chakra.button
        type="button"
        onClick={onOpen}
        disabled={!onOpen}
        aria-label={`Ouvrir la séance de ${clientLabel(item.client)} — ${title}`}
        textAlign="left"
        display="flex"
        flexDirection="column"
        gap="10px"
        cursor={onOpen ? 'pointer' : 'default'}
      >
        <HStack gap="10px" align="center" w="full">
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
      </chakra.button>
      {(onReply || onAdjust) && (
        <HStack gap="8px" wrap="wrap">
          <Reactions
            active={reacted}
            onPick={react}
            disabled={reply.isPending}
          />
          {onReply && (
            <CardAction onClick={onReply} icon={<LuMessageCircle size={14} />}>
              Répondre
            </CardAction>
          )}
          {onAdjust && (
            <Box ml="auto">
              <CardAction
                onClick={onAdjust}
                tone="amber"
                icon={<LuSlidersHorizontal size={14} />}
              >
                Ajuster
              </CardAction>
            </Box>
          )}
        </HStack>
      )}
    </Card>
  );
};
