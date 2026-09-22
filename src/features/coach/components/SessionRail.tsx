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
import { sessionTitleParts } from '@/features/program/sessionTitle';

interface SessionRailProps {
  sessions: Session[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onAddSession: () => void;
  onReorder?: (orderedSessionIds: string[]) => void;
  /**
   * What the client actually did with each session: how many times, and when
   * the last was. That is what says whether the programme is being followed,
   * and it reads here across every session rather than on the open one alone.
   */
  suivi?: Map<string, { fois: number; derniere?: string }>;
}

/**
 * A row of segments, one per block, in its type's accent: you read a
 * session's work / rest balance in 150 px, without opening it.
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

  const { rang, libre } = sessionTitleParts(session.order, session.name);

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
        {/* The rank and the name on two lines, not one: "Séance 1 — Full
            body A" does not fit in 220 px, and broke in the middle of the
            name. Stacked, the rank keeps its place and the name keeps its
            own. */}
        <VStack align="start" gap={0} minW={0} flex={1}>
          <Text
            fontSize="sm"
            fontWeight="bold"
            color={isActive ? 'fg' : 'fg.muted'}
          >
            {rang}
          </Text>
          {libre && (
            <Text fontSize="xs" color="fg.muted" lineClamp={1} maxW="full">
              {libre}
            </Text>
          )}
        </VStack>
        {/* A discreet marker, not an alert: "jamais faite" is a fact, and
            so is "faite 4 fois". What matters is being able to compare
            sessions with each other — and so to read them all. */}
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
        {/* The coach has to reread what they set without reopening every
            session: this is where they see they put three sessions on
            Tuesday. */}
        {(session.suggestedDays?.length ?? 0) > 0 && (
          <Text fontSize="xs" color="app.primary">
            {session.suggestedDays!.map((d) => WEEKDAY_SHORT[d]).join(' · ')}
          </Text>
        )}
        {/* The date of the last time: "faite 4 fois" does not say whether
            that was last week or in June. */}
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
  /**
   * From when the rail becomes a column.
   *
   * It appeared at 768 px, at the same time as the navigation: 420 px of
   * chrome out of 768, and 260 px left to write a programme — less than a
   * phone, which offers 358. Every exercise row broke in two, and the session
   * grew 39 % taller. A coach on a tablet in portrait had the worst of the
   * three experiences.
   *
   * Measured: a row fits on a single level from 428 px of editor. The rail
   * costs 244 px with its gutter, the navigation 200 — so at least 926 px are
   * needed to house all three. `lg`, which is 1024 px in Chakra v3 (and not
   * 992 as in v2), is the first threshold that passes: it leaves 516 px to
   * the editor, and 991 px just below.
   *
   * Below it, the horizontal S1…S5 strip does the same job without taking a
   * pixel of width.
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
    // The "+" was the last item in the scroll: past eight sessions it went
    // off screen and became impossible to find. It now stays outside the
    // scrolling container, pinned to the right — permanently visible, and
    // without costing a second line.
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
