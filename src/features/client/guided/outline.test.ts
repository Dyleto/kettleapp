import { describe, expect, it } from 'vitest';
import {
  blockOutcome,
  blockSegments,
  firstGesture,
  openingEyebrow,
  positionLabel,
  rankLabel,
} from './outline';
import { setsOfBlock } from '@/domain/session/sets';
import {
  makeBlock,
  makeBlockExercise,
  makeExercise,
  makeSession,
} from '@/domain/fixtures';

const swing = makeExercise({ _id: 'ex-swing', name: 'Kettlebell Swing' });
const lunge = makeExercise({ _id: 'ex-lunge', name: 'Fentes marchées' });

describe("l'en-tête de l'ouverture", () => {
  it('donne le rang et le jour conseillé quand la séance a un nom', () => {
    expect(
      openingEyebrow({ order: 2, name: 'Haut du corps', suggestedDays: [5] })
    ).toBe('Séance 2 · conseillée le samedi');
  });

  it('ne répète pas le rang quand il est déjà le titre', () => {
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

describe('positionLabel', () => {
  const classic = makeBlock({
    order: 2,
    exercises: [makeBlockExercise({ sets: 4 })],
  });
  const session = makeSession({
    blocks: [
      makeBlock({ _id: 'bloc-0', order: 1, type: 'warmup' }),
      classic,
      makeBlock({ _id: 'bloc-3', order: 3, type: 'emom', rounds: 10 }),
    ],
  });

  it('compte en blocs, puis en séries', () => {
    const [first, second] = setsOfBlock(classic);
    expect(positionLabel(session, classic, [first.key, second.key])).toBe(
      'Bloc 2 sur 3 · série 3 sur 4'
    );
  });

  it('compte en tours quand l’horloge mène', () => {
    expect(
      positionLabel(session, session.blocks[2], [], { rank: 3, total: 10 })
    ).toBe('Bloc 3 sur 3 · tour 3 sur 10');
  });

  it('ne dit pas « sur » quand le bloc est sans limite', () => {
    expect(
      positionLabel(session, session.blocks[2], [], { rank: 7, total: null })
    ).toBe('Bloc 3 sur 3 · tour 7');
  });

  it('dit qu’un bloc est terminé quand tout y est coché', () => {
    const keys = setsOfBlock(classic).map((set) => set.key);
    expect(positionLabel(session, classic, keys)).toBe(
      'Bloc 2 sur 3 · terminé'
    );
  });

  it('s’en tient au bloc pour un AMRAP, qui ne se compte pas en séries', () => {
    const amrap = makeBlock({ order: 1, type: 'amrap', durationMinutes: 12 });
    expect(positionLabel(makeSession({ blocks: [amrap] }), amrap)).toBe(
      'Bloc 1 sur 1'
    );
  });

  it('range les blocs par leur ordre, pas par leur position dans le tableau', () => {
    const shuffled = makeSession({
      blocks: [session.blocks[2], session.blocks[0], classic],
    });
    expect(positionLabel(shuffled, classic).startsWith('Bloc 2 sur 3')).toBe(
      true
    );
  });
});

describe('blockSegments', () => {
  const block = (order: number) => ({
    type: 'block' as const,
    block: { order },
  });
  const round = (order: number) => ({
    type: 'round' as const,
    block: { order },
  });
  const rest = { type: 'rest' as const };

  it('donne un segment par bloc, même quand deux blocs voisins ont le même format', () => {
    // Le défaut d'origine : regroupés par nom de format, deux blocs
    // classiques se fondaient en un seul segment.
    expect(blockSegments([block(1), block(2), block(3)])).toEqual([
      { order: 1, start: 0, size: 1 },
      { order: 2, start: 1, size: 1 },
      { order: 3, start: 2, size: 1 },
    ]);
  });

  it('rattache un repos au bloc qui le précède', () => {
    expect(
      blockSegments([block(1), rest, round(2), round(2), round(2)])
    ).toEqual([
      { order: 1, start: 0, size: 2 },
      { order: 2, start: 2, size: 3 },
    ]);
  });

  it('ignore un repos qui ne suit aucun bloc', () => {
    expect(blockSegments([rest, block(1)])).toEqual([
      { order: 1, start: 1, size: 1 },
    ]);
  });

  it('ne rend rien pour une séance sans écran', () => {
    expect(blockSegments([])).toEqual([]);
  });
});

describe('blockOutcome', () => {
  const classic = makeBlock({
    order: 1,
    exercises: [
      makeBlockExercise({ order: 1, exercise: swing, sets: 4 }),
      makeBlockExercise({ order: 2, exercise: lunge, sets: 3 }),
    ],
  });
  const tabata = makeBlock({ order: 2, type: 'tabata', rounds: 8 });
  const emom = makeBlock({ order: 3, type: 'emom' });
  const amrap = makeBlock({ order: 4, type: 'amrap', durationMinutes: 12 });
  const ladder = makeBlock({
    order: 5,
    type: 'ladder',
    repsScheme: [2, 4, 6],
    exercises: [
      makeBlockExercise({ order: 1, exercise: swing }),
      makeBlockExercise({ order: 2, exercise: lunge }),
    ],
  });
  const session = makeSession({
    blocks: [classic, tabata, emom, amrap, ladder],
  });
  const keys = (block: typeof classic) =>
    setsOfBlock(block).map((set) => set.key);

  it('compte les séries faites, toutes', () => {
    expect(blockOutcome(session, classic, 'finished', keys(classic), 0)).toBe(
      'Bloc 1 terminé · 7\u00A0séries'
    );
  });

  it('dit ce qui a été fait, pas ce qui était prescrit', () => {
    const done = keys(classic).slice(0, 5);
    expect(blockOutcome(session, classic, 'finished', done, 0)).toBe(
      'Bloc 1 terminé · 5\u00A0séries sur 7'
    );
  });

  it('un bloc quitté sans rien y cocher est passé', () => {
    expect(blockOutcome(session, classic, 'finished', [], 0)).toBe(
      'Bloc 1 passé'
    );
    expect(blockOutcome(session, classic, 'skipped', keys(classic), 0)).toBe(
      'Bloc 1 passé'
    );
  });

  it('un bloc mené par l’horloge jusqu’au bout a fait tous ses tours', () => {
    expect(blockOutcome(session, tabata, 'finished', [], 0)).toBe(
      'Bloc 2 terminé · 8\u00A0tours'
    );
  });

  it('un bloc à horloge arrêté avant la fin ne donne pas de compte', () => {
    expect(blockOutcome(session, emom, 'stopped', [], 0)).toBe(
      'Bloc 3 terminé'
    );
    // Borné ou non : arrêté, il n'a pas fait ses huit tours.
    expect(blockOutcome(session, tabata, 'stopped', [], 0)).toBe(
      'Bloc 2 terminé'
    );
  });

  it('un AMRAP compte les tours tapés, quand il y en a', () => {
    expect(blockOutcome(session, amrap, 'finished', [], 5)).toBe(
      'Bloc 4 terminé · 5\u00A0tours'
    );
    expect(blockOutcome(session, amrap, 'finished', [], 1)).toBe(
      'Bloc 4 terminé · 1\u00A0tour'
    );
    expect(blockOutcome(session, amrap, 'finished', [], 0)).toBe(
      'Bloc 4 terminé'
    );
  });

  it('un palier de l’échelle ne compte que tous ses mouvements cochés', () => {
    const sets = setsOfBlock(ladder);
    // Le premier palier entier, et un seul mouvement du deuxième.
    const done = [
      ...sets.filter((set) => set.rank === 1).map((set) => set.key),
      sets.find((set) => set.rank === 2)!.key,
    ];
    expect(blockOutcome(session, ladder, 'finished', done, 0)).toBe(
      'Bloc 5 terminé · 1\u00A0palier sur 3'
    );
  });
});
