import { Session } from '@/types';
import { buildGuidedSteps } from '../guidedSteps';
import { useCountdown } from '../useCountdown';
import { formatLastPerformance, LastPerformance } from '../lastPerformance';
import { Box, HStack, Button, VStack, Text } from '@chakra-ui/react';
import VideoPlayer from '@/components/VideoPlayer';
import { hitArea } from '@/components/hitArea';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuInfo, LuX } from 'react-icons/lu';

interface GuidedSessionProps {
  session: Session;
  onExit: () => void;
  onFinish: () => void;
  lastPerformance?: Map<string, LastPerformance>;
}

interface CountdownProps {
  duration: number;
  /**
   * Fourni pour le repos, absent pour l'effort : un repos qui s'achève enchaîne
   * tout seul, un effort qui s'achève s'arrête et attend. Personne n'a envie de
   * voir la page changer sous ses yeux alors qu'il finit sa dernière rep.
   */
  onComplete?: () => void;
  color: string;
  holdLabel?: string;
}

// C'est le seul écran utilisé pendant l'effort, celui où l'on peut le moins se
// permettre de perdre sa place : un appel entrant ou un écran verrouillé trop
// longtemps ne doit pas renvoyer à l'étape 1 d'une séance qui en compte
// quarante.
const progressKey = (sessionId: string) => `kettle-guided-${sessionId}`;

const readSavedIndex = (sessionId: string): number => {
  try {
    const raw = sessionStorage.getItem(progressKey(sessionId));
    if (raw === null) return 0;
    const n = Number(raw);
    return Number.isInteger(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
};

const writeSavedIndex = (sessionId: string, index: number) => {
  try {
    sessionStorage.setItem(progressKey(sessionId), String(index));
  } catch {
    // Stockage indisponible (navigation privée, quota) : on continue sans.
  }
};

const clearSavedIndex = (sessionId: string) => {
  try {
    sessionStorage.removeItem(progressKey(sessionId));
  } catch {
    // idem
  }
};

const Countdown = ({
  duration,
  onComplete,
  color,
  holdLabel,
}: CountdownProps) => {
  const { remaining, isRunning, pause, resume } = useCountdown(duration, {
    onComplete,
  });
  const isDone = remaining === 0;

  useEffect(() => {
    if (remaining > 0 && remaining <= 3) {
      navigator.vibrate?.(150);
    }
  }, [remaining]);

  // Le décompte d'effort ne rend pas la main tout seul : on le signale une
  // fois, franchement, parce que personne ne regarde l'écran à ce moment-là.
  useEffect(() => {
    if (isDone && !onComplete) {
      navigator.vibrate?.([120, 80, 120]);
    }
  }, [isDone, onComplete]);

  return (
    <Box
      as="button"
      onClick={isDone ? undefined : () => (isRunning ? pause() : resume())}
      cursor={isDone ? 'default' : 'pointer'}
      aria-label={isRunning ? 'Mettre en pause' : 'Reprendre le décompte'}
    >
      <Text
        fontSize="72px"
        fontWeight="800"
        fontFamily="mono"
        lineHeight="1"
        color={color}
        opacity={isRunning || isDone ? 1 : 0.5}
      >
        {remaining}s
      </Text>
      {isDone && holdLabel ? (
        <Text fontSize="sm" color={color} opacity={0.75} mt={2}>
          {holdLabel}
        </Text>
      ) : (
        !isRunning && (
          <Text fontSize="xs" color={color} opacity={0.75} mt={1}>
            En pause — toucher pour reprendre
          </Text>
        )
      )}
    </Box>
  );
};

export const GuidedSession = ({
  session,
  onExit,
  onFinish,
  lastPerformance,
}: GuidedSessionProps) => {
  const [steps] = useState(() => buildGuidedSteps(session));
  const [savedIndex] = useState(() =>
    Math.min(readSavedIndex(session._id), Math.max(0, steps.length - 1))
  );
  const [index, setIndex] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  // La consigne du coach est écrite pour ce moment précis — au milieu de
  // l'effort, mains occupées. Elle était pourtant le seul contenu de la
  // séance inaccessible depuis le plein écran : il fallait en sortir, donc
  // perdre sa place, pour aller la lire.
  const [showDetail, setShowDetail] = useState(false);
  // Proposée, jamais imposée : un client qui veut vraiment recommencer ne doit
  // pas se retrouver piégé au milieu de la séance précédente.
  const [showResume, setShowResume] = useState(() => savedIndex > 0);

  const step = steps[index];
  const isLast = index === steps.length - 1;

  const goTo = (next: number) => {
    setIndex(next);
    setShowDetail(false);
    writeSavedIndex(session._id, next);
  };

  const goNext = () => {
    if (isLast) {
      clearSavedIndex(session._id);
      onFinish();
      return;
    }
    goTo(index + 1);
  };

  const goPrev = () => goTo(Math.max(0, index - 1));

  // On demande toujours. À la première étape il n'y a rien à perdre, mais on
  // vient d'entrer dans un plein écran : en sortir sans un mot sur un doigt
  // qui glisse, c'est la séance qu'on croit avoir lancée et qui n'est plus là.
  const handleExitClick = () => setShowExitConfirm(true);

  const confirmExit = () => {
    clearSavedIndex(session._id);
    onExit();
  };

  // Le plein écran se superposait à la page sans la neutraliser : quatre
  // tabulations suffisaient pour en sortir, on se retrouvait dans la barre
  // d'onglets et sur les boutons de la séance en dessous, et un lecteur
  // d'écran annonçait toujours toute la page. `inert` retire d'un coup le
  // focus, le pointeur et l'arbre d'accessibilité de tout ce qui n'est pas
  // la séance guidée.
  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    root.setAttribute('inert', '');
    return () => root.removeAttribute('inert');
  }, []);

  // ... ce qui oblige la séance elle-même à sortir de `#root`, sans quoi
  // elle se neutraliserait avec le reste.
  const overlay = (node: React.ReactNode) => createPortal(node, document.body);

  // Empêche l'écran de s'éteindre pendant toute la séance guidée : sans ça,
  // l'écran s'éteint entre deux exercices et il faut le déverrouiller les
  // mains moites.
  useEffect(() => {
    if (!('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const requestLock = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) {
          lock.release().catch(() => {});
          return;
        }
        sentinel = lock;
      } catch {
        // Refusé ou indisponible (hors écran actif, permissions...) : tant pis.
      }
    };

    requestLock();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !sentinel) {
        requestLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      sentinel?.release().catch(() => {});
    };
  }, []);

  if (steps.length === 0) {
    return overlay(
      <Box
        position="fixed"
        inset={0}
        zIndex={50}
        bg="bg.canvas"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        px={8}
        gap={4}
        textAlign="center"
      >
        <Text fontSize="lg" fontWeight="bold">
          Aucun exercice à suivre
        </Text>
        <Text fontSize="sm" color="fg.muted">
          Cette séance n'a pas d'exercices définis.
        </Text>
        <Button
          bg="app.primary"
          color="bg.canvas"
          fontWeight="bold"
          onClick={onExit}
        >
          Retour
        </Button>
      </Box>
    );
  }

  if (showResume) {
    return overlay(
      <Box
        position="fixed"
        inset={0}
        zIndex={50}
        bg="bg.canvas"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        px={8}
        gap={6}
        textAlign="center"
      >
        <Text fontSize="lg" fontWeight="bold">
          Reprendre où tu en étais&nbsp;?
        </Text>
        <Text fontSize="sm" color="fg.muted">
          Tu t'étais arrêté à l'étape {savedIndex + 1} sur {steps.length}.
        </Text>
        <VStack gap={2} w="full" maxW="280px">
          <Button
            w="full"
            bg="app.primary"
            color="bg.canvas"
            fontWeight="bold"
            onClick={() => {
              setIndex(savedIndex);
              setShowResume(false);
            }}
          >
            Reprendre
          </Button>
          <Button
            w="full"
            variant="ghost"
            color="fg.muted"
            onClick={() => {
              clearSavedIndex(session._id);
              setIndex(0);
              setShowResume(false);
            }}
          >
            Recommencer depuis le début
          </Button>
        </VStack>
      </Box>
    );
  }

  if (showExitConfirm) {
    return overlay(
      <Box
        position="fixed"
        inset={0}
        zIndex={50}
        bg="bg.canvas"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        px={8}
        gap={6}
        textAlign="center"
      >
        <Text fontSize="lg" fontWeight="bold">
          Quitter le mode guidé ?
        </Text>
        <Text fontSize="sm" color="fg.muted">
          {index > 0
            ? 'Ta progression sur cette séance ne sera pas enregistrée.'
            : "Tu n'as pas encore commencé — tu retrouveras la séance telle quelle."}
        </Text>
        <VStack gap={2} w="full" maxW="280px">
          <Button
            w="full"
            bg="app.primary"
            color="bg.canvas"
            fontWeight="bold"
            onClick={confirmExit}
          >
            Quitter
          </Button>
          <Button
            w="full"
            variant="ghost"
            color="fg.muted"
            onClick={() => setShowExitConfirm(false)}
          >
            Continuer la séance
          </Button>
        </VStack>
      </Box>
    );
  }

  const isRest = step.type === 'rest';
  const hasDetail =
    step.type === 'exercise' &&
    (!!step.coachNote?.trim() ||
      !!step.description?.trim() ||
      !!step.videoUrl?.trim());
  const lastLabel =
    step.type === 'exercise'
      ? formatLastPerformance(lastPerformance?.get(step.exerciseId))
      : null;

  const dotColor = (i: number) => {
    if (isRest) {
      return i <= index ? 'bg.canvas' : 'bg.canvas/25';
    }
    if (i < index) return 'session.rest';
    if (i === index) return 'app.primary';
    return 'whiteAlpha.200';
  };

  return overlay(
    <Box
      role="dialog"
      aria-modal="true"
      aria-label="Séance guidée"
      position="fixed"
      inset={0}
      zIndex={50}
      bg={{ base: isRest ? 'session.rest' : 'bg.canvas', md: 'blackAlpha.800' }}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent={{ base: 'stretch', md: 'center' }}
    >
      <Box
        w="full"
        maxW={{ base: 'full', md: '560px' }}
        h={{ base: 'full', md: '90vh' }}
        maxH={{ base: 'full', md: '720px' }}
        bg={isRest ? 'session.rest' : 'bg.canvas'}
        borderRadius={{ base: 0, md: '2xl' }}
        boxShadow={{ md: '0 24px 64px rgba(0,0,0,0.5)' }}
        display="flex"
        flexDirection="column"
        overflow="hidden"
        position="relative"
      >
        <HStack justify="flex-end" p={4}>
          <Button
            variant="ghost"
            size="sm"
            minH="44px"
            onClick={handleExitClick}
            color={isRest ? 'bg.canvas' : 'fg.muted'}
          >
            Quitter
          </Button>
        </HStack>

        <HStack gap={steps.length > 24 ? '2px' : '4px'} px={5} pt={2}>
          {steps.map((_, i) => (
            <Box
              key={i}
              flex={1}
              h="3px"
              borderRadius="full"
              bg={dotColor(i)}
            />
          ))}
        </HStack>

        <VStack
          flex={1}
          justify="center"
          align="center"
          gap={6}
          px={8}
          textAlign="center"
        >
          {step.type === 'exercise' ? (
            <>
              <Text
                fontSize="xs"
                letterSpacing="2px"
                textTransform="uppercase"
                fontWeight="800"
                color="session.work"
              >
                {step.blockLabel}
              </Text>
              {hasDetail ? (
                <Box
                  as="button"
                  aria-label={`Voir la consigne — ${step.exerciseName}`}
                  onClick={() => setShowDetail(true)}
                  css={hitArea(44)}
                  _focusVisible={{
                    outline: '2px solid',
                    outlineColor: 'app.primary',
                    outlineOffset: '4px',
                  }}
                >
                  <HStack gap={2} justify="center" maxW="22ch">
                    <Text fontSize="28px" fontWeight="800">
                      {step.exerciseName}
                    </Text>
                    <Box color="app.primary" flexShrink={0} pt={1}>
                      <LuInfo size={18} />
                    </Box>
                  </HStack>
                </Box>
              ) : (
                <Text fontSize="28px" fontWeight="800" maxW="22ch">
                  {step.exerciseName}
                </Text>
              )}
              {step.setCount && (
                <Text fontSize="sm" fontFamily="mono" color="fg.muted" mt={-4}>
                  Série {step.setIndex} / {step.setCount}
                </Text>
              )}
              {step.workSeconds ? (
                <Countdown
                  key={index}
                  duration={step.workSeconds}
                  color="fg"
                  holdLabel="Temps écoulé"
                />
              ) : (
                <Text
                  fontSize="72px"
                  fontWeight="800"
                  fontFamily="mono"
                  lineHeight="1"
                >
                  {step.metric || '—'}
                </Text>
              )}
              {lastLabel && (
                <Text fontSize="sm" color="fg.muted">
                  la dernière fois&nbsp;: {lastLabel}
                </Text>
              )}
            </>
          ) : (
            <>
              <Text
                fontSize="xs"
                letterSpacing="2px"
                textTransform="uppercase"
                fontWeight="800"
                color="bg.canvas"
              >
                Repos
              </Text>
              <Countdown
                key={index}
                duration={step.duration}
                color="bg.canvas"
                onComplete={goNext}
              />
              {step.nextExerciseName && (
                <Text fontSize="sm" color="bg.canvas" opacity={0.75}>
                  Ensuite : {step.nextExerciseName}
                </Text>
              )}
            </>
          )}
        </VStack>

        {showDetail && step.type === 'exercise' && (
          <Box
            position="absolute"
            inset={0}
            bg="bg.canvas"
            zIndex={1}
            overflowY="auto"
            p={5}
          >
            <HStack justify="space-between" align="flex-start" mb={4}>
              <Text fontSize="xl" fontWeight="800" maxW="20ch">
                {step.exerciseName}
              </Text>
              <Box
                as="button"
                aria-label="Revenir à la séance"
                onClick={() => setShowDetail(false)}
                color="fg.muted"
                flexShrink={0}
                css={hitArea(44)}
              >
                <LuX size={20} />
              </Box>
            </HStack>

            {/* Ce que le coach a écrit pour cette séance passe devant, et se
                reconnaît à la barre ambrée. La technique du mouvement, qui
                vient de la bibliothèque, reste du texte nu en dessous. */}
            {step.coachNote?.trim() && (
              <Box
                p={3}
                bg="whiteAlpha.50"
                borderRadius="md"
                borderLeft="2px solid"
                borderLeftColor="app.primary.border"
                mb={4}
              >
                <Text
                  fontSize="2xs"
                  color="fg.muted"
                  fontWeight="bold"
                  letterSpacing="wide"
                  textTransform="uppercase"
                  mb={1}
                >
                  Consigne du coach
                </Text>
                <Text fontSize="sm" color="fg" whiteSpace="pre-wrap">
                  {step.coachNote}
                </Text>
              </Box>
            )}
            {step.description?.trim() && (
              <>
                {step.coachNote?.trim() && (
                  <Text
                    fontSize="2xs"
                    color="fg.muted"
                    fontWeight="bold"
                    letterSpacing="wide"
                    textTransform="uppercase"
                    mb={1}
                  >
                    Le mouvement
                  </Text>
                )}
                <Text
                  fontSize="sm"
                  color={step.coachNote?.trim() ? 'fg.muted' : 'fg'}
                  whiteSpace="pre-wrap"
                  mb={4}
                >
                  {step.description}
                </Text>
              </>
            )}
            {step.videoUrl?.trim() && <VideoPlayer url={step.videoUrl} />}
          </Box>
        )}

        <HStack p={4} gap={3}>
          <Button
            variant="ghost"
            onClick={goPrev}
            disabled={index === 0}
            flexShrink={0}
            minH="52px"
            color={isRest ? 'bg.canvas' : 'fg.muted'}
          >
            Précédent
          </Button>
          <Button
            flex={1}
            minH="52px"
            bg={isRest ? 'bg.canvas' : 'app.primary'}
            color={isRest ? 'fg' : 'bg.canvas'}
            _hover={{ bg: isRest ? 'bg.canvas' : 'app.primary.hover' }}
            onClick={goNext}
          >
            {isLast ? 'Terminer' : step.type === 'rest' ? 'Passer' : 'Suivant'}
          </Button>
        </HStack>
      </Box>
    </Box>
  );
};
