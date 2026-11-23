import { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  HStack,
  Text,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { COACH_ROUTES } from '@/shared/config/routes';
import { queryKeys } from '@/shared/config/queryKeys';
import { useAuth } from '@/shared/contexts/useAuth';
import { undoable } from '@/shared/components/undoable';
import { ActionButton, Chip, EmptyState, LoadFailure, Sheet } from '@/kit';
import { clientLabel, feedOf } from '@/domain/inbox/feed';
import { concernedExercise } from '@/domain/inbox/concerned';
import { useInbox } from '@/features/coach/hooks/useInbox';
import { useMarkViewed } from '@/features/coach/hooks/useInboxActions';
import { COACH_CONTENT_MAX_W } from '@/features/coach/constants';
import { InboxCard } from '@/features/coach/inbox/InboxCard';
import { InboxDetail } from '@/features/coach/inbox/InboxDetail';
import { QuietFold } from '@/features/coach/inbox/QuietFold';
import { ReplyComposer } from '@/features/coach/inbox/ReplyComposer';
import { Swipeable } from '@/features/coach/inbox/Swipeable';
import type { Inbox as InboxData, InboxItem } from '@/shared/types';
import { PullToRefresh } from '@/shared/components/PullToRefresh';

/** « 3 séances », « 1 séance » : le compte du titre. */
const sessionsWord = (n: number): string => `${n} séance${n > 1 ? 's' : ''}`;

/**
 * Une des deux listes, sous forme de bouton-bascule : « À lire · 6 » et
 * « Déjà lues ». Des boutons pressés plutôt que des onglets : ils changent
 * ce que la même page montre, ils n'ouvrent pas un autre écran.
 */
const Toggle = ({
  on,
  onPress,
  children,
}: {
  on: boolean;
  onPress: () => void;
  children: string;
}) => (
  <Box
    as="button"
    aria-pressed={on}
    onClick={onPress}
    minH="40px"
    px="14px"
    borderRadius="full"
    fontWeight="600"
    fontSize="14px"
    bg={on ? 'app.primary.bg' : 'transparent'}
    color={on ? 'app.primary.fg' : 'fg.muted'}
    boxShadow={on ? undefined : 'inset 0 0 0 1.5px {colors.line}'}
  >
    {children}
  </Box>
);

/** Les séances déjà lues, du plus récent au plus ancien : rien à
 * prioriser dans ce qui est lu. */
const byDate = (items: readonly InboxItem[]) =>
  [...items].sort(
    (a, b) =>
      Date.parse(b.completed.completedAt) - Date.parse(a.completed.completedAt)
  );

/**
 * « À lire » : ce que les clients ont fait depuis la dernière visite, tous
 * clients confondus.
 *
 * L'espace coach s'ouvre ici. Le coach y lisait « 3 séances à lire » dans
 * la liste de ses clients, puis ouvrait chaque journal ; il lit maintenant
 * l'essentiel sans rien ouvrir, dans l'ordre où cela compte — voir
 * `feedOf` —, réagit d'une touche, répond, ou part ajuster le programme.
 *
 * Une séance ouverte s'affiche en feuille sur téléphone, dans un panneau à
 * droite à partir de 1 280 px — la maquette. L'ouvrir la marque lue, mais la
 * carte reste à sa place jusqu'au prochain chargement : la voir disparaître
 * pendant qu'on la lit ferait perdre le fil.
 *
 * Glisser une carte la lit sans répondre, avec « Annuler » huit secondes.
 * Là, la carte part tout de suite : c'est le geste qui le demande.
 */
const Inbox = () => {
  useDocumentTitle('À lire');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const coachId = useAuth().user?.coachId;
  const wide = useBreakpointValue({ base: false, xl: true }) ?? false;
  const [showRead, setShowRead] = useState(false);
  // La séance ouverte est gardée ici, et non retrouvée dans la liste : un
  // rechargement du fil — le retour sur l'onglet suffit — la ferait
  // disparaître pendant qu'on la lit. La version fraîche passe devant quand
  // elle existe, pour qu'une réponse envoyée s'y relise.
  const [openItem, setOpenItem] = useState<InboxItem | null>(null);
  const [replyItem, setReplyItem] = useState<InboxItem | null>(null);
  const unread = useInbox('unread');
  // « Déjà lues » ne se charge qu'à la demande : la plupart des visites
  // s'arrêtent à ce qui reste à lire.
  const read = useInbox('read', showRead);
  const markViewed = useMarkViewed();
  const shown = showRead ? read : unread;
  const total = unread.data?.total ?? 0;

  const fresh = (kept: InboxItem | null) =>
    kept &&
    ([...(unread.data?.items ?? []), ...(read.data?.items ?? [])].find(
      (item) => item.completed._id === kept.completed._id
    ) ??
      kept);
  const opened = fresh(openItem);
  const replying = fresh(replyItem);

  const open = (item: InboxItem) => {
    setOpenItem(item);
    if (!item.completed.viewedByCoach)
      markViewed.mutate({ ids: [item.completed._id], viewed: true });
  };
  // Sur grand écran, le panneau porte déjà le champ de réponse.
  const replyTo = (item: InboxItem) => (wide ? open(item) : setReplyItem(item));
  // L'atelier sur la séance au rang qu'elle avait ce jour-là — le
  // programme a pu bouger depuis, et la séance n'y est peut-être plus —,
  // l'exercice dont elle parle ouvert et en vue (`concernedExercise`).
  const adjust = (item: InboxItem) =>
    navigate(
      COACH_ROUTES.clientSession(
        item.client._id,
        item.completed.sessionOrder,
        concernedExercise(item)
      )
    );

  const readBySwipe = (items: InboxItem[]) => {
    const ids = items.map((item) => item.completed._id);
    const key = queryKeys.coach.inbox('unread');
    const before = queryClient.getQueryData<InboxData>(key);
    if (before)
      queryClient.setQueryData<InboxData>(key, {
        total: Math.max(0, before.total - ids.length),
        items: before.items.filter((item) => !ids.includes(item.completed._id)),
      });
    markViewed.mutate({ ids, viewed: true });
    undoable({
      title: ids.length > 1 ? `${ids.length} séances lues` : 'Séance lue',
      undo: () => {
        if (before) queryClient.setQueryData(key, before);
        markViewed.mutate({ ids, viewed: false });
      },
    });
  };

  const card = (item: InboxItem) => (
    <InboxCard
      key={item.completed._id}
      item={item}
      coachId={coachId}
      onOpen={() => open(item)}
      onReply={() => replyTo(item)}
      onAdjust={() => adjust(item)}
    />
  );

  const list = (
    <VStack align="stretch" gap={4} minW={0}>
      <HStack gap={3}>
        <Text as="h1" fontWeight="bold" fontSize="lg">
          À lire
        </Text>
        {total > 0 && <Chip tone="amber">{sessionsWord(total)}</Chip>}
      </HStack>

      <HStack gap="6px">
        <Toggle on={!showRead} onPress={() => setShowRead(false)}>
          {total > 0 ? `À lire · ${total}` : 'À lire'}
        </Toggle>
        <Toggle on={showRead} onPress={() => setShowRead(true)}>
          Déjà lues
        </Toggle>
      </HStack>

      {shown.isError ? (
        <LoadFailure query={shown} />
      ) : showRead ? (
        <>
          {read.data && read.data.items.length === 0 && (
            <EmptyState
              mood="sleep"
              title="Rien de lu ces trente derniers jours"
              line="Les séances que tu lis restent ici un mois, pour y revenir."
            />
          )}
          {read.data && byDate(read.data.items).map(card)}
        </>
      ) : (
        <>
          {unread.data && total === 0 && (
            <EmptyState
              mood="bravo"
              title="Tout est lu"
              line="Les prochaines séances de tes clients arriveront ici, la plus préoccupante en premier."
              action={
                <ActionButton
                  tone="ghost"
                  size="md"
                  onClick={() => navigate(COACH_ROUTES.clients)}
                >
                  Voir mes clients
                </ActionButton>
              }
            />
          )}
          {unread.data &&
            feedOf(unread.data.items).map((entry) =>
              entry.kind === 'fold' ? (
                <QuietFold
                  key={entry.clientId}
                  items={entry.items}
                  card={card}
                  onReadAll={() => readBySwipe(entry.items)}
                />
              ) : (
                <Swipeable
                  key={entry.item.completed._id}
                  onSwipe={() => readBySwipe([entry.item])}
                >
                  {card(entry.item)}
                </Swipeable>
              )
            )}
        </>
      )}
    </VStack>
  );

  const detail = opened && (
    <InboxDetail
      item={opened}
      coachId={coachId}
      onAdjust={() => adjust(opened)}
    />
  );

  // Les séances que les clients viennent d'envoyer, lues ou non.
  const pull = <PullToRefresh queries={[[...queryKeys.coach.all, 'inbox']]} />;

  if (wide)
    return (
      <Container maxW="1200px" py={8} px={6}>
        {pull}
        <Grid templateColumns="minmax(0, 1fr) 372px" gap={8} alignItems="start">
          {list}
          <Box
            as="aside"
            aria-label="La séance ouverte"
            position="sticky"
            top={8}
            maxH="calc(100vh - 64px)"
            overflowY="auto"
            bg="bg.rail"
            borderRadius="card"
            p="20px"
          >
            {detail ?? (
              <Text color="fg.muted">
                Choisis une séance pour la lire et y répondre.
              </Text>
            )}
          </Box>
        </Grid>
      </Container>
    );

  return (
    <Container maxW={COACH_CONTENT_MAX_W} py={8} px={4}>
      {pull}
      {list}
      {opened && (
        <Sheet label="La séance ouverte" onDismiss={() => setOpenItem(null)}>
          {detail}
        </Sheet>
      )}
      {replying && (
        <Sheet
          label={`Répondre à ${clientLabel(replying.client)}`}
          onDismiss={() => setReplyItem(null)}
        >
          <VStack align="stretch" gap="14px">
            <Box>
              <Text as="h2" fontWeight="800" fontSize="20px">
                Répondre à{' '}
                {replying.client.firstName ?? clientLabel(replying.client)}
              </Text>
              <Text color="fg.muted" fontSize="sm">
                {replying.completed.sessionName}
                {replying.completed.clientNotes?.trim()
                  ? ` · « ${replying.completed.clientNotes.trim()} »`
                  : ''}
              </Text>
            </Box>
            <ReplyComposer
              item={replying}
              coachId={coachId}
              onSent={() => setReplyItem(null)}
            />
          </VStack>
        </Sheet>
      )}
    </Container>
  );
};

export default Inbox;
