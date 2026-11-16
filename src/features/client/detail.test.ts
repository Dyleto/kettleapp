import { describe, expect, it } from 'vitest';
import {
  blockChips,
  exerciseDose,
  exerciseSub,
  formatName,
  hasInstructions,
} from './detail';
import { makeBlock, makeBlockExercise, makeExercise } from './fixtures';

const NBSP = ' ';
const n = (text: string) => text.replaceAll(NBSP, ' ');

describe('formatName', () => {
  it('lit le format hérité « every » comme un EMOM', () => {
    expect(formatName('every')).toBe('EMOM');
    expect(formatName('tabata')).toBe('Tabata');
  });
});

describe('blockChips', () => {
  it('un Tabata : ses tours, son travail et son repos', () => {
    const tabata = makeBlock({
      type: 'tabata',
      rounds: 8,
      workDuration: 20,
      restDuration: 10,
    });
    expect(blockChips(tabata).map(n)).toEqual(['8 tours', '20 s / 10 s']);
  });

  it('un EMOM ne dit sa cadence que lorsqu’elle n’est pas à la minute', () => {
    expect(blockChips(makeBlock({ type: 'emom', rounds: 10 })).map(n)).toEqual([
      '10 tours',
    ]);
    expect(
      blockChips(
        makeBlock({ type: 'emom', rounds: 6, intervalMinutes: 2 })
      ).map(n)
    ).toEqual(['6 tours', 'toutes les 2 min']);
    expect(blockChips(makeBlock({ type: 'emom' }))).toEqual(['sans limite']);
  });

  it('une durée qui borne se dit « max », une durée qui fixe non', () => {
    expect(
      blockChips(makeBlock({ type: 'amrap', durationMinutes: 12 })).map(n)
    ).toEqual(['12 min']);
    expect(
      blockChips(makeBlock({ type: 'chipper', durationMinutes: 15 })).map(n)
    ).toEqual(['15 min max']);
  });

  it('une échelle : ses paliers, sa limite, son repos', () => {
    expect(
      blockChips(
        makeBlock({
          type: 'ladder',
          repsScheme: [2, 4, 6],
          durationMinutes: 10,
          restBetweenRounds: 30,
        })
      ).map(n)
    ).toEqual(['2-4-6', '10 min max', 'repos 30 s']);
  });

  it('un bloc classique n’a pas de pastille : tout est dans les doses', () => {
    expect(blockChips(makeBlock({ type: 'classic' }))).toEqual([]);
  });
});

describe('exerciseDose', () => {
  const classic = makeBlock({ type: 'classic' });
  it('des séries : « 4 × 10 »', () => {
    expect(
      exerciseDose(classic, makeBlockExercise({ sets: 4, reps: 10 }))
    ).toBe('4 × 10');
  });
  it('sans série, le nombre seul', () => {
    expect(
      exerciseDose(
        makeBlock({ type: 'amrap' }),
        makeBlockExercise({ reps: 15 })
      )
    ).toBe('15');
  });
  it('une durée, une mesure libre', () => {
    expect(n(exerciseDose(classic, makeBlockExercise({ duration: 60 })))).toBe(
      '1 min'
    );
    expect(
      n(
        exerciseDose(
          makeBlock({ type: 'chipper' }),
          makeBlockExercise({ customMetric: { value: 500, unit: 'm' } })
        )
      )
    ).toBe('500 m');
  });
  it('un Tabata sans répétitions se dose au temps de travail', () => {
    expect(
      n(
        exerciseDose(
          makeBlock({ type: 'tabata', workDuration: 20 }),
          makeBlockExercise()
        )
      )
    ).toBe('20 s');
  });
  it('une échelle n’a pas de dose par exercice', () => {
    expect(
      exerciseDose(
        makeBlock({ type: 'ladder', repsScheme: [1, 2, 3] }),
        makeBlockExercise({ reps: 5 })
      )
    ).toBe('');
  });
  it('des séries sans rien d’autre se comptent', () => {
    expect(exerciseDose(classic, makeBlockExercise({ sets: 3 }))).toBe(
      '3 séries'
    );
  });
});

describe('exerciseSub', () => {
  const classic = makeBlock({ type: 'classic' });
  it('le repos, puis la série la plus lourde de la dernière fois', () => {
    expect(
      n(
        exerciseSub(
          classic,
          makeBlockExercise({ sets: 4, reps: 10, restBetweenSets: 60 }),
          {
            completedAt: new Date(2026, 8, 1),
            sets: [{ weight: 24 }, { weight: 26 }, { weight: 22.5 }],
          }
        )
      )
    ).toBe('repos 1 min · la dernière fois 26 kg');
  });
  it('une charge décimale prend la virgule', () => {
    expect(
      n(
        exerciseSub(classic, makeBlockExercise(), {
          completedAt: new Date(2026, 8, 1),
          sets: [{ weight: 22.5 }],
        })
      )
    ).toBe('la dernière fois 22,5 kg');
  });
  it('jamais fait, pas de repos : rien', () => {
    expect(exerciseSub(classic, makeBlockExercise())).toBe('');
  });
});

describe('hasInstructions', () => {
  it('une note, une description ou une vidéo', () => {
    expect(hasInstructions(makeBlockExercise())).toBe(false);
    expect(hasInstructions(makeBlockExercise({ note: '  ' }))).toBe(false);
    expect(hasInstructions(makeBlockExercise({ note: 'Lent' }))).toBe(true);
    expect(
      hasInstructions(
        makeBlockExercise({
          exercise: makeExercise({ videoUrl: 'https://youtu.be/x' }),
        })
      )
    ).toBe(true);
  });
});
