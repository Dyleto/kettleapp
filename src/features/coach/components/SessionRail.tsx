import {
  Box,
  HStack,
  Text,
  VStack,
  useBreakpointValue,
} from '@chakra-ui/react';
import { LuGripVertical, LuPlus } from 'react-icons/lu';
import { CompletedSession, Session } from '@/shared/types';
import { BLOCK_ACCENT_COLOR, getBlockAccent } from '@/domain/session/blocks';
import { pulseOf, railLine } from '@/domain/session/rail';
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
import { sessionName, sessionRank } from '@/domain/session/name';
import { EffortDots } from './EffortDots';
import { SessionContextMenu, type SessionMenuAction } from './SessionMenu';

interface SessionRailProps {
  sessions: Session[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onAddSession: () => void;
  onReorder?: (orderedSessionIds: string[]) => void;
  /**
   * Ce que le client a fait de ses séances : d'où le rail tire, pour
   * chacune, « jamais faite » ou ses cinq derniers ressentis. Absent pour un
   * modèle, que personne ne fait.
   */
  history?: CompletedSession[];
  /**
   * Le menu d'une séance, au clic droit — sans l'ouvrir d'abord. Absent
   * quand le rail se lit sans pouvoir rien y faire.
   */
  menuFor?: (session: Session) => SessionMenuAction[];
}

/**
 * Une rangée de segments, un par bloc, dans l'accent de son type : on lit
 * l'équilibre travail / repos d'une séance en 150 px, sans l'ouvrir.
 */
const Composition = ({ session }: { session: Session }) => {
  if (session.blocks.length === 0) {
    return <Box h="6px" borderRadius="3px" bg="line" />;
  }
  return (
    <HStack gap="3px" h="6px" data-composition>
      {session.blocks.map((block) => (
        <Box
          key={block._id}
          flex={1}
          h="full"
          borderRadius="3px"
          bg={BLOCK_ACCENT_COLOR[getBlockAccent(block.type)]}
        />
      ))}
    </HStack>
  );
};

interface RowProps {
  session: Session;
  isActive: boolean;
  /**
   * Le programme appartient à quelqu'un qui fait des séances.
   *
   * Sans cela, une séance jamais faite et un modèle ne se distinguaient
   * pas : les deux n'avaient aucun relevé, et le rail d'un modèle écrivait
   * « jamais faite » sous chacune de ses séances — une notion de client, sur
   * un écran où il n'y a pas de client.
   */
  tracked: boolean;
  history: readonly CompletedSession[];
  onSelect: () => void;
  sortable: boolean;
  /** Le menu de la séance, au clic droit. */
  actions?: SessionMenuAction[];
}

/**
 * Une séance du rail : « 1 · Full body A », la durée et les jours, la
 * barre de composition, et les cinq derniers ressentis.
 *
 * La ligne disait « 2 blocs » et « faite 4 fois » : un compte, pas une
 * lecture. Les cinq points disent ce que le compte taisait — une séance faite
 * quatre fois dont les deux dernières ont été trop dures.
 */
const RailRow = ({
  session,
  isActive,
  tracked,
  history,
  actions,
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

  const rank = sessionRank(session.order);
  const name = sessionName(session);
  const freeName = name === rank ? undefined : name;
  const done = history.some((c) => c.originalSessionId === session._id);
  const line = railLine(session, { tracked, done });

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
      // Le rang d'abord, pour un lecteur d'écran comme pour le banc :
      // « Séance 3 — Full body A, ≈ 45 min · lun, jeu ».
      aria-label={`${rank}${freeName ? ` — ${freeName}` : ''}, ${line}`}
      aria-current={isActive ? 'true' : undefined}
      textAlign="left"
      w="full"
      px="14px"
      py="12px"
      display="flex"
      flexDirection="column"
      gap="6px"
      borderRadius="18px"
      bg={isActive ? 'bg.raised' : 'transparent'}
      boxShadow={isActive ? 'inset 3px 0 0 {colors.app.primary}' : undefined}
      _hover={{ bg: isActive ? 'bg.raised' : 'whiteAlpha.50' }}
      transition="background 0.15s"
      touchAction="none"
      data-session-row
    >
      <HStack gap={2} w="full">
        {/* Le rang et le nom sur une ligne, comme la maquette : « 1 · Full
            body A ». Un nom trop long se coupe ; le titre de la séance
            ouverte le donne en entier. */}
        <Text fontWeight="700" fontSize="15px" lineClamp={1} flex={1} minW={0}>
          {session.order} · {name}
        </Text>
        <Box color="fg.muted" flexShrink={0} aria-hidden>
          <LuGripVertical size={16} />
        </Box>
      </HStack>
      <Text fontSize="12.5px" color="fg.muted" lineClamp={1}>
        {line}
      </Text>
      <Composition session={session} />
      {/* Les points seulement pour une séance faite : « jamais faite » le
          dit déjà, et cinq ronds vides le rediraient. */}
      {tracked && done && <EffortDots zones={pulseOf(history, session._id)} />}
    </Box>
  );
  if (!actions) return row;
  return <SessionContextMenu actions={actions}>{row}</SessionContextMenu>;
};

/**
 * Le rail des séances : la navigation du programme, et son bilan.
 *
 * Colonne à partir de `lg`, bande horizontale en dessous — le seuil est
 * mesuré, voir plus bas. Il porte aussi ce que chaque séance est devenue :
 * « jamais faite », ou ses cinq derniers ressentis — ce qui ne se lit
 * utilement que sur l'ensemble, pas sur la séance ouverte.
 */
export const SessionRail = ({
  sessions,
  activeIndex,
  onSelect,
  onAddSession,
  onReorder,
  history,
  menuFor,
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
      <VStack align="stretch" gap={1} w="240px" flexShrink={0}>
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
                isActive={index === activeIndex}
                tracked={history !== undefined}
                history={history ?? []}
                onSelect={() => onSelect(index)}
                sortable={!!onReorder}
                actions={menuFor?.(session)}
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
                history &&
                !history.some((c) => c.originalSessionId === session._id) &&
                !isActive
                  ? 0.6
                  : 1
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
