import {
  Box,
  chakra,
  HStack,
  Text,
  VisuallyHidden,
  VStack,
} from '@chakra-ui/react';
import type { CompletedSession, InboxItem, Session } from '@/shared/types';
import { ActionButton, Bubble, Chip, Eyebrow } from '@/kit';
import { TAG_NOUN } from '@/domain/history/pulse';
import { tagsInOrder } from '@/domain/inbox/feed';
import { LEGACY_METRIC_LABELS } from '@/domain/history/tags';
import {
  detailDate,
  doneLines,
  sinceThen,
} from '@/domain/history/journalDetail';
import { sessionName } from '@/domain/session/name';
import { ReplyThread } from '../inbox/ReplyThread';
import { Verdict } from './JournalList';

interface JournalDetailProps {
  /** La séance, le client et le passage d'avant : ce que le champ de
   * réponse de « À lire » attend, et de quoi comparer les charges. */
  item: InboxItem;
  coachId: string | undefined;
  /** Le programme d'aujourd'hui, pour dire s'il a bougé depuis. */
  sessions: readonly Session[];
  /** Ouvre l'atelier sur la séance d'aujourd'hui. */
  onAdjust: (session: Session) => void;
}

/** Les cinq axes de l'ancien bilan, en lecture seule. */
const LegacyMetrics = ({
  metrics,
}: {
  metrics: NonNullable<CompletedSession['metrics']>;
}) => (
  <VStack align="stretch" gap="8px">
    <Eyebrow>Ancien bilan</Eyebrow>
    <VStack
      align="stretch"
      gap={0}
      bg="bg.raised"
      borderRadius="14px"
      data-legacy-metrics
    >
      {(
        Object.keys(
          LEGACY_METRIC_LABELS
        ) as (keyof typeof LEGACY_METRIC_LABELS)[]
      ).map((key) => (
        <HStack
          key={key}
          justify="space-between"
          px="16px"
          py="10px"
          borderTopWidth="1px"
          borderColor="line"
          _first={{ borderTopWidth: 0 }}
        >
          <Text>{LEGACY_METRIC_LABELS[key]}</Text>
          <Text fontWeight="700" fontVariantNumeric="tabular-nums">
            {metrics[key]}/5
          </Text>
        </HStack>
      ))}
    </VStack>
  </VStack>
);

/**
 * Une séance faite, ouverte : ce que le client en a dit, la réponse, et ce
 * qui a été fait en face de ce qui était prévu.
 *
 * Le détail de l'ancien journal était celui du client — il disait « Ton
 * commentaire » au coach, et ne montrait que les charges. Ici : « Son mot »,
 * la réponse avec la même pièce que « À lire », et le prévu à gauche du
 * fait, avec une flèche quand la charge passe celle d'avant.
 *
 * Quand le programme a bougé depuis, le détail le dit : le « prévu » est
 * celui du jour où elle a été faite, et le coach qui compare à ce qu'il a
 * sous les yeux dans l'atelier ne doit pas croire à un écart du client.
 * « Ce qui a été fait », et non « Ce qu'elle a fait » : on ne connaît pas
 * l'accord.
 */
export const JournalDetail = ({
  item,
  coachId,
  sessions,
  onAdjust,
}: JournalDetailProps) => {
  const { completed } = item;
  const said = completed.clientNotes?.trim();
  const tags = tagsInOrder(completed.feedback?.tags);
  const since = sinceThen(completed, sessions);
  const lines = doneLines(completed, item.previous);
  const title =
    completed.sessionName ||
    sessionName({ order: completed.sessionOrder, name: completed.sessionName });

  return (
    <VStack align="stretch" gap="16px" data-journal-detail={completed._id}>
      <HStack align="start" gap="12px">
        <Box minW={0} flex={1}>
          <Text as="h2" fontWeight="800" fontSize="20px">
            {title}
          </Text>
          <Text color="fg.muted" fontSize="sm">
            {detailDate(completed.completedAt)}
          </Text>
        </Box>
        <Verdict completed={completed} />
      </HStack>

      {tags.length > 0 && (
        <HStack gap="6px" wrap="wrap">
          {tags.map((tag) => (
            <Chip key={tag} tone={tag === 'pain' ? 'coral' : 'neutral'}>
              {TAG_NOUN[tag]}
            </Chip>
          ))}
        </HStack>
      )}

      {said && (
        <VStack align="stretch" gap="8px">
          <Eyebrow>Son mot</Eyebrow>
          <Bubble>{said}</Bubble>
        </VStack>
      )}

      <ReplyThread item={item} coachId={coachId} />

      {lines.length > 0 && (
        <VStack align="stretch" gap="8px">
          <Eyebrow>Ce qui a été fait</Eyebrow>
          {since.state === 'changed' && (
            <Text fontSize="sm" color="fg.muted" data-program-changed>
              Le programme a changé depuis : le « prévu » est celui du jour où
              elle a été faite.
            </Text>
          )}
          <VStack
            align="stretch"
            gap={0}
            bg="bg.raised"
            borderRadius="14px"
            data-done-lines
          >
            {lines.map((line) => (
              <HStack
                key={line.key}
                justify="space-between"
                align="start"
                gap="12px"
                px="16px"
                py="12px"
                borderTopWidth="1px"
                borderColor="line"
                _first={{ borderTopWidth: 0 }}
                data-done-line
              >
                <VStack align="start" gap="2px" minW={0} flex={1}>
                  <Text fontWeight="700">{line.name}</Text>
                  {line.planned && (
                    <Text fontSize="sm" color="fg.muted">
                      {line.planned}
                    </Text>
                  )}
                </VStack>
                <Text
                  maxW="55%"
                  fontWeight={line.noted ? '700' : '400'}
                  textAlign="right"
                  fontVariantNumeric="tabular-nums"
                  color={
                    line.up ? 'session.rest' : line.noted ? 'fg' : 'fg.muted'
                  }
                  data-up={line.up || undefined}
                >
                  {line.done}
                  {line.up && (
                    <>
                      {' '}
                      <chakra.span aria-hidden>↗</chakra.span>
                      <VisuallyHidden>
                        , plus lourd que la fois d’avant
                      </VisuallyHidden>
                    </>
                  )}
                </Text>
              </HStack>
            ))}
          </VStack>
        </VStack>
      )}

      {completed.metrics && <LegacyMetrics metrics={completed.metrics} />}

      {since.state === 'gone' ? (
        <Text fontSize="sm" color="fg.muted">
          Cette séance n’est plus au programme.
        </Text>
      ) : (
        <ActionButton
          tone="ghost"
          size="md"
          w="full"
          onClick={() => onAdjust(since.session)}
        >
          Ajuster la séance
        </ActionButton>
      )}
    </VStack>
  );
};
