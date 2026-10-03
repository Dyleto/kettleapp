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
  bilan,
  bloc,
  blocFige,
  exercice,
  figer,
  pose,
  seance,
} from './fixtures';

/** Une séance et son bilan, identiques par construction. */
const paire = (blocs = [bloc()]) => {
  const s = seance({ blocks: blocs });
  return {
    session: s,
    history: [bilan({ originalSessionId: s._id, blocks: blocs.map(figer) })],
  };
};

describe('ce qui rompt la correspondance', () => {
  it('rien, quand le contenu est le même', () => {
    const { session, history } = paire();
    expect(matchSession(session, history).state).toBe('done');
  });

  it('un changement de répétitions', () => {
    const { session, history } = paire([
      bloc({ exercises: [pose({ reps: 10 })] }),
    ]);
    session.blocks[0].exercises[0].reps = 12;
    expect(matchSession(session, history).state).toBe('changed');
  });

  it('un changement de séries', () => {
    const { session, history } = paire([
      bloc({ exercises: [pose({ sets: 3 })] }),
    ]);
    session.blocks[0].exercises[0].sets = 4;
    expect(matchSession(session, history).state).toBe('changed');
  });

  it('un changement de tours', () => {
    const { session, history } = paire([bloc({ type: 'amrap', rounds: 5 })]);
    session.blocks[0].rounds = 6;
    expect(matchSession(session, history).state).toBe('changed');
  });

  it('un palier de pyramide retiré', () => {
    const { session, history } = paire([
      bloc({ type: 'pyramid', repsScheme: [21, 15, 9] }),
    ]);
    session.blocks[0].repsScheme = [21, 15];
    expect(matchSession(session, history).state).toBe('changed');
  });

  it('un exercice remplacé par un autre', () => {
    const { session, history } = paire();
    session.blocks[0].exercises[0].exercise = exercice({ _id: 'ex-autre' });
    expect(matchSession(session, history).state).toBe('changed');
  });

  it('un bloc ajouté', () => {
    const { session, history } = paire();
    session.blocks.push(bloc({ order: 2, type: 'amrap' }));
    expect(matchSession(session, history).state).toBe('changed');
  });

  it("l'ordre de deux blocs échangé", () => {
    const a = bloc({ order: 1, type: 'warmup' });
    const b = bloc({ order: 2, type: 'amrap' });
    const { session, history } = paire([a, b]);
    session.blocks = [
      { ...a, order: 2 },
      { ...b, order: 1 },
    ];
    expect(matchSession(session, history).state).toBe('changed');
  });

  it("l'ordre de deux exercices échangé dans un bloc", () => {
    const un = pose({ order: 1, exercise: exercice({ _id: 'ex-un' }) });
    const deux = pose({ order: 2, exercise: exercice({ _id: 'ex-deux' }) });
    const { session, history } = paire([bloc({ exercises: [un, deux] })]);
    session.blocks[0].exercises = [
      { ...un, order: 2 },
      { ...deux, order: 1 },
    ];
    expect(matchSession(session, history).state).toBe('changed');
  });

  it('un changement de mesure libre', () => {
    const { session, history } = paire([
      bloc({ exercises: [pose({ customMetric: { value: 400, unit: 'm' } })] }),
    ]);
    session.blocks[0].exercises[0].customMetric = { value: 500, unit: 'm' };
    expect(matchSession(session, history).state).toBe('changed');
  });
});

describe('ce qui ne la rompt pas', () => {
  it('renommer la séance', () => {
    const { session, history } = paire();
    session.name = 'Full body A';
    expect(matchSession(session, history).state).toBe('done');
  });

  it('renommer un bloc', () => {
    const { session, history } = paire();
    session.blocks[0].label = 'AMRAP 12';
    expect(matchSession(session, history).state).toBe('done');
  });

  it("changer la note de la séance ou la consigne d'un bloc", () => {
    const { session, history } = paire();
    session.notes = 'On garde 2 reps en réserve.';
    session.blocks[0].notes = 'Rythme régulier.';
    expect(matchSession(session, history).state).toBe('done');
  });

  it("changer la consigne d'un exercice", () => {
    const { session, history } = paire();
    session.blocks[0].exercises[0].note = 'Attention épaule droite';
    expect(matchSession(session, history).state).toBe('done');
  });

  it("renommer l'exercice de bibliothèque, à identifiant égal", () => {
    const { session, history } = paire();
    session.blocks[0].exercises[0].exercise = {
      ...session.blocks[0].exercises[0].exercise,
      name: 'Squat gobelet',
    };
    expect(matchSession(session, history).state).toBe('done');
  });

  it('changer les jours conseillés', () => {
    const { session, history } = paire();
    session.suggestedDays = [0, 3];
    expect(matchSession(session, history).state).toBe('done');
  });

  it('ce que le client a réellement fait', () => {
    const { session, history } = paire();
    history[0].blocks[0].exercises[0].performed = {
      sets: [{ weight: 26, reps: 10 }],
    };
    history[0].blocks[0].performedRounds = 7;
    expect(matchSession(session, history).state).toBe('done');
  });

  it("le `_id` d'un bloc, que l'instantané ne porte pas", () => {
    const { session, history } = paire();
    session.blocks[0]._id = 'bloc-tout-neuf';
    expect(matchSession(session, history).state).toBe('done');
  });
});

describe('les trois réponses', () => {
  it("« jamais faite » quand aucun bilan ne porte l'identifiant", () => {
    const s = seance();
    const autre = bilan({ originalSessionId: 'une-autre-seance' });
    expect(matchSession(s, [autre]).state).toBe('never');
  });

  it('« jamais faite » sur un historique vide', () => {
    expect(matchSession(seance(), []).state).toBe('never');
  });

  it("« modifiée depuis » quand l'identifiant correspond mais pas le contenu", () => {
    const s = seance();
    const vieux = bilan({
      originalSessionId: s._id,
      blocks: [blocFige({ type: 'amrap' })],
    });
    expect(matchSession(s, [vieux]).state).toBe('changed');
  });

  it('« faite », à la date du bilan le plus récent', () => {
    const blocs = [bloc()];
    const s = seance({ blocks: blocs });
    const faits = blocs.map(figer);
    const resultat = matchSession(s, [
      bilan({
        originalSessionId: s._id,
        blocks: faits,
        completedAt: '2026-09-01T10:00:00.000Z',
      }),
      bilan({
        originalSessionId: s._id,
        blocks: faits,
        completedAt: '2026-09-20T07:30:00.000Z',
      }),
      bilan({
        originalSessionId: s._id,
        blocks: faits,
        completedAt: '2026-09-12T18:00:00.000Z',
      }),
    ]);
    expect(resultat).toEqual({
      state: 'done',
      on: new Date('2026-09-20T07:30:00.000Z'),
    });
  });

  it('une forme ancienne ne masque pas la forme actuelle', () => {
    // Le client a fait la séance, le coach l'a remaniée, le client l'a refaite.
    // C'est « faite » — et à la date de la seconde fois.
    const blocs = [bloc()];
    const s = seance({ blocks: blocs });
    const resultat = matchSession(s, [
      bilan({
        originalSessionId: s._id,
        blocks: [blocFige({ type: 'amrap' })],
        completedAt: '2026-09-25T10:00:00.000Z',
      }),
      bilan({
        originalSessionId: s._id,
        blocks: blocs.map(figer),
        completedAt: '2026-09-10T10:00:00.000Z',
      }),
    ]);
    expect(resultat).toEqual({
      state: 'done',
      on: new Date('2026-09-10T10:00:00.000Z'),
    });
  });

  it('une séance sans bloc correspond à un bilan sans bloc', () => {
    const s = seance({ blocks: [] });
    const vide = bilan({ originalSessionId: s._id, blocks: [] });
    expect(matchSession(s, [vide]).state).toBe('done');
  });
});

describe('la dose, prise seule', () => {
  it('ne dépend pas de l’ordre du tableau, mais du champ `order`', () => {
    const a = bloc({ order: 1, type: 'warmup' });
    const b = bloc({ order: 2, type: 'amrap' });
    expect(sessionDose([a, b])).toBe(sessionDose([b, a]));
  });

  // Zéro et absent sont deux affirmations différentes partout dans Kettle —
  // « zéro répétition » n'est pas « aucune répétition prescrite ». Chaque
  // champ est éprouvé : le premier essai n'en couvrait qu'un, et retirer la
  // distinction sur `sets` ne faisait tomber aucun test.
  const champsDExercice = [
    'sets',
    'reps',
    'duration',
    'restBetweenSets',
  ] as const;

  it.each(champsDExercice)('distingue `%s` absent de zéro', (champ) => {
    const sans = bloc({ exercises: [pose({})] });
    const zero = bloc({ exercises: [pose({ [champ]: 0 })] });
    expect(sessionDose([sans])).not.toBe(sessionDose([zero]));
  });

  const champsDeBloc = [
    'rounds',
    'durationMinutes',
    'intervalMinutes',
    'restBetweenRounds',
    'workDuration',
    'restDuration',
  ] as const;

  it.each(champsDeBloc)('distingue `%s` absent de zéro', (champ) => {
    expect(sessionDose([bloc()])).not.toBe(sessionDose([bloc({ [champ]: 0 })]));
  });

  // Le rang ne fait pas partie de la dose : c'est le tri qui porte la suite.
  // Une renumérotation qui ne change pas l'ordre ne change donc rien.
  it('ne bouge pas quand des rangs non contigus sont renumérotés', () => {
    const a = bloc({ order: 1, type: 'warmup' });
    const b = bloc({ order: 3, type: 'amrap' });
    expect(sessionDose([a, b])).toBe(sessionDose([a, { ...b, order: 2 }]));
  });

  it("de même pour les rangs d'exercices", () => {
    const un = pose({ order: 1, exercise: exercice({ _id: 'ex-un' }) });
    const deux = pose({ order: 3, exercise: exercice({ _id: 'ex-deux' }) });
    expect(sessionDose([bloc({ exercises: [un, deux] })])).toBe(
      sessionDose([bloc({ exercises: [un, { ...deux, order: 2 }] })])
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
    const libelle = matchLabel({
      state: 'done',
      on: new Date('2026-09-12T10:00:00.000Z'),
    });
    expect(libelle).toMatch(/^Faite le 12 sept/);
  });
});
