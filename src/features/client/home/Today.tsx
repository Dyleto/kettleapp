import { useOutletContext, useNavigate } from 'react-router';
import { useMemo, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  HStack,
  Skeleton,
  Text,
  VisuallyHidden,
  VStack,
} from '@chakra-ui/react';
import { LuFlame, LuMessageCircle, LuSend } from 'react-icons/lu';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { useAuth } from '@/shared/contexts/useAuth';
import type { CompletedSession, Session } from '@/shared/types';
import {
  CLIENT_CONTENT_MAX_W,
  CLIENT_GRID_MAX_W,
} from '@/features/client/shell/layout';
import { CompletedSheet } from '@/features/client/progress/CompletedDetail';
import { CorrectFlow } from '@/features/client/progress/CorrectFlow';
import { useClientSessions } from '@/features/client/common/useClientSessions';
import { buildWeekPlan } from '@/domain/week/plan';
import { dayKey, WEEKDAY_FULL } from '@/domain/week/dates';
import { doneInWeek, weekStreak, weekTarget } from '@/domain/week/ring';
import { homeFocus, weekWords } from '@/features/client/home/focus';
import {
  finishedAgo,
  startedAgo,
  unfinishedSession,
} from '@/features/client/home/unfinished';
import { restartProgress } from '@/features/client/guided/sessionProgress';
import {
  ActionButton,
  Chip,
  EmptyState,
  hitArea,
  Mascot,
  Segments,
  Sheet,
} from '@/kit';
import { estimatedMinutes } from '@/domain/session/measure';
import { getBlockLabel } from '@/domain/session/blocks';
import { CLIENT_ROUTES } from '@/shared/config/routes';
import type { WeekBubble } from '@/features/client/home/WeekBubbles';
import { WeekCard } from '@/features/client/home/WeekCard';
import { FocusCard } from '@/features/client/home/FocusCard';
import {
  FullCard,
  HowItWorks,
  RestCard,
} from '@/features/client/home/DayCards';
import { LastSessionCard } from '@/features/client/home/LastSessionCard';
import { sessionName } from '@/domain/session/name';

type ClientSessionsData = ReturnType<typeof useClientSessions>;

/** Les formats d'une séance, sans doublon, dans l'ordre des blocs. */
const formats = (session: Session): string[] => [
  ...new Set(
    [...session.blocks]
      .sort((a, b) => a.order - b.order)
      .map((block) => getBlockLabel(block.type))
  ),
];

const startable = (session: Session) =>
  session.blocks.some((block) => block.exercises.length > 0);

const capitalized = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

/**
 * L'accueil du client : une seule question, « qu'est-ce que je fais
 * maintenant ? ».
 *
 * Une séance à démarrer ou à reprendre, la semaine en un anneau, et la
 * dernière séance. Tout le reste — l'historique, les records, le
 * calendrier — est dans Progrès ; l'accueil en montrait trois cartes, qui
 * repoussaient la séance du jour sous le pli.
 */
const Today = () => {
  useDocumentTitle('Aujourd’hui');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sessions, nextSession, history, isLoading, coach, sendPending } =
    useOutletContext<ClientSessionsData>();
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [correcting, setCorrecting] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  // L'enregistrement du téléphone, relu quand le programme ou l'historique
  // change : un ressenti parti en arrière-plan efface l'enregistrement, puis
  // l'historique se recharge — c'est ce qui retire la carte « En attente de
  // réseau ».
  const unfinished = useMemo(
    () => unfinishedSession(sessions),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- relu quand l'historique change
    [sessions, history]
  );

  // Relue dans l'historique à chaque rendu, comme dans Progrès : une
  // correction enregistrée se voit sans refermer la séance.
  const opened = history.find((c) => c._id === openedId) ?? null;
  const openCompleted = (completed: CompletedSession) => {
    setCorrecting(false);
    setOpenedId(completed._id);
  };
  // `from` dit à la fiche d'où l'on vient : son lien de retour ramène ici,
  // et non au programme.
  const openSheet = (session: Session) =>
    navigate(CLIENT_ROUTES.sessionById(session._id), {
      state: { from: 'today' },
    });
  // Démarrer depuis l'accueil ouvre la séance guidée sur son écran
  // d'ouverture : la fiche est là-dessous, et la refermer y ramène.
  // Reprendre passe par la même porte : une séance commencée s'ouvre
  // d'elle-même sur le bloc et la série où l'on s'était arrêté.
  const startGuided = (session: Session) =>
    navigate(CLIENT_ROUTES.sessionById(session._id), {
      state: { guided: 'start', from: 'today' },
    });
  // Recommencer efface la position et ce qui est coché, puis repart de
  // l'ouverture. Les charges notées restent, comme quand on recommence
  // depuis la séance elle-même : elles s'écrasent au fil des séries.
  const restartGuided = (session: Session) => {
    restartProgress(session._id);
    startGuided(session);
  };

  // Le prénom seul, jamais l'adresse : un compte créé par Google peut ne pas
  // en avoir, et « Salut corentin.lm@… » se lirait comme une erreur.
  const firstName = user?.firstName?.trim();
  const greeting = firstName ? `Salut ${firstName}` : 'Salut';

  if (isLoading) {
    return (
      <Container maxW={CLIENT_CONTENT_MAX_W} py={6} px={4}>
        <VStack align="stretch" gap={4} aria-busy="true">
          <HStack gap={3}>
            <Skeleton w="38px" h="38px" borderRadius="full" />
            <Skeleton w="170px" h="26px" borderRadius="md" />
          </HStack>
          <Skeleton h="184px" borderRadius="card" />
          <Skeleton h="300px" borderRadius="card" />
          <Skeleton h="120px" borderRadius="card" />
        </VStack>
      </Container>
    );
  }

  const target = weekTarget(sessions);
  const streak = weekStreak(history, target);

  const header = (
    <HStack gap={3}>
      <VisuallyHidden as="h1">Aujourd&rsquo;hui</VisuallyHidden>
      <Mascot mood="hello" size={38} />
      <Text fontSize="26px" fontWeight="800" lineHeight="1.1">
        {greeting}
      </Text>
      {streak >= 2 && (
        <Box
          as="button"
          ml="auto"
          borderRadius="full"
          css={hitArea()}
          aria-label={`${streak} semaines d’affilée — voir tes progrès`}
          onClick={() => navigate(CLIENT_ROUTES.history)}
        >
          <Chip tone="amber">
            <LuFlame size={14} aria-hidden />
            {streak}&nbsp;sem.
          </Chip>
        </Box>
      )}
    </HStack>
  );

  if (sessions.length === 0 || !nextSession) {
    return (
      <Container maxW={CLIENT_CONTENT_MAX_W} py={6} px={4}>
        <VStack align="stretch" gap={6}>
          {header}
          <EmptyState
            mood="sleep"
            title="Ton programme arrive"
            line={`${coach.opening} prépare tes séances. Tu n'as rien à faire : elles apparaîtront ici.`}
          />
        </VStack>
      </Container>
    );
  }

  const today = dayKey(new Date());
  const words = weekWords({ sessions, history, streak, coach: coach.opening });
  const days: WeekBubble[] = buildWeekPlan(sessions, history).map((day) => {
    const name = `${capitalized(WEEKDAY_FULL[day.index])} ${day.date.getDate()}`;
    const done = day.done[0];
    const planned = day.suggested[0];
    return {
      date: day.date,
      state: done ? 'done' : planned ? 'planned' : 'free',
      today: day.key === today,
      ...(done
        ? {
            label: `${name} — faite : ${sessionName({ order: done.sessionOrder, name: done.sessionName })}`,
            onOpen: () => openCompleted(done),
          }
        : planned
          ? {
              label: `${name} — conseillée : ${sessionName(planned)}`,
              onOpen: () => openSheet(planned),
            }
          : {}),
    };
  });

  const focus = homeFocus(sessions, history, nextSession);
  const last = history[0];

  const hero = (session: Session, eyebrow: string) => (
    <FocusCard
      eyebrow={eyebrow}
      title={sessionName(session)}
      chips={
        startable(session)
          ? [`≈ ${estimatedMinutes(session)} min`, ...formats(session)]
          : formats(session)
      }
      note={session.notes?.trim() || undefined}
      cta={startable(session) ? 'Démarrer' : 'Voir la séance'}
      onCta={() =>
        startable(session) ? startGuided(session) : openSheet(session)
      }
      link={startable(session) ? 'Voir le détail de la séance' : undefined}
      onLink={() => openSheet(session)}
    />
  );

  // Finie, pas encore envoyée : le ressenti rouvre la fin de la séance, à
  // l'écran du ressenti — la fête est passée, les charges sont notées.
  const reviewFeeling = (session: Session) =>
    navigate(CLIENT_ROUTES.sessionById(session._id), {
      state: { end: 'review', from: 'today' },
    });

  const leftCard =
    unfinished?.state === 'pending' ? (
      <FocusCard
        eyebrow="En attente de réseau"
        title={sessionName(unfinished.session)}
        chips={[]}
        aside="ton ressenti partira seul"
        cta="Envoyer maintenant"
        icon={<LuSend size={18} aria-hidden />}
        onCta={() => void sendPending()}
      />
    ) : unfinished?.state === 'finished' ? (
      <FocusCard
        eyebrow="À valider"
        title={sessionName(unfinished.session)}
        chips={[]}
        aside={
          unfinished.finishedAt !== undefined
            ? finishedAgo(unfinished.finishedAt, new Date().getTime())
            : undefined
        }
        cta="Dire comment c’était"
        icon={<LuMessageCircle size={18} aria-hidden />}
        onCta={() => reviewFeeling(unfinished.session)}
        link="Voir la séance"
        onLink={() => openSheet(unfinished.session)}
      />
    ) : undefined;

  const resumeCard =
    leftCard ??
    (unfinished && (
      <FocusCard
        eyebrow="En cours"
        title={sessionName(unfinished.session)}
        chips={unfinished.where}
        aside={
          unfinished.startedAt !== undefined
            ? startedAgo(unfinished.startedAt, new Date().getTime())
            : undefined
        }
        extra={<Segments parts={unfinished.blocks} />}
        // Le coach a changé la séance depuis : la position enregistrée ne
        // désigne plus rien de sûr. Il ne reste que recommencer.
        cta={unfinished.changed ? 'Recommencer' : 'Reprendre'}
        onCta={() =>
          unfinished.changed
            ? setConfirmRestart(true)
            : startGuided(unfinished.session)
        }
        link={unfinished.changed ? undefined : 'Recommencer depuis le début'}
        onLink={() => setConfirmRestart(true)}
      />
    ));

  const main = resumeCard ? (
    resumeCard
  ) : focus.kind === 'full' ? (
    <FullCard onMore={() => navigate(CLIENT_ROUTES.program)} />
  ) : focus.kind === 'rest' ? (
    <RestCard
      doneToday={focus.doneToday}
      day={WEEKDAY_FULL[focus.day]}
      name={sessionName(focus.session)}
      detail={[
        startable(focus.session)
          ? `≈ ${estimatedMinutes(focus.session)} min`
          : '',
        formats(focus.session).join(', '),
      ]
        .filter(Boolean)
        .join(' · ')}
      onOpen={() => openSheet(focus.session)}
    />
  ) : (
    hero(
      focus.session,
      focus.kind === 'first'
        ? 'Ta première séance'
        : focus.kind === 'today'
          ? 'À faire aujourd’hui'
          : 'La prochaine'
    )
  );

  return (
    <Container
      maxW={{ base: CLIENT_CONTENT_MAX_W, lg: CLIENT_GRID_MAX_W }}
      py={6}
      px={4}
    >
      <VStack align="stretch" gap={4}>
        {header}
        {/* Au téléphone, la semaine d'abord : c'est le contexte dans lequel
            la séance du jour se lit. Sur grand écran, ce qu'il y a à faire
            à gauche, où l'on en est à droite. */}
        <Grid
          gap={4}
          templateColumns={{ base: '1fr', lg: '1.25fr 1fr' }}
          templateAreas={
            last
              ? { base: '"week" "main" "last"', lg: '"main week" "main last"' }
              : { base: '"week" "main"', lg: '"main week"' }
          }
          alignItems="start"
        >
          <Box gridArea="week">
            <WeekCard
              done={doneInWeek(history)}
              target={target}
              title={words.title}
              line={words.line}
              days={days}
            />
          </Box>
          <VStack gridArea="main" align="stretch" gap={4}>
            {main}
            {!unfinished && focus.kind === 'first' && <HowItWorks />}
          </VStack>
          {last && (
            <Box gridArea="last">
              <LastSessionCard
                // Une autre séance, une autre pastille « Nouveau » : l'état
                // de la carte repart avec elle.
                key={last._id}
                completed={last}
                onOpen={() => openCompleted(last)}
              />
            </Box>
          )}
        </Grid>
      </VStack>

      {confirmRestart && unfinished && (
        <Sheet
          label="Recommencer la séance ?"
          onDismiss={() => setConfirmRestart(false)}
        >
          <Text as="h2" fontSize="22px" fontWeight="800" lineHeight="1.2">
            Recommencer la séance&nbsp;?
          </Text>
          <Text color="fg.muted">
            {unfinished.changed
              ? `${coach.opening} a modifié cette séance depuis que tu l’as commencée. `
              : ''}
            Tu perdras ce que tu as coché. Tes charges notées restent.
          </Text>
          <ActionButton
            size="lg"
            w="full"
            onClick={() => {
              setConfirmRestart(false);
              restartGuided(unfinished.session);
            }}
          >
            Recommencer
          </ActionButton>
          <ActionButton
            tone="ghost"
            size="lg"
            w="full"
            onClick={() => setConfirmRestart(false)}
          >
            Annuler
          </ActionButton>
        </Sheet>
      )}

      {opened && !correcting && (
        <CompletedSheet
          completed={opened}
          history={history}
          viewer="self"
          onCorrect={() => setCorrecting(true)}
          onClose={() => setOpenedId(null)}
        />
      )}
      {opened && correcting && (
        <CorrectFlow completed={opened} onClose={() => setCorrecting(false)} />
      )}
    </Container>
  );
};

export default Today;
