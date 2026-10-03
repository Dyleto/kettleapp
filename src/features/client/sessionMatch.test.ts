/**
 * La correspondance de séance, par le contenu et non par l'identifiant.
 *
 * C'est le mécanisme qui a été écrit sur un retour du terrain précis : « j'ai
 * modifié mon programme en changeant les séances plutôt qu'en les supprimant
 * et en les recréant, donc elles ont gardé le même id, et ça me met une
 * séance comme terminée alors que je ne l'ai jamais faite. »
 *
 * Le banc le couvre déjà par l'écran, et c'est ce qui prouve que la chaîne
 * entière tient. Ce qu'il ne peut pas couvrir, c'est la frontière : quels
 * changements rompent la correspondance et lesquels ne la rompent pas. Elle
 * se décrit en une table de vingt cas, dont aucun ne se construit dans
 * l'atelier — on n'y fabrique pas une séance sans bloc, ni deux bilans à la
 * seconde près.
 */
import { describe, expect, it } from 'vitest';
import { matchLabel, matchSession, sessionDose } from './sessionMatch';
import {
  makeCompleted,
  makeBlock,
  makeBlockSnapshot,
  makeExercise,
  freeze,
  makeBlockExercise,
  makeSession,
} from './fixtures';

/** Une séance et son bilan, identiques par construction. */
const pair = (blocksOf = [makeBlock()]) => {
  const s = makeSession({ blocks: blocksOf });
  return {
    session: s,
    history: [
      makeCompleted({ originalSessionId: s._id, blocks: blocksOf.map(freeze) }),
    ],
  };
};

describe('ce qui rompt la correspondance', () => {
  it('rien, quand le contenu est le même', () => {
    const { session, history } = pair();
    expect(matchSession(session, history).state).toBe('done');
  });

  it('un changement de répétitions', () => {
    const { session, history } = pair([
      makeBlock({ exercises: [makeBlockExercise({ reps: 10 })] }),
    ]);
    session.blocks[0].exercises[0].reps = 12;
    expect(matchSession(session, history).state).toBe('changed');
  });

  it('un changement de séries', () => {
    const { session, history } = pair([
      makeBlock({ exercises: [makeBlockExercise({ sets: 3 })] }),
    ]);
    session.blocks[0].exercises[0].sets = 4;
    expect(matchSession(session, history).state).toBe('changed');
  });

  it('un changement de tours', () => {
    const { session, history } = pair([
      makeBlock({ type: 'amrap', rounds: 5 }),
    ]);
    session.blocks[0].rounds = 6;
    expect(matchSession(session, history).state).toBe('changed');
  });

  it('un palier de pyramide retiré', () => {
    const { session, history } = pair([
      makeBlock({ type: 'pyramid', repsScheme: [21, 15, 9] }),
    ]);
    session.blocks[0].repsScheme = [21, 15];
    expect(matchSession(session, history).state).toBe('changed');
  });

  it('un exercice remplacé par un autre', () => {
    const { session, history } = pair();
    session.blocks[0].exercises[0].exercise = makeExercise({ _id: 'ex-autre' });
    expect(matchSession(session, history).state).toBe('changed');
  });

  it('un bloc ajouté', () => {
    const { session, history } = pair();
    session.blocks.push(makeBlock({ order: 2, type: 'amrap' }));
    expect(matchSession(session, history).state).toBe('changed');
  });

  it("l'ordre de deux blocs échangé", () => {
    const a = makeBlock({ order: 1, type: 'warmup' });
    const b = makeBlock({ order: 2, type: 'amrap' });
    const { session, history } = pair([a, b]);
    session.blocks = [
      { ...a, order: 2 },
      { ...b, order: 1 },
    ];
    expect(matchSession(session, history).state).toBe('changed');
  });

  it("l'ordre de deux exercices échangé dans un bloc", () => {
    const one = makeBlockExercise({
      order: 1,
      exercise: makeExercise({ _id: 'ex-un' }),
    });
    const two = makeBlockExercise({
      order: 2,
      exercise: makeExercise({ _id: 'ex-deux' }),
    });
    const { session, history } = pair([makeBlock({ exercises: [one, two] })]);
    session.blocks[0].exercises = [
      { ...one, order: 2 },
      { ...two, order: 1 },
    ];
    expect(matchSession(session, history).state).toBe('changed');
  });

  it('un changement de mesure libre', () => {
    const { session, history } = pair([
      makeBlock({
        exercises: [
          makeBlockExercise({ customMetric: { value: 400, unit: 'm' } }),
        ],
      }),
    ]);
    session.blocks[0].exercises[0].customMetric = { value: 500, unit: 'm' };
    expect(matchSession(session, history).state).toBe('changed');
  });
});

describe('ce qui ne la rompt pas', () => {
  it('renommer la séance', () => {
    const { session, history } = pair();
    session.name = 'Full body A';
    expect(matchSession(session, history).state).toBe('done');
  });

  it('renommer un bloc', () => {
    const { session, history } = pair();
    session.blocks[0].label = 'AMRAP 12';
    expect(matchSession(session, history).state).toBe('done');
  });

  it("changer la note de la séance ou la consigne d'un bloc", () => {
    const { session, history } = pair();
    session.notes = 'On garde 2 reps en réserve.';
    session.blocks[0].notes = 'Rythme régulier.';
    expect(matchSession(session, history).state).toBe('done');
  });

  it("changer la consigne d'un exercice", () => {
    const { session, history } = pair();
    session.blocks[0].exercises[0].note = 'Attention épaule droite';
    expect(matchSession(session, history).state).toBe('done');
  });

  it("renommer l'exercice de bibliothèque, à identifiant égal", () => {
    const { session, history } = pair();
    session.blocks[0].exercises[0].exercise = {
      ...session.blocks[0].exercises[0].exercise,
      name: 'Squat gobelet',
    };
    expect(matchSession(session, history).state).toBe('done');
  });

  it('changer les jours conseillés', () => {
    const { session, history } = pair();
    session.suggestedDays = [0, 3];
    expect(matchSession(session, history).state).toBe('done');
  });

  it('ce que le client a réellement fait', () => {
    const { session, history } = pair();
    history[0].blocks[0].exercises[0].performed = {
      sets: [{ weight: 26, reps: 10 }],
    };
    history[0].blocks[0].performedRounds = 7;
    expect(matchSession(session, history).state).toBe('done');
  });

  it("le `_id` d'un bloc, que l'instantané ne porte pas", () => {
    const { session, history } = pair();
    session.blocks[0]._id = 'bloc-tout-neuf';
    expect(matchSession(session, history).state).toBe('done');
  });
});

describe('les trois réponses', () => {
  it("« jamais faite » quand aucun bilan ne porte l'identifiant", () => {
    const s = makeSession();
    const other = makeCompleted({ originalSessionId: 'une-autre-seance' });
    expect(matchSession(s, [other]).state).toBe('never');
  });

  it('« jamais faite » sur un historique vide', () => {
    expect(matchSession(makeSession(), []).state).toBe('never');
  });

  it("« modifiée depuis » quand l'identifiant correspond mais pas le contenu", () => {
    const s = makeSession();
    const old = makeCompleted({
      originalSessionId: s._id,
      blocks: [makeBlockSnapshot({ type: 'amrap' })],
    });
    expect(matchSession(s, [old]).state).toBe('changed');
  });

  it('« faite », à la date du bilan le plus récent', () => {
    const blocksOf = [makeBlock()];
    const s = makeSession({ blocks: blocksOf });
    const snapshots = blocksOf.map(freeze);
    const result = matchSession(s, [
      makeCompleted({
        originalSessionId: s._id,
        blocks: snapshots,
        completedAt: '2026-09-01T10:00:00.000Z',
      }),
      makeCompleted({
        originalSessionId: s._id,
        blocks: snapshots,
        completedAt: '2026-09-20T07:30:00.000Z',
      }),
      makeCompleted({
        originalSessionId: s._id,
        blocks: snapshots,
        completedAt: '2026-09-12T18:00:00.000Z',
      }),
    ]);
    expect(result).toEqual({
      state: 'done',
      on: new Date('2026-09-20T07:30:00.000Z'),
    });
  });

  it('une forme ancienne ne masque pas la forme actuelle', () => {
    // Le client a fait la séance, le coach l'a remaniée, le client l'a refaite.
    // C'est « faite » — et à la date de la seconde fois.
    const blocksOf = [makeBlock()];
    const s = makeSession({ blocks: blocksOf });
    const result = matchSession(s, [
      makeCompleted({
        originalSessionId: s._id,
        blocks: [makeBlockSnapshot({ type: 'amrap' })],
        completedAt: '2026-09-25T10:00:00.000Z',
      }),
      makeCompleted({
        originalSessionId: s._id,
        blocks: blocksOf.map(freeze),
        completedAt: '2026-09-10T10:00:00.000Z',
      }),
    ]);
    expect(result).toEqual({
      state: 'done',
      on: new Date('2026-09-10T10:00:00.000Z'),
    });
  });

  it('une séance sans bloc correspond à un bilan sans bloc', () => {
    const s = makeSession({ blocks: [] });
    const empty = makeCompleted({ originalSessionId: s._id, blocks: [] });
    expect(matchSession(s, [empty]).state).toBe('done');
  });
});

describe('la dose, prise seule', () => {
  it('ne dépend pas de l’ordre du tableau, mais du champ `order`', () => {
    const a = makeBlock({ order: 1, type: 'warmup' });
    const b = makeBlock({ order: 2, type: 'amrap' });
    expect(sessionDose([a, b])).toBe(sessionDose([b, a]));
  });

  // Zéro et absent sont deux affirmations différentes partout dans Kettle —
  // « zéro répétition » n'est pas « aucune répétition prescrite ». Chaque
  // champ est éprouvé : le premier essai n'en couvrait qu'un, et retirer la
  // distinction sur `sets` ne faisait tomber aucun test.
  const exerciseFields = [
    'sets',
    'reps',
    'duration',
    'restBetweenSets',
  ] as const;

  it.each(exerciseFields)('distingue `%s` absent de zéro', (field) => {
    const without = makeBlock({ exercises: [makeBlockExercise({})] });
    const zero = makeBlock({ exercises: [makeBlockExercise({ [field]: 0 })] });
    expect(sessionDose([without])).not.toBe(sessionDose([zero]));
  });

  const blockFields = [
    'rounds',
    'durationMinutes',
    'intervalMinutes',
    'restBetweenRounds',
    'workDuration',
    'restDuration',
  ] as const;

  it.each(blockFields)('distingue `%s` absent de zéro', (field) => {
    expect(sessionDose([makeBlock()])).not.toBe(
      sessionDose([makeBlock({ [field]: 0 })])
    );
  });

  // Le rang ne fait pas partie de la dose : c'est le tri qui porte la suite.
  // Une renumérotation qui ne change pas l'ordre ne change donc rien.
  it('ne bouge pas quand des rangs non contigus sont renumérotés', () => {
    const a = makeBlock({ order: 1, type: 'warmup' });
    const b = makeBlock({ order: 3, type: 'amrap' });
    expect(sessionDose([a, b])).toBe(sessionDose([a, { ...b, order: 2 }]));
  });

  it("de même pour les rangs d'exercices", () => {
    const one = makeBlockExercise({
      order: 1,
      exercise: makeExercise({ _id: 'ex-un' }),
    });
    const two = makeBlockExercise({
      order: 3,
      exercise: makeExercise({ _id: 'ex-deux' }),
    });
    expect(sessionDose([makeBlock({ exercises: [one, two] })])).toBe(
      sessionDose([makeBlock({ exercises: [one, { ...two, order: 2 }] })])
    );
  });
});

describe('ce qui se lit à l’écran', () => {
  it('« Jamais faite »', () => {
    expect(matchLabel({ state: 'never' })).toBe('Jamais faite');
  });

  it('« Modifiée depuis »', () => {
    expect(matchLabel({ state: 'changed' })).toBe('Modifiée depuis');
  });

  it('une date abrégée, en français', () => {
    const label = matchLabel({
      state: 'done',
      on: new Date('2026-09-12T10:00:00.000Z'),
    });
    expect(label).toMatch(/^Faite le 12 sept/);
  });
});
