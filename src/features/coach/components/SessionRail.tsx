import {
  Box,
  HStack,
  Text,
  VStack,
  useBreakpointValue,
} from '@chakra-ui/react';
import { LuPlus } from 'react-icons/lu';
import { Session } from '@/types';
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

interface SessionRailProps {
  sessions: Session[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onAddSession: () => void;
  onReorder?: (orderedSessionIds: string[]) => void;
  /**
   * Ce que le client a réellement fait de chaque séance : combien de fois, et
   * quand la dernière. C'est ce qui dit si le programme est suivi, et ça se
   * lit ici sur toutes les séances plutôt que sur la seule qui est ouverte.
   */
  suivi?: Map<string, { fois: number; derniere?: string }>;
}

/**
 * Une rangée de segments, un par bloc, à l'accent de son type : on lit
 * l'équilibre effort / repos d'une séance en 150 px, sans l'ouvrir.
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
  suivi?: { fois: number; derniere?: string };
  onSelect: () => void;
  sortable: boolean;
}

const RailRow = ({
  session,
  isActive,
  suivi,
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

  return (
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
        <Text
          fontSize="sm"
          fontWeight="bold"
          color={isActive ? 'fg' : 'fg.muted'}
        >
          Séance {session.order}
        </Text>
        {/* Un repère discret, pas une alerte : « jamais faite » est un fait,
            et « faite 4 fois » aussi. Ce qui compte, c'est de pouvoir
            comparer les séances entre elles — donc de les lire toutes. */}
        <Text
          fontSize="xs"
          color="fg.muted"
          flexShrink={0}
          title={
            suivi
              ? `Réalisée ${suivi.fois} fois par ce client`
              : 'Jamais réalisée par ce client'
          }
        >
          {suivi ? `${suivi.fois}×` : 'jamais faite'}
        </Text>
      </HStack>
      <HStack gap={1.5} align="baseline">
        <Text fontSize="xs" color="fg.muted">
          {session.blocks.length} bloc{session.blocks.length > 1 ? 's' : ''}
        </Text>
        {/* Le coach doit relire ce qu'il a posé sans rouvrir chaque séance :
            c'est là qu'il voit qu'il a mis trois séances le mardi. */}
        {(session.suggestedDays?.length ?? 0) > 0 && (
          <Text fontSize="xs" color="app.primary">
            {session.suggestedDays!.map((d) => WEEKDAY_SHORT[d]).join(' · ')}
          </Text>
        )}
        {/* La date de la dernière fois : « faite 4 fois » ne dit pas si
            c'était la semaine dernière ou en juin. */}
        {suivi?.derniere && (
          <Text fontSize="xs" color="fg.muted" flexShrink={0} ml="auto">
            {new Intl.DateTimeFormat('fr-FR', {
              day: 'numeric',
              month: 'short',
            }).format(new Date(suivi.derniere))}
          </Text>
        )}
      </HStack>
      <Composition session={session} />
    </Box>
  );
};

export const SessionRail = ({
  sessions,
  activeIndex,
  onSelect,
  onAddSession,
  onReorder,
  suivi,
}: SessionRailProps) => {
  const isDesktop = useBreakpointValue({ base: false, md: true });

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
                suivi={suivi?.get(session._id)}
                onSelect={() => onSelect(index)}
                sortable={!!onReorder}
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
    // Le « + » était le dernier élément du défilement : passé huit séances,
    // il sortait de l'écran et devenait introuvable. Il reste maintenant
    // hors du conteneur défilant, épinglé à droite — visible en permanence,
    // et sans coûter une seconde ligne.
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
              opacity={!suivi?.get(session._id) && !isActive ? 0.6 : 1}
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
