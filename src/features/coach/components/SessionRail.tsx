import { useEffect, useRef } from 'react';
import {
  Box,
  HStack,
  Text,
  VStack,
  useBreakpointValue,
} from '@chakra-ui/react';
import { LuGripVertical, LuPlus } from 'react-icons/lu';
import { CompletedSession, Session } from '@/shared/types';
import { cardLine, pulseOf, railLine } from '@/domain/session/rail';
import { Composition } from '@/kit';
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
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { sessionName, sessionRank } from '@/domain/session/name';
import { EffortDots } from './EffortDots';
import { dragSpeech } from './dragSpeech';
import { SessionContextMenu, type SessionMenuAction } from './SessionMenu';

interface SessionRailProps {
  sessions: Session[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onAddSession: () => void;
  /** « Importer un modèle… », au pied du rail : absent d'un modèle, qu'on
   * n'importe pas dans un autre. */
  onImport?: () => void;
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
      // Un bouton, qui ouvre sa séance : la bibliothèque l'annonçait
      // « sortable », en anglais, et « désactivé » quand le programme ne se
      // réordonne pas — alors qu'il s'ouvre toujours.
      aria-roledescription={undefined}
      aria-disabled={undefined}
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
      <Composition blocks={session.blocks} />
      {/* Les points seulement pour une séance faite : « jamais faite » le
          dit déjà, et cinq ronds vides le rediraient. */}
      {tracked && done && <EffortDots zones={pulseOf(history, session._id)} />}
    </Box>
  );
  if (!actions) return row;
  return <SessionContextMenu actions={actions}>{row}</SessionContextMenu>;
};

/**
 * Une séance de la bande, sur téléphone : la même lecture que le rail, en
 * carte de 176 px — le nom, la durée, la composition, les cinq ressentis.
 *
 * Elle remplace des pastilles « S1 … S6 » qui ne disaient que le rang : il
 * fallait ouvrir chaque séance pour savoir laquelle était « Full body A ».
 * Un appui long la soulève pour la déplacer ; un glissement bref fait
 * défiler la bande — d'où `manipulation`, et non `none` comme sur le rail
 * d'un écran large, qui ne défile pas de côté.
 */
const BandCard = ({
  session,
  isActive,
  tracked,
  history,
  onSelect,
  sortable,
}: Omit<RowProps, 'actions'>) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: session._id, disabled: !sortable });
  const cardRef = useRef<HTMLElement | null>(null);

  // La séance ouverte se montre dans la bande : ouverte par son adresse —
  // la sixième, au retour d'un lien —, elle était hors de l'écran, et rien
  // ne disait laquelle on lisait.
  useEffect(() => {
    if (isActive)
      cardRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [isActive]);

  const rank = sessionRank(session.order);
  const name = sessionName(session);
  const freeName = name === rank ? undefined : name;
  const done = history.some((c) => c.originalSessionId === session._id);

  return (
    <Box
      ref={(node: HTMLElement | null) => {
        setNodeRef(node);
        cardRef.current = node;
      }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
      {...listeners}
      // Un bouton, qui ouvre sa séance : la bibliothèque l'annonçait
      // « sortable », en anglais, et « désactivé » quand le programme ne se
      // réordonne pas — alors qu'il s'ouvre toujours.
      aria-roledescription={undefined}
      aria-disabled={undefined}
      as="button"
      onClick={onSelect}
      // Le même nom que la ligne du rail : un lecteur d'écran entend la
      // séance de la même façon sur les deux écrans.
      aria-label={`${rank}${freeName ? ` — ${freeName}` : ''}, ${railLine(session, { tracked, done })}`}
      aria-current={isActive ? 'true' : undefined}
      flexShrink={0}
      w="176px"
      display="flex"
      flexDirection="column"
      gap="7px"
      px="14px"
      py="12px"
      textAlign="left"
      borderRadius="18px"
      bg="bg.surface"
      boxShadow={isActive ? 'inset 0 0 0 2px {colors.app.primary}' : undefined}
      touchAction="manipulation"
      data-session-card
    >
      <Text fontWeight="700" fontSize="15px" lineClamp={1}>
        {session.order} · {name}
      </Text>
      <Text fontSize="12px" color="fg.muted" lineClamp={1}>
        {cardLine(session, { tracked, done })}
      </Text>
      <Composition blocks={session.blocks} />
      {/* La place des points reste prise sans eux : les cartes d'une bande
          ont toutes la même hauteur. */}
      {tracked && done ? (
        <EffortDots zones={pulseOf(history, session._id)} />
      ) : (
        <Box h="10px" />
      )}
    </Box>
  );
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
  onImport,
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
   * En dessous, une bande de cartes qui défile de côté fait le même travail
   * sans prendre un pixel de largeur.
   */
  const isDesktop = useBreakpointValue({ base: false, lg: true });

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  // Le même nom que la ligne et la carte : « Séance 3 — Full body A ».
  const speech = dragSpeech(
    'session',
    sessions.map((s) => s._id),
    (id) => {
      const session = sessions.find((s) => s._id === id);
      if (!session) return 'La séance';
      const rank = sessionRank(session.order);
      const name = sessionName(session);
      return name === rank ? rank : `${rank} — ${name}`;
    }
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
          accessibility={speech}
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
          onClick={() => onAddSession()}
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
        {onImport && (
          <Box
            as="button"
            onClick={onImport}
            minH="44px"
            fontSize="sm"
            color="fg.muted"
            textAlign="center"
            _hover={{ color: 'fg' }}
          >
            Importer un modèle…
          </Box>
        )}
      </VStack>
    );
  }

  return (
    // Le « + » était le dernier élément du défilement : passé huit séances
    // il sortait de l'écran et devenait introuvable. Il reste maintenant hors
    // du conteneur qui défile, épinglé à droite — visible en permanence, et
    // sans coûter une seconde ligne.
    <HStack gap={2} w="100%" align="center">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        accessibility={speech}
        // La bande défile d'elle-même quand le doigt approche d'un bord :
        // par défaut, dans le dernier cinquième — 63 px sur 318, là même où
        // se pose le doigt pour échanger une carte avec sa voisine. La
        // bande filait sous lui, et la carte tombait une place trop loin.
        autoScroll={{ threshold: { x: 0.1, y: 0 } }}
      >
        <SortableContext
          items={sessions.map((s) => s._id)}
          strategy={horizontalListSortingStrategy}
        >
          <HStack
            gap="10px"
            overflowX="auto"
            pb={2}
            flex={1}
            minW={0}
            align="stretch"
            css={{ scrollbarWidth: 'none' }}
            data-session-band
          >
            {sessions.map((session, index) => (
              <BandCard
                key={session._id}
                session={session}
                isActive={index === activeIndex}
                tracked={history !== undefined}
                history={history ?? []}
                onSelect={() => onSelect(index)}
                sortable={!!onReorder}
              />
            ))}
          </HStack>
        </SortableContext>
      </DndContext>
      <Box
        as="button"
        onClick={() => onAddSession()}
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
