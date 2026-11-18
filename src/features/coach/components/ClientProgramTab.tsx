import { useCallback, useRef, useState } from 'react';
import {
  Box,
  Drawer,
  Portal,
  Text,
  VStack,
  useBreakpointValue,
} from '@chakra-ui/react';
import { LuMessageSquarePlus, LuPencil, LuPlus } from 'react-icons/lu';
import {
  BlockExercise,
  BlockType,
  Exercise,
  Session,
  SessionBlock,
} from '@/shared/types';
import {
  WorkshopBlock,
  FormatPalette,
  ExerciseSelectorPanel,
  InlineText,
} from '@/features/workshop';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ActionButton, Sheet } from '@/kit';
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
import { useOutsideDismiss } from '@/shared/hooks/useOutsideDismiss';
import { SessionHeader } from './SessionHeader';
import type { SessionMenuAction } from './SessionMenu';
import { useBackDismiss } from '@/shared/hooks/useBackDismiss';

interface Props {
  session: Session;
  /**
   * Le menu de la séance ouverte, sans « Renommer » que l'en-tête tient
   * lui-même : dupliquer, copier vers un client, enregistrer comme modèle,
   * supprimer. C'est la page qui le construit — le clic droit sur le rail
   * ouvre le même —, et l'atelier ne sait toujours pas de qui est le
   * programme qu'il édite.
   */
  menuActions: SessionMenuAction[];
  onUpdateSessionName: (name?: string) => void;
  /** Le nom s'ouvre à l'écriture en arrivant : la séance vient d'être
   * créée, ou « Renommer » a été choisi sur le rail. */
  startRenaming?: boolean;
  onRenamed?: () => void;
  /**
   * Sur téléphone, la page offre la feuille de la séance (`SessionSheet`)
   * depuis sa barre du haut : l'en-tête et le mot d'avant séance s'effacent
   * alors sous `md`. La page d'un modèle n'a pas de barre du haut, et garde
   * son en-tête.
   */
  sessionSheetOnPhone?: boolean;
  /**
   * Un exercice à mettre en vue en arrivant : sa première ligne dans la
   * séance s'ouvre, et la page défile jusqu'à elle. « Ajuster » depuis « À
   * lire » le désigne ; absent, rien ne s'ouvre.
   */
  focusExerciseId?: string;
  /**
   * Où ouvrir la fiche d'un exercice, quand la page a mieux qu'un tiroir :
   * à partir de 1 280 px, la page du client la pose à la place de
   * l'aperçu. Absent, la fiche s'ouvre en tiroir par-dessus l'atelier.
   */
  onOpenExerciseSheet?: (exercise: Exercise) => void;
  /** Les exercices déjà placés ailleurs dans le programme, pour le
   * sélecteur. */
  inProgram: Exercise[];
  onUpdateSessionNotes: (notes: string) => void;
  onUpdateSessionDays: (days: number[]) => void;
  /** Rend l'identifiant du bloc créé. */
  onAddBlock: (type: BlockType) => string;
  onRemoveBlock: (blockId: string) => void;
  onChangeBlockFormat: (blockId: string, type: BlockType) => void;
  onDuplicateBlock: (blockId: string) => void;
  onUpdateBlock: (blockId: string, updates: Partial<SessionBlock>) => void;
  onReorderBlocks: (orderedBlockIds: string[]) => void;
  onAddExercise: (blockId: string, exercise: Exercise) => void;
  onRemoveExercise: (blockId: string, index: number) => void;
  onDuplicateExercise: (blockId: string, index: number) => void;
  onUpdateExercise: (
    blockId: string,
    index: number,
    updates: Partial<Omit<BlockExercise, 'exercise'>>
  ) => void;
}

/** La première ligne d'une séance où figure ce mouvement, s'il y est : le
 * programme a pu bouger depuis la séance que le client a faite. */
const rowOfExercise = (
  session: Session,
  exerciseId: string | undefined
): { blockId: string; index: number } | null => {
  if (!exerciseId) return null;
  for (const block of session.blocks) {
    const index = block.exercises.findIndex(
      (ex) => ex.exercise._id === exerciseId
    );
    if (index >= 0) return { blockId: block._id, index };
  }
  return null;
};

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

/**
 * L'atelier : là où le coach écrit le programme de son client.
 *
 * Tout s'édite sur place, sans formulaire ni bouton d'enregistrement :
 * l'écran est dense parce qu'on y corrige trois mots vingt fois, et un
 * aller-retour vers une page de saisie pour chacun rendait le travail
 * impraticable. L'enregistrement automatique en est la contrepartie — d'où
 * les filets d'annulation, qui remplacent les confirmations.
 */
export const ClientProgramTab = ({
  session,
  menuActions,
  onUpdateSessionName,
  startRenaming = false,
  onRenamed,
  sessionSheetOnPhone = false,
  focusExerciseId,
  onOpenExerciseSheet,
  inProgram,
  onUpdateSessionNotes,
  onUpdateSessionDays,
  onAddBlock,
  onRemoveBlock,
  onChangeBlockFormat,
  onDuplicateBlock,
  onUpdateBlock,
  onReorderBlocks,
  onAddExercise,
  onRemoveExercise,
  onDuplicateExercise,
  onUpdateExercise,
}: Props) => {
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [selectorBlockId, setSelectorBlockId] = useState<string | null>(null);

  const [sheetExercise, setSheetExercise] = useState<Exercise | null>(null);
  const openSheet = onOpenExerciseSheet ?? setSheetExercise;
  // La ligne ouverte, pour toute la séance : en ouvrir une referme l'autre,
  // même dans un autre bloc. L'écran est remonté à chaque séance — sa clé
  // est celle de la séance —, rien ne reste donc ouvert d'une séance à
  // l'autre.
  // L'exercice désigné en arrivant ouvre sa ligne. Décidé une fois, au
  // montage : l'écran est remonté à chaque séance, et l'adresse qui le
  // désigne ne doit pas rouvrir la ligne après qu'on l'a refermée.
  const [focused] = useState(() => rowOfExercise(session, focusExerciseId));
  const [openRow, setOpenRow] = useState<{
    blockId: string;
    index: number;
  } | null>(focused);
  // « Renommer » : chaque demande remonte le titre, ouvert à l'écriture.
  // Elles viennent de deux côtés — le « ⋯ » de l'en-tête, et la page (une
  // séance neuve, le clic droit sur le rail). Celles de la page arrivent en
  // `startRenaming`, qu'on recompte ici au passage à vrai : la séance
  // ouverte ne se remonte pas, et un titre déjà monté ignorait l'ordre — le
  // clic droit « Renommer » sur la séance qu'on lisait ne faisait rien.
  const [renameRequest, setRenameRequest] = useState(startRenaming ? 1 : 0);
  const [pageAsked, setPageAsked] = useState(startRenaming);
  if (startRenaming !== pageAsked) {
    setPageAsked(startRenaming);
    if (startRenaming) setRenameRequest((n) => n + 1);
  }
  const [noteRequested, setNoteRequested] = useState(false);
  const hasNote = !!session.notes?.trim();
  const showsNote = hasNote || noteRequested;

  const blockSelectorRef = useRef<HTMLDivElement>(null);
  const closeBlockSelector = useCallback(() => setShowBlockSelector(false), []);
  useOutsideDismiss(blockSelectorRef, showBlockSelector, closeBlockSelector);

  const isMobile = useBreakpointValue({ base: true, md: false });

  // Le bloc qu'on vient de créer : son « + exercice » s'ouvre aussitôt.
  // Un format choisi n'est qu'une coquille, et la suite du geste est
  // toujours d'y mettre un exercice.
  const [pickingBlockId, setPickingBlockId] = useState<string | null>(null);
  const addBlockOf = (type: BlockType) => {
    const id = onAddBlock(type);
    setShowBlockSelector(false);
    if (isMobile) setSelectorBlockId(id);
    else setPickingBlockId(id);
  };

  // Le bouton retour du téléphone ferme ce qui est ouvert par-dessus
  // l'éditeur, au lieu de quitter la séance. Quatre couches, quatre repères —
  // la plus haute se ferme d'abord, chacune ayant posé le sien à
  // l'ouverture.
  useBackDismiss(showBlockSelector, closeBlockSelector);
  useBackDismiss(!!selectorBlockId, () => setSelectorBlockId(null));
  useBackDismiss(!!sheetExercise, () => setSheetExercise(null));

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
        <Box
          display={{
            base: sessionSheetOnPhone ? 'none' : 'block',
            md: 'block',
          }}
        >
          <SessionHeader
            session={session}
            onRename={onUpdateSessionName}
            onDays={onUpdateSessionDays}
            onRenamed={onRenamed}
            renameRequest={renameRequest}
            actions={[
              {
                value: 'rename',
                label: 'Renommer',
                icon: <LuPencil size={14} />,
                onSelect: () => setRenameRequest((n) => n + 1),
              },
              // Le mot que le client lit avant de commencer : une invitation
              // permanente sous chaque titre était la septième de l'écran, et
              // la plupart des séances s'en passent. Il s'écrit d'ici.
              {
                value: 'note',
                label: hasNote
                  ? 'Modifier le mot d’avant séance'
                  : 'Ajouter un mot d’avant séance',
                icon: <LuMessageSquarePlus size={14} />,
                onSelect: () => setNoteRequested(true),
              },
              ...menuActions,
            ]}
          />
        </Box>

        {showsNote && (
          <Box
            className="group"
            w="fit-content"
            maxW="full"
            mt={-2}
            display={{
              base: sessionSheetOnPhone ? 'none' : 'block',
              md: 'block',
            }}
          >
            <InlineText
              value={session.notes}
              onChange={(notes) => onUpdateSessionNotes(notes ?? '')}
              addLabel="+ mot d’avant séance"
              ariaLabel="Note de la séance"
              fontSize="sm"
              startOpen={noteRequested && !hasNote}
              multiline
            />
          </Box>
        )}

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
                    <WorkshopBlock
                      block={block}
                      inProgram={inProgram}
                      dragHandleProps={dragHandleProps}
                      onUpdate={(updates) => onUpdateBlock(block._id, updates)}
                      onRemove={() => onRemoveBlock(block._id)}
                      onDuplicate={() => onDuplicateBlock(block._id)}
                      onChangeFormat={(type) =>
                        onChangeBlockFormat(block._id, type)
                      }
                      onAddExercise={(exercise) =>
                        onAddExercise(block._id, exercise)
                      }
                      onRemoveExercise={(i) => onRemoveExercise(block._id, i)}
                      onDuplicateExercise={(i) =>
                        onDuplicateExercise(block._id, i)
                      }
                      onUpdateExercise={(i, updates) =>
                        onUpdateExercise(block._id, i, updates)
                      }
                      openIndex={
                        openRow?.blockId === block._id ? openRow.index : null
                      }
                      onOpenRow={(index) =>
                        setOpenRow(
                          index === null ? null : { blockId: block._id, index }
                        )
                      }
                      settingsInSheet={!!isMobile}
                      startPicking={pickingBlockId === block._id}
                      revealIndex={
                        focused?.blockId === block._id ? focused.index : null
                      }
                      onRequestExercisePicker={
                        isMobile
                          ? () => setSelectorBlockId(block._id)
                          : undefined
                      }
                      onOpenExerciseSheet={openSheet}
                    />
                  )}
                </SortableBlock>
              ))}
            </VStack>
          </SortableContext>
        </DndContext>

        {/* La palette se déplie à l'endroit du bloc à venir ; sur
            téléphone, elle monte en feuille. */}
        {showBlockSelector && !isMobile ? (
          <Box ref={blockSelectorRef}>
            <FormatPalette
              layout="card"
              onSelect={addBlockOf}
              onCancel={closeBlockSelector}
            />
          </Box>
        ) : (
          <ActionButton
            tone="ghost"
            size="md"
            w="full"
            onClick={() => setShowBlockSelector(true)}
          >
            <LuPlus size={18} />
            Ajouter un bloc
          </ActionButton>
        )}
        {showBlockSelector && isMobile && (
          <Portal>
            <Sheet label="Quel format ?" onDismiss={closeBlockSelector}>
              <FormatPalette layout="sheet" onSelect={addBlockOf} />
            </Sheet>
          </Portal>
        )}

        {session.blocks.length === 0 && !showBlockSelector && (
          <Text color="fg.muted" fontSize="sm">
            Cette séance ne contient aucun bloc.
          </Text>
        )}
      </VStack>

      {selectorBlockId && (
        <ExerciseSelectorPanel
          isOpen={!!selectorBlockId}
          inProgram={inProgram}
          onOpenSheet={openSheet}
          onClose={() => setSelectorBlockId(null)}
          onSelect={(exercise) => {
            onAddExercise(selectorBlockId, exercise);
            setSelectorBlockId(null);
          }}
        />
      )}

      {/* La fiche par-dessus l'éditeur : on corrige une consigne ou on
          colle une vidéo sans naviguer, donc sans perdre le programme en
          main. */}
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
                    // Ouverte par-dessus la séance en cours d'écriture, la
                    // fiche doit dire où l'on retourne : une croix dans un
                    // coin ne le dit pas.
                    doneLabel="Retour au programme"
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
