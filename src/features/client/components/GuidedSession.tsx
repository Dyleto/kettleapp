import { BlockExercise, PerformedValues, Session } from '@/shared/types';
import { buildGuidedSteps } from '../guidedSteps';
import { BlockCard } from '@/features/program/components/BlockCard';
import {
  BLOCK_ACCENT_COLOR,
  blockHasClock,
  getBlockAccent,
  prescribedSetLabels,
  restBetweenSetsOf,
} from '@/features/program/constants';
import { PerformedFields } from './PerformedFields';
import { LastPerformance, performedKey } from '../lastPerformance';
import { Box, HStack, Button, VStack, Text } from '@chakra-ui/react';
import VideoPlayer from '@/shared/components/VideoPlayer';
import { hitArea } from '@/shared/components/hitArea';
import { formatDuration } from '@/shared/utils/duration';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuX } from 'react-icons/lu';
import { countRecorded, writeProgress, readProgress } from '../sessionProgress';
import { LANDSCAPE } from './guided/media';
import { Timer, OnDemandTimer } from './guided/Timer';
import { Round } from './guided/Round';
import { BlockList } from './guided/BlockList';
import {
  readSavedIndex,
  writeSavedIndex,
  splitIntoBlockRuns,
} from './guided/progress';

interface GuidedSessionProps {
  session: Session;
  onExit: () => void;
  onFinish: () => void;
  lastPerformance?: Map<string, LastPerformance>;
  /**
   * Ce qui a déjà été noté, et de quoi y ajouter — le même état que le
   * formulaire de bilan. Retour du terrain : « dommage de ne pas pouvoir
   * noter les charges au fur et à mesure. » On note donc là où l'on est, et
   * le bilan retrouve ce qui a été saisi au lieu de le redemander.
   */
  performed?: Record<string, PerformedValues>;
  onPerformedChange?: (key: string, next: PerformedValues) => void;
}

/**
 * Le mode guidé : l'écran qu'on a devant soi en s'entraînant.
 *
 * Il tient sur un plein écran `inert` posé hors de `#root` — sans quoi
 * quatre tabulations suffisaient à en sortir sans le savoir — et il garde
 * l'écran allumé le temps de la séance.
 *
 * Trois principes dont tout le reste découle :
 *
 *   — un seul bouton principal, toujours au même endroit, et c'est la forme
 *     du bloc qui dit ce qu'il fait ;
 *   — où l'on est et ce qu'on a fait sont deux états distincts, ce qui est
 *     la raison pour laquelle on peut enfin cocher ;
 *   — une sortie existe à chaque écran, parce qu'un geste principal qui
 *     change de sens a déjà emporté celui qu'il remplaçait, trois fois.
 */
export const GuidedSession = ({
  session,
  onExit,
  onFinish,
  lastPerformance,
  performed,
  onPerformedChange,
}: GuidedSessionProps) => {
  const [steps] = useState(() => buildGuidedSteps(session));
  // Les blocs ne changent pas pendant la séance : on les découpe une fois.
  const [blockRuns] = useState(() => splitIntoBlockRuns(steps));
  const [savedIndex] = useState(() =>
    Math.min(readSavedIndex(session._id), Math.max(0, steps.length - 1))
  );
  const [index, setIndex] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  // La consigne du coach est écrite pour ce moment précis — en plein effort,
  // les mains occupées. C'était pourtant le seul contenu de la séance
  // inatteignable depuis le plein écran : il fallait en sortir, et donc perdre
  // sa place, pour aller la lire.
  //
  // Un tour porte plusieurs mouvements : ce qui s'ouvre n'est plus « la
  // consigne de l'écran », c'est celle d'un mouvement nommé.
  const [detail, setDetail] = useState<BlockExercise | null>(null);
  // Proposé, jamais imposé : un client qui veut vraiment recommencer ne doit
  // pas se retrouver prisonnier du milieu de la tentative précédente.
  /**
   * Cette séance a-t-elle déjà été commencée ?
   *
   * La position ne suffit pas à le dire : sur un bloc en liste, cocher des
   * séries ne fait pas avancer l'étape. Quelqu'un qui coche quatre lignes
   * d'échauffement puis ferme l'application a bel et bien commencé, et lui
   * remontrer l'écran d'introduction reviendrait à lui dire qu'il n'a rien
   * fait.
   */
  // L'heure de départ, posée une fois pour toutes : c'est elle qui permet de
  // dire, à la fin, combien de temps la séance a réellement duré.
  useEffect(() => {
    if (readProgress(session._id)?.startedAt === undefined) {
      writeProgress(session._id, { startedAt: Date.now() });
    }
  }, [session._id]);

  const [alreadyStarted] = useState(() => {
    const saved = readProgress(session._id);
    return (saved?.step ?? 0) > 0 || (saved?.done.length ?? 0) > 0;
  });
  const [showResume, setShowResume] = useState(() => alreadyStarted);
  /**
   * L'écran d'introduction n'apparaît qu'au début.
   *
   * Reprendre une séance qu'on a commencée veut dire qu'on sait ce qu'on
   * fait : on ne répète pas le briefing à quelqu'un qui revient de sa
   * douzième série.
   */
  const [showIntro, setShowOuverture] = useState(() => !alreadyStarted);

  /** Ce qui attend le client : un aperçu des blocs, et le total à faire. */
  const blockPreview = useMemo(
    () =>
      steps.reduce<
        { start: number; label: string; color: string; detail: string }[]
      >((acc, step, i) => {
        if (step.type === 'rest') return acc;
        const last = acc[acc.length - 1];
        if (last?.label === step.blockLabel) return acc;
        acc.push({
          start: i,
          label: step.blockLabel,
          color: BLOCK_ACCENT_COLOR[getBlockAccent(step.block.type)],
          detail:
            step.type === 'round'
              ? `${step.rounds} tours`
              : step.shape === 'loop'
                ? `${step.block.durationMinutes ?? '?'} min`
                : `${step.sets.length} exercices`,
        });
        return acc;
      }, []),
    [steps]
  );

  const totalSets = useMemo(
    () =>
      steps.reduce(
        (n, step) =>
          n +
          (step.type === 'round'
            ? 1
            : step.type === 'block'
              ? step.sets.length
              : 0),
        0
      ),
    [steps]
  );
  // Lu une fois, à l'ouverture : c'est l'état précédent qu'on annonce.
  const [keptCount] = useState(() =>
    countRecorded(readProgress(session._id)?.performed ?? {})
  );

  /**
   * Les séries déjà faites, indépendamment de la position.
   *
   * Remonter lire la consigne du mouvement précédent ne doit rien défaire :
   * où l'on est et ce qu'on a fait sont deux choses, et c'est faute de les
   * distinguer que rien ne pouvait être coché.
   */
  const [done, setDone] = useState<string[]>(
    () => readProgress(session._id)?.done ?? []
  );
  const doneKeys = useMemo(() => new Set(done), [done]);
  // Le repos déclenché par « Fait » : il n'a pas d'étape à lui, il
  // appartient à la série qui vient de finir.
  const [rest, setRest] = useState<{
    afterKey: string;
    duration: number;
    nextUp: string;
  } | null>(null);

  /**
   * Le bloc dont l'horloge a été lancée, s'il y en a un.
   *
   * Il vit ici et non dans `Round` parce qu'un tour est remonté à chaque
   * changement de phase : le drapeau doit lui survivre, sans quoi le deuxième
   * tour redemanderait une touche. Quitter le bloc l'efface — en revenant sur
   * un EMOM dix minutes plus tard, l'horloge vous attend de nouveau.
   */
  const [armedBlock, setArmedBlock] = useState<number | null>(null);

  /**
   * Les tours bouclés, par bloc.
   *
   * Un AMRAP ne se coche pas, il se compte — et ce compte est le score de la
   * séance. Le coach du jeu de test le réclame en prose, dans une note libre
   * (« Rythme régulier, viser 5-6 tours »), faute d'un champ pour le
   * recevoir.
   */
  const [rounds, setRounds] = useState<Record<string, number>>(
    () => readProgress(session._id)?.rounds ?? {}
  );

  const countOneRound = (blockOrder: number, delta: number) => {
    const key = String(blockOrder);
    const next = {
      ...rounds,
      // Jamais sous zéro : on corrige un faux doigt, on ne passe pas en
      // négatif.
      [key]: Math.max(0, (rounds[key] ?? 0) + delta),
    };
    setRounds(next);
    writeProgress(session._id, { rounds: next });
    if (delta > 0) navigator.vibrate?.(40);
  };

  const step = steps[index];
  const isLast = index === steps.length - 1;

  // La première non faite : on ne force pas l'ordre, on le suggère.
  const sets = step?.type === 'block' ? step.sets : [];
  const current = sets.find((e) => !doneKeys.has(e.key));
  const blockFinished = sets.length > 0 && !current;
  const doneInBlock = sets.filter((e) => doneKeys.has(e.key)).length;
  // Un AMRAP ne se termine pas en cochant : c'est le client qui décide de
  // s'arrêter, ou l'horloge. Le bouton principal compte, le secondaire sort.
  const isLoop = step?.type === 'block' && step.shape === 'loop';

  const markDone = () => {
    if (!current) return;
    const next = [...done, current.key];
    setDone(next);
    writeProgress(session._id, { done: next });
    navigator.vibrate?.(40);

    // La dernière série d'un bloc en liste ne laisse rien à faire.
    //
    // Le bloc restait là, toutes ses lignes cochées, à attendre une touche sur
    // « Bloc suivant » qui ne disait rien que l'écran ne disait déjà. Un
    // cul-de-sac entre deux blocs, et un geste de plus au milieu d'une séance.
    // Cocher la dernière série EST passer au suivant.
    //
    // Seulement quand il y a où aller. Au dernier bloc de la séance,
    // « Terminer » reste un acte délibéré : finir une séance est une décision,
    // pas l'effet de bord d'une case cochée.
    if (next.length === sets.length && !isLast) {
      goNext();
      return;
    }

    // Le repos prescrit démarre de lui-même : c'est le geste que le client
    // ferait de toute façon, et l'oublier coûte la série suivante.
    if (current.restAfter) {
      const after = sets[sets.indexOf(current) + 1];
      setRest({
        afterKey: current.key,
        duration: current.restAfter,
        nextUp: after ? `${after.name} · ${after.dose}` : '',
      });
    }
  };

  /**
   * Une série redevient quelque chose à faire.
   *
   * Le curseur suit tout seul : c'est la première série non faite, donc en
   * décocher une qui la précède la ramène devant. Rien d'autre n'a à bouger —
   * c'est tout le bénéfice d'un état qui n'est pas un index.
   *
   * La charge reste. Refaire une série n'est pas oublier ce qu'on y a
   * soulevé, et elle est écrasée dès qu'on saisit autre chose.
   */
  const undoSet = (key: string) => {
    const next = done.filter((k) => k !== key);
    setDone(next);
    writeProgress(session._id, { done: next });
    // Un repos qui appartenait à la série qu'on vient de décocher ne veut
    // plus rien dire.
    if (rest?.afterKey === key) setRest(null);
  };

  const goTo = (next: number) => {
    // Quitter le bloc désarme son horloge : en revenant sur un EMOM après le
    // bloc suivant, ou dix minutes plus tard, elle vous attend plutôt que de
    // tourner pendant qu'on cherche sa kettlebell.
    const target = steps[next];
    const blockOrder =
      target && target.type !== 'rest' ? target.block.order : null;
    if (blockOrder !== armedBlock) setArmedBlock(null);
    setIndex(next);
    setDetail(null);
    writeSavedIndex(session._id, next);
  };

  const goNext = () => {
    if (isLast) {
      // On n'efface pas ici : le bilan qui suit se nourrit de ce qui vient
      // d'être noté. L'enregistrement part quand la séance part au
      // serveur.
      onFinish();
      return;
    }
    goTo(index + 1);
  };

  const goPrev = () => goTo(Math.max(0, index - 1));

  // On demande toujours. À la première étape il n'y a rien à perdre, mais
  // on vient d'entrer dans un plein écran : en sortir sans un mot sur un faux
  // doigt, c'est voir disparaître la séance qu'on croyait avoir commencée.
  const handleExitClick = () => setShowExitConfirm(true);

  // Quitter n'efface plus rien. Sortir pour répondre au téléphone, ou parce
  // qu'un doigt a glissé, ne doit pas coûter la séance : on retrouve sa place
  // et ses charges en revenant. Pour repartir de zéro, l'écran de reprise
  // propose « Recommencer depuis le début ».
  const confirmExit = () => onExit();

  // Le plein écran se posait par-dessus la page sans la neutraliser :
  // quatre tabulations suffisaient à en sortir, on atterrissait dans la barre
  // d'onglets et sur les boutons de la séance en dessous, et un lecteur
  // d'écran annonçait encore toute la page. `inert` retire d'un coup le
  // focus, le pointeur et l'arbre d'accessibilité à tout ce qui n'est pas la
  // séance guidée.
  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    root.setAttribute('inert', '');
    return () => root.removeAttribute('inert');
  }, []);

  // … ce qui oblige à sortir la séance elle-même de `#root`, sans quoi elle
  // se neutraliserait avec le reste.
  const overlay = (node: React.ReactNode) => createPortal(node, document.body);

  // Garde l'écran allumé pendant toute la séance guidée : sans cela il
  // s'éteint entre deux exercices et il faut le déverrouiller les mains
  // moites.
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
        // Refusé ou indisponible (écran non actif, permissions…) : tant pis.
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
        role="dialog"
        aria-modal="true"
        aria-label="Aucun exercice à suivre"
        position="fixed"
        inset={0}
        zIndex={50}
        bg="bg.canvas"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="safe center"
        overflowY="auto"
        py={6}
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

  // L'écran d'introduction.
  //
  // La note que le coach a écrite pour cette séance-là était inatteignable
  // depuis le mode guidé : s'il écrivait « aujourd'hui on garde 2 reps en
  // réserve sur tout », le client ne pouvait pas la relire en plein effort.
  // Elle ouvre donc le parcours — on lit le briefing au moment où il sert,
  // avant de commencer.
  //
  // C'est aussi le seul endroit qui rappelle qu'un humain a écrit cette
  // séance. Aucune application de fitness générique ne peut en dire autant, et
  // le mode guidé ne s'en servait nulle part.
  if (showIntro) {
    return overlay(
      <Box
        role="dialog"
        aria-modal="true"
        aria-label="Avant de commencer"
        position="fixed"
        inset={0}
        zIndex={50}
        bg="bg.canvas"
        display="flex"
        flexDirection="column"
      >
        <HStack justify="flex-end" p={4}>
          <Button
            variant="ghost"
            size="sm"
            minH="44px"
            onClick={onExit}
            color="fg.muted"
          >
            Quitter
          </Button>
        </HStack>

        {/* `flex: 1` sans `min-height: 0` ne rétrécit jamais sous son
            contenu : sur un écran posé à plat, le corps poussait
            « Commencer » hors de l'écran — le bouton existait, figurait dans
            l'arbre, et ne pouvait pas être touché. `safe center` centre tant
            qu'il y a la place et se rabat en haut quand il n'y en a plus, au
            lieu de couper des deux côtés. */}
        <VStack
          flex={1}
          minH={0}
          overflowY="auto"
          justifyContent="safe center"
          align="stretch"
          gap={7}
          px={7}
          pb={6}
        >
          <VStack align="start" gap={1.5}>
            <Text
              fontSize="xs"
              fontWeight="800"
              letterSpacing="2px"
              color="fg.muted"
            >
              SÉANCE {session.order}
            </Text>
            {session.name?.trim() && (
              <Text fontSize="3xl" fontWeight="800" lineHeight="1.15">
                {session.name.trim()}
              </Text>
            )}
            {/* Ce qui attend le client, avant qu'il ne s'engage. Aucun écran
                ne le disait : on commençait sans savoir si c'était dix minutes
                ou quarante. */}
            <Text fontSize="sm" color="fg.muted">
              {session.blocks.length} bloc
              {session.blocks.length > 1 ? 's' : ''} · {totalSets} exercice
              {totalSets > 1 ? 's' : ''}
            </Text>
          </VStack>

          {session.notes?.trim() && (
            <Box
              bg="surface.card"
              borderLeftWidth="3px"
              borderLeftColor="app.primary"
              borderRadius="lg"
              p={4}
            >
              <Text fontSize="xs" color="fg.muted" mb={2}>
                Ton coach te dit&nbsp;:
              </Text>
              <Text fontSize="lg" lineHeight="1.5" whiteSpace="pre-wrap">
                {session.notes}
              </Text>
            </Box>
          )}

          <VStack align="stretch" gap={2.5}>
            {blockPreview.map((b) => (
              <HStack key={b.start} gap={3}>
                <Box
                  w="10px"
                  h="10px"
                  borderRadius="sm"
                  bg={b.color}
                  flexShrink={0}
                />
                <Text fontSize="sm" flex={1} minW={0} lineClamp={1}>
                  {b.label}
                </Text>
                <Text
                  fontSize="xs"
                  color="fg.muted"
                  fontFamily="mono"
                  flexShrink={0}
                >
                  {b.detail}
                </Text>
              </HStack>
            ))}
          </VStack>
        </VStack>

        <Box p={4}>
          <Button
            w="full"
            minH="56px"
            bg="app.primary"
            color="bg.canvas"
            fontWeight="bold"
            fontSize="lg"
            _hover={{ bg: 'app.primary.hover' }}
            onClick={() => setShowOuverture(false)}
          >
            Commencer
          </Button>
        </Box>
      </Box>
    );
  }

  if (showResume) {
    return overlay(
      <Box
        role="dialog"
        aria-modal="true"
        aria-label="Reprendre où tu en étais ?"
        position="fixed"
        inset={0}
        zIndex={50}
        bg="bg.canvas"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="safe center"
        overflowY="auto"
        py={6}
        px={8}
        gap={6}
        textAlign="center"
      >
        <Text fontSize="lg" fontWeight="bold">
          Reprendre où tu en étais&nbsp;?
        </Text>
        <Text fontSize="sm" color="fg.muted">
          Tu t'étais arrêté à l'étape {savedIndex + 1} sur {steps.length}.
          {/* Le dire explicitement : quelqu'un qui a noté ses charges puis
              fermé l'application n'a aucun moyen de savoir ce qui l'attend, et
              « Recommencer » devient un pari. */}
          {keptCount > 0 &&
            ` Tes charges sur ${keptCount} exercice${
              keptCount > 1 ? 's' : ''
            } sont gardées.`}
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
              // Tout ce qui dit « où j'en suis » repart à zéro : l'étape, les
              // séries cochées, les tours comptés.
              //
              // Réinitialiser la seule étape ne suffisait pas — et sur un
              // bloc en liste cela ne faisait rien du tout, un tel bloc étant
              // une étape unique : on « recommençait » un chipper en gardant
              // ses trois mouvements cochés. C'est un reste d'une époque où
              // l'étape était la seule notion de position ; depuis, ce sont
              // les séries qui la portent.
              //
              // Les charges, elles, restent. Effacer ce que quelqu'un a
              // soulevé parce qu'il reprend la séance du début serait
              // exactement la perte qu'on venait de corriger — et elles sont
              // écrasées au fur et à mesure.
              writeProgress(session._id, { step: 0, done: [], rounds: {} });
              setDone([]);
              setRounds({});
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
        role="dialog"
        aria-modal="true"
        aria-label="Quitter le mode guidé ?"
        position="fixed"
        inset={0}
        zIndex={50}
        bg="bg.canvas"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="safe center"
        overflowY="auto"
        py={6}
        px={8}
        gap={6}
        textAlign="center"
      >
        <Text fontSize="lg" fontWeight="bold">
          Quitter le mode guidé ?
        </Text>
        <Text fontSize="sm" color="fg.muted">
          {/* Ce message annonçait une perte qui n'a plus lieu — et qui,
              quand elle avait lieu, était pire qu'il ne le laissait entendre :
              les charges partaient avec. */}
          {index > 0
            ? 'Tu retrouveras ta séance là où tu la laisses, charges comprises.'
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

  // Écrit une fois, monté à deux endroits selon l'orientation — jamais les
  // deux à la fois. Deux boutons identiques dans l'arbre annonceraient deux
  // sorties à un lecteur d'écran.
  const quitButton = (
    <Button
      variant="ghost"
      size="sm"
      minH="44px"
      onClick={handleExitClick}
      color={isRest ? 'bg.canvas' : 'fg.muted'}
    >
      Quitter
    </Button>
  );

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
      // Un iPhone posé à plat fait 844 px de large : il franchit le seuil `md`
      // et recevait la mise en page de bureau — une carte flottante de 560 px
      // sur un fond assombri, haute comme 90 % d'un écran qui n'a déjà pas
      // beaucoup de hauteur. Le seuil regarde la largeur ; ici c'est la
      // hauteur qui décide.
      css={{
        [LANDSCAPE]: { justifyContent: 'stretch', background: 'transparent' },
      }}
    >
      <Box
        w="full"
        maxW={{ base: 'full', md: '560px' }}
        h={{ base: 'full', md: '90vh' }}
        maxH={{ base: 'full', md: '720px' }}
        css={{
          [LANDSCAPE]: {
            maxWidth: '100%',
            height: '100%',
            maxHeight: '100%',
            borderRadius: 0,
            boxShadow: 'none',
          },
        }}
        bg={isRest ? 'session.rest' : 'bg.canvas'}
        borderRadius={{ base: 0, md: '2xl' }}
        boxShadow={{ md: '0 24px 64px rgba(0,0,0,0.5)' }}
        display="flex"
        flexDirection="column"
        overflow="hidden"
        position="relative"
      >
        {/* En portrait, « Quitter » a sa propre ligne : c'est la maquette
            validée, et elle ne change pas. Posé à plat, cette ligne coûte
            76 px sur 390 — un cinquième de l'écran pour un mot — le bouton
            rejoint donc la barre de progression, qui a de la largeur à
            revendre. Un seul des deux est monté à la fois : l'autre est retiré
            de l'arbre, pas seulement masqué. */}
        <HStack
          justify="flex-end"
          p={4}
          css={{ [LANDSCAPE]: { display: 'none' } }}
        >
          {quitButton}
        </HStack>

        <HStack gap={3} px={5} pt={2} align="center">
          <HStack
            gap={1.5}
            flex={1}
            role="progressbar"
            aria-label="Avancement de la séance"
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-valuenow={index + 1}
            aria-valuetext={`Étape ${index + 1} sur ${steps.length} — ${step.blockLabel}`}
          >
            {blockRuns.map((block) => {
              const isCurrent =
                index >= block.start && index < block.start + block.size;
              // Ce qu'on a derrière soi dans ce bloc, entre 0 et 1.
              //
              // Le nombre d'étapes ne suffit plus : un bloc en liste n'en fait
              // qu'une, donc le remplissage sautait de rien à tout pendant
              // qu'on y coche sept séries. Quand le bloc courant a des séries,
              // ce sont elles qui parlent.
              const part =
                isCurrent && sets.length > 0
                  ? doneInBlock / sets.length
                  : Math.max(0, Math.min(block.size, index - block.start)) /
                    block.size;
              return (
                <Box
                  key={`${block.label}-${block.start}`}
                  flex={block.weight}
                  // Proportionnel, mais jamais au point de disparaître : un
                  // échauffement de deux pages dans une séance de trente-cinq
                  // se réduirait à un point.
                  minW="20px"
                  h="4px"
                  borderRadius="full"
                  // La piste du bloc courant est légèrement plus claire : à la
                  // première étape d'un bloc, le remplissage est nul et rien
                  // d'autre ne dirait où l'on est.
                  bg={
                    isRest
                      ? isCurrent
                        ? 'bg.canvas/40'
                        : 'bg.canvas/20'
                      : isCurrent
                        ? 'whiteAlpha.400'
                        : 'whiteAlpha.200'
                  }
                  overflow="hidden"
                >
                  <Box
                    h="100%"
                    borderRadius="full"
                    w={`${part * 100}%`}
                    bg={
                      isRest
                        ? 'bg.canvas'
                        : isCurrent
                          ? 'app.primary'
                          : 'session.rest'
                    }
                    transition="width 0.25s"
                  />
                </Box>
              );
            })}
          </HStack>
          <Text
            fontSize="xs"
            fontFamily="mono"
            flexShrink={0}
            color={isRest ? 'bg.canvas' : 'fg.muted'}
            opacity={isRest ? 0.75 : 1}
            aria-hidden="true"
          >
            {index + 1} / {steps.length}
          </Text>
          <Box
            display="none"
            flexShrink={0}
            mt={-1}
            css={{ [LANDSCAPE]: { display: 'block' } }}
          >
            {quitButton}
          </Box>
        </HStack>

        {step.type === 'block' && step.shape === 'list' ? (
          <>
            <VStack align="stretch" gap={0.5} px={5} pt={4} pb={1}>
              <Text
                fontSize="xs"
                letterSpacing="2px"
                textTransform="uppercase"
                fontWeight="800"
                color="session.work"
              >
                {step.blockLabel}
                {step.block.label ? ` · ${step.block.label}` : ''}
              </Text>
              <HStack justify="space-between" align="center" gap={3}>
                <Text fontSize="sm" color="fg.muted">
                  {doneInBlock} sur {step.sets.length} faits dans ce bloc
                </Text>
                {/* Le passage.
                    « Suivant » le portait sans le dire, et le remplacer par
                    « Fait » l'a retiré sans qu'on le remarque : on restait
                    bloqué sur un échauffement tant que ses deux lignes
                    n'étaient pas cochées. Un client saute un mouvement, change
                    d'avis, arrive en retard — il doit pouvoir passer.

                    Discret et à l'écart du geste principal : c'est une sortie
                    de secours, pas une invitation. */}
                <Box
                  as="button"
                  onClick={goNext}
                  color="fg.muted"
                  fontSize="sm"
                  flexShrink={0}
                  css={hitArea(44)}
                  _hover={{ color: 'fg' }}
                >
                  {/* Au dernier bloc, « passer » ne veut rien dire : il n'y a rien
                      après. Mais la sortie doit exister quand même — elle y
                      était cachée, et il fallait cocher les sept paliers d'une
                      pyramide pour gagner le droit de terminer. */}
                  {isLast ? 'Terminer la séance' : 'Passer ce bloc'}
                </Box>
              </HStack>
            </VStack>
            <BlockList
              block={step.block}
              sets={step.sets}
              done={doneKeys}
              current={current}
              performed={performed}
              onPerformedChange={onPerformedChange}
              lastPerformance={lastPerformance}
              onOpenDetail={setDetail}
              rest={rest}
              onRestDone={() => setRest(null)}
              onUndo={undoSet}
            />
          </>
        ) : step.type === 'block' ? (
          /*
           * Un bloc entier, lu d'un coup.
           *
           * C'est la carte de la fiche de séance — celle que le client lit
           * avant de commencer — posée ici sans changement. Un seul rendu pour
           * les deux écrans : ce qu'il a mémorisé en se préparant, il le
           * retrouve pendant. Consignes et vidéos s'y déplient déjà, ligne par
           * ligne, ce que le plein écran ne savait faire que pour le seul
           * exercice affiché.
           */
          <VStack
            flex={1}
            align="stretch"
            gap={5}
            px={5}
            py={2}
            overflowY="auto"
          >
            {/* La sortie, ici aussi.
                Sur une boucle, le bouton principal compte les tours : rien
                d'autre ne terminerait la séance sans cela. Le troisième
                endroit où un geste principal qui change de sens a emporté
                celui qu'il remplaçait. */}
            {step.shape === 'loop' && (
              <HStack justify="flex-end">
                <Box
                  as="button"
                  onClick={goNext}
                  color="fg.muted"
                  fontSize="sm"
                  css={hitArea(44)}
                  _hover={{ color: 'fg' }}
                >
                  {isLast ? 'Terminer la séance' : 'Passer ce bloc'}
                </Box>
              </HStack>
            )}
            {/* L'horloge d'un bloc chronométré : dans un AMRAP, c'est elle qui
                dit quand s'arrêter. Plus petite qu'en plein écran — on est
                venu lire la liste, pas l'horloge. */}
            {blockHasClock(step.block.type) && step.block.durationMinutes ? (
              <Timer
                key={index}
                duration={step.block.durationMinutes * 60}
                color="fg"
                holdLabel="Temps écoulé"
                // Pas le nom du bloc : la carte juste en dessous le porte déjà,
                // et l'écran le disait deux fois. Ce qui manquait, c'est ce
                // que l'horloge mesure — un AMRAP s'arrête à zéro.
                title={
                  <Text
                    fontSize="xs"
                    letterSpacing="2px"
                    textTransform="uppercase"
                    fontWeight="800"
                    color="fg.muted"
                  >
                    Temps restant
                  </Text>
                }
                compact
              />
            ) : null}
            {/* Le compteur de tours.
                C'est le score de la séance, et il n'avait aucune place : ni à
                l'écran ni dans le modèle. Le client le gardait en tête ou sur
                un carnet. En grand, sous l'horloge, et à côté du bouton qui
                l'incrémente — on le tape à bout de souffle. */}
            {step.shape === 'loop' && (
              <HStack justify="space-between" align="center" gap={4}>
                <HStack align="baseline" gap={2}>
                  <Text
                    fontSize="54px"
                    fontWeight="800"
                    lineHeight="1"
                    color="app.primary"
                    fontVariantNumeric="tabular-nums"
                  >
                    {rounds[String(step.block.order)] ?? 0}
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    tour{(rounds[String(step.block.order)] ?? 0) > 1 ? 's' : ''}
                    &nbsp;bouclé
                    {(rounds[String(step.block.order)] ?? 0) > 1 ? 's' : ''}
                  </Text>
                </HStack>
                {/* Redescendre doit rester possible — un doigt glisse, et perdre
                    un tour qu'on a fait est pire que d'en compter un de trop.
                    Discret : ce n'est pas le geste qu'on répète. */}
                {(rounds[String(step.block.order)] ?? 0) > 0 && (
                  <Box
                    as="button"
                    aria-label="Retirer un tour"
                    onClick={() => countOneRound(step.block.order, -1)}
                    color="fg.muted"
                    fontSize="sm"
                    css={hitArea(44)}
                    _hover={{ color: 'fg' }}
                  >
                    − 1
                  </Box>
                )}
              </HStack>
            )}
            <BlockCard
              block={step.block}
              renderExerciseExtra={({ blockOrder, exerciseOrder }) => {
                const prescribed = step.block.exercises.find(
                  (e) => e.order === exerciseOrder
                );
                if (!prescribed) return null;
                const key = performedKey(blockOrder, exerciseOrder);
                const rest = restBetweenSetsOf(step.block, prescribed);
                return (
                  <>
                    {performed && onPerformedChange && (
                      <PerformedFields
                        value={performed[key] ?? { sets: [] }}
                        onChange={(next) => onPerformedChange(key, next)}
                        setLabels={prescribedSetLabels(step.block, prescribed)}
                        isTimed={prescribed.duration !== undefined}
                      />
                    )}
                    {/* Le travail chronométré d'abord, le repos ensuite : c'est
                        l'ordre dans lequel on les vit. */}
                    {prescribed.duration ? (
                      <OnDemandTimer
                        duration={prescribed.duration}
                        label={formatDuration(prescribed.duration)}
                        color="app.primary"
                      />
                    ) : null}
                    {rest ? (
                      <OnDemandTimer
                        duration={rest}
                        label={`rest ${formatDuration(rest)}`}
                        color="session.rest"
                      />
                    ) : null}
                  </>
                );
              }}
            />
          </VStack>
        ) : step.type === 'round' ? (
          <Round
            step={step}
            onDone={goNext}
            lastPerformance={lastPerformance}
            onOpenDetail={setDetail}
            armed={armedBlock === step.block.order}
            onArm={() => setArmedBlock(step.block.order)}
          />
        ) : (
          <VStack
            flex={1}
            justify="center"
            align="center"
            gap={6}
            px={8}
            textAlign="center"
          >
            <Timer
              key={index}
              duration={step.duration}
              color="bg.canvas"
              // Le fond est ici la couleur du repos : une piste claire y
              // disparaîtrait. C'est le seul écran où la jauge s'inverse.
              track="blackAlpha.400"
              onComplete={goNext}
              title={
                <Text
                  fontSize="xs"
                  letterSpacing="2px"
                  textTransform="uppercase"
                  fontWeight="800"
                  color="bg.canvas"
                >
                  Repos
                </Text>
              }
            />
            {step.nextExerciseName && (
              <Text fontSize="sm" color="bg.canvas" opacity={0.75}>
                Ensuite : {step.nextExerciseName}
              </Text>
            )}
          </VStack>
        )}

        {detail && (
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
                {detail.exercise.name}
              </Text>
              <Box
                as="button"
                aria-label="Revenir à la séance"
                onClick={() => setDetail(null)}
                color="fg.muted"
                flexShrink={0}
                css={hitArea(44)}
              >
                <LuX size={20} />
              </Box>
            </HStack>

            {/* Ce que le coach a écrit pour cette séance vient en premier,
                reconnaissable à la barre ambre. La technique du mouvement, qui
                vient de la bibliothèque, reste du texte simple en dessous. */}
            {detail.note?.trim() && (
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
                  {detail.note}
                </Text>
              </Box>
            )}
            {detail.exercise.description?.trim() && (
              <>
                {detail.note?.trim() && (
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
                  color={detail.note?.trim() ? 'fg.muted' : 'fg'}
                  whiteSpace="pre-wrap"
                  mb={4}
                >
                  {detail.exercise.description}
                </Text>
              </>
            )}
            {detail.exercise.videoUrl?.trim() && (
              <VideoPlayer url={detail.exercise.videoUrl} />
            )}
          </Box>
        )}

        {/* Les cibles gardent leurs 52 px — on ne rétrécit pas ce qu'on
            touche les mains moites. C'est la marge qui cède, pas le
            bouton. */}
        <HStack p={4} gap={3} css={{ [LANDSCAPE]: { padding: '8px 12px' } }}>
          {/* Un contour, comme celui de « J'ai terminé cette séance ». Du
              texte gris sans cadre, à côté d'un « Suivant » ambre plein deux
              fois plus large, se lit « indisponible » : le contraste était
              conforme, la hiérarchie mentait. Secondaire et indisponible
              doivent rester deux choses distinctes — le bouton porte donc son
              cadre, et ne s'efface vraiment qu'à la première étape, où il est
              réellement désactivé. */}
          <Button
            variant="outline"
            borderColor={isRest ? 'blackAlpha.400' : 'whiteAlpha.300'}
            onClick={goPrev}
            disabled={index === 0}
            flexShrink={0}
            minH="52px"
            color={isRest ? 'bg.canvas' : 'fg'}
          >
            Précédent
          </Button>
          {/* Un seul bouton principal, toujours au même endroit, et la forme
              du bloc dit ce qu'il fait : « Fait » tant qu'il reste une série à
              cocher, puis passer. Le client n'a jamais à choisir où
              appuyer. */}
          <Button
            flex={1}
            minH="52px"
            bg={isRest ? 'bg.canvas' : 'app.primary'}
            color={isRest ? 'fg' : 'bg.canvas'}
            _hover={{ bg: isRest ? 'bg.canvas' : 'app.primary.hover' }}
            onClick={
              isLoop && step.type === 'block'
                ? () => countOneRound(step.block.order, 1)
                : current
                  ? markDone
                  : goNext
            }
          >
            {isLoop
              ? '+1 tour'
              : current
                ? 'Fait'
                : isLast
                  ? 'Terminer'
                  : blockFinished
                    ? 'Bloc suivant'
                    : step.type === 'rest'
                      ? 'Passer'
                      : 'Suivant'}
          </Button>
        </HStack>
      </Box>
    </Box>
  );
};
