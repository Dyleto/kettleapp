import {
  Box,
  HStack,
  IconButton,
  Input,
  Menu,
  Portal,
  Text,
} from '@chakra-ui/react';
import { useState } from 'react';
import {
  LuEllipsis,
  LuGripVertical,
  LuMessageSquare,
  LuPlus,
  LuTrash2,
  LuX,
} from 'react-icons/lu';
import { BlockExercise, Exercise, SessionBlock } from '@/types';
import {
  blockDefinesOwnMetrics,
  blockIndexPrefix,
  blockSupportsSets,
  getBlockLabel,
} from '@/features/program/constants';
import { BlockFrame } from './BlockFrame';
import { ecartTactile, hitAreaTactile, pasTactile } from '@/components/hitArea';
import { formatDuration } from '@/utils/formatters';
import { InlineText, InlineValue } from './InlineValue';
import { BlockConfigInline } from './BlockConfigInline';
import { InlineExercisePicker } from './InlineExercisePicker';

type MetricKind = 'reps' | 'duration' | 'custom';

const kindOf = (ex: BlockExercise): MetricKind =>
  ex.duration !== undefined
    ? 'duration'
    : ex.customMetric !== undefined
      ? 'custom'
      : 'reps';

const NEXT_KIND: Record<MetricKind, MetricKind> = {
  reps: 'duration',
  duration: 'custom',
  custom: 'reps',
};

const KIND_LABEL: Record<MetricKind, string> = {
  reps: 'répétitions',
  duration: 'durée',
  custom: 'mesure libre',
};

/** The same, short enough to fit in a row's gutter. */
const KIND_SHORT: Record<MetricKind, string> = {
  reps: 'reps',
  duration: 'durée',
  custom: 'libre',
};

type ExerciseUpdate = Partial<Omit<BlockExercise, 'exercise'>>;

interface ExerciseRowProps {
  exercise: BlockExercise;
  block: SessionBlock;
  index: number;
  onUpdate: (updates: ExerciseUpdate) => void;
  onRemove: () => void;
}

const ExerciseRow = ({
  exercise,
  block,
  index,
  onUpdate,
  onRemove,
}: ExerciseRowProps) => {
  // An exercise's instruction has no permanent invitation under every row:
  // five exercises would mean five "+ consigne" to read before reading the
  // programme. It opens from the gutter, where the row's controls already
  // live, and afterwards only shows when it exists.
  const [noteOuverte, setNoteOuverte] = useState(false);
  const aUneNote = !!exercise.note?.trim();

  const kind = kindOf(exercise);
  const supportsSets = blockSupportsSets(block.type);
  const ownMetrics = blockDefinesOwnMetrics(block.type);
  const showPrefix = blockIndexPrefix(block.type);

  const switchKind = () => {
    const next = NEXT_KIND[kind];
    if (next === 'reps')
      onUpdate({ reps: 10, duration: undefined, customMetric: undefined });
    if (next === 'duration')
      onUpdate({ duration: 30, reps: undefined, customMetric: undefined });
    if (next === 'custom')
      onUpdate({
        customMetric: { value: 100, unit: 'm' },
        reps: undefined,
        duration: undefined,
      });
  };

  const ligne = (
    // The row splits over two levels by itself when the name runs out of
    // room. No guessed breakpoint: the width actually available decides, and
    // it does not depend on the screen alone — at 768 px the session rail
    // appears and leaves the name only 116 px, less than at 390 px. The
    // metric keeps its `ml="auto"`: right-aligned whether it is on the same
    // line or the next.
    //
    // It all rests on the name's `flex-basis`, left at `auto`: the basis is
    // then the width of the name written in one go. A short name fits beside
    // the metric and the row does not break; a long name does not fit, and
    // that is what triggers the wrap. `flex={1}` — a zero basis — never
    // broke, and a percentage `min-width` is circular here: the container's
    // width depends on the rows, the rows on the minimum, the minimum on the
    // container. Chromium then treats it as zero at wrap time.
    <HStack
      // A stable anchor for layout measurements: without it a probe has to
      // walk up the DOM counting levels, and the slightest regrouping breaks
      // it without breaking anything in the app.
      data-exercise-row
      py={1.5}
      gap={3}
      rowGap={1}
      flexWrap="wrap"
      align="center"
      css={{
        ...pasTactile,
        // Permanently visible, set back: at zero opacity, a coach
        // discovering the editor could not guess a block can be moved or
        // deleted — the control only existed after hovering over it.
        '&:hover [data-row-gutter], &:focus-within [data-row-gutter]': {
          opacity: 1,
        },
      }}
    >
      <HStack gap={1} flex="1 1 auto" minW={0}>
        {showPrefix && (
          <Text fontSize="sm" color="fg.muted" flexShrink={0}>
            {index + 1} ·
          </Text>
        )}
        {/* Two lines rather than one: "Soulevé de terre jambes tendues à
            la barre" needs two even across a whole phone's width. */}
        <Text fontSize="sm" color="fg.muted" lineClamp={2}>
          {exercise.exercise.name}
        </Text>
      </HStack>

      {/* The prescription, right-aligned in tabular figures: it is what
          you scan vertically when rereading a session. */}
      {/* The prescription and the controls form one element: without this
          group they wrapped independently and the controls ended up alone on
          the line below, to the left, orphaned. */}
      <HStack gap={3} flexShrink={0} ml="auto" align="center">
        {!ownMetrics && (
          <HStack gap={1} flexShrink={0}>
            {supportsSets && (
              <>
                {/* With no number written, the exercise happens once: "1" is
                  the correct reading, and it is also the target to click to
                  ask for several. */}
                <InlineValue
                  value={exercise.sets}
                  onChange={(v) => onUpdate({ sets: v })}
                  ariaLabel={`Séries — ${exercise.exercise.name}`}
                  emptyLabel="1"
                  min={1}
                  width="44px"
                  clearable
                />
                <Text as="span" fontSize="sm" color="fg.muted">
                  ×
                </Text>
              </>
            )}

            {kind === 'reps' && (
              <InlineValue
                value={exercise.reps}
                onChange={(v) => onUpdate({ reps: v })}
                suffix="reps"
                ariaLabel={`Répétitions — ${exercise.exercise.name}`}
                width="56px"
              />
            )}
            {kind === 'duration' && (
              <InlineValue
                value={exercise.duration}
                onChange={(v) => onUpdate({ duration: v })}
                suffix="s"
                format={formatDuration}
                ariaLabel={`Durée — ${exercise.exercise.name}`}
                width="56px"
              />
            )}
            {kind === 'custom' && (
              <HStack gap={1}>
                <InlineValue
                  value={exercise.customMetric?.value}
                  onChange={(v) =>
                    onUpdate({
                      customMetric: {
                        value: v ?? 0,
                        unit: exercise.customMetric?.unit || 'm',
                      },
                    })
                  }
                  ariaLabel={`Mesure — ${exercise.exercise.name}`}
                  width="56px"
                />
                <Input
                  size="xs"
                  w="44px"
                  h="22px"
                  px={1}
                  textAlign="center"
                  aria-label={`Unité — ${exercise.exercise.name}`}
                  value={exercise.customMetric?.unit ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      customMetric: {
                        value: exercise.customMetric?.value ?? 0,
                        unit: e.target.value,
                      },
                    })
                  }
                  bg="whiteAlpha.50"
                  borderColor="whiteAlpha.100"
                  borderRadius="sm"
                  fontSize="xs"
                />
              </HStack>
            )}

            {supportsSets && (exercise.sets ?? 1) > 1 && (
              <HStack gap={1} pl={2}>
                <Text as="span" fontSize="xs" color="fg.muted">
                  repos
                </Text>
                <InlineValue
                  value={exercise.restBetweenSets}
                  onChange={(v) => onUpdate({ restBetweenSets: v })}
                  suffix="s"
                  format={formatDuration}
                  emptyLabel="aucun"
                  ariaLabel={`Repos entre séries — ${exercise.exercise.name}`}
                  width="52px"
                  clearable
                />
              </HStack>
            )}
          </HStack>
        )}

        {/* Gutter: revealed on hover or keyboard focus, always visible on
          touch where hover does not exist. */}
        <HStack
          data-row-gutter
          gap={2}
          css={ecartTactile}
          flexShrink={0}
          opacity={{ base: 1, md: 0.35 }}
          transition="opacity 0.15s"
        >
          <IconButton
            aria-label={
              aUneNote
                ? `Modifier la consigne — ${exercise.exercise.name}`
                : `Ajouter une consigne — ${exercise.exercise.name}`
            }
            title={aUneNote ? 'Modifier la consigne' : 'Ajouter une consigne'}
            css={hitAreaTactile()}
            size="2xs"
            variant="ghost"
            color={aUneNote ? 'app.primary' : 'fg.muted'}
            onClick={() => setNoteOuverte(true)}
          >
            <LuMessageSquare size={11} />
          </IconButton>
          {!ownMetrics && (
            /* "⇄" said neither that it replaces, nor that it swaps, nor
               that it reverses — a pictogram its author has to explain is not
               one. The word carries two pieces of information the arrow
               carried neither of: what this row measures today, and that it
               can be changed. */
            <Box
              as="button"
              aria-label={`Changer l'unité (actuellement : ${KIND_LABEL[kind]}) — ${exercise.exercise.name}`}
              title={`Mesure en ${KIND_LABEL[kind]} — changer`}
              onClick={switchKind}
              css={hitAreaTactile()}
              fontSize="10px"
              fontWeight="bold"
              letterSpacing="wide"
              textTransform="uppercase"
              color="fg.muted"
              _hover={{ color: 'app.primary' }}
              transition="color 0.15s"
            >
              {KIND_SHORT[kind]}
            </Box>
          )}
          <IconButton
            aria-label={`Retirer ${exercise.exercise.name}`}
            title="Retirer cet exercice"
            css={hitAreaTactile()}
            size="2xs"
            variant="ghost"
            color="fg.muted"
            _hover={{ color: 'app.error' }}
            onClick={onRemove}
          >
            <LuX size={12} />
          </IconButton>
        </HStack>
      </HStack>
    </HStack>
  );

  return (
    <Box borderTopWidth="1px" borderColor="whiteAlpha.100">
      {ligne}
      {/* The instruction sits under its row, outside that row's wrapping
          calculation, and only appears when it exists or has just been
          asked for. */}
      {(aUneNote || noteOuverte) && (
        <Box pb={1.5} pl={1}>
          <InlineText
            value={exercise.note}
            onChange={(note) => onUpdate({ note })}
            addLabel="+ consigne"
            ariaLabel={`Consigne — ${exercise.exercise.name}`}
            startOpen={noteOuverte && !aUneNote}
            multiline
          />
        </Box>
      )}
    </Box>
  );
};

interface AtelierBlockProps {
  block: SessionBlock;
  /** Exercises already placed elsewhere in the programme. */
  inProgram: Exercise[];
  dragHandleProps?: Record<string, unknown>;
  onUpdate: (updates: Partial<SessionBlock>) => void;
  onRemove: () => void;
  onAddExercise: (exercise: Exercise) => void;
  onRemoveExercise: (index: number) => void;
  onUpdateExercise: (index: number, updates: ExerciseUpdate) => void;
  /** Provided below 768 px: choosing an exercise then goes through the
   *  full-screen drawer rather than the dropdown, which is too cramped. */
  onRequestExercisePicker?: () => void;
  /** Opens an exercise's card over the editor. */
  onOpenExerciseSheet?: (exercise: Exercise) => void;
}

/**
 * A block in the coach's editor: the same rendering the client sees, but
 * where every value becomes a field on click.
 *
 * The principle everything follows from: a programme reads as a programme,
 * not as a form. No grey box per value, no card inside a card — typography, a
 * rule per block, and controls that only show when you come close.
 */
export const AtelierBlock = ({
  block,
  inProgram,
  dragHandleProps,
  onUpdate,
  onRemove,
  onAddExercise,
  onRemoveExercise,
  onUpdateExercise,
  onRequestExercisePicker,
  onOpenExerciseSheet,
}: AtelierBlockProps) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  /**
   * The optional field just requested.
   *
   * Block name and instruction each announced themselves with a permanently
   * placed "+ something". At three blocks, with "+ exercice" and "+ note de
   * séance", that made seven simultaneous invitations on one screen, all the
   * same grey and the same size: the programme read as a form to fill in
   * rather than as a session to read.
   *
   * They now only show when they carry something — or when they have just
   * been asked for through the block's "⋯".
   */
  const [champDemande, setChampDemande] = useState<'nom' | 'consigne' | null>(
    null
  );
  /**
   * Opens an optional field — once the menu has really gone.
   *
   * The menu returns focus to its trigger as it closes. Mounting the field in
   * the same breath means watching it close at once on its own blur:
   * measured, it appeared and disappeared in under a hundred milliseconds,
   * and the coach landed back on the invitation they had just chosen. So we
   * wait until the close has returned focus before mounting the field.
   */
  const ouvrirChamp = (champ: 'nom' | 'consigne') =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setChampDemande(champ))
    );

  const aUnNom = !!block.label?.trim();
  const aUneConsigne = !!block.notes?.trim();
  const nomVisible = aUnNom || champDemande === 'nom';
  const consigneVisible = aUneConsigne || champDemande === 'consigne';

  return (
    <BlockFrame
      block={block}
      name={
        /* Neither a description of the type — the label already says it —
           nor a permanent placeholder: a block with no free name leaves no
           trace. */
        nomVisible ? (
          <InlineText
            value={block.label}
            onChange={(label) => onUpdate({ label })}
            addLabel="+ nom"
            ariaLabel={`Nom personnalisé du bloc ${getBlockLabel(block.type)}`}
            width="160px"
            startOpen={champDemande === 'nom' && !aUnNom}
          />
        ) : undefined
      }
      config={<BlockConfigInline block={block} onUpdate={onUpdate} />}
      gutter={
        <HStack
          gap={2}
          css={ecartTactile}
          opacity={{ base: 1, md: 0.35 }}
          _groupHover={{ opacity: 1 }}
          _groupFocusWithin={{ opacity: 1 }}
          transition="opacity 0.15s"
        >
          {/* One control for everything optional. A "⋯" promises nothing
              and calls for nothing: exactly what you want for a field most
              blocks do without. */}
          <Menu.Root>
            <Menu.Trigger asChild>
              <IconButton
                aria-label={`Champs facultatifs du bloc ${getBlockLabel(block.type)}`}
                title="Nom et consigne du bloc"
                css={hitAreaTactile()}
                size="2xs"
                variant="ghost"
                color="fg.muted"
              >
                <LuEllipsis size={13} />
              </IconButton>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content
                  bg="bg.surface"
                  borderWidth="1px"
                  borderColor="whiteAlpha.200"
                  minW="200px"
                >
                  <Menu.Item
                    value="nom"
                    onClick={() => ouvrirChamp('nom')}
                    color="fg"
                    _hover={{ bg: 'whiteAlpha.100' }}
                  >
                    {aUnNom ? 'Renommer le bloc' : 'Nommer le bloc'}
                  </Menu.Item>
                  <Menu.Item
                    value="consigne"
                    onClick={() => ouvrirChamp('consigne')}
                    color="fg"
                    _hover={{ bg: 'whiteAlpha.100' }}
                  >
                    {aUneConsigne
                      ? 'Modifier la consigne'
                      : 'Ajouter une consigne'}
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
          <IconButton
            aria-label={`Réorganiser le bloc ${getBlockLabel(block.type)}`}
            title="Déplacer ce bloc"
            css={hitAreaTactile()}
            size="2xs"
            variant="ghost"
            color="fg.muted"
            cursor="grab"
            touchAction="none"
            {...dragHandleProps}
          >
            <LuGripVertical size={12} />
          </IconButton>
          <IconButton
            aria-label={`Supprimer le bloc ${getBlockLabel(block.type)}`}
            title="Supprimer ce bloc"
            css={hitAreaTactile()}
            size="2xs"
            variant="ghost"
            color="fg.muted"
            _hover={{ color: 'app.error' }}
            onClick={onRemove}
          >
            <LuTrash2 size={12} />
          </IconButton>
        </HStack>
      }
      footer={
        isPickerOpen && !onRequestExercisePicker ? (
          <InlineExercisePicker
            inProgram={inProgram}
            onSelect={onAddExercise}
            onClose={() => setIsPickerOpen(false)}
            onOpenSheet={onOpenExerciseSheet}
          />
        ) : (
          <Box
            as="button"
            onClick={() =>
              onRequestExercisePicker
                ? onRequestExercisePicker()
                : setIsPickerOpen(true)
            }
            fontSize="xs"
            color="fg.muted"
            minH="44px"
            display="flex"
            alignItems="center"
            _hover={{ color: 'app.primary' }}
            transition="color 0.15s"
          >
            <HStack gap={1}>
              <LuPlus size={12} />
              <Text as="span">exercice</Text>
            </HStack>
          </Box>
        )
      }
      notes={
        consigneVisible ? (
          <InlineText
            value={block.notes}
            onChange={(notes) => onUpdate({ notes })}
            addLabel="+ consigne"
            ariaLabel={`Consigne du bloc ${getBlockLabel(block.type)}`}
            width="100%"
            startOpen={champDemande === 'consigne' && !aUneConsigne}
            multiline
          />
        ) : undefined
      }
    >
      {block.exercises.map((exercise, index) => (
        <ExerciseRow
          key={index}
          exercise={exercise}
          block={block}
          index={index}
          onUpdate={(updates) => onUpdateExercise(index, updates)}
          onRemove={() => onRemoveExercise(index)}
        />
      ))}
    </BlockFrame>
  );
};
