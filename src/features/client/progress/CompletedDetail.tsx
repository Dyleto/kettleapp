import { useEffect, useMemo } from 'react';
import {
  Box,
  chakra,
  HStack,
  Portal,
  Text,
  VisuallyHidden,
  VStack,
} from '@chakra-ui/react';
import { LuPencil } from 'react-icons/lu';
import type { CompletedSession } from '@/shared/types';
import {
  ActionButton,
  Bubble,
  Chip,
  Eyebrow,
  LegacyMetrics,
  Sheet,
} from '@/kit';
import { EFFORT_ZONE_COLOR, getEffortLevel } from '@/domain/history/effort';
import { FEEDBACK_TAG_LABELS } from '@/domain/history/tags';
import { TAG_NOUN } from '@/domain/history/pulse';
import { tagsInOrder } from '@/domain/inbox/feed';
import { hasUnread, replyLine } from '@/domain/inbox/reply';
import {
  detailDate,
  doneLines,
  previousPassage,
} from '@/domain/history/journalDetail';
import { movementsOf } from '@/domain/history/movements';
import { sessionName } from '@/domain/session/name';
import { useReadReplies } from '@/features/client/common/useReadReplies';
import { useCoachVoice } from '@/features/client/common/coach';
import { EffortFace } from '@/features/client/end/EffortScale';
import { useSheetDismiss } from '@/features/workshop';

interface CompletedDetailProps {
  completed: CompletedSession;
  /** L'historique déjà chargé : le passage d'avant et les records s'y
   * lisent, sans requête de plus. */
  history: readonly CompletedSession[];
  /**
   * Qui lit. Le mot du client est « ton mot » pour lui, « son mot » pour
   * son coach ; et seul le client marque lue la réponse qu'il ouvre.
   */
  viewer: 'self' | 'coach';
  /** Rouvre les écrans de la fin de séance. Absent pour le coach : ce qui
   * s'est passé pendant la séance appartient à celui qui l'a faite. */
  onCorrect?: () => void;
}

const titleOf = (completed: CompletedSession) =>
  completed.sessionName ||
  sessionName({ order: completed.sessionOrder, name: completed.sessionName });

const editedLabel = (at: string) =>
  `Corrigée le ${new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(new Date(at))}`;

/**
 * Une séance faite, ouverte : le ressenti, le mot, la réponse du coach, et
 * ce qui a été fait, mouvement par mouvement.
 *
 * Elle remplace le tiroir du bilan, qui montrait la séance comme l'atelier
 * la montre — des cartes de bloc, avec « Fait : 12 reps · 26 kg » glissé
 * sous chaque exercice — et qui corrigeait sur place avec ses propres
 * champs. Ici, une ligne par mouvement : son nom, son format et sa dose,
 * ce qui a été fait en face ; le record qu'elle a établi en ambre, la même
 * couleur que les cartes de record en tête de Progrès. « Corriger »
 * rouvre les écrans de la fin de séance (`CorrectFlow`).
 *
 * Un ancien bilan n'a pas de ressenti : il montre ses cinq axes, et rien
 * n'est recalculé à partir d'eux.
 */
export const CompletedDetail = ({
  completed,
  history,
  viewer,
  onCorrect,
}: CompletedDetailProps) => {
  const coach = useCoachVoice();
  const self = viewer === 'self';
  const level = getEffortLevel(completed.feedback?.effort);
  const tags = tagsInOrder(completed.feedback?.tags);
  const said = completed.clientNotes?.trim();
  const previous = useMemo(
    () => previousPassage(completed, history),
    [completed, history]
  );
  const lines = useMemo(
    () => doneLines(completed, previous),
    [completed, previous]
  );
  // Le record d'un mouvement se date au passage qui l'a établi : c'est
  // celui-là, et lui seul, qui le porte.
  const records = useMemo(
    () =>
      new Set(
        movementsOf(history)
          .filter((m) => m.recordId === completed._id)
          .map((m) => m.exerciseId)
      ),
    [history, completed._id]
  );
  const title = titleOf(completed);

  // Ouvrir la séance, c'est lire ce que le coach y a répondu — pour le
  // client seulement : le coach qui relit ne lit pas à sa place.
  const { mutate: markRead } = useReadReplies();
  useEffect(() => {
    if (self && hasUnread(completed.replies)) markRead(completed._id);
  }, [self, completed, markRead]);

  return (
    <VStack align="stretch" gap="18px" data-completed-detail={completed._id}>
      <HStack align="start" gap="12px">
        <Box minW={0} flex={1}>
          <Text as="h2" fontWeight="800" fontSize="22px" lineHeight="1.2">
            {title}
          </Text>
          <Text color="fg.muted" fontSize="sm">
            {detailDate(completed.completedAt)}
          </Text>
        </Box>
        {onCorrect && (
          <ActionButton tone="soft" size="sm" onClick={onCorrect}>
            <LuPencil size={14} aria-hidden />
            Corriger
          </ActionButton>
        )}
      </HStack>

      {level ? (
        <VStack align="stretch" gap="10px">
          <HStack gap="14px" data-detail-feeling={level.zone}>
            <Box color={EFFORT_ZONE_COLOR[level.zone]} flexShrink={0}>
              <EffortFace value={level.value} size={48} />
            </Box>
            <Box minW={0}>
              <Text
                fontWeight="800"
                fontSize="18px"
                color={EFFORT_ZONE_COLOR[level.zone]}
              >
                {level.label}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                « {level.description} »
              </Text>
            </Box>
          </HStack>
          {tags.length > 0 && (
            <HStack gap="6px" wrap="wrap">
              {tags.map((tag) => (
                <Chip key={tag} tone={tag === 'pain' ? 'coral' : 'neutral'}>
                  {self ? FEEDBACK_TAG_LABELS[tag] : TAG_NOUN[tag]}
                </Chip>
              ))}
            </HStack>
          )}
        </VStack>
      ) : (
        completed.metrics && <LegacyMetrics metrics={completed.metrics} />
      )}

      {(said || completed.replies.length > 0) && (
        <VStack align="stretch" gap="8px">
          {said && (
            <>
              <Eyebrow>{self ? 'Ton mot' : 'Son mot'}</Eyebrow>
              <Bubble tone="raised">{said}</Bubble>
            </>
          )}
          {/* La réponse du coach, en bulle sous le mot du client, comme
              sur l'accueil. */}
          {completed.replies.map((reply) => (
            <Bubble
              key={`${reply.coachId}:${reply.sentAt}`}
              tone="raised"
              from={self ? reply.firstName : 'Ta réponse'}
              data-reply
            >
              {replyLine(reply)}
            </Bubble>
          ))}
        </VStack>
      )}

      {lines.length > 0 && (
        <VStack align="stretch" gap="8px">
          <Eyebrow>{self ? 'Ce que tu as fait' : 'Ce qui a été fait'}</Eyebrow>
          <VStack
            align="stretch"
            gap={0}
            bg="bg.raised"
            borderRadius="14px"
            data-done-lines
          >
            {lines.map((line) => {
              const record =
                line.exerciseId !== undefined && records.has(line.exerciseId);
              // « Classique · 4 × 12 reps » ; rien sous « AMRAP 12 min »,
              // dont le nom porte déjà le format.
              const sub = [line.format, line.dose].filter(Boolean).join(' · ');
              const showSub = sub !== '' && !line.name.startsWith(sub);
              return (
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
                  data-record={record || undefined}
                >
                  <VStack align="start" gap="2px" minW={0} flex={1}>
                    <Text fontWeight="700">{line.name}</Text>
                    {showSub && (
                      <Text fontSize="sm" color="fg.muted">
                        {sub}
                      </Text>
                    )}
                  </VStack>
                  <VStack align="end" gap="4px" maxW="55%">
                    <Text
                      fontWeight={line.noted ? '700' : '400'}
                      textAlign="right"
                      fontVariantNumeric="tabular-nums"
                      color={
                        record
                          ? 'app.primary'
                          : line.up
                            ? 'session.rest'
                            : line.noted
                              ? 'fg'
                              : 'fg.muted'
                      }
                      data-up={line.up || undefined}
                    >
                      {line.done}
                      {line.up && !record && (
                        <>
                          {' '}
                          <chakra.span aria-hidden>↗</chakra.span>
                          <VisuallyHidden>
                            , plus lourd que la fois d’avant
                          </VisuallyHidden>
                        </>
                      )}
                    </Text>
                    {record && <Chip tone="amber">Record</Chip>}
                  </VStack>
                </HStack>
              );
            })}
          </VStack>
        </VStack>
      )}

      {completed.coachNotes && (
        <VStack align="stretch" gap="8px">
          <Eyebrow>
            {self ? `La consigne de ${coach.inline}` : 'Ta consigne'}
          </Eyebrow>
          <Bubble tone="raised">{completed.coachNotes}</Bubble>
        </VStack>
      )}

      {completed.editedAt && (
        <Text fontSize="sm" color="fg.muted" data-edited>
          {editedLabel(completed.editedAt)}
        </Text>
      )}
    </VStack>
  );
};

/**
 * Le détail en feuille : sur téléphone, et partout où l'écran n'a pas de
 * place pour un panneau — l'accueil, l'aperçu d'un client.
 *
 * Son nom pour un lecteur d'écran est celui de la séance et sa date : deux
 * séances ouvertes l'une après l'autre ne s'annoncent pas pareil.
 */
export const CompletedSheet = ({
  onClose,
  ...detail
}: CompletedDetailProps & { onClose: () => void }) => {
  useSheetDismiss(true, onClose);
  return (
    <Portal>
      <Sheet
        label={`${titleOf(detail.completed)} · ${detailDate(detail.completed.completedAt)}`}
        onDismiss={onClose}
      >
        <CompletedDetail {...detail} />
      </Sheet>
    </Portal>
  );
};
