import {
  Box,
  HStack,
  Menu,
  Portal,
  Text,
  VStack,
  useBreakpointValue,
} from '@chakra-ui/react';
import { LuPlus, LuTrash2 } from 'react-icons/lu';
import { Session } from '@/shared/types';
import {
  BLOCK_ACCENT_COLOR,
  getBlockAccent,
} from '@/features/program/constants';
import { WEEKDAY_SHORT } from '@/features/client/sessionDates';
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { sessionTitleParts } from '@/features/program/sessionTitle';

interface SessionRailProps {
  sessions: Session[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onAddSession: () => void;
  onReorder?: (orderedSessionIds: string[]) => void;
  /**
   * Ce que le client a réellement fait de chaque séance : combien de fois, et
   * quand fut la dernière. C'est ce qui dit si le programme est suivi, et
   * cela se lit ici sur toutes les séances plutôt que sur la seule ouverte.
   */
  tracking?: Map<string, { count: number; lastAt?: string }>;
  /**
   * Supprimer la séance visée, sans l'ouvrir d'abord.
   *
   * Absent quand le rail se lit sans pouvoir supprimer. Le filet d'annulation
   * vit chez l'appelant : c'est lui qui sait où remettre la séance.
   */
  onRequestDelete?: (sessionId: string) => void;
}

/**
 * Une rangée de segments, un par bloc, dans l'accent de son type : on lit
 * l'équilibre travail / repos d'une séance en 150 px, sans l'ouvrir.
 */
const Composition = ({ session }: { session: Session }) => {
  if (session.blocks.length === 0) {
    return <Box h="3px" borderRadius="full" bg="whiteAlpha.100" mt={1.5} />;
  }
  return (
    <HStack gap="2px" mt={1.5} h="3px">
      {session.blocks.map((block) => (
        <Box
          key={block._id}
          flex={1}
          h="full"
          borderRadius="full"
          bg={BLOCK_ACCENT_COLOR[getBlockAccent(block.type)]}
          opacity={0.8}
        />
      ))}
    </HStack>
  );
};

interface RowProps {
  session: Session;
  index: number;
  isActive: boolean;
  tracking?: { count: number; lastAt?: string };
  /**
   * Le programme appartient à quelqu'un qui fait des séances.
   *
   * Sans cela, une séance jamais faite et un modèle ne se distinguaient
   * pas : les deux n'avaient aucun relevé, et le rail d'un modèle écrivait
   * « jamais faite » sous chacune de ses séances — une notion de client, sur
   * un écran où il n'y a pas de client.
   */
  tracked: boolean;
  onSelect: () => void;
  sortable: boolean;
  /** Absent quand le rail se lit sans pouvoir supprimer. */
  onRequestDelete?: () => void;
}

const RailRow = ({
  session,
  isActive,
  tracking,
  tracked,
  onRequestDelete,
  onSelect,
  sortable,
}: RowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: session._id, disabled: !sortable });

  const { rank, freeName } = sessionTitleParts(session.order, session.name);

  const row = (
    <Box
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
      {...listeners}
      as="button"
      onClick={onSelect}
      textAlign="left"
      w="full"
      px={3}
      py={2}
      borderRadius="md"
      borderLeftWidth="2px"
      borderLeftColor={isActive ? 'app.primary' : 'transparent'}
      bg={isActive ? 'whiteAlpha.100' : 'transparent'}
      _hover={{ bg: 'whiteAlpha.50' }}
      transition="background 0.15s"
      touchAction="none"
    >
      <HStack justify="space-between" align="baseline" gap={2}>
        {/* Le rang et le nom sur deux lignes, pas une : « Séance 1 — Full
            body A » ne tient pas dans 220 px, et se cassait au milieu du nom.
            Empilés, le rang garde sa place et le nom la sienne. */}
        <VStack align="start" gap={0} minW={0} flex={1}>
          <Text
            fontSize="sm"
            fontWeight="bold"
            color={isActive ? 'fg' : 'fg.muted'}
          >
            {rank}
          </Text>
          {freeName && (
            <Text fontSize="xs" color="fg.muted" lineClamp={1} maxW="full">
              {freeName}
            </Text>
          )}
        </VStack>
        {/* Un repère discret, pas une alerte : « jamais faite » est un
            fait, et « faite 4 fois » aussi. Ce qui compte est de pouvoir
            comparer les séances entre elles — donc de toutes les lire. */}
        {tracked && (
          <Text
            fontSize="xs"
            color="fg.muted"
            flexShrink={0}
            title={
              tracking
                ? `Réalisée ${tracking.count} fois par ce client`
                : 'Jamais réalisée par ce client'
            }
          >
            {tracking ? `${tracking.count}×` : 'jamais faite'}
          </Text>
        )}
      </HStack>
      <HStack gap={1.5} align="baseline">
        <Text fontSize="xs" color="fg.muted">
          {session.blocks.length} bloc{session.blocks.length > 1 ? 's' : ''}
        </Text>
        {/* Le coach doit pouvoir relire ce qu'il a posé sans rouvrir
            chaque séance : c'est ici qu'il voit qu'il a mis trois séances le
            mardi. */}
        {(session.suggestedDays?.length ?? 0) > 0 && (
          <Text fontSize="xs" color="app.primary">
            {session.suggestedDays!.map((d) => WEEKDAY_SHORT[d]).join(' · ')}
          </Text>
        )}
        {/* La date de la dernière fois : « faite 4 fois » ne dit pas si
            c'était la semaine dernière ou en juin. */}
        {tracking?.lastAt && (
          <Text fontSize="xs" color="fg.muted" flexShrink={0} ml="auto">
            {new Intl.DateTimeFormat('fr-FR', {
              day: 'numeric',
              month: 'short',
            }).format(new Date(tracking.lastAt))}
          </Text>
        )}
      </HStack>
      <Composition session={session} />
    </Box>
  );

  if (!onRequestDelete) return row;

  return (
    <Menu.Root>
      <Menu.ContextTrigger asChild>{row}</Menu.ContextTrigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content
            bg="bg.surface"
            borderWidth="1px"
            borderRadius="xl"
            padding={1}
          >
            <Menu.Item
              value="delete"
              cursor="pointer"
              onClick={onRequestDelete}
              color="app.error"
              _hover={{ bg: 'app.error/12' }}
              borderRadius="md"
            >
              <HStack gap={2}>
                <LuTrash2 size={13} />
                <Text>Supprimer la séance {session.order}</Text>
              </HStack>
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};

/**
 * Le rail des séances : la navigation du programme, et son bilan.
 *
 * Colonne à partir de `lg`, bande horizontale en dessous — le seuil est
 * mesuré, voir plus bas. Il porte aussi ce que chaque séance est devenue :
 * combien de fois faite, et quand — ce qui ne se lit utilement que sur
 * l'ensemble, pas sur la séance ouverte.
 */
export const SessionRail = ({
  sessions,
  activeIndex,
  onSelect,
  onAddSession,
  onReorder,
  tracking,
  onRequestDelete,
}: SessionRailProps) => {
  /**
   * À partir de quand le rail devient une colonne.
   *
   * Il apparaissait à 768 px, en même temps que la navigation : 420 px de
   * décor sur 768, et 260 px restants pour écrire un programme — moins qu'un
   * téléphone, qui en offre 358. Chaque ligne d'exercice se cassait en deux,
   * et la séance gagnait 39 % de hauteur. Un coach sur une tablette en mode
   * portrait vivait la pire des trois expériences.
   *
   * Mesuré : une ligne tient sur un seul niveau à partir de 428 px d'éditeur.
   * Le rail coûte 244 px avec sa gouttière, la navigation 200 — il faut donc
   * au moins 926 px pour loger les trois. `lg`, qui vaut 1024 px dans Chakra
   * v3 (et non 992 comme en v2), est le premier seuil qui passe : il laisse
   * 516 px à l'éditeur, contre 991 px juste en dessous.
   *
   * En dessous, la bande horizontale S1…S5 fait le même travail sans prendre
   * un pixel de largeur.
   */
  const isDesktop = useBreakpointValue({ base: false, lg: true });

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!onReorder || !over || active.id === over.id) return;
    const from = sessions.findIndex((s) => s._id === active.id);
    const to = sessions.findIndex((s) => s._id === over.id);
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(sessions, from, to).map((s) => s._id));
  };

  if (isDesktop) {
    return (
      <VStack align="stretch" gap={1} w="220px" flexShrink={0}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sessions.map((s) => s._id)}
            strategy={verticalListSortingStrategy}
          >
            {sessions.map((session, index) => (
              <RailRow
                key={session._id}
                session={session}
                index={index}
                isActive={index === activeIndex}
                tracking={tracking?.get(session._id)}
                tracked={tracking !== undefined}
                onSelect={() => onSelect(index)}
                sortable={!!onReorder}
                onRequestDelete={
                  onRequestDelete
                    ? () => onRequestDelete(session._id)
                    : undefined
                }
              />
            ))}
          </SortableContext>
        </DndContext>

        <Box
          as="button"
          onClick={onAddSession}
          px={3}
          py={2.5}
          minH="44px"
          borderRadius="md"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="whiteAlpha.200"
          textAlign="center"
          color="app.primary"
          fontSize="sm"
          fontWeight="bold"
          _hover={{ bg: 'app.primary/8' }}
        >
          + Séance
        </Box>
      </VStack>
    );
  }

  return (
    // Le « + » était le dernier élément du défilement : passé huit séances
    // il sortait de l'écran et devenait introuvable. Il reste maintenant hors
    // du conteneur qui défile, épinglé à droite — visible en permanence, et
    // sans coûter une seconde ligne.
    <HStack gap={2} w="100%" align="center">
      <HStack
        gap={2}
        overflowX="auto"
        pb={2}
        flex={1}
        minW={0}
        css={{ scrollbarWidth: 'none' }}
      >
        {sessions.map((session, index) => {
          const isActive = index === activeIndex;
          return (
            <Box
              key={session._id}
              as="button"
              onClick={() => onSelect(index)}
              flexShrink={0}
              minW="44px"
              minH="44px"
              px={3}
              py={1.5}
              borderRadius="full"
              bg={isActive ? 'app.primary' : 'whiteAlpha.100'}
              color={isActive ? 'bg.canvas' : 'fg.muted'}
              fontSize="sm"
              fontWeight="bold"
              // Estompée quand le client ne l'a jamais faite — et seulement
              // s'il y a un client : dans un modèle, elles l'étaient toutes.
              opacity={
                tracking && !tracking.get(session._id) && !isActive ? 0.6 : 1
              }
            >
              S{session.order}
            </Box>
          );
        })}
      </HStack>
      <Box
        as="button"
        onClick={onAddSession}
        flexShrink={0}
        mb={2}
        minW="44px"
        minH="44px"
        justifyContent="center"
        px={3}
        py={1.5}
        borderRadius="full"
        borderWidth="1px"
        borderStyle="dashed"
        borderColor="whiteAlpha.200"
        color="app.primary"
        display="flex"
        alignItems="center"
        aria-label="Ajouter une séance"
      >
        <LuPlus size={14} />
      </Box>
    </HStack>
  );
};
