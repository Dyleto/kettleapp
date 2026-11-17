/**
 * L'état d'une séance guidée, sans écran.
 *
 * Ce que ces cas fixent se vérifiait seulement par le banc, en menant un
 * navigateur série après série : cocher la dernière série d'un bloc passe au
 * suivant, mais pas au dernier ; un repos appartient à sa série et part avec
 * elle ; quitter un bloc désarme son horloge et joue ses deux notes, revenir
 * en arrière non. Ici chacun tient en trois lignes, et dit ce qui est écrit
 * sur l'appareil et ce qui est demandé au monde.
 */
import { describe, expect, it } from 'vitest';
import {
  currentSet,
  guidedTransition,
  initialGuidedState,
  nextBlockIndex,
  type GuidedAction,
  type GuidedState,
  type ProgressPatch,
} from './session';
import { buildGuidedSteps } from './steps';
import {
  makeBlock,
  makeBlockExercise,
  makeExercise,
  makeSession,
} from '@/domain/fixtures';

const squat = makeExercise({ _id: 'ex-squat', name: 'Goblet Squat' });
const lunge = makeExercise({ _id: 'ex-lunge', name: 'Fentes marchées' });
const swing = makeExercise({ _id: 'ex-swing', name: 'Kettlebell Swing' });

/**
 * Trois blocs : deux séries de squat (une minute entre elles) puis une de
 * fentes, un repos de 90 s, un EMOM de trois tours, un dernier bloc d'une
 * série. Les étapes : 0 la liste, 1 le repos, 2-4 les tours, 5 la dernière
 * liste.
 */
const session = makeSession({
  blocks: [
    makeBlock({
      _id: 'b1',
      order: 1,
      restDuration: 90,
      exercises: [
        makeBlockExercise({
          order: 1,
          exercise: squat,
          sets: 2,
          reps: 10,
          restBetweenSets: 60,
        }),
        makeBlockExercise({ order: 2, exercise: lunge, sets: 1, reps: 12 }),
      ],
    }),
    makeBlock({
      _id: 'b2',
      order: 2,
      type: 'emom',
      rounds: 3,
      intervalMinutes: 1,
      exercises: [makeBlockExercise({ order: 1, exercise: swing, reps: 15 })],
    }),
    makeBlock({
      _id: 'b3',
      order: 3,
      exercises: [makeBlockExercise({ order: 1, exercise: swing, sets: 1 })],
    }),
  ],
});
const steps = buildGuidedSteps(session);

/** La scène ouverte à cette étape, avec ces séries déjà faites. */
const at = (index: number, done: string[] = []): GuidedState => ({
  ...initialGuidedState(steps, null),
  phase: 'scene',
  index,
  done,
});

const run = (state: GuidedState, ...actions: GuidedAction[]) =>
  actions.reduce(
    (t, action) => {
      const next = guidedTransition(t.state, action);
      return {
        state: next.state,
        persist: { ...t.persist, ...next.persist },
        signals: [...t.signals, ...next.signals],
      };
    },
    { state, persist: {} as ProgressPatch, signals: [] as string[] }
  );

describe('le découpage attendu', () => {
  it('six étapes : la liste, le repos, trois tours, la liste', () => {
    expect(steps.map((s) => s.type)).toEqual([
      'block',
      'rest',
      'round',
      'round',
      'round',
      'block',
    ]);
  });
});

describe("l'arrivée", () => {
  it("une séance jamais commencée s'ouvre sur l'ouverture", () => {
    const state = initialGuidedState(steps, null);
    expect(state).toMatchObject({ phase: 'opening', resumed: false });
  });

  it('une séance commencée reprend à son étape, sans question', () => {
    // La question « Reprendre où tu en étais ? » se posait à qui venait de
    // toucher « Reprendre » : on redemandait ce qu'on venait de répondre.
    const state = initialGuidedState(steps, {
      step: 3,
      done: [],
      skipped: [],
      rounds: {},
    });
    expect(state).toMatchObject({ phase: 'scene', index: 3, resumed: true });
  });

  it('des séries cochées sans avoir avancé, c’est commencé aussi', () => {
    // Un bloc en liste est une étape unique : on y coche sans que l'étape
    // bouge, et l'ouverture remontrée dirait qu'on n'a rien fait.
    const state = initialGuidedState(steps, {
      step: 0,
      done: ['1:1:1'],
      skipped: [],
      rounds: {},
    });
    expect(state).toMatchObject({ phase: 'scene', index: 0, resumed: true });
  });

  it('une étape gardée hors de la séance revient à la dernière', () => {
    const state = initialGuidedState(steps, {
      step: 40,
      done: [],
      skipped: [],
      rounds: {},
    });
    expect(state.index).toBe(steps.length - 1);
  });

  it('sans exercice, rien à suivre', () => {
    expect(initialGuidedState([], null).phase).toBe('empty');
  });

  it('le bandeau de reprise se retire, et la séance ne bouge pas', () => {
    const resumed = initialGuidedState(steps, {
      step: 3,
      done: [],
      skipped: [],
      rounds: {},
    });
    const t = run(resumed, { type: 'dismissResume' });
    expect(t.state).toMatchObject({ resumed: false, index: 3, phase: 'scene' });
    expect(t.persist).toEqual({});
  });
});

describe('le décompte de départ', () => {
  it('arme un premier bloc à horloge : pas de second « Lancer »', () => {
    const emomFirst = buildGuidedSteps(
      makeSession({ blocks: [session.blocks[1]] })
    );
    const state = {
      ...initialGuidedState(emomFirst, null),
      phase: 'counting' as const,
    };
    expect(
      guidedTransition(state, { type: 'countdownDone' }).state.armedBlock
    ).toBe(2);
  });

  it("n'arme rien devant une liste", () => {
    const state = {
      ...initialGuidedState(steps, null),
      phase: 'counting' as const,
    };
    const { state: next } = guidedTransition(state, { type: 'countdownDone' });
    expect(next).toMatchObject({ phase: 'scene', armedBlock: null });
  });

  it('arme un chipper borné, pas un chipper sans limite', () => {
    const chipperFirst = (durationMinutes?: number) => ({
      ...initialGuidedState(
        buildGuidedSteps(
          makeSession({
            blocks: [
              makeBlock({
                order: 4,
                type: 'chipper',
                durationMinutes,
                exercises: [makeBlockExercise({ exercise: swing, reps: 15 })],
              }),
            ],
          })
        ),
        null
      ),
      phase: 'counting' as const,
    });
    const arm = (durationMinutes?: number) =>
      guidedTransition(chipperFirst(durationMinutes), {
        type: 'countdownDone',
      }).state.armedBlock;
    expect(arm(20)).toBe(4);
    expect(arm(undefined)).toBeNull();
  });
});

describe('cocher', () => {
  it('une série faite est écrite, vibre, et lance son repos', () => {
    const t = run(at(0), { type: 'markDone' });
    expect(t.state.done).toEqual(['1:1:1']);
    expect(t.persist).toEqual({ done: ['1:1:1'] });
    expect(t.signals).toEqual(['vibrate']);
    expect(t.state.rest).toEqual({ afterKey: '1:1:1', duration: 60, bonus: 0 });
  });

  it('la série suivante est celle qui n’est pas faite', () => {
    expect(currentSet(at(0, ['1:1:1']))?.key).toBe('1:1:2');
  });

  it('la dernière série d’un bloc passe au suivant, sans repos', () => {
    const t = run(at(0, ['1:1:1', '1:1:2']), { type: 'markDone' });
    expect(t.state.index).toBe(1);
    expect(t.state.rest).toBeNull();
    expect(t.persist).toEqual({ done: ['1:1:1', '1:1:2', '1:2:1'], step: 1 });
    expect(t.signals).toEqual(['vibrate', 'blockEnd']);
  });

  it('mais pas au dernier bloc : finir reste une décision', () => {
    const t = run(at(5), { type: 'markDone' });
    expect(t.state.index).toBe(5);
    expect(t.signals).toEqual(['vibrate']);
  });

  it('décocher rend la série, et son repos part avec elle', () => {
    const t = run(at(0), { type: 'markDone' }, { type: 'undo', key: '1:1:1' });
    expect(t.state.done).toEqual([]);
    expect(t.state.rest).toBeNull();
    expect(currentSet(t.state)?.key).toBe('1:1:1');
  });

  it('refaire une série d’un mouvement passé revient sur ce choix', () => {
    const t = run(
      at(0, ['1:1:1']),
      { type: 'skipExercise' },
      { type: 'undo', key: '1:1:1' }
    );
    expect(t.state.skipped).toEqual([]);
    expect(t.persist.skipped).toEqual([]);
    expect(currentSet(t.state)?.key).toBe('1:1:1');
  });

  it('passer le dernier mouvement d’un bloc passe au suivant', () => {
    const t = run(at(0), { type: 'skipExercise' }, { type: 'skipExercise' });
    expect(t.state.skipped).toEqual(['1:1', '1:2']);
    expect(t.state.index).toBe(1);
  });

  it('passer un mouvement coupe le repos en cours', () => {
    const t = run(at(0), { type: 'markDone' }, { type: 'skipExercise' });
    expect(t.state.rest).toBeNull();
  });

  it('« + 15 s » s’ajoute au repos, « Passer » le termine', () => {
    const t = run(
      at(0),
      { type: 'markDone' },
      { type: 'extendRest' },
      { type: 'extendRest' }
    );
    expect(t.state.rest?.bonus).toBe(30);
    expect(run(t.state, { type: 'endRest' }).state.rest).toBeNull();
  });
});

describe('aller et venir', () => {
  it('quitter un bloc vers l’avant joue ses notes et désarme son horloge', () => {
    const armed = { ...at(3), armedBlock: 2 };
    const t = run(armed, { type: 'goTo', index: 5 });
    expect(t.state.armedBlock).toBeNull();
    expect(t.signals).toEqual(['blockEnd']);
    expect(t.persist).toEqual({ step: 5 });
  });

  it('revenir en arrière ne termine rien', () => {
    expect(run(at(5), { type: 'previous' }).signals).toEqual([]);
  });

  it('sortir du repos entre deux blocs non plus', () => {
    expect(run(at(1), { type: 'next' }).signals).toEqual([]);
  });

  it('aller ailleurs referme la consigne ouverte', () => {
    const open = run(at(0), {
      type: 'openDetail',
      exercise: session.blocks[0].exercises[0],
    }).state;
    expect(run(open, { type: 'next' }).state.detail).toBeNull();
  });

  it('un tour qui passe garde la consigne et l’horloge', () => {
    const open = {
      ...at(2),
      armedBlock: 2,
      detail: session.blocks[1].exercises[0],
    };
    const t = run(open, { type: 'round', blockOrder: 2, round: 2 });
    expect(t.state).toMatchObject({ index: 3, armedBlock: 2 });
    expect(t.state.detail).not.toBeNull();
    expect(t.signals).toEqual([]);
  });

  it('un EMOM sans limite compte ses tours sans changer d’étape', () => {
    const unbounded = buildGuidedSteps(
      makeSession({
        blocks: [{ ...session.blocks[1], rounds: undefined }],
      })
    );
    const state = { ...initialGuidedState(unbounded, null), index: 0 };
    const t = run(state, { type: 'round', blockOrder: 2, round: 7 });
    expect(t.state).toMatchObject({ index: 0, liveRound: 7 });
  });

  it('le dernier tour tombé mène à ce qui suit le bloc', () => {
    const t = run(at(3), { type: 'finishTimedBlock', blockOrder: 2 });
    expect(t.state.index).toBe(5);
    expect(t.signals).toEqual(['blockEnd']);
  });

  it('« Passer ce bloc » saute aussi le repos qui le termine', () => {
    expect(nextBlockIndex(at(0))).toBe(2);
    const t = run({ ...at(0), pause: 'open' }, { type: 'skipBlock' });
    expect(t.state).toMatchObject({ index: 2, pause: 'closed' });
  });
});

describe('l’écran « Bloc suivant »', () => {
  it('se pose quand un bloc mène droit au suivant', () => {
    const t = run(at(3), { type: 'finishTimedBlock', blockOrder: 2 });
    expect(t.state.interlude).toEqual({ fromBlock: 2, ending: 'finished' });
    // L'index a déjà changé : c'est lui qu'on retrouve en revenant.
    expect(t.persist).toEqual({ step: 5 });
  });

  it('pas en entrant dans le repos qui termine un bloc', () => {
    const last = run(at(0), { type: 'markDone' }, { type: 'markDone' });
    expect(last.state.index).toBe(0);
    const t = run(last.state, { type: 'markDone' });
    expect(t.state.index).toBe(1);
    expect(t.state.interlude).toBeNull();
  });

  it('ni en en sortant : ce repos annonçait déjà la suite', () => {
    expect(run(at(1), { type: 'next' }).state.interlude).toBeNull();
  });

  it('ni en revenant en arrière', () => {
    expect(run(at(5), { type: 'previous' }).state.interlude).toBeNull();
  });

  it('dit qu’un bloc a été passé depuis la pause', () => {
    const t = run({ ...at(0), pause: 'open' }, { type: 'skipBlock' });
    expect(t.state.interlude).toEqual({ fromBlock: 1, ending: 'skipped' });
  });

  it('et qu’un bloc sans limite a été arrêté, non mené au bout', () => {
    const t = run({ ...at(3), pause: 'open' }, { type: 'endBlock' });
    expect(t.state.interlude).toEqual({ fromBlock: 2, ending: 'stopped' });
  });

  it('se retire sans rien écrire ni rien demander', () => {
    const shown = run(at(3), { type: 'finishTimedBlock', blockOrder: 2 });
    const t = guidedTransition(shown.state, { type: 'interludeDone' });
    expect(t.state.interlude).toBeNull();
    expect(t.state.index).toBe(5);
    expect(t.persist).toEqual({});
    expect(t.signals).toEqual([]);
  });

  it('aller ailleurs le retire', () => {
    const shown = run(at(3), { type: 'finishTimedBlock', blockOrder: 2 });
    expect(run(shown.state, { type: 'previous' }).state.interlude).toBeNull();
  });
});

describe('finir', () => {
  it('« Terminer » au dernier écran joue sa note et rend la main', () => {
    expect(run(at(5), { type: 'next' }).signals).toEqual([
      'sessionEnd',
      'finish',
    ]);
  });

  it('un bloc chronométré qui finit la séance la finit aussi', () => {
    const emomLast = buildGuidedSteps(
      makeSession({ blocks: [session.blocks[1]] })
    );
    const state = { ...initialGuidedState(emomLast, null), index: 1 };
    expect(
      run(state, { type: 'finishTimedBlock', blockOrder: 2 }).signals
    ).toEqual(['sessionEnd', 'finish']);
  });

  it('« Terminer la séance maintenant » rend la main, sans fanfare', () => {
    const t = run({ ...at(3), pause: 'open' }, { type: 'finishNow' });
    expect(t.signals).toEqual(['finish']);
    expect(t.state.pause).toBe('closed');
  });
});

describe('compter des tours', () => {
  it('jamais sous zéro, et seul l’ajout vibre', () => {
    const t = run(
      at(0),
      { type: 'countRound', blockOrder: 4, delta: 1 },
      { type: 'countRound', blockOrder: 4, delta: -1 },
      { type: 'countRound', blockOrder: 4, delta: -1 }
    );
    expect(t.state.rounds).toEqual({ '4': 0 });
    expect(t.persist).toEqual({ rounds: { '4': 0 } });
    expect(t.signals).toEqual(['vibrate']);
  });
});

describe('la pause', () => {
  it('une horloge qui tournait reprend par un décompte', () => {
    const t = run(
      { ...at(3), armedBlock: 2, pause: 'open' },
      {
        type: 'resume',
      }
    );
    expect(t.state.pause).toBe('resuming');
    expect(run(t.state, { type: 'resumed' }).state.pause).toBe('closed');
  });

  it('sans horloge, reprendre referme la feuille', () => {
    expect(
      run({ ...at(0), pause: 'open' }, { type: 'resume' }).state.pause
    ).toBe('closed');
  });

  it('pendant le décompte, le retour ne change rien', () => {
    const resuming = { ...at(3), pause: 'resuming' as const };
    expect(run(resuming, { type: 'closePause' }).state.pause).toBe('resuming');
  });

  it('Échap referme d’abord la consigne, puis ouvre et ferme la pause', () => {
    const open = {
      ...at(0),
      detail: session.blocks[0].exercises[0],
    };
    const first = run(open, { type: 'escape' }).state;
    expect(first).toMatchObject({ detail: null, pause: 'closed' });
    const second = run(first, { type: 'escape' }).state;
    expect(second.pause).toBe('open');
    expect(run(second, { type: 'escape' }).state.pause).toBe('closed');
  });

  it('un EMOM sans limite se termine depuis la pause', () => {
    const t = run({ ...at(3), pause: 'open' }, { type: 'endBlock' });
    expect(t.state).toMatchObject({ index: 5, pause: 'closed' });
  });
});

describe('les charges', () => {
  it('une charge effacée le reste, jusqu’à ce qu’on en écrive une', () => {
    const declined = run(at(0), {
      type: 'loadDeclined',
      key: '1:1:1',
      declined: true,
    }).state;
    expect(declined.declined).toEqual(['1:1:1']);
    expect(
      run(declined, { type: 'loadDeclined', key: '1:1:1', declined: false })
        .state.declined
    ).toEqual([]);
  });

  it('« Noter une charge » vaut pour le mouvement, une fois', () => {
    const t = run(
      at(0),
      { type: 'askLoad', exerciseKey: '1:1' },
      { type: 'askLoad', exerciseKey: '1:1' }
    );
    expect(t.state.askedLoad).toEqual(['1:1']);
  });
});
