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
} from '@/shared/types';
import {
  WorkshopBlock,
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
import { TOUCH, touchGap, touchHitArea } from '@/shared/components/hitArea';
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
import { CopySessionToClient } from './CopySessionToClient';
import { useBackDismiss } from '@/shared/hooks/useBackDismiss';

interface Props {
  session: Session;
  /** Le client dont on édite le programme — la source d'une copie. */
  clientId: string;
  /** Les exercices déjà placés ailleurs dans le programme, pour le
   * sélecteur. */
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

  // Le bouton retour du téléphone ferme ce qui est ouvert par-dessus
  // l'éditeur, au lieu de quitter la séance. Quatre couches, quatre repères —
  // la plus haute se ferme d'abord, chacune ayant posé le sien à
  // l'ouverture.
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
          {/* La note ne s'affiche que lorsqu'elle existe, ou qu'elle vient
              d'être demandée. Un « + note de séance » posé en permanence était
              la septième invitation de l'écran, et la seule dont la plupart
              des séances se passent. */}
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
          {/* Les pastilles de jour font 44 px sous un doigt, le bouton de
              note en porte 44 invisibles autour de ses 24 : sans cet écart,
              sa zone mordrait sur la pastille de dimanche. */}
          <HStack gap={2} css={touchGap} align="center">
            {/* Le jour conseillé est un attribut de la séance, du même rang
                que sa note : le coach le pose, une fois, ici. La semaine du
                client s'en déduit à l'affichage — il n'y a pas d'agenda
                séparé à tenir cohérent. */}
            <SuggestedDaysPicker
              value={session.suggestedDays}
              onChange={onUpdateSessionDays}
            />
            {!noteVisible && (
              <IconButton
                aria-label="Ajouter une note de séance"
                title="Ajouter une note de séance"
                onClick={() => setNoteDemandee(true)}
                css={touchHitArea()}
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
                    <WorkshopBlock
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

        {/* La barre de la séance.

            Les deux commandes se tenaient côte à côte, même taille, même
            gris, même style d'icône, à quatre pixels l'une de l'autre. L'une
            est sans conséquence — on peut dupliquer dix fois sans dégât —
            l'autre détruit le travail d'une séance entière. La confirmation
            existe déjà ; c'est le geste *avant* la confirmation qu'il faut
            rendre moins facile, et deux boutons jumeaux le rendent facile par
            erreur.

            « Supprimer » part donc seul à droite, en rouge, avec toute la
            largeur de la colonne entre lui et son voisin. */}
        <HStack justify="flex-start" gap={4} rowGap={2} wrap="wrap" pt={2}>
          <Button
            size="xs"
            variant="ghost"
            color="fg.muted"
            /* Assez larges, trop courts : 32 px de haut sous un doigt. Ils
                           sont seuls sur leur ligne, la hauteur peut donc croître sans
                           rien recouvrir. */
            css={{ [TOUCH]: { minHeight: '44px' } }}
            onClick={onDuplicateSession}
          >
            <LuCopy size={13} />
            Dupliquer la séance
          </Button>
          {/* Dupliquer et copier se ressemblent assez pour voisiner, et
              assez peu pour ne pas se confondre : l'un reste chez ce client,
              l'autre part chez un autre — et son libellé le dit avant le
              clic, par les points de suspension qui annoncent un choix. */}
          <Button
            size="xs"
            variant="ghost"
            color="fg.muted"
            css={{ [TOUCH]: { minHeight: '44px' } }}
            onClick={() => setIsCopyOpen(true)}
          >
            <LuUsers size={13} />
            Copier vers un client…
          </Button>
          <Button
            size="xs"
            variant="ghost"
            /* `ml="auto"` plutôt que `space-between` : l'écart maximal quand
                           les deux tiennent sur une ligne, et « Supprimer » qui reste à
                           droite quand elles passent à la ligne. `space-between` sur une
                           rangée qui ne se replie pas poussait la page 51 px trop large à
                           768. */
            ml="auto"
            color="app.error"
            _hover={{ bg: 'app.error/12' }}
            css={{ [TOUCH]: { minHeight: '44px' } }}
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
