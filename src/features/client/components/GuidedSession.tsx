import { BlockExercise, PerformedValues, Session } from '@/shared/types';
import { buildGuidedSteps, type GuidedSet } from '../guidedSteps';

import { LastPerformance, performedKey } from '../lastPerformance';
import { Box, HStack, Button, VStack, Text } from '@chakra-ui/react';
import VideoPlayer from '@/shared/components/VideoPlayer';
import { hitArea } from '@/shared/components/hitArea';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuCheck, LuPause, LuX } from 'react-icons/lu';
import { countRecorded, writeProgress, readProgress } from '../sessionProgress';
import { LANDSCAPE } from './guided/media';
import { Timer } from './guided/Timer';
import { playCue, unlockSound } from '../sound';
import { SoundToggle } from './SoundToggle';
import { Opening } from './scene/Opening';
import { Countdown } from './scene/Countdown';
import {
  blockSegments,
  blockMarker,
  blockTitle,
  firstGesture,
  positionLabel,
  rankLabel,
} from '../guided/outline';
import { PauseSheet } from './scene/PauseSheet';
import { SetHero } from './scene/SetHero';
import { RestHero } from './scene/RestHero';
import { LoadStepper } from './scene/LoadStepper';
import {
  formatWeight,
  heaviest,
  loadLegend,
  proposedLoad,
} from '../guided/load';
import { ActionButton } from '@/shared/components/ActionButton';
import { PauseContext } from '../guided/PauseContext';
import { useBackDismiss } from '@/shared/hooks/useBackDismiss';
import { TimedBlock } from './scene/TimedBlock';
import { AmrapBlock } from './scene/AmrapBlock';
import { BlockList } from './guided/BlockList';
import { readSavedIndex, writeSavedIndex } from './guided/progress';

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
  const [segments] = useState(() => blockSegments(steps));
  const [savedIndex] = useState(() =>
    Math.min(readSavedIndex(session._id), Math.max(0, steps.length - 1))
  );
  const [index, setIndex] = useState(0);
  // La pause : une feuille par-dessus la scène, qui reste montée dessous.
  // L'ancienne question de sortie remplaçait la scène tout entière, et
  // démontait donc ses horloges — un tour d'EMOM repartait de zéro quand on
  // répondait « Continuer la séance ».
  const [showPause, setShowPause] = useState(false);
  // Le décompte qui précède la reprise d'un bloc mené par l'horloge : la
  // scène reste figée pendant qu'il compte.
  const [resuming, setResuming] = useState(false);
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
  // La sortie audio s'ouvre à la première touche faite dans la séance. Un
  // navigateur refuse tout son qu'aucun geste n'a autorisé, et le premier
  // bip est déclenché par l'horloge, pas par un doigt : sans cette
  // ouverture, il serait refusé. À l'échelle du document et en capture,
  // parce que la séance se dessine dans plusieurs portails et qu'un seul
  // écouteur doit tous les couvrir.
  useEffect(() => {
    document.addEventListener('click', unlockSound, true);
    document.addEventListener('keydown', unlockSound, true);
    return () => {
      document.removeEventListener('click', unlockSound, true);
      document.removeEventListener('keydown', unlockSound, true);
    };
  }, []);

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
  // Le décompte qui suit « C'est parti ». Une séance reprise n'en a pas :
  // on y revient au milieu d'un bloc, pas à son premier geste.
  const [counting, setCounting] = useState(false);

  // L'heure de départ, posée une fois pour toutes : c'est elle qui permet de
  // dire, à la fin, combien de temps la séance a réellement duré.
  //
  // Elle se pose quand l'ouverture est franchie, pas quand elle s'affiche.
  // Posée au montage, elle faisait d'un simple coup d'œil une séance
  // commencée : on ouvrait pour voir ce qui attendait, on refermait, et
  // l'appareil gardait une séance en cours dont la durée courait déjà.
  useEffect(() => {
    if (showIntro) return;
    if (readProgress(session._id)?.startedAt === undefined) {
      writeProgress(session._id, { startedAt: Date.now() });
    }
  }, [session._id, showIntro]);

  // Le retour du téléphone et la touche Échap ouvrent la pause : ils ne
  // quittent jamais directement. Sur Android, retour est le geste
  // d'annulation universel, et rien ne lui répondait ici — il quittait la
  // page, donc la séance, sans un mot. Une fois la pause ouverte, le même
  // geste la referme ; depuis l'ouverture, il revient à la fiche.
  const sceneActive =
    !showIntro && !showResume && !counting && steps.length > 0;
  useBackDismiss(showIntro, onExit);
  useBackDismiss(sceneActive && !showPause, () => setShowPause(true));
  useBackDismiss(sceneActive && showPause, () => setShowPause(false));
  useEffect(() => {
    if (!sceneActive) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // La consigne d'un exercice est ouverte : Échap la referme d'abord,
      // comme n'importe quelle couche du dessus.
      if (detail) {
        setDetail(null);
        return;
      }
      setShowPause((open) => !open);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sceneActive, detail]);

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

  // Les mouvements qu'on a choisi de passer : leurs séries restent non
  // faites, mais ne se présentent plus comme la suivante.
  const [skipped, setSkipped] = useState<string[]>(
    () => readProgress(session._id)?.skipped ?? []
  );
  const skippedKeys = useMemo(() => new Set(skipped), [skipped]);

  // Les séries dont on a effacé la charge proposée. Sans cela, effacer la
  // charge la faisait reparaître aussitôt — proposée de nouveau, d'après la
  // série d'avant — et une série au poids du corps restait impossible à
  // noter.
  const [declined, setDeclined] = useState<ReadonlySet<string>>(new Set());
  // Les mouvements où l'on a demandé « Noter une charge ».
  const [askedLoad, setAskedLoad] = useState<ReadonlySet<string>>(new Set());
  // Le repos déclenché par « Fait » : il n'a pas d'étape à lui, il
  // appartient à la série qui vient de finir.
  const [rest, setRest] = useState<{
    afterKey: string;
    duration: number;
    /** Les secondes ajoutées par « + 15 s ». */
    bonus: number;
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
   * Le tour d'un EMOM sans limite, tel que son horloge le lit.
   *
   * Un tel bloc n'est qu'une étape — ses tours ne se dénombrent pas — et
   * l'index ne peut donc pas suivre l'horloge comme ailleurs. Sans ce
   * relevé, la pause et la barre du haut annonceraient « tour 1 » pendant
   * tout le bloc.
   */
  const [liveRound, setLiveRound] = useState<number | null>(null);

  /** La ligne du haut, où une scène peut poser une puce — le temps d'un
   * AMRAP. Un état et non une référence : la scène doit être rendue de
   * nouveau quand l'emplacement existe. */
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);

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
  const exerciseKeyOf = (set: { blockOrder: number; exerciseOrder: number }) =>
    performedKey(set.blockOrder, set.exerciseOrder);
  const current = sets.find(
    (e) => !doneKeys.has(e.key) && !skippedKeys.has(exerciseKeyOf(e))
  );
  const blockFinished = sets.length > 0 && !current;
  const doneInBlock = sets.filter((e) => doneKeys.has(e.key)).length;
  // Un AMRAP ne se termine pas en cochant : c'est le client qui décide de
  // s'arrêter, ou l'horloge. Le bouton principal compte, le secondaire sort.
  const isLoop = step?.type === 'block' && step.shape === 'loop';

  const notedOfCurrent = current
    ? performed?.[exerciseKeyOf(current)]?.sets
    : undefined;
  const lastTimeOfCurrent = current
    ? lastPerformance?.get(current.exercise.exercise._id)?.sets
    : undefined;
  const ownNoted = current
    ? notedOfCurrent?.[current.rank - 1]?.weight
    : undefined;
  const currentLoad =
    !current || declined.has(current.key)
      ? undefined
      : (ownNoted ??
        proposedLoad(notedOfCurrent, current.rank, lastTimeOfCurrent));

  /** Écrit la charge d'une série dans ce qui a été noté. */
  const writeLoad = (set: GuidedSet, weight: number | undefined) => {
    if (!onPerformedChange) return;
    const key = exerciseKeyOf(set);
    const noted = [...(performed?.[key]?.sets ?? [])];
    while (noted.length < set.rank) noted.push({});
    noted[set.rank - 1] = { ...noted[set.rank - 1], weight };
    onPerformedChange(key, { sets: noted });
  };

  const changeLoad = (next: number | undefined) => {
    if (!current) return;
    const nextDeclined = new Set(declined);
    if (next === undefined) nextDeclined.add(current.key);
    else nextDeclined.delete(current.key);
    setDeclined(nextDeclined);
    writeLoad(current, next);
  };

  /** Ce qui reste à faire dans le bloc une fois `doneNow` et `skippedNow`
   * pris en compte. */
  const remainsAfter = (doneNow: string[], skippedNow: string[]) =>
    sets.some(
      (e) => !doneNow.includes(e.key) && !skippedNow.includes(exerciseKeyOf(e))
    );

  const markDone = () => {
    if (!current) return;
    // La charge affichée est enregistrée avec la série : c'est celle qu'on a
    // sous les yeux, proposée ou corrigée. Rien n'était noté tant qu'on ne
    // tapait pas dans le champ, et « tes charges sont déjà enregistrées »
    // n'était vrai que pour qui avait tout ressaisi.
    if (ownNoted === undefined && currentLoad !== undefined) {
      writeLoad(current, currentLoad);
    }
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
    if (!remainsAfter(next, skipped) && !isLast) {
      goNext();
      return;
    }

    // Le repos prescrit démarre de lui-même : c'est le geste que le client
    // ferait de toute façon, et l'oublier coûte la série suivante.
    if (current.restAfter) {
      setRest({ afterKey: current.key, duration: current.restAfter, bonus: 0 });
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
    // Refaire une série d'un mouvement qu'on avait passé, c'est revenir sur
    // ce choix : sans cela la série redevenait à faire sans jamais se
    // présenter.
    const undone = sets.find((e) => e.key === key);
    if (undone && skippedKeys.has(exerciseKeyOf(undone))) {
      const unskipped = skipped.filter((k) => k !== exerciseKeyOf(undone));
      setSkipped(unskipped);
      writeProgress(session._id, { skipped: unskipped });
    }
    // Un repos qui appartenait à la série qu'on vient de décocher ne veut
    // plus rien dire.
    if (rest?.afterKey === key) setRest(null);
  };

  /** La dernière série faite de ce bloc, pour « Série précédente ». */
  const lastDoneInBlock = [...done]
    .reverse()
    .find((key) => sets.some((e) => e.key === key));

  const skipExercise = () => {
    if (!current) return;
    const next = [...skipped, exerciseKeyOf(current)];
    setSkipped(next);
    writeProgress(session._id, { skipped: next });
    if (rest) setRest(null);
    if (!remainsAfter(done, next) && !isLast) goNext();
  };

  const goTo = (next: number) => {
    // Quitter le bloc désarme son horloge : en revenant sur un EMOM après le
    // bloc suivant, ou dix minutes plus tard, elle vous attend plutôt que de
    // tourner pendant qu'on cherche sa kettlebell.
    const target = steps[next];
    const blockOrder =
      target && target.type !== 'rest' ? target.block.order : null;
    if (blockOrder !== armedBlock) setArmedBlock(null);
    setLiveRound(null);
    // Deux notes quand on quitte un bloc vers l'avant. Revenir en arrière ne
    // termine rien, et sortir d'un repos entre deux blocs non plus : son
    // horloge a déjà sonné.
    const current = steps[index];
    const leavesBlock =
      next > index &&
      current !== undefined &&
      current.type !== 'rest' &&
      current.block.order !== blockOrder;
    if (leavesBlock) playCue('blockEnd');
    setIndex(next);
    setDetail(null);
    writeSavedIndex(session._id, next);
  };

  const goNext = () => {
    if (isLast) {
      // On n'efface pas ici : le bilan qui suit se nourrit de ce qui vient
      // d'être noté. L'enregistrement part quand la séance part au
      // serveur.
      playCue('sessionEnd');
      onFinish();
      return;
    }
    goTo(index + 1);
  };

  const goPrev = () => goTo(Math.max(0, index - 1));

  // Un tour qui passe, à l'horloge ou d'un geste. Ni bip de fin de bloc ni
  // consigne refermée : on reste dans le même bloc, et une consigne ouverte
  // pendant un EMOM se refermait à chaque minute.
  const goToRound = (blockOrder: number, round: number) => {
    if (step?.type === 'round' && step.rounds === null) {
      setLiveRound(round);
      return;
    }
    const target = steps.findIndex(
      (candidate) =>
        candidate.type === 'round' &&
        candidate.block.order === blockOrder &&
        candidate.round === round
    );
    if (target === -1) return;
    setIndex(target);
    writeSavedIndex(session._id, target);
  };

  // Le premier tour d'un bloc chronométré : « Bloc précédent » part de là,
  // quel que soit le tour affiché.
  const firstRoundIndex = (blockOrder: number): number =>
    steps.findIndex(
      (candidate) =>
        candidate.type === 'round' && candidate.block.order === blockOrder
    );

  // Ce qu'annonce le pied d'un bloc chronométré : « AMRAP 12 · 12 min ».
  const nextBlockLine = (blockOrder: number): string | null => {
    const next = [...session.blocks]
      .sort((a, b) => a.order - b.order)
      .find((block) => block.order > blockOrder);
    return next ? `${blockTitle(next)} · ${blockMarker(next)}` : null;
  };

  // Le dernier tour est tombé : l'écran qui suit le bloc, d'où que l'index
  // en soit — un téléphone verrouillé peut avoir sauté plusieurs tours.
  const finishTimedBlock = (blockOrder: number) => {
    const after = steps.findIndex(
      (candidate, i) =>
        i > index &&
        (candidate.type === 'rest' || candidate.block.order !== blockOrder)
    );
    if (after === -1) {
      playCue('sessionEnd');
      onFinish();
      return;
    }
    goTo(after);
  };

  // Quitter n'efface rien. Sortir pour répondre au téléphone, ou parce
  // qu'un doigt a glissé, ne doit pas coûter la séance : on retrouve sa place
  // et ses charges en revenant.
  const leave = () => onExit();

  // Reprendre. Quand l'horloge mène le bloc et qu'elle tournait, trois
  // secondes d'abord : on ne repart pas au milieu d'un tour le téléphone à
  // la main.
  const resume = () => {
    const clockRuns =
      step !== undefined &&
      step.type !== 'rest' &&
      armedBlock === step.block.order;
    if (clockRuns) {
      setResuming(true);
      return;
    }
    setShowPause(false);
  };

  // Le premier écran du bloc suivant, quand il y en a un : c'est là que mène
  // « Passer ce bloc », d'où que l'on soit dans le bloc courant.
  const currentBlockOrder =
    step && step.type !== 'rest' ? step.block.order : null;
  const nextBlockIndex = steps.findIndex(
    (candidate, i) =>
      i > index &&
      candidate.type !== 'rest' &&
      candidate.block.order !== currentBlockOrder
  );

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

  // L'ouverture, puis trois secondes pour poser le téléphone. Rien de la
  // scène n'est monté pendant ce temps : aucune horloge ne peut tourner
  // derrière un décompte.
  if (showIntro) {
    return overlay(
      <Opening
        session={session}
        onClose={onExit}
        onStart={() => {
          setShowOuverture(false);
          setCounting(true);
        }}
      />
    );
  }

  if (counting && step && step.type !== 'rest') {
    const gesture = firstGesture(step.block, done);
    return overlay(
      <Countdown
        title={gesture.title}
        detail={gesture.detail}
        onDone={() => {
          setCounting(false);
          // « C'est parti » et ses trois secondes valent le « Lancer » d'un
          // premier bloc à horloge — tours chronométrés ou AMRAP : un second
          // décompte, juste derrière, ne ferait que redemander ce qui vient
          // d'être décidé.
          if (step.type === 'round' || isLoop) setArmedBlock(step.block.order);
        }}
      />
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

  const isRest = step.type === 'rest';

  // Écrit une fois, monté à deux endroits selon l'orientation — jamais les
  // deux à la fois. Deux boutons identiques dans l'arbre annonceraient deux
  // sorties à un lecteur d'écran.
  // Le son se coupe là où il s'entend. Monté une fois, à côté de « Quitter »,
  // pour la même raison que lui : deux exemplaires dans l'arbre annonceraient
  // deux réglages à un lecteur d'écran.
  const soundToggle = <SoundToggle color={isRest ? 'bg.canvas' : 'fg.muted'} />;

  const pauseButton = (
    <Box
      as="button"
      // « la séance », pour ne pas se confondre avec l'horloge d'un tour, qui
      // porte déjà « Mettre en pause — 57 s restant » : deux commandes au
      // même nom, l'une figeant tout et l'autre une seule horloge.
      aria-label="Mettre la séance en pause"
      display="grid"
      placeItems="center"
      w="44px"
      h="44px"
      flexShrink={0}
      borderRadius="full"
      bg={isRest ? 'blackAlpha.300' : 'bg.surface'}
      color={isRest ? 'bg.canvas' : 'fg'}
      onClick={() => setShowPause(true)}
    >
      <LuPause size={20} />
    </Box>
  );

  const paused = showPause || resuming;

  // Le geste principal dit ce qu'il coche : une série, un palier, ou un
  // exercice qui n'en a qu'une. « Fait » valait pour les trois, et ne disait
  // pas qu'il en restait.
  const isLadder = step.type === 'block' && step.block.type === 'ladder';
  const singleMovement =
    step.type === 'block' && step.block.exercises.length === 1;
  const doneLabel = !current
    ? ''
    : isLadder
      ? singleMovement
        ? 'Palier fait'
        : 'Fait'
      : current.total > 1
        ? 'Série faite'
        : 'Fait';
  const showLoad =
    !!current &&
    !!onPerformedChange &&
    (askedLoad.has(exerciseKeyOf(current)) ||
      heaviest(lastTimeOfCurrent) !== undefined ||
      heaviest(notedOfCurrent) !== undefined);
  const offerLoad =
    !!current &&
    !!onPerformedChange &&
    (!current.exercise.duration || heaviest(lastTimeOfCurrent) !== undefined);
  // Le même nom que dans les autres écrans du mouvement : « série 2 / 4 ».
  const loadLabel = current
    ? `Poids utilisé, en kilos — ${current.name} ${
        current.total > 1
          ? `${isLadder ? 'palier' : 'série'} ${current.rank} / ${current.total}`
          : ''
      }`
    : '';
  const previousLabel = isLadder
    ? 'Palier précédent'
    : current && current.total > 1
      ? 'Série précédente'
      : 'Exercice précédent';
  const segmentIndex = Math.max(
    0,
    segments.findIndex(
      (segment) =>
        index >= segment.start && index < segment.start + segment.size
    )
  );
  // Un repos n'a pas de bloc à lui : il porte le titre du bloc qu'il
  // termine.
  const titledStep = steps
    .slice(0, index + 1)
    .reverse()
    .find((candidate) => candidate.type !== 'rest');
  // TypeScript déduit de `find` que l'écran trouvé n'est pas un repos.
  const currentTitle = titledStep
    ? blockTitle(titledStep.block)
    : step.blockLabel;
  const position =
    step.type === 'rest'
      ? 'Repos'
      : positionLabel(
          session,
          step.block,
          done,
          step.type === 'round'
            ? {
                rank:
                  step.rounds === null ? (liveRound ?? step.round) : step.round,
                total: step.rounds,
              }
            : undefined
        );

  return overlay(
    <PauseContext.Provider value={paused}>
      <Box
        role="dialog"
        aria-modal="true"
        aria-label="Séance guidée"
        position="fixed"
        inset={0}
        zIndex={50}
        bg={{
          base: isRest ? 'session.rest' : 'bg.canvas',
          md: 'blackAlpha.800',
        }}
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
          // Le fond d'une phase de Tabata se pose derrière la scène : sans
          // contexte d'empilement propre, il passerait aussi derrière le
          // fond de cette carte, donc hors de vue.
          isolation="isolate"
        >
          {/* Le haut de la scène dit dans quel bloc on est — son rang et son
              nom — avec le son et la pause à droite. Il disait « 9 / 12 » :
              un compteur d'écrans, qui annonçait « 9 / 9 » en entrant dans
              un bloc où il restait sept séries. On compte en blocs.

              Posé à plat, cette ligne coûterait un cinquième des 390 px de
              haut : elle disparaît, le titre du bloc se lit dans la scène et
              les deux boutons rejoignent la barre. Un seul exemplaire de
              chaque bouton est monté à la fois. */}
          <HStack
            px={5}
            pt="18px"
            pb={3}
            minH="66px"
            gap={2.5}
            css={{ [LANDSCAPE]: { display: 'none' } }}
          >
            <VStack align="start" gap="6px" flex={1} minW={0}>
              <Text
                fontSize="11px"
                fontWeight="800"
                letterSpacing="0.14em"
                textTransform="uppercase"
                lineHeight="1"
                color={isRest ? 'bg.canvas' : 'fg.muted'}
                opacity={isRest ? 0.75 : 1}
              >
                Bloc {segmentIndex + 1} sur {segments.length}
              </Text>
              <Text
                as="h2"
                fontSize="18px"
                fontWeight="bold"
                lineHeight="1.1"
                lineClamp={1}
                color={isRest ? 'bg.canvas' : 'fg'}
              >
                {currentTitle}
              </Text>
            </VStack>
            {/* La place d'une puce que la scène y pose : le temps d'un
                AMRAP. Vide ailleurs. */}
            <Box ref={setHeaderSlot} display="contents" />
            {soundToggle}
            {pauseButton}
          </HStack>

          <HStack
            gap={3}
            px={5}
            align="center"
            css={{ [LANDSCAPE]: { paddingTop: '10px' } }}
          >
            {/* Un segment par bloc, tous de la même largeur : la barre dit
                « bloc 2 sur 3 », pas la durée de chacun. Fait : sarcelle. En
                cours : ambre, rempli au prorata des séries cochées ou des
                tours passés. Le reste : la piste. */}
            <HStack
              gap="5px"
              flex={1}
              role="progressbar"
              aria-label="Avancement de la séance"
              aria-valuemin={0}
              aria-valuemax={segments.length}
              aria-valuenow={segmentIndex}
              aria-valuetext={`${position} — ${step.blockLabel}`}
            >
              {segments.map((segment, i) => {
                const isDone = i < segmentIndex;
                const isCurrent = i === segmentIndex;
                const part = isDone
                  ? 1
                  : !isCurrent
                    ? 0
                    : sets.length > 0
                      ? doneInBlock / sets.length
                      : (index - segment.start) / segment.size;
                return (
                  <Box
                    key={segment.order}
                    flex={1}
                    h="6px"
                    borderRadius="3px"
                    bg={isRest ? 'bg.canvas/20' : 'bg.surface'}
                    overflow="hidden"
                  >
                    <Box
                      h="100%"
                      borderRadius="3px"
                      w={`${part * 100}%`}
                      bg={
                        isRest
                          ? 'bg.canvas'
                          : isDone
                            ? 'session.rest'
                            : 'app.primary'
                      }
                      transition="width 0.25s"
                      _motionReduce={{ transition: 'none' }}
                    />
                  </Box>
                );
              })}
            </HStack>
            <Box
              display="none"
              flexShrink={0}
              mt={-1}
              css={{ [LANDSCAPE]: { display: 'block' } }}
            >
              <HStack gap={0}>
                {soundToggle}
                {pauseButton}
              </HStack>
            </Box>
          </HStack>

          {step.type === 'block' && step.shape === 'list' ? (
            // Un seul défilement pour la série en cours et le bloc entier :
            // la série se lit en grand, et la liste reste juste en dessous.
            // Le terrain l'avait demandé — « voir toutes les infos d'un
            // coup » — et c'est ce qu'il a validé.
            <VStack
              flex={1}
              minH={0}
              overflowY="auto"
              align="stretch"
              gap={4}
              px={5}
              pt={4}
              pb={2}
            >
              {/* Le nom du bloc est dans le haut de la scène ; il ne se
                  répète ici que téléphone couché, où ce haut disparaît. */}
              <Text
                display="none"
                css={{ [LANDSCAPE]: { display: 'block' } }}
                fontSize="xs"
                letterSpacing="2px"
                textTransform="uppercase"
                fontWeight="800"
                color="session.work"
              >
                {step.blockLabel}
                {step.block.label ? ` · ${step.block.label}` : ''}
              </Text>
              {rest ? (
                <RestHero
                  key={rest.afterKey}
                  duration={rest.duration}
                  bonus={rest.bonus}
                  nextTitle={
                    current
                      ? `${current.name} · ${lowerFirst(
                          rankLabel(step.block, current, step.sets)
                        )}`
                      : ''
                  }
                  nextDetail={
                    current
                      ? [
                          current.dose,
                          currentLoad !== undefined
                            ? `à ${formatWeight(currentLoad)} kg`
                            : '',
                        ]
                          .filter(Boolean)
                          .join(' ')
                      : ''
                  }
                  onDone={() => setRest(null)}
                >
                  {current && showLoad && (
                    <LoadStepper
                      key={current.key}
                      value={currentLoad}
                      onChange={changeLoad}
                      legend={loadLegend(currentLoad, lastTimeOfCurrent)}
                      label={loadLabel}
                    />
                  )}
                </RestHero>
              ) : (
                current && (
                  <SetHero
                    key={current.key}
                    block={step.block}
                    set={current}
                    blockSets={step.sets}
                    doneKeys={doneKeys}
                    load={currentLoad}
                    legend={loadLegend(currentLoad, lastTimeOfCurrent)}
                    showLoad={showLoad}
                    offerLoad={offerLoad}
                    onAskLoad={() =>
                      setAskedLoad(
                        new Set([...askedLoad, exerciseKeyOf(current)])
                      )
                    }
                    onLoadChange={changeLoad}
                    loadLabel={loadLabel}
                    onTimedDone={markDone}
                    onOpenDetail={
                      current.exercise.note?.trim() ||
                      current.exercise.exercise.description?.trim() ||
                      current.exercise.exercise.videoUrl?.trim()
                        ? () => setDetail(current.exercise)
                        : undefined
                    }
                  />
                )
              )}
              <VStack align="stretch" gap={1}>
                <Text fontSize="sm" color="fg.muted">
                  {doneInBlock} sur {step.sets.length} faits dans ce bloc
                </Text>
                <BlockList
                  block={step.block}
                  sets={step.sets}
                  done={doneKeys}
                  current={current}
                  performed={performed}
                  onPerformedChange={onPerformedChange}
                  onOpenDetail={setDetail}
                  onUndo={undoSet}
                />
              </VStack>
            </VStack>
          ) : step.type === 'block' ? (
            <AmrapBlock
              key={step.block.order}
              step={step}
              armed={armedBlock === step.block.order}
              onArm={() => setArmedBlock(step.block.order)}
              rounds={rounds[String(step.block.order)] ?? 0}
              onRoundsChange={(next) =>
                countOneRound(
                  step.block.order,
                  next - (rounds[String(step.block.order)] ?? 0)
                )
              }
              onDone={goNext}
              onPrevious={index > 0 ? goPrev : undefined}
              headerSlot={headerSlot}
              lastPerformance={lastPerformance}
              onOpenDetail={setDetail}
            />
          ) : step.type === 'round' ? (
            <TimedBlock
              key={step.block.order}
              step={step}
              armed={armedBlock === step.block.order}
              onArm={() => setArmedBlock(step.block.order)}
              onRound={(round) => goToRound(step.block.order, round)}
              onFinish={() => finishTimedBlock(step.block.order)}
              onPause={() => setShowPause(true)}
              onPrevious={
                firstRoundIndex(step.block.order) > 0
                  ? () => goTo(firstRoundIndex(step.block.order) - 1)
                  : undefined
              }
              nextBlock={nextBlockLine(step.block.order)}
              lastPerformance={lastPerformance}
              onOpenDetail={setDetail}
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

          {step.type === 'block' && step.shape === 'list' && rest ? (
            // Le repos : rallonger, ou repartir. Aucun bouton ne coche la
            // série suivante pendant qu'on souffle — « Fait » restait là, au
            // même endroit, et se touchait par habitude.
            <HStack
              gap={2.5}
              px={4}
              pt={3}
              pb={3}
              css={{ [LANDSCAPE]: { padding: '6px 12px' } }}
            >
              <ActionButton
                tone="ghost"
                size="xl"
                aria-label="Quinze secondes de repos de plus"
                onClick={() => setRest({ ...rest, bonus: rest.bonus + 15 })}
                css={{ [LANDSCAPE]: { minHeight: '52px' } }}
              >
                + 15 s
              </ActionButton>
              <ActionButton
                tone="soft"
                size="xl"
                flex={1}
                onClick={() => setRest(null)}
                css={{ [LANDSCAPE]: { minHeight: '52px' } }}
              >
                Passer
              </ActionButton>
            </HStack>
          ) : step.type === 'block' && step.shape === 'list' && current ? (
            // Une série : un seul geste principal, en très grand, et deux
            // liens discrets dessous. « Précédent » prenait un tiers de la
            // largeur pour un geste rare, à côté du seul qu'on fait vingt
            // fois par séance.
            <VStack
              align="stretch"
              gap={1}
              px={4}
              pt={3}
              pb={3}
              css={{ [LANDSCAPE]: { padding: '6px 12px', gap: '0' } }}
            >
              <ActionButton
                size="xl"
                w="full"
                onClick={markDone}
                css={{ [LANDSCAPE]: { minHeight: '52px' } }}
              >
                <LuCheck size={22} />
                {doneLabel}
              </ActionButton>
              <HStack justify="space-between" gap={4}>
                {lastDoneInBlock ? (
                  <FooterLink onClick={() => undoSet(lastDoneInBlock)}>
                    {previousLabel}
                  </FooterLink>
                ) : index > 0 ? (
                  <FooterLink onClick={goPrev}>Bloc précédent</FooterLink>
                ) : (
                  <Box />
                )}
                {!isLadder && (
                  <FooterLink onClick={skipExercise}>
                    Passer cet exercice
                  </FooterLink>
                )}
              </HStack>
            </VStack>
          ) : step.type === 'round' || isLoop ? null : (
            <>
              {/* Les cibles gardent leurs 52 px — on ne rétrécit pas ce qu'on
            touche les mains moites. C'est la marge qui cède, pas le
            bouton. */}
              <HStack
                p={4}
                gap={3}
                css={{ [LANDSCAPE]: { padding: '8px 12px' } }}
              >
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
            </>
          )}
        </Box>
      </Box>

      {resuming && step.type !== 'rest' ? (
        <Countdown
          title={currentTitle}
          detail={position}
          onDone={() => {
            setResuming(false);
            setShowPause(false);
          }}
        />
      ) : (
        showPause && (
          <PauseSheet
            position={position}
            onResume={resume}
            onLeave={leave}
            onSkipBlock={
              nextBlockIndex === -1
                ? undefined
                : () => {
                    setShowPause(false);
                    goTo(nextBlockIndex);
                  }
            }
            onFinish={() => {
              setShowPause(false);
              onFinish();
            }}
            onEndBlock={
              step.type === 'round' && step.rounds === null
                ? () => {
                    setShowPause(false);
                    finishTimedBlock(step.block.order);
                  }
                : undefined
            }
          />
        )
      )}
    </PauseContext.Provider>
  );
};

/**
 * Un lien du pied de scène : un geste secondaire, à l'écart du principal.
 *
 * 44 px de haut, réels et non débordants : la zone tactile d'un lien de
 * 13 px serait sinon le lien lui-même.
 */
const FooterLink = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <Box
    as="button"
    minH="44px"
    display="inline-flex"
    alignItems="center"
    fontSize="13px"
    fontWeight="bold"
    color="fg.muted"
    onClick={onClick}
    _hover={{ color: 'fg' }}
  >
    {children}
  </Box>
);

/** « Série 3 sur 4 » au milieu d'une phrase : « série 3 sur 4 ». */
const lowerFirst = (text: string): string =>
  text.charAt(0).toLowerCase() + text.slice(1);
