/**
 * Le découpage d'une séance en étapes guidées.
 *
 * C'est la fonction qui a été réécrite sur le constat le plus coûteux du mode
 * guidé : un EMOM de dix tours censé durer dix minutes en durait vingt. Il
 * était découpé en une page par mouvement, sans horloge, puis une page
 * « REPOS 1:00 » — si bien que le client ne voyait jamais la minute tourner
 * et prenait une minute de repos que le coach n'avait pas prescrite.
 *
 * L'unité est donc le tour, et non le mouvement. C'est la propriété centrale
 * de ce fichier, et elle se vérifie ici en une ligne : un EMOM de dix tours
 * donne dix étapes, pas trente.
 *
 * `buildGuidedSteps` est pure — une séance entre, une liste sort — et tout ce
 * que le mode guidé affiche en découle. Le banc en éprouve le résultat à
 * l'écran ; ces tests éprouvent la table de décision, qui compte quatre
 * entrées et autant de cas de bord que de formats.
 */
import { describe, expect, it } from 'vitest';
import {
  buildGuidedSteps,
  repsOfSet,
  roundDose,
  setsOfBlock,
  type GuidedStep,
} from './guidedSteps';
import { restBetweenSetsOf } from '@/features/program/constants';
import {
  makeBlock,
  makeExercise,
  makeBlockExercise,
  makeSession,
} from './fixtures';

const roundsOf = (steps: GuidedStep[]) =>
  steps.filter((e) => e.type === 'round');
const blocksOf = (steps: GuidedStep[]) =>
  steps.filter((e) => e.type === 'block');
const restsOf = (steps: GuidedStep[]) => steps.filter((e) => e.type === 'rest');

describe('un bloc mené par le minuteur devient une suite de tours', () => {
  it('un EMOM de dix tours donne dix étapes, pas une par mouvement', () => {
    const emom = makeBlock({
      type: 'emom',
      rounds: 10,
      exercises: [
        makeBlockExercise({
          order: 1,
          exercise: makeExercise({ _id: 'a', name: 'Swing' }),
        }),
        makeBlockExercise({
          order: 2,
          exercise: makeExercise({ _id: 'b', name: 'Pompes' }),
        }),
        makeBlockExercise({
          order: 3,
          exercise: makeExercise({ _id: 'c', name: 'Squat' }),
        }),
      ],
    });
    const steps = buildGuidedSteps(makeSession({ blocks: [emom] }));
    expect(steps).toHaveLength(10);
    expect(roundsOf(steps)).toHaveLength(10);
  });

  it('chaque tour porte son rang et le total', () => {
    const steps = roundsOf(
      buildGuidedSteps(
        makeSession({ blocks: [makeBlock({ type: 'emom', rounds: 3 })] })
      )
    );
    expect(steps.map((t) => [t.round, t.rounds])).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
    ]);
  });

  it('chaque tour porte tous les mouvements du tour, dans l’ordre', () => {
    const emom = makeBlock({
      type: 'emom',
      rounds: 2,
      exercises: [
        makeBlockExercise({
          order: 2,
          exercise: makeExercise({ _id: 'b', name: 'Pompes' }),
        }),
        makeBlockExercise({
          order: 1,
          exercise: makeExercise({ _id: 'a', name: 'Swing' }),
        }),
      ],
    });
    const first = roundsOf(
      buildGuidedSteps(makeSession({ blocks: [emom] }))
    )[0];
    expect(first.exercises.map((e) => e.exercise.name)).toEqual([
      'Swing',
      'Pompes',
    ]);
  });

  it("un EMOM sans intervalle écrit vaut la minute : c'est ce que le mot dit", () => {
    const steps = roundsOf(
      buildGuidedSteps(
        makeSession({ blocks: [makeBlock({ type: 'emom', rounds: 2 })] })
      )
    );
    expect(steps[0].workSeconds).toBe(60);
  });

  it('un E2MOM lit son intervalle', () => {
    const steps = roundsOf(
      buildGuidedSteps(
        makeSession({
          blocks: [makeBlock({ type: 'emom', rounds: 4, intervalMinutes: 2 })],
        })
      )
    );
    expect(steps[0].workSeconds).toBe(120);
  });

  it("un EMOM n'impose aucun repos : le repos est ce qu'il reste de la minute", () => {
    // C'est le défaut corrigé : une page « REPOS 1:00 » ajoutait une minute
    // que le coach n'avait pas prescrite, et doublait la durée du bloc.
    const steps = roundsOf(
      buildGuidedSteps(
        makeSession({ blocks: [makeBlock({ type: 'emom', rounds: 3 })] })
      )
    );
    expect(steps.every((t) => t.restSeconds === undefined)).toBe(true);
  });

  it('un Tabata impose les deux : le travail et le repos', () => {
    const tabata = makeBlock({
      type: 'tabata',
      rounds: 8,
      workDuration: 20,
      restDuration: 10,
    });
    const steps = roundsOf(buildGuidedSteps(makeSession({ blocks: [tabata] })));
    expect(steps).toHaveLength(8);
    expect([steps[0].workSeconds, steps[0].restSeconds]).toEqual([20, 10]);
  });

  it('un bloc à tours qui n’en a qu’un redevient une liste', () => {
    // Un seul tour n'est pas un rythme : c'est une liste qu'on coche.
    const steps = buildGuidedSteps(
      makeSession({ blocks: [makeBlock({ type: 'emom', rounds: 1 })] })
    );
    expect(roundsOf(steps)).toHaveLength(0);
    expect(blocksOf(steps)).toHaveLength(1);
  });

  it('un bloc à tours sans nombre de tours aussi', () => {
    const steps = buildGuidedSteps(
      makeSession({ blocks: [makeBlock({ type: 'tabata' })] })
    );
    expect(blocksOf(steps)).toHaveLength(1);
  });
});

describe('ce qui annonce la suite', () => {
  it('le dernier tour nomme le bloc suivant', () => {
    const steps = roundsOf(
      buildGuidedSteps(
        makeSession({
          blocks: [
            makeBlock({ order: 1, type: 'emom', rounds: 3 }),
            makeBlock({ order: 2, type: 'amrap' }),
          ],
        })
      )
    );
    expect(steps.map((t) => t.nextLabel)).toEqual([null, null, 'AMRAP']);
  });

  it('le dernier tour du dernier bloc n’annonce rien', () => {
    const steps = roundsOf(
      buildGuidedSteps(
        makeSession({ blocks: [makeBlock({ type: 'emom', rounds: 2 })] })
      )
    );
    expect(steps.map((t) => t.nextLabel)).toEqual([null, null]);
  });
});

describe('une boucle se compte, une liste se coche', () => {
  it('un AMRAP est une boucle, et ne porte aucune série', () => {
    const steps = blocksOf(
      buildGuidedSteps(
        makeSession({
          blocks: [makeBlock({ type: 'amrap', durationMinutes: 12 })],
        })
      )
    );
    expect(steps[0].shape).toBe('loop');
    expect(steps[0].sets).toEqual([]);
  });

  const listTypes = [
    'classic',
    'chipper',
    'warmup',
    'pyramid',
    'ladder',
  ] as const;

  it.each(listTypes)('un bloc %s est une liste', (type) => {
    const steps = blocksOf(
      buildGuidedSteps(makeSession({ blocks: [makeBlock({ type })] }))
    );
    expect(steps[0].shape).toBe('list');
    expect(steps[0].sets.length).toBeGreaterThan(0);
  });
});

describe('les séries d’un bloc en liste', () => {
  it('un classique donne une série par série prescrite', () => {
    const classicBlock = makeBlock({
      type: 'classic',
      exercises: [
        makeBlockExercise({ sets: 4, reps: 10, restBetweenSets: 90 }),
      ],
    });
    const sets = setsOfBlock(classicBlock);
    expect(sets).toHaveLength(4);
    expect(sets.map((s) => [s.rank, s.total])).toEqual([
      [1, 4],
      [2, 4],
      [3, 4],
      [4, 4],
    ]);
  });

  it('sans nombre de séries écrit, l’exercice se fait une fois', () => {
    expect(setsOfBlock(makeBlock({ type: 'warmup' }))).toHaveLength(1);
  });

  it('porte le repos entre les séries, mais pas après la dernière', () => {
    const sets = setsOfBlock(
      makeBlock({
        type: 'classic',
        exercises: [
          makeBlockExercise({ sets: 3, reps: 10, restBetweenSets: 90 }),
        ],
      })
    );
    expect(sets.map((s) => s.restAfter)).toEqual([90, 90, undefined]);
  });

  it('ne porte aucun repos quand il n’y a qu’une série', () => {
    const sets = setsOfBlock(
      makeBlock({
        type: 'classic',
        exercises: [
          makeBlockExercise({ sets: 1, reps: 10, restBetweenSets: 90 }),
        ],
      })
    );
    expect(sets[0].restAfter).toBeUndefined();
  });

  it('une pyramide donne une série par palier, chacune avec sa dose', () => {
    const pyramidBlock = makeBlock({
      type: 'pyramid',
      repsScheme: [21, 15, 9],
      restBetweenRounds: 60,
      exercises: [makeBlockExercise({})],
    });
    const sets = setsOfBlock(pyramidBlock);
    expect(sets).toHaveLength(3);
    expect(sets.map((s) => s.dose)).toEqual(['21 reps', '15 reps', '9 reps']);
    expect(sets.map((s) => s.reps)).toEqual([21, 15, 9]);
    expect(sets.map((s) => s.restAfter)).toEqual([60, 60, undefined]);
  });

  it('enchaîne les exercices dans l’ordre, séries comprises', () => {
    const chipper = makeBlock({
      type: 'chipper',
      exercises: [
        makeBlockExercise({
          order: 2,
          exercise: makeExercise({ _id: 'b', name: 'Pompes' }),
        }),
        makeBlockExercise({
          order: 1,
          exercise: makeExercise({ _id: 'a', name: 'Burpee' }),
        }),
      ],
    });
    expect(setsOfBlock(chipper).map((s) => s.name)).toEqual([
      'Burpee',
      'Pompes',
    ]);
  });

  it('donne à chaque série une clé qui l’identifie', () => {
    const sets = setsOfBlock(
      makeBlock({
        order: 2,
        type: 'classic',
        exercises: [makeBlockExercise({ order: 3, sets: 2 })],
      })
    );
    expect(sets.map((s) => s.key)).toEqual(['2:3:1', '2:3:2']);
  });
});

/**
 * Le repos entre séries, éprouvé à son propre niveau.
 *
 * Il l'était d'abord à travers `setsOfBlock`, et cela ne prouvait rien :
 * retirer la condition « plus d'une série » ne faisait tomber aucun test,
 * parce que la règle « pas de repos après la dernière » la masquait — avec
 * une seule série, la dernière est aussi la première.
 *
 * Or la fonction a deux autres appelants, dont la ligne de lecture de
 * l'atelier, qui affiche « 90 s repos ». Là, rien ne masque rien : un
 * exercice d'une seule série afficherait un repos qui ne veut rien dire.
 */
describe('le repos entre séries', () => {
  it('existe sur un classique à plusieurs séries', () => {
    expect(
      restBetweenSetsOf({ type: 'classic' }, { sets: 3, restBetweenSets: 90 })
    ).toBe(90);
  });

  it("n'existe pas avec une seule série : il n'y a pas d'entre-deux", () => {
    expect(
      restBetweenSetsOf({ type: 'classic' }, { sets: 1, restBetweenSets: 90 })
    ).toBeUndefined();
  });

  it("n'existe pas sans nombre de séries écrit", () => {
    expect(
      restBetweenSetsOf({ type: 'classic' }, { restBetweenSets: 90 })
    ).toBeUndefined();
  });

  it("n'existe pas sans repos écrit", () => {
    expect(restBetweenSetsOf({ type: 'classic' }, { sets: 4 })).toBeUndefined();
  });

  it('vaut aussi pour un échauffement : « 3 × 10 rotations » en est un', () => {
    expect(
      restBetweenSetsOf({ type: 'warmup' }, { sets: 3, restBetweenSets: 30 })
    ).toBe(30);
  });

  it("n'existe pas sur un format qui ne compte pas de séries", () => {
    expect(
      restBetweenSetsOf({ type: 'amrap' }, { sets: 3, restBetweenSets: 90 })
    ).toBeUndefined();
  });
});

describe('la dose d’un mouvement, pour un tour', () => {
  it('les répétitions d’abord', () => {
    expect(
      roundDose(makeBlock({ type: 'emom' }), makeBlockExercise({ reps: 15 }))
    ).toBe('15 reps');
  });

  it('la durée à défaut', () => {
    expect(
      roundDose(
        makeBlock({ type: 'emom' }),
        makeBlockExercise({ duration: 45 })
      )
    ).toBe('45 s');
  });

  it('la mesure libre ensuite', () => {
    expect(
      roundDose(
        makeBlock({ type: 'emom' }),
        makeBlockExercise({ customMetric: { value: 400, unit: 'm' } })
      )
    ).toBe('400 m');
  });

  it('le temps de travail du bloc en dernier recours, sur un Tabata', () => {
    expect(
      roundDose(
        makeBlock({ type: 'tabata', workDuration: 20 }),
        makeBlockExercise({})
      )
    ).toBe('20 s');
  });

  it('rien quand le coach n’a rien prescrit', () => {
    expect(roundDose(makeBlock({ type: 'emom' }), makeBlockExercise({}))).toBe(
      ''
    );
  });
});

describe('les répétitions d’une série', () => {
  it('viennent du palier sur une pyramide', () => {
    const pyramidBlock = { type: 'pyramid' as const, repsScheme: [21, 15, 9] };
    expect(repsOfSet(pyramidBlock, { reps: 99 }, 2)).toBe(15);
  });

  it('viennent de l’exercice partout ailleurs', () => {
    expect(repsOfSet({ type: 'classic' }, { reps: 12 }, 3)).toBe(12);
  });

  it('sont absentes quand le coach n’a rien écrit', () => {
    expect(repsOfSet({ type: 'classic' }, {}, 1)).toBeUndefined();
  });

  it('sont absentes au-delà du dernier palier', () => {
    const pyramidBlock = { type: 'pyramid' as const, repsScheme: [21, 15] };
    expect(repsOfSet(pyramidBlock, {}, 3)).toBeUndefined();
  });
});

describe('le repos entre deux blocs', () => {
  it('existe quand le coach a écrit une durée', () => {
    const steps = buildGuidedSteps(
      makeSession({
        blocks: [
          makeBlock({ order: 1, type: 'classic', restDuration: 120 }),
          makeBlock({ order: 2, type: 'chipper' }),
        ],
      })
    );
    expect(restsOf(steps)).toHaveLength(1);
    expect(restsOf(steps)[0].duration).toBe(120);
  });

  it("n'existe pas quand il n'a rien écrit : on n'invente pas une minute", () => {
    const steps = buildGuidedSteps(
      makeSession({
        blocks: [
          makeBlock({ order: 1, type: 'classic' }),
          makeBlock({ order: 2, type: 'chipper' }),
        ],
      })
    );
    expect(restsOf(steps)).toEqual([]);
  });

  it("n'existe pas après un bloc mené par le minuteur", () => {
    // Un bloc à tours porte déjà son repos dans ses tours : en ajouter un
    // recréerait la minute fantôme.
    const steps = buildGuidedSteps(
      makeSession({
        blocks: [
          makeBlock({
            order: 1,
            type: 'tabata',
            rounds: 8,
            workDuration: 20,
            restDuration: 10,
          }),
          makeBlock({ order: 2, type: 'chipper' }),
        ],
      })
    );
    expect(restsOf(steps)).toEqual([]);
  });

  it('annonce le premier mouvement du bloc qui vient', () => {
    const steps = buildGuidedSteps(
      makeSession({
        blocks: [
          makeBlock({ order: 1, type: 'classic', restDuration: 60 }),
          makeBlock({
            order: 2,
            type: 'chipper',
            exercises: [
              makeBlockExercise({
                exercise: makeExercise({ _id: 'z', name: 'Rameur' }),
              }),
            ],
          }),
        ],
      })
    );
    expect(restsOf(steps)[0].nextExerciseName).toBe('Rameur');
  });

  it('ne ferme jamais une séance : un repos final est retiré', () => {
    const steps = buildGuidedSteps(
      makeSession({
        blocks: [makeBlock({ type: 'classic', restDuration: 120 })],
      })
    );
    expect(steps[steps.length - 1].type).not.toBe('rest');
    expect(restsOf(steps)).toEqual([]);
  });
});

describe('l’ordre et les cas vides', () => {
  it('suit l’ordre des blocs, pas celui du tableau', () => {
    const steps = buildGuidedSteps(
      makeSession({
        blocks: [
          makeBlock({ order: 2, type: 'amrap' }),
          makeBlock({ order: 1, type: 'warmup' }),
        ],
      })
    );
    expect(steps.map((e) => e.blockLabel)).toEqual(['Échauffement', 'AMRAP']);
  });

  it('une séance sans bloc ne donne aucune étape', () => {
    expect(buildGuidedSteps(makeSession({ blocks: [] }))).toEqual([]);
  });

  it('un bloc sans exercice donne quand même son étape', () => {
    const steps = buildGuidedSteps(
      makeSession({ blocks: [makeBlock({ type: 'amrap', exercises: [] })] })
    );
    expect(steps).toHaveLength(1);
    expect(blocksOf(steps)[0].sets).toEqual([]);
  });

  it('un bloc à tours sans exercice donne ses tours, vides', () => {
    const steps = roundsOf(
      buildGuidedSteps(
        makeSession({
          blocks: [makeBlock({ type: 'emom', rounds: 3, exercises: [] })],
        })
      )
    );
    expect(steps).toHaveLength(3);
    expect(steps[0].exercises).toEqual([]);
  });
});
