import { describe, expect, it } from 'vitest';
import {
  blockMarker,
  blockTitle,
  distinctExerciseCount,
  estimatedMinutes,
  firstGesture,
  openingEyebrow,
  openingTitle,
  rankLabel,
} from './outline';
import { setsOfBlock } from '../guidedSteps';
import {
  makeBlock,
  makeBlockExercise,
  makeExercise,
  makeSession,
} from '../fixtures';

const swing = makeExercise({ _id: 'ex-swing', name: 'Kettlebell Swing' });
const lunge = makeExercise({ _id: 'ex-lunge', name: 'Fentes marchées' });

describe('distinctExerciseCount', () => {
  it('compte les mouvements, pas les lignes', () => {
    // Le défaut d'origine : « 12 exercices » pour une séance de sept, parce
    // que l'écran comptait ses étapes.
    const session = makeSession({
      blocks: [
        makeBlock({
          order: 1,
          exercises: [
            makeBlockExercise({ order: 1, sets: 4 }),
            makeBlockExercise({ order: 2, exercise: swing, sets: 3 }),
          ],
        }),
      ],
    });
    expect(distinctExerciseCount(session)).toBe(2);
  });

  it('ne compte qu’une fois un mouvement repris dans deux blocs', () => {
    const session = makeSession({
      blocks: [
        makeBlock({ order: 1 }),
        makeBlock({
          _id: 'bloc-2',
          order: 2,
          type: 'emom',
          exercises: [
            makeBlockExercise({ order: 1 }),
            makeBlockExercise({ order: 2, exercise: swing }),
          ],
        }),
      ],
    });
    expect(distinctExerciseCount(session)).toBe(2);
  });

  it('vaut zéro pour une séance sans bloc', () => {
    expect(distinctExerciseCount(makeSession({ blocks: [] }))).toBe(0);
  });
});

describe('blockTitle', () => {
  it('prend le nom que le coach a donné', () => {
    expect(blockTitle({ type: 'classic', label: 'Renfo' })).toBe('Renfo');
  });

  it('retombe sur le nom du format, y compris pour un nom vide', () => {
    expect(blockTitle({ type: 'emom' })).toBe('EMOM');
    expect(blockTitle({ type: 'emom', label: '   ' })).toBe('EMOM');
  });
});

describe('blockMarker', () => {
  it('compte un EMOM en tours et en minutes', () => {
    expect(blockMarker(makeBlock({ type: 'emom', rounds: 10 }))).toBe(
      '10 tours · 10 min'
    );
    expect(
      blockMarker(makeBlock({ type: 'emom', rounds: 6, intervalMinutes: 2 }))
    ).toBe('6 tours · 12 min');
  });

  it('compte un Tabata avec son repos', () => {
    // 8 × (20 s + 10 s) = 4 min : le temps réel du bloc, repos compris.
    expect(
      blockMarker(
        makeBlock({
          type: 'tabata',
          rounds: 8,
          workDuration: 20,
          restDuration: 10,
        })
      )
    ).toBe('8 tours · 4 min');
  });

  it('donne à un AMRAP sa durée, ou dit qu’il n’en a pas', () => {
    expect(blockMarker(makeBlock({ type: 'amrap', durationMinutes: 12 }))).toBe(
      '12 min'
    );
    expect(blockMarker(makeBlock({ type: 'amrap' }))).toBe('sans limite');
  });

  it('compte un bloc classique en séries', () => {
    const block = makeBlock({
      exercises: [
        makeBlockExercise({ order: 1, sets: 4 }),
        makeBlockExercise({ order: 2, exercise: lunge, sets: 3 }),
      ],
    });
    expect(blockMarker(block)).toBe('7 séries');
  });

  it('compte en exercices un bloc où chaque mouvement n’a qu’une série', () => {
    const block = makeBlock({
      type: 'warmup',
      exercises: [
        makeBlockExercise({ order: 1 }),
        makeBlockExercise({ order: 2, exercise: swing }),
      ],
    });
    expect(blockMarker(block)).toBe('2 exercices');
  });

  it('compte une échelle en paliers et un chipper en mouvements', () => {
    expect(
      blockMarker(makeBlock({ type: 'ladder', repsScheme: [2, 4, 6, 4, 2] }))
    ).toBe('5 paliers');
    expect(
      blockMarker(
        makeBlock({
          type: 'chipper',
          durationMinutes: 20,
          exercises: [
            makeBlockExercise({ order: 1 }),
            makeBlockExercise({ order: 2, exercise: swing }),
            makeBlockExercise({ order: 3, exercise: lunge }),
          ],
        })
      )
    ).toBe('3 mouvements · 20 min');
  });

  it('s’accorde au singulier', () => {
    expect(blockMarker(makeBlock({ type: 'emom', rounds: 1 }))).toBe(
      '1 tour · 1 min'
    );
    expect(blockMarker(makeBlock())).toBe('1 exercice');
  });
});

describe('estimatedMinutes', () => {
  it('est exacte pour ce que l’horloge fixe', () => {
    const session = makeSession({
      blocks: [makeBlock({ type: 'emom', rounds: 10 })],
    });
    expect(estimatedMinutes(session)).toBe(10);
  });

  it('compte les repos écrits par le coach', () => {
    // 4 séries à 40 s + 3 repos d'une minute = 5 min 40, soit 5 arrondi à
    // cinq ; avec deux minutes de repos, 8 min 40, soit 10.
    const block = (rest: number) =>
      makeBlock({
        exercises: [makeBlockExercise({ sets: 4, restBetweenSets: rest })],
      });
    expect(estimatedMinutes(makeSession({ blocks: [block(60)] }))).toBe(5);
    expect(estimatedMinutes(makeSession({ blocks: [block(120)] }))).toBe(10);
  });

  it('ne descend jamais sous cinq minutes, même pour une séance vide', () => {
    expect(estimatedMinutes(makeSession({ blocks: [] }))).toBe(5);
  });

  it('est toujours un multiple de cinq', () => {
    const session = makeSession({
      blocks: [
        makeBlock({ order: 1, type: 'amrap', durationMinutes: 12 }),
        makeBlock({ _id: 'bloc-2', order: 2, type: 'emom', rounds: 7 }),
      ],
    });
    expect(estimatedMinutes(session) % 5).toBe(0);
  });
});

describe("l'en-tête de l'ouverture", () => {
  it('donne le rang et le jour conseillé quand la séance a un nom', () => {
    expect(
      openingEyebrow({ order: 2, name: 'Haut du corps', suggestedDays: [5] })
    ).toBe('Séance 2 · conseillée le samedi');
    expect(openingTitle({ order: 2, name: 'Haut du corps' })).toBe(
      'Haut du corps'
    );
  });

  it('ne répète pas le rang quand il est déjà le titre', () => {
    expect(openingTitle({ order: 3 })).toBe('Séance 3');
    expect(openingEyebrow({ order: 3, suggestedDays: [0, 3] })).toBe(
      'conseillée le lundi et le jeudi'
    );
    expect(openingEyebrow({ order: 3 })).toBe('');
  });

  it('se tait sur le jour quand aucun n’est conseillé', () => {
    expect(openingEyebrow({ order: 2, name: 'Haut du corps' })).toBe(
      'Séance 2'
    );
  });
});

describe('rankLabel', () => {
  const label = (
    block: ReturnType<typeof makeBlock>,
    index: number
  ): string => {
    const sets = setsOfBlock(block);
    return rankLabel(block, sets[index], sets);
  };

  it('compte en séries un mouvement qui en a plusieurs', () => {
    const block = makeBlock({ exercises: [makeBlockExercise({ sets: 4 })] });
    expect(label(block, 2)).toBe('Série 3 sur 4');
  });

  it('compte en exercices quand chaque mouvement n’a qu’une série', () => {
    const block = makeBlock({
      type: 'warmup',
      exercises: [
        makeBlockExercise({ order: 1 }),
        makeBlockExercise({ order: 2, exercise: swing }),
      ],
    });
    expect(label(block, 1)).toBe('Exercice 2 sur 2');
  });

  it('compte en paliers dans une échelle', () => {
    const block = makeBlock({
      type: 'ladder',
      repsScheme: [2, 4, 6, 8, 6, 4, 2],
      exercises: [
        makeBlockExercise({ order: 1 }),
        makeBlockExercise({ order: 2, exercise: swing }),
      ],
    });
    // Le septième geste est le premier mouvement du quatrième palier.
    expect(label(block, 6)).toBe('Palier 4 sur 7');
  });

  it('compte en mouvements dans un chipper', () => {
    const block = makeBlock({
      type: 'chipper',
      exercises: [
        makeBlockExercise({ order: 1 }),
        makeBlockExercise({ order: 2, exercise: swing }),
        makeBlockExercise({ order: 3, exercise: lunge }),
      ],
    });
    expect(label(block, 1)).toBe('Mouvement 2 sur 3');
  });
});

describe('firstGesture', () => {
  it('annonce le mouvement, son rang et sa dose', () => {
    const block = makeBlock({
      exercises: [makeBlockExercise({ sets: 4, reps: 10 })],
    });
    expect(firstGesture(block)).toEqual({
      title: 'Goblet Squat',
      detail: 'Série 1 sur 4 · 10 reps',
    });
  });

  it('reprend à la première série qui reste à faire', () => {
    const block = makeBlock({
      exercises: [makeBlockExercise({ sets: 4, reps: 10 })],
    });
    const [first, second] = setsOfBlock(block);
    expect(firstGesture(block, [first.key, second.key]).detail).toBe(
      'Série 3 sur 4 · 10 reps'
    );
  });

  it('annonce le bloc et son repère quand l’horloge mène', () => {
    expect(firstGesture(makeBlock({ type: 'emom', rounds: 10 }))).toEqual({
      title: 'EMOM',
      detail: '10 tours · 10 min',
    });
    expect(
      firstGesture(makeBlock({ type: 'amrap', durationMinutes: 12 }))
    ).toEqual({ title: 'AMRAP', detail: '12 min' });
  });

  it('ne lève pas sur un bloc sans exercice', () => {
    expect(firstGesture(makeBlock({ exercises: [] }))).toEqual({
      title: 'Classique',
      detail: '',
    });
  });
});
