import { useCallback, useRef, useState } from 'react';
import {
  Box,
  Button,
  Drawer,
  HStack,
  IconButton,
  Portal,
  Text,
  VStack,
  useBreakpointValue,
} from '@chakra-ui/react';
import {
  LuCopy,
  LuUsers,
  LuMessageSquarePlus,
  LuPlus,
  LuTrash2,
} from 'react-icons/lu';
import {
  BlockExercise,
  BlockType,
  Exercise,
  Session,
  SessionBlock,
} from '@/types';
import {
  AtelierBlock,
  BlockTypeSelector,
  ExerciseSelectorPanel,
  InlineText,
  SuggestedDaysPicker,
} from '@/features/program';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TACTILE, ecartTactile, hitAreaTactile } from '@/components/hitArea';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { ExerciseSheet } from '@/features/exercise';
import { useOutsideDismiss } from '@/hooks/useOutsideDismiss';
import { CopySessionToClient } from './CopySessionToClient';
import { useBackDismiss } from '@/hooks/useBackDismiss';

interface Props {
  session: Session;
  /** The client whose programme is being edited — the source of a copy. */
  clientId: string;
  /** Exercises already placed elsewhere in the programme, for the selector. */
  inProgram: Exercise[];
  onRemoveSession: () => void;
  onDuplicateSession: () => void;
  onUpdateSessionNotes: (notes: string) => void;
  onUpdateSessionDays: (days: number[]) => void;
  onAddBlock: (type: BlockType) => void;
  onRemoveBlock: (blockId: string) => void;
  onUpdateBlock: (blockId: string, updates: Partial<SessionBlock>) => void;
  onReorderBlocks: (orderedBlockIds: string[]) => void;
  onAddExercise: (blockId: string, exercise: Exercise) => void;
  onRemoveExercise: (blockId: string, index: number) => void;
  onUpdateExercise: (
    blockId: string,
    index: number,
    updates: Partial<Omit<BlockExercise, 'exercise'>>
  ) => void;
}

const SortableBlock = ({
  id,
  children,
}: {
  id: string;
  children: (dragHandleProps: Record<string, unknown>) => React.ReactNode;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <Box
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {children({ ...attributes, ...listeners })}
    </Box>
  );
};

export const ClientProgramTab = ({
  session,
  clientId,
  inProgram,
  onRemoveSession,
  onDuplicateSession,
  onUpdateSessionNotes,
  onUpdateSessionDays,
  onAddBlock,
  onRemoveBlock,
  onUpdateBlock,
  onReorderBlocks,
  onAddExercise,
  onRemoveExercise,
  onUpdateExercise,
}: Props) => {
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [selectorBlockId, setSelectorBlockId] = useState<string | null>(null);

  const [sheetExercise, setSheetExercise] = useState<Exercise | null>(null);
  const [isCopyOpen, setIsCopyOpen] = useState(false);
  const [noteDemandee, setNoteDemandee] = useState(false);
  const aUneNote = !!session.notes?.trim();
  const noteVisible = aUneNote || noteDemandee;

  const blockSelectorRef = useRef<HTMLDivElement>(null);
  const closeBlockSelector = useCallback(() => setShowBlockSelector(false), []);
  useOutsideDismiss(blockSelectorRef, showBlockSelector, closeBlockSelector);

  const isMobile = useBreakpointValue({ base: true, md: false });

  // The phone's back button closes whatever is open over the editor, instead
  // of leaving the session. Four layers, four landmarks — the topmost closes
  // first, since each pushed its own on opening.
  useBackDismiss(showBlockSelector, closeBlockSelector);
  useBackDismiss(!!selectorBlockId, () => setSelectorBlockId(null));
  useBackDismiss(!!sheetExercise, () => setSheetExercise(null));
  useBackDismiss(isCopyOpen, () => setIsCopyOpen(false));

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = session.blocks.findIndex((b) => b._id === active.id);
    const to = session.blocks.findIndex((b) => b._id === over.id);
    if (from < 0 || to < 0) return;
    onReorderBlocks(arrayMove(session.blocks, from, to).map((b) => b._id));
  };

  return (
    <>
      <VStack align="stretch" gap={4}>
        <VStack align="stretch" gap={1}>
          {/* The note only shows when it exists, or when it has just been
              asked for. A permanently placed "+ note de séance" was the
              screen's seventh invitation, and the only one most sessions do
              without. */}
          {noteVisible && (
            <Box className="group" w="fit-content" maxW="full">
              <InlineText
                value={session.notes}
                onChange={(notes) => onUpdateSessionNotes(notes ?? '')}
                addLabel="+ note de séance"
                ariaLabel="Note de la séance"
                fontSize="sm"
                startOpen={noteDemandee && !aUneNote}
                multiline
              />
            </Box>
          )}
          {/* The day chips are 44 px under a finger, the note button carries
              44 invisible ones around its 24: without this gap its zone would
              bite into Sunday's chip. */}
          <HStack gap={2} css={ecartTactile} align="center">
            {/* The suggested day is an attribute of the session, of the same
                rank as its note: the coach sets it, once, here. The client's
                week is derived from it at display time — there is no separate
                schedule to keep consistent. */}
            <SuggestedDaysPicker
              value={session.suggestedDays}
              onChange={onUpdateSessionDays}
            />
            {!noteVisible && (
              <IconButton
                aria-label="Ajouter une note de séance"
                title="Ajouter une note de séance"
                onClick={() => setNoteDemandee(true)}
                css={hitAreaTactile()}
                size="2xs"
                variant="ghost"
                color="fg.muted"
                flexShrink={0}
              >
                <LuMessageSquarePlus size={14} />
              </IconButton>
            )}
          </HStack>
        </VStack>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={session.blocks.map((b) => b._id)}
            strategy={verticalListSortingStrategy}
          >
            <VStack align="stretch" gap={5}>
              {session.blocks.map((block) => (
                <SortableBlock key={block._id} id={block._id}>
                  {(dragHandleProps) => (
                    <AtelierBlock
                      block={block}
                      inProgram={inProgram}
                      dragHandleProps={dragHandleProps}
                      onUpdate={(updates) => onUpdateBlock(block._id, updates)}
                      onRemove={() => onRemoveBlock(block._id)}
                      onAddExercise={(exercise) =>
                        onAddExercise(block._id, exercise)
                      }
                      onRemoveExercise={(i) => onRemoveExercise(block._id, i)}
                      onUpdateExercise={(i, updates) =>
                        onUpdateExercise(block._id, i, updates)
                      }
                      onRequestExercisePicker={
                        isMobile
                          ? () => setSelectorBlockId(block._id)
                          : undefined
                      }
                      onOpenExerciseSheet={setSheetExercise}
                    />
                  )}
                </SortableBlock>
              ))}
            </VStack>
          </SortableContext>
        </DndContext>

        {showBlockSelector ? (
          <Box
            ref={blockSelectorRef}
            p={3}
            borderRadius="lg"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            bg="whiteAlpha.50"
          >
            <HStack justify="space-between" mb={3}>
              <Text fontSize="sm" fontWeight="bold" color="fg.muted">
                Choisir un type de bloc
              </Text>
              <Button
                size="xs"
                variant="ghost"
                color="fg.muted"
                onClick={closeBlockSelector}
              >
                Annuler
              </Button>
            </HStack>
            <BlockTypeSelector
              onSelect={(type) => {
                onAddBlock(type);
                setShowBlockSelector(false);
              }}
            />
          </Box>
        ) : (
          <Box
            as="button"
            onClick={() => setShowBlockSelector(true)}
            alignSelf="flex-start"
            minH="44px"
            display="flex"
            alignItems="center"
            fontSize="sm"
            color="fg.muted"
            _hover={{ color: 'app.primary' }}
            transition="color 0.15s"
          >
            <HStack gap={1.5}>
              <LuPlus size={14} />
              <Text as="span">Ajouter un bloc</Text>
            </HStack>
          </Box>
        )}

        {session.blocks.length === 0 && !showBlockSelector && (
          <Text color="fg.muted" fontSize="sm">
            Cette séance ne contient aucun bloc.
          </Text>
        )}

        {/* The session chrome.

            The two controls sat side by side, the same size, the same grey
            and the same icon style, four pixels apart. One is harmless — you
            can duplicate ten times without damage — the other destroys a
            whole session's work. The confirmation already exists; it is the
            gesture *before* the confirmation that has to be made less easy,
            and two twin buttons make it easy by mistake.

            So "Supprimer" goes alone to the right, in red, with the column's
            whole width between it and its neighbour. */}
        <HStack justify="flex-start" gap={4} rowGap={2} wrap="wrap" pt={2}>
          <Button
            size="xs"
            variant="ghost"
            color="fg.muted"
            /* Wide enough, too short: 32 px tall under a finger. They are
               alone on their row, so the height can grow without covering
               anything. */
            css={{ [TACTILE]: { minHeight: '44px' } }}
            onClick={onDuplicateSession}
          >
            <LuCopy size={13} />
            Dupliquer la séance
          </Button>
          {/* Duplicating and copying are alike enough to sit side by side,
              and unalike enough not to be confused: one stays with this
              client, the other goes to another — and its label says so before
              the click, through the ellipsis that announces a choice. */}
          <Button
            size="xs"
            variant="ghost"
            color="fg.muted"
            css={{ [TACTILE]: { minHeight: '44px' } }}
            onClick={() => setIsCopyOpen(true)}
          >
            <LuUsers size={13} />
            Copier vers un client…
          </Button>
          <Button
            size="xs"
            variant="ghost"
            /* `ml="auto"` rather than `space-between`: the maximum gap when
               both fit on one line, and "Supprimer" staying on the right when
               they wrap. `space-between` on a row that does not wrap pushed
               the page 51 px wide at 768. */
            ml="auto"
            color="app.error"
            _hover={{ bg: 'app.error/12' }}
            css={{ [TACTILE]: { minHeight: '44px' } }}
            onClick={onRemoveSession}
          >
            <LuTrash2 size={13} />
            Supprimer la séance
          </Button>
        </HStack>
      </VStack>

      <CopySessionToClient
        sourceClientId={clientId}
        sourceSessionId={session._id}
        sessionOrder={session.order}
        isOpen={isCopyOpen}
        onClose={() => setIsCopyOpen(false)}
      />

      {selectorBlockId && (
        <ExerciseSelectorPanel
          isOpen={!!selectorBlockId}
          inProgram={inProgram}
          onOpenSheet={setSheetExercise}
          onClose={() => setSelectorBlockId(null)}
          onSelect={(exercise) => {
            onAddExercise(selectorBlockId, exercise);
            setSelectorBlockId(null);
          }}
        />
      )}

      {/* The card over the editor: you fix an instruction or paste a video
          without navigating, and so without losing the programme in hand. */}
      <Drawer.Root
        open={!!sheetExercise}
        onOpenChange={(e) => !e.open && setSheetExercise(null)}
        size={{ base: 'full', md: 'md' }}
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content bg="bg.canvas">
              <Drawer.Body p={5}>
                {sheetExercise && (
                  <ExerciseSheet
                    exercise={sheetExercise}
                    onClose={() => setSheetExercise(null)}
                  />
                )}
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </>
  );
};
