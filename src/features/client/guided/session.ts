import type { BlockExercise } from '@/shared/types';
import type { GuidedSet } from '@/domain/session/sets';
import { performedKey } from '@/domain/history/lastPerformance';
import type { BlockSegment } from './outline';
import type { GuidedStep } from './steps';
import type { SessionProgress } from './sessionProgress';

/**
 * L'état d'une séance guidée, et tout ce qui le fait changer.
 *
 * Il vivait dans quatorze `useState` d'un composant de 1 523 lignes, et
 * chaque geste en touchait trois ou quatre à la main : cocher la dernière
 * série d'un bloc écrivait les séries faites, les enregistrait, faisait
 * vibrer, passait au bloc suivant, désarmait son horloge, jouait deux notes
 * et enregistrait l'étape. Rien de cela ne se vérifiait sans navigateur.
 *
 * Ici, une action entre et une transition sort : l'état suivant, ce qu'il
 * faut enregistrer sur l'appareil, et ce qu'il faut faire au monde — vibrer,
 * sonner, rendre la main. Le composant applique ; il ne décide plus.
 */

/** Ce qu'une transition demande au monde, dans cet ordre. */
export type GuidedSignal =
  /** Une série cochée, un tour compté : une vibration brève. */
  | 'vibrate'
  /** On quitte un bloc vers l'avant : ses deux notes. */
  | 'blockEnd'
  /** La séance arrive à son terme : sa note. */
  | 'sessionEnd'
  /** Rendre la main à l'écran de fin. */
  | 'finish';

/**
 * Où en est l'écran, avant la scène elle-même.
 *
 * Il y avait une phase de plus : la question « Reprendre où tu en étais ? ».
 * Elle se posait à qui venait de toucher « Reprendre » sur la fiche — on
 * redemandait ce qu'on venait de répondre. La reprise se décide sur
 * l'accueil, qui porte aussi « Recommencer depuis le début ».
 */
export type GuidedPhase = 'empty' | 'opening' | 'counting' | 'scene';

/** Le repos déclenché par « Série faite » : il appartient à la série qui
 * vient de finir, et n'a pas d'étape à lui. */
export interface SetRest {
  afterKey: string;
  duration: number;
  /** Les secondes ajoutées par « + 15 s », au total. */
  bonus: number;
}

/**
 * La pause : une feuille par-dessus la scène, qui reste montée dessous.
 *
 * `resuming` est le décompte qui précède la reprise d'un bloc mené par
 * l'horloge : la feuille est partie, la scène est encore figée.
 */
export type PauseState = 'closed' | 'open' | 'resuming';

export interface GuidedState {
  /** Découpées une fois : les blocs ne changent pas pendant la séance. */
  steps: GuidedStep[];
  phase: GuidedPhase;
  index: number;
  /**
   * La séance reprend là où elle avait été quittée : le haut le dit trois
   * secondes, « Reprise au bloc 2 », le temps de retrouver où l'on est.
   */
  resumed: boolean;
  /**
   * Les séries faites, indépendamment de la position.
   *
   * Remonter lire la consigne du mouvement précédent ne doit rien défaire :
   * où l'on est et ce qu'on a fait sont deux choses, et c'est faute de les
   * distinguer que rien ne pouvait être coché.
   */
  done: string[];
  /** Les mouvements passés : leurs séries restent à faire, mais ne se
   * présentent plus comme la suivante. */
  skipped: string[];
  /**
   * Les tours bouclés, par bloc. Un AMRAP ne se coche pas, il se compte, et
   * ce compte est le score de la séance.
   */
  rounds: Record<string, number>;
  rest: SetRest | null;
  /**
   * Le bloc dont l'horloge a été lancée.
   *
   * Il survit aux tours, qui sont remontés à chaque changement de phase —
   * sans quoi le deuxième tour redemanderait une touche. Quitter le bloc
   * l'efface : en revenant sur un EMOM dix minutes plus tard, l'horloge
   * attend de nouveau.
   */
  armedBlock: number | null;
  /**
   * Le tour d'un EMOM sans limite, tel que son horloge le lit. Un tel bloc
   * n'est qu'une étape : sans ce relevé, la pause et la barre du haut
   * annonceraient « tour 1 » pendant tout le bloc.
   */
  liveRound: number | null;
  pause: PauseState;
  /**
   * La consigne ouverte. Un tour porte plusieurs mouvements : ce qui s'ouvre
   * est la consigne d'un mouvement nommé, pas celle de l'écran.
   */
  detail: BlockExercise | null;
  /**
   * Les séries dont on a effacé la charge proposée. Sans cela, effacer la
   * charge la faisait reparaître aussitôt — proposée de nouveau d'après la
   * série d'avant — et une série au poids du corps restait impossible à
   * noter.
   */
  declined: string[];
  /** Les mouvements où l'on a demandé « Noter une charge ». */
  askedLoad: string[];
}

/** Ce qu'une transition écrit sur l'appareil. Les charges n'en sont pas :
 * elles passent par l'écran de la séance, qui les tient pour le bilan. */
export type ProgressPatch = Partial<
  Pick<SessionProgress, 'step' | 'done' | 'skipped' | 'rounds'>
>;

export interface Transition {
  state: GuidedState;
  persist: ProgressPatch;
  signals: GuidedSignal[];
}

export type GuidedAction =
  | { type: 'start' }
  | { type: 'countdownDone' }
  | { type: 'dismissResume' }
  | { type: 'markDone' }
  | { type: 'undo'; key: string }
  | { type: 'skipExercise' }
  | { type: 'setDone'; done: string[] }
  | { type: 'goTo'; index: number }
  | { type: 'next' }
  | { type: 'previous' }
  | { type: 'round'; blockOrder: number; round: number }
  | { type: 'finishTimedBlock'; blockOrder: number }
  | { type: 'countRound'; blockOrder: number; delta: number }
  | { type: 'arm'; blockOrder: number }
  | { type: 'extendRest' }
  | { type: 'endRest' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'resumed' }
  | { type: 'closePause' }
  | { type: 'skipBlock' }
  | { type: 'finishNow' }
  | { type: 'endBlock' }
  | { type: 'openDetail'; exercise: BlockExercise }
  | { type: 'closeDetail' }
  | { type: 'escape' }
  | { type: 'loadDeclined'; key: string; declined: boolean }
  | { type: 'askLoad'; exerciseKey: string };

/** Ce que l'appareil a gardé de la séance, quand il en a gardé quelque
 * chose. */
type Saved = Pick<SessionProgress, 'step' | 'done' | 'skipped' | 'rounds'>;

/**
 * L'état d'arrivée.
 *
 * La position seule ne dit pas si la séance a été commencée : sur un bloc en
 * liste, cocher des séries ne fait pas avancer l'étape. Quelqu'un qui coche
 * quatre lignes d'échauffement puis ferme l'application a bel et bien
 * commencé, et lui remontrer l'ouverture reviendrait à lui dire qu'il n'a
 * rien fait.
 *
 * Une séance commencée s'ouvre sur l'étape gardée, sans ouverture ni
 * question : on revient pour reprendre, pas pour relire le programme.
 */
export const initialGuidedState = (
  steps: GuidedStep[],
  saved: Saved | null
): GuidedState => {
  const savedIndex = Math.min(saved?.step ?? 0, Math.max(0, steps.length - 1));
  const started = (saved?.step ?? 0) > 0 || (saved?.done.length ?? 0) > 0;
  const phase: GuidedPhase =
    steps.length === 0 ? 'empty' : started ? 'scene' : 'opening';
  return {
    steps,
    phase,
    index: started ? savedIndex : 0,
    resumed: phase === 'scene',
    done: saved?.done ?? [],
    skipped: saved?.skipped ?? [],
    rounds: saved?.rounds ?? {},
    rest: null,
    armedBlock: null,
    liveRound: null,
    pause: 'closed',
    detail: null,
    declined: [],
    askedLoad: [],
  };
};

// ─── Ce qui se lit de l'état ────────────────────────────────────────────────

/** Une série s'enregistre par mouvement : c'est la clé de ses charges. */
export const exerciseKeyOf = (set: {
  blockOrder: number;
  exerciseOrder: number;
}): string => performedKey(set.blockOrder, set.exerciseOrder);

export const stepOf = (state: GuidedState): GuidedStep | undefined =>
  state.steps[state.index];

export const isLastStep = (state: GuidedState): boolean =>
  state.index === state.steps.length - 1;

/** Les séries de l'étape, quand elle se coche. */
export const blockSets = (state: GuidedState): GuidedSet[] => {
  const step = stepOf(state);
  return step?.type === 'block' ? step.sets : [];
};

/** La première série ni faite ni passée : on ne force pas l'ordre, on le
 * suggère. */
export const currentSet = (state: GuidedState): GuidedSet | undefined =>
  blockSets(state).find(
    (set) =>
      !state.done.includes(set.key) &&
      !state.skipped.includes(exerciseKeyOf(set))
  );

/** La dernière série faite de ce bloc, pour « Série précédente ». */
export const lastDoneInBlock = (state: GuidedState): string | undefined => {
  const sets = blockSets(state);
  return [...state.done]
    .reverse()
    .find((key) => sets.some((set) => set.key === key));
};

/** Le premier écran du bloc suivant : c'est là que mène « Passer ce bloc »,
 * d'où que l'on soit dans le bloc courant. -1 au dernier bloc. */
export const nextBlockIndex = (state: GuidedState): number => {
  const step = stepOf(state);
  const order = step && step.type !== 'rest' ? step.block.order : null;
  return state.steps.findIndex(
    (candidate, i) =>
      i > state.index &&
      candidate.type !== 'rest' &&
      candidate.block.order !== order
  );
};

/** Le premier tour d'un bloc chronométré : « Bloc précédent » part de là,
 * quel que soit le tour affiché. */
export const firstRoundIndex = (
  state: GuidedState,
  blockOrder: number
): number =>
  state.steps.findIndex(
    (candidate) =>
      candidate.type === 'round' && candidate.block.order === blockOrder
  );

/** L'horloge du bloc tourne : reprendre passe alors par un décompte. */
export const clockRuns = (state: GuidedState): boolean => {
  const step = stepOf(state);
  return (
    step !== undefined &&
    step.type !== 'rest' &&
    state.armedBlock === step.block.order
  );
};

/** Les séries faites du bloc en cours : « 2 sur 7 faits dans ce bloc ». */
export const doneInBlock = (state: GuidedState): number =>
  blockSets(state).filter((set) => state.done.includes(set.key)).length;

/**
 * La barre du haut : la part faite de chaque bloc, et le bloc en cours.
 *
 * Le bloc en cours se remplit au prorata des séries cochées quand il se
 * coche, des tours passés quand l'horloge le mène — c'est ce qu'on y fait
 * qui avance, pas les écrans qu'on y traverse.
 */
export const segmentProgress = (
  state: GuidedState,
  segments: BlockSegment[]
): { current: number; parts: number[] } => {
  const { index } = state;
  const current = Math.max(
    0,
    segments.findIndex(
      (segment) =>
        index >= segment.start && index < segment.start + segment.size
    )
  );
  const sets = blockSets(state);
  const parts = segments.map((segment, i) =>
    i < current
      ? 1
      : i > current
        ? 0
        : sets.length > 0
          ? doneInBlock(state) / sets.length
          : (index - segment.start) / segment.size
  );
  return { current, parts };
};

// ─── Ce qui le fait changer ─────────────────────────────────────────────────

const stay = (state: GuidedState): Transition => ({
  state,
  persist: {},
  signals: [],
});

const merge = (
  t: Transition,
  state: Partial<GuidedState>,
  persist: ProgressPatch = {},
  signals: GuidedSignal[] = []
): Transition => ({
  state: { ...t.state, ...state },
  persist: { ...t.persist, ...persist },
  signals: [...t.signals, ...signals],
});

/** Ce qui reste à faire dans le bloc une fois `done` et `skipped` pris en
 * compte. */
const remainsAfter = (
  state: GuidedState,
  done: string[],
  skipped: string[]
): boolean =>
  blockSets(state).some(
    (set) => !done.includes(set.key) && !skipped.includes(exerciseKeyOf(set))
  );

/**
 * Aller à une étape.
 *
 * Quitter le bloc désarme son horloge : en y revenant après le bloc suivant,
 * ou dix minutes plus tard, elle attend plutôt que de tourner pendant qu'on
 * cherche sa kettlebell. Deux notes quand on quitte un bloc vers l'avant ;
 * revenir en arrière ne termine rien, et sortir d'un repos entre deux blocs
 * non plus — son horloge a déjà sonné.
 */
const goTo = (t: Transition, next: number): Transition => {
  const { state } = t;
  const target = state.steps[next];
  const targetBlock =
    target && target.type !== 'rest' ? target.block.order : null;
  const here = stepOf(state);
  const leavesBlock =
    next > state.index &&
    here !== undefined &&
    here.type !== 'rest' &&
    here.block.order !== targetBlock;
  return merge(
    t,
    {
      index: next,
      armedBlock: targetBlock === state.armedBlock ? state.armedBlock : null,
      liveRound: null,
      detail: null,
    },
    { step: next },
    leavesBlock ? ['blockEnd'] : []
  );
};

/**
 * La séance s'arrête et rend la main.
 *
 * Rien ne s'efface ici : l'écran de fin se nourrit de ce qui vient d'être
 * noté, et l'enregistrement part quand la séance part au serveur.
 */
const finish = (t: Transition, withCue: boolean): Transition =>
  merge(t, {}, {}, withCue ? ['sessionEnd', 'finish'] : ['finish']);

const goNext = (t: Transition): Transition =>
  isLastStep(t.state) ? finish(t, true) : goTo(t, t.state.index + 1);

/** Le dernier tour est tombé : l'écran qui suit le bloc, d'où que l'index en
 * soit — un téléphone verrouillé peut avoir sauté plusieurs tours. */
const finishTimedBlock = (t: Transition, blockOrder: number): Transition => {
  const { state } = t;
  const after = state.steps.findIndex(
    (candidate, i) =>
      i > state.index &&
      (candidate.type === 'rest' || candidate.block.order !== blockOrder)
  );
  return after === -1 ? finish(t, true) : goTo(t, after);
};

/** Les blocs que « C'est parti » arme : leurs trois secondes valent le
 * « Lancer » d'un premier bloc à horloge, et un second décompte juste
 * derrière ne ferait que redemander ce qui vient d'être décidé. */
const armedByStart = (step: GuidedStep | undefined): number | null => {
  if (!step || step.type === 'rest') return null;
  if (step.type === 'round') return step.block.order;
  if (step.shape === 'loop') return step.block.order;
  if (step.block.type === 'ladder' && step.block.durationMinutes)
    return step.block.order;
  return null;
};

/** La transition d'une action. Pure : la même entrée rend toujours la même
 * sortie, et rien n'est écrit tant que le composant ne l'applique pas. */
export const guidedTransition = (
  state: GuidedState,
  action: GuidedAction
): Transition => {
  const t = stay(state);
  const step = stepOf(state);

  switch (action.type) {
    case 'start':
      return merge(t, { phase: 'counting' });

    case 'countdownDone':
      return merge(t, {
        phase: 'scene',
        armedBlock: armedByStart(step) ?? state.armedBlock,
      });

    case 'dismissResume':
      return state.resumed ? merge(t, { resumed: false }) : t;

    case 'markDone': {
      const current = currentSet(state);
      if (!current) return t;
      const done = [...state.done, current.key];
      const marked = merge(t, { done }, { done }, ['vibrate']);
      // La dernière série d'un bloc en liste ne laisse rien à faire : la
      // cocher EST passer au suivant. Le bloc restait là, toutes ses lignes
      // cochées, à attendre une touche sur « Bloc suivant ». Seulement quand
      // il y a où aller : au dernier bloc, finir reste une décision.
      if (!remainsAfter(state, done, state.skipped) && !isLastStep(state))
        return goNext(marked);
      // Le repos prescrit démarre de lui-même : c'est le geste que le client
      // ferait de toute façon, et l'oublier coûte la série suivante.
      return current.restAfter
        ? merge(marked, {
            rest: {
              afterKey: current.key,
              duration: current.restAfter,
              bonus: 0,
            },
          })
        : marked;
    }

    case 'undo': {
      // Le curseur suit tout seul : c'est la première série non faite, donc
      // en décocher une qui la précède la ramène devant.
      const done = state.done.filter((key) => key !== action.key);
      let undone = merge(t, { done }, { done });
      // Refaire une série d'un mouvement passé, c'est revenir sur ce choix :
      // sans cela elle redevenait à faire sans jamais se présenter.
      const set = blockSets(state).find((s) => s.key === action.key);
      if (set && state.skipped.includes(exerciseKeyOf(set))) {
        const skipped = state.skipped.filter((k) => k !== exerciseKeyOf(set));
        undone = merge(undone, { skipped }, { skipped });
      }
      // Un repos qui appartenait à cette série ne veut plus rien dire.
      return state.rest?.afterKey === action.key
        ? merge(undone, { rest: null })
        : undone;
    }

    case 'skipExercise': {
      const current = currentSet(state);
      if (!current) return t;
      const skipped = [...state.skipped, exerciseKeyOf(current)];
      const skippedNow = merge(t, { skipped, rest: null }, { skipped });
      return !remainsAfter(state, state.done, skipped) && !isLastStep(state)
        ? goNext(skippedNow)
        : skippedNow;
    }

    case 'setDone':
      return merge(t, { done: action.done }, { done: action.done });

    case 'goTo':
      return goTo(t, action.index);

    case 'next':
      return goNext(t);

    case 'previous':
      return goTo(t, Math.max(0, state.index - 1));

    case 'round': {
      // Un tour qui passe, à l'horloge ou d'un geste. Ni note de fin de bloc
      // ni consigne refermée : on reste dans le même bloc, et une consigne
      // ouverte pendant un EMOM se refermait à chaque minute.
      if (step?.type === 'round' && step.rounds === null)
        return merge(t, { liveRound: action.round });
      const target = state.steps.findIndex(
        (candidate) =>
          candidate.type === 'round' &&
          candidate.block.order === action.blockOrder &&
          candidate.round === action.round
      );
      if (target === -1) return t;
      return merge(t, { index: target }, { step: target });
    }

    case 'finishTimedBlock':
      return finishTimedBlock(t, action.blockOrder);

    case 'countRound': {
      const key = String(action.blockOrder);
      const rounds = {
        ...state.rounds,
        // Jamais sous zéro : on corrige un faux doigt, on ne passe pas en
        // négatif.
        [key]: Math.max(0, (state.rounds[key] ?? 0) + action.delta),
      };
      return merge(
        t,
        { rounds },
        { rounds },
        action.delta > 0 ? ['vibrate'] : []
      );
    }

    case 'arm':
      return merge(t, { armedBlock: action.blockOrder });

    case 'extendRest':
      return state.rest
        ? merge(t, { rest: { ...state.rest, bonus: state.rest.bonus + 15 } })
        : t;

    case 'endRest':
      return merge(t, { rest: null });

    case 'pause':
      return merge(t, { pause: 'open' });

    case 'resume':
      // Quand l'horloge mène le bloc et qu'elle tournait, trois secondes
      // d'abord : on ne repart pas au milieu d'un tour le téléphone à la
      // main.
      return merge(t, { pause: clockRuns(state) ? 'resuming' : 'closed' });

    case 'resumed':
      return merge(t, { pause: 'closed' });

    case 'closePause':
      // Pendant le décompte de reprise, le retour et Échap ne changent rien :
      // la feuille est déjà partie, et le décompte finit de lui-même.
      return state.pause === 'open' ? merge(t, { pause: 'closed' }) : t;

    case 'skipBlock': {
      const closed = merge(t, { pause: 'closed' });
      const next = nextBlockIndex(state);
      return next === -1 ? closed : goTo(closed, next);
    }

    case 'finishNow':
      return finish(merge(t, { pause: 'closed' }), false);

    case 'endBlock':
      return step && step.type === 'round'
        ? finishTimedBlock(merge(t, { pause: 'closed' }), step.block.order)
        : t;

    case 'openDetail':
      return merge(t, { detail: action.exercise });

    case 'closeDetail':
      return merge(t, { detail: null });

    case 'escape':
      // La consigne ouverte se referme d'abord, comme n'importe quelle couche
      // du dessus ; ensuite Échap ouvre ou referme la pause.
      if (state.detail) return merge(t, { detail: null });
      if (state.pause === 'open') return merge(t, { pause: 'closed' });
      if (state.pause === 'closed') return merge(t, { pause: 'open' });
      return t;

    case 'loadDeclined': {
      const declined = state.declined.filter((key) => key !== action.key);
      return merge(t, {
        declined: action.declined ? [...declined, action.key] : declined,
      });
    }

    case 'askLoad':
      return state.askedLoad.includes(action.exerciseKey)
        ? t
        : merge(t, { askedLoad: [...state.askedLoad, action.exerciseKey] });
  }
};
