import {
  Box,
  Button,
  Drawer,
  HStack,
  IconButton,
  Portal,
  Separator,
  Text,
  VStack,
  Wrap,
} from '@chakra-ui/react';
import {
  CompletedSession,
  BlockExercise,
  SessionBlock,
  Exercise,
  BlockType,
  FeedbackTag,
  PerformedEntry,
  PerformedValues,
} from '@/types';
import {
  EFFORT_ZONE_COLOR,
  FEEDBACK_TAG_LABELS,
  getEffortLevel,
  LEGACY_METRIC_LABELS,
} from '@/features/client/constants';
import { BlockCard } from '@/features/program/components/BlockCard';
import { AutoResizeTextarea } from '@/components/AutoResizeTextarea';
import { LuPencil, LuX } from 'react-icons/lu';
import { useState } from 'react';
import { EffortScale } from './EffortScale';
import { FeedbackTags } from './FeedbackTags';
import { PerformedFields } from './PerformedFields';
import { performedKey } from '../lastPerformance';
import {
  formatPerformed,
  sameSet,
  truncateAtFirstEmpty,
} from '../performedFormat';
import { useUpdateCompletedSession } from '../hooks/useCompleteSession';
import { useAuth } from '@/contexts/useAuth';

const toSessionBlock = (
  block: CompletedSession['blocks'][number],
  index: number
): SessionBlock => ({
  _id: `snap-${index}`,
  type: block.type as BlockType,
  label: block.label,
  order: block.order,
  notes: block.notes,
  durationMinutes: block.durationMinutes,
  intervalMinutes: block.intervalMinutes,
  rounds: block.rounds,
  restBetweenRounds: block.restBetweenRounds,
  workDuration: block.workDuration,
  restDuration: block.restDuration,
  repsScheme: block.repsScheme,
  exercises: block.exercises.map(
    (ex) =>
      ({
        exercise: ex.exercise as unknown as Exercise,
        order: ex.order,
        sets: ex.sets,
        restBetweenSets: ex.restBetweenSets,
        reps: ex.reps,
        duration: ex.duration,
        customMetric: ex.customMetric,
      }) satisfies BlockExercise
  ),
});

const collectPerformed = (
  completed: CompletedSession
): Record<string, PerformedValues> => {
  const map: Record<string, PerformedValues> = {};
  completed.blocks.forEach((block) => {
    block.exercises.forEach((ex) => {
      if (ex.performed) {
        map[performedKey(block.order, ex.order)] = {
          sets: (ex.performed.sets ?? []).map((set) => ({ ...set })),
        };
      }
    });
  });
  return map;
};

// Ne renvoie que les exercices dont le réalisé a bougé. La liste de séries
// part entière : elle remplace celle enregistrée, et `[]` l'efface. Plus rien
// à distinguer entre « efface » et « n'y touche pas » — c'est l'absence de
// l'exercice dans le corps qui veut dire « n'y touche pas ».
const diffPerformed = (
  original: Record<string, PerformedValues>,
  edited: Record<string, PerformedValues>
): PerformedEntry[] => {
  const entries: PerformedEntry[] = [];
  const keys = new Set([...Object.keys(original), ...Object.keys(edited)]);

  keys.forEach((key) => {
    const before = truncateAtFirstEmpty(original[key]?.sets ?? []);
    const after = truncateAtFirstEmpty(edited[key]?.sets ?? []);
    if (
      before.length === after.length &&
      before.every((set, i) => sameSet(set, after[i]))
    ) {
      return;
    }
    const [blockOrder, exerciseOrder] = key.split(':').map(Number);
    entries.push({ blockOrder, exerciseOrder, sets: after });
  });

  return entries;
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Text
    fontSize="xs"
    fontWeight="bold"
    color="fg.muted"
    textTransform="uppercase"
    letterSpacing="wider"
  >
    {children}
  </Text>
);

interface CompletedSessionDrawerProps {
  completed: CompletedSession;
  isOpen: boolean;
  onClose: () => void;
  /** Seul le client propriétaire du bilan peut le corriger. */
  editable?: boolean;
}

export const CompletedSessionDrawer = ({
  completed,
  isOpen,
  onClose,
  editable = false,
}: CompletedSessionDrawerProps) => {
  // Même règle que dans le formulaire de fin de séance : sans accord, on ne
  // propose pas de saisir ce qu'on n'a pas le droit d'enregistrer.
  const { user } = useAuth();
  const partageSante = user?.healthConsent?.granted === true;

  const [isEditing, setIsEditing] = useState(false);
  const [effort, setEffort] = useState(completed.feedback?.effort);
  const [tags, setTags] = useState<FeedbackTag[]>(
    completed.feedback?.tags ?? []
  );
  const [notes, setNotes] = useState(completed.clientNotes ?? '');
  const [performed, setPerformed] = useState(() => collectPerformed(completed));
  const update = useUpdateCompletedSession();

  const original = collectPerformed(completed);
  const level = getEffortLevel(completed.feedback?.effort);
  const blocks = completed.blocks.map(toSessionBlock);

  const completedDate = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(completed.completedAt));

  const startEditing = () => {
    setEffort(completed.feedback?.effort);
    setTags(completed.feedback?.tags ?? []);
    setNotes(completed.clientNotes ?? '');
    setPerformed(collectPerformed(completed));
    setIsEditing(true);
  };

  const handleSave = () => {
    const performedDiff = diffPerformed(original, performed);
    update.mutate(
      {
        completedId: completed._id,
        ...(effort !== undefined
          ? { feedback: { effort, ...(tags.length > 0 ? { tags } : {}) } }
          : {}),
        ...(performedDiff.length > 0 ? { performed: performedDiff } : {}),
        clientNotes: notes,
      },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      size={{ base: 'full', md: 'md', lg: 'lg' }}
    >
      <Portal>
        <Box onClick={(e) => e.stopPropagation()}>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content bg="bg.canvas">
              <Drawer.Header
                borderBottomWidth="1px"
                borderColor="whiteAlpha.100"
              >
                <HStack justify="space-between" align="center" flex="1">
                  <VStack align="start" gap={0}>
                    <Text fontWeight="bold" fontSize="lg">
                      Séance {completed.sessionOrder}
                    </Text>
                    <Text
                      fontSize="xs"
                      color="fg.muted"
                      textTransform="capitalize"
                    >
                      {completedDate}
                    </Text>
                  </VStack>
                  <HStack gap={1}>
                    {editable && !isEditing && (
                      <Button
                        size="xs"
                        variant="ghost"
                        color="fg.muted"
                        onClick={startEditing}
                      >
                        <LuPencil size={13} />
                        Corriger
                      </Button>
                    )}
                    <IconButton
                      aria-label="Fermer"
                      size="sm"
                      variant="ghost"
                      color="fg.muted"
                      _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                      borderRadius="full"
                      onClick={onClose}
                    >
                      <LuX size={16} />
                    </IconButton>
                  </HStack>
                </HStack>
              </Drawer.Header>

              <Drawer.Body p={4}>
                <VStack align="stretch" gap={5}>
                  {/* ── Ressenti ── */}
                  <VStack align="stretch" gap={3}>
                    <SectionTitle>Ressenti</SectionTitle>

                    {isEditing ? (
                      <>
                        <EffortScale value={effort} onChange={setEffort} />
                        {partageSante && (
                          <FeedbackTags value={tags} onChange={setTags} />
                        )}
                      </>
                    ) : level ? (
                      <VStack align="stretch" gap={2}>
                        <HStack gap={2} align="baseline">
                          <Text
                            fontSize="lg"
                            fontWeight="bold"
                            color={EFFORT_ZONE_COLOR[level.zone]}
                          >
                            {level.label}
                          </Text>
                          <Text fontSize="xs" color="fg.muted">
                            {level.description}
                          </Text>
                        </HStack>
                        {completed.feedback?.tags &&
                          completed.feedback.tags.length > 0 && (
                            <Wrap gap={2}>
                              {completed.feedback.tags.map((tag) => (
                                <Box
                                  key={tag}
                                  px={2.5}
                                  py={1}
                                  borderRadius="full"
                                  borderWidth="1px"
                                  borderColor="whiteAlpha.200"
                                  fontSize="xs"
                                  color="fg.muted"
                                >
                                  {FEEDBACK_TAG_LABELS[tag]}
                                </Box>
                              ))}
                            </Wrap>
                          )}
                      </VStack>
                    ) : (
                      // Bilan antérieur à la refonte : la question de la
                      // difficulté ne lui a jamais été posée. On le dit, on
                      // n'invente pas de niveau, et on ne remoyenne rien.
                      <VStack align="stretch" gap={2}>
                        <Text fontSize="sm" color="fg.muted">
                          Ressenti non comparable
                        </Text>
                        {completed.metrics && (
                          <Wrap gap={3}>
                            {(
                              Object.keys(
                                LEGACY_METRIC_LABELS
                              ) as (keyof typeof LEGACY_METRIC_LABELS)[]
                            ).map((key) => (
                              <Text key={key} fontSize="xs" color="fg.muted">
                                {LEGACY_METRIC_LABELS[key]}{' '}
                                <Text as="span" color="fg" fontFamily="mono">
                                  {completed.metrics?.[key]}/5
                                </Text>
                              </Text>
                            ))}
                          </Wrap>
                        )}
                      </VStack>
                    )}
                  </VStack>

                  {/* ── Commentaires ── */}
                  {((isEditing && partageSante) ||
                    completed.clientNotes ||
                    completed.coachNotes) && (
                    <>
                      <Separator borderColor="whiteAlpha.100" />
                      <VStack align="stretch" gap={3}>
                        {isEditing && partageSante ? (
                          <Box>
                            <SectionTitle>Ton commentaire</SectionTitle>
                            <AutoResizeTextarea
                              mt={1.5}
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              size="sm"
                              border="1px solid"
                              borderColor="whiteAlpha.200"
                              _focus={{ borderColor: 'app.primary.border' }}
                            />
                          </Box>
                        ) : (
                          completed.clientNotes && (
                            <Box>
                              <SectionTitle>Ton commentaire</SectionTitle>
                              <Text
                                mt={1.5}
                                fontSize="sm"
                                color="fg.muted"
                                fontStyle="italic"
                              >
                                "{completed.clientNotes}"
                              </Text>
                            </Box>
                          )
                        )}
                        {completed.coachNotes && (
                          <Box
                            p={3}
                            bg="whiteAlpha.50"
                            borderRadius="md"
                            borderLeft="2px solid"
                            borderLeftColor="app.primary.border"
                          >
                            <SectionTitle>Consigne du coach</SectionTitle>
                            <Text
                              mt={1}
                              fontSize="sm"
                              color="fg.muted"
                              whiteSpace="pre-wrap"
                            >
                              {completed.coachNotes}
                            </Text>
                          </Box>
                        )}
                      </VStack>
                    </>
                  )}

                  {/* ── Contenu : prescrit vs réalisé ── */}
                  {blocks.length > 0 && (
                    <>
                      <Separator borderColor="whiteAlpha.100" />
                      <VStack align="stretch" gap={3}>
                        <SectionTitle>Contenu de la séance</SectionTitle>
                        {blocks.map((block) => (
                          <BlockCard
                            key={block._id}
                            block={block}
                            renderExerciseExtra={({
                              blockOrder,
                              exerciseOrder,
                            }) => {
                              const key = performedKey(
                                blockOrder,
                                exerciseOrder
                              );
                              if (isEditing) {
                                const prescribed = block.exercises.find(
                                  (e) => e.order === exerciseOrder
                                );
                                return (
                                  <PerformedFields
                                    value={performed[key] ?? { sets: [] }}
                                    onChange={(next) =>
                                      setPerformed((prev) => ({
                                        ...prev,
                                        [key]: next,
                                      }))
                                    }
                                    setCount={prescribed?.sets ?? 1}
                                    isTimed={prescribed?.duration !== undefined}
                                  />
                                );
                              }
                              const done = formatPerformed(original[key]);
                              // Rien de noté : on n'écrit rien. Une colonne de
                              // « Fait : — » sur dix exercices ne dit pas que
                              // c'est vide, elle encombre pour le dire.
                              if (!done) return null;
                              return (
                                <Text fontSize="xs" color="fg.muted" pl={4}>
                                  Fait&nbsp;: {done}
                                </Text>
                              );
                            }}
                          />
                        ))}
                      </VStack>
                    </>
                  )}

                  {completed.editedAt && !isEditing && (
                    <Text fontSize="xs" color="fg.muted" textAlign="right">
                      Corrigé le{' '}
                      {new Intl.DateTimeFormat('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                      }).format(new Date(completed.editedAt))}
                    </Text>
                  )}
                </VStack>
              </Drawer.Body>

              {isEditing && (
                <Drawer.Footer
                  borderTopWidth="1px"
                  borderColor="whiteAlpha.100"
                  gap={3}
                >
                  <Button
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                    disabled={update.isPending}
                  >
                    Annuler
                  </Button>
                  <Button
                    bg="app.primary"
                    color="bg.canvas"
                    fontWeight="bold"
                    onClick={handleSave}
                    disabled={effort === undefined}
                    loading={update.isPending}
                  >
                    Enregistrer
                  </Button>
                </Drawer.Footer>
              )}
            </Drawer.Content>
          </Drawer.Positioner>
        </Box>
      </Portal>
    </Drawer.Root>
  );
};
