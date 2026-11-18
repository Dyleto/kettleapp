import { useState } from 'react';
import { Box, Container, HStack, Text, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { COACH_ROUTES } from '@/shared/config/routes';
import { ActionButton, Chip, EmptyState, LoadFailure } from '@/kit';
import { feedOf } from '@/domain/inbox/feed';
import { useInbox } from '@/features/coach/hooks/useInbox';
import { COACH_CONTENT_MAX_W } from '@/features/coach/constants';
import { InboxCard } from '@/features/coach/inbox/InboxCard';
import { QuietFold } from '@/features/coach/inbox/QuietFold';
import type { InboxItem } from '@/shared/types';

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
 * `feedOf`.
 *
 * « Déjà lues » remonte trente jours : de quoi retrouver la séance qu'on a
 * lue hier et à laquelle on veut répondre.
 */
const Inbox = () => {
  useDocumentTitle('À lire');
  const navigate = useNavigate();
  const [showRead, setShowRead] = useState(false);
  const unread = useInbox('unread');
  // « Déjà lues » ne se charge qu'à la demande : la plupart des visites
  // s'arrêtent à ce qui reste à lire.
  const read = useInbox('read', showRead);
  const shown = showRead ? read : unread;

  const total = unread.data?.total ?? 0;
  return (
    <Container maxW={COACH_CONTENT_MAX_W} py={8} px={4}>
      <VStack align="stretch" gap={4}>
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
            {read.data &&
              byDate(read.data.items).map((item) => (
                <InboxCard key={item.completed._id} item={item} />
              ))}
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
                  <QuietFold key={entry.clientId} items={entry.items} />
                ) : (
                  <InboxCard key={entry.item.completed._id} item={entry.item} />
                )
              )}
          </>
        )}
      </VStack>
    </Container>
  );
};

export default Inbox;
