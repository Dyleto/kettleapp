import { describe, expect, it } from 'vitest';
import { setsOfBlock } from '@/domain/session/sets';
import { makeBlock, makeBlockExercise, makeExercise } from '@/domain/fixtures';
import {
  doneUpTo,
  ladderState,
  minutesSeconds,
  rungCount,
  rungSets,
  stepHeight,
} from './ladder';

// Deux mouvements, quatre paliers : huit séries, deux par palier.
const ladder = makeBlock({
  type: 'ladder',
  repsScheme: [2, 4, 6, 4],
  exercises: [
    makeBlockExercise({ order: 1 }),
    makeBlockExercise({
      order: 2,
      exercise: makeExercise({ _id: 'ex-squat', name: 'Goblet Squat' }),
    }),
  ],
});
const sets = setsOfBlock(ladder);
const keysOf = (rung: number) => rungSets(sets, rung).map((set) => set.key);

describe('ladderState', () => {
  it('compte les paliers et commence au premier', () => {
    expect(rungCount(sets)).toBe(4);
    expect(ladderState(sets, new Set())).toEqual({
      count: 4,
      done: 0,
      current: 1,
    });
  });

  it("ne tient un palier pour fait que si chacun de ses mouvements l'est", () => {
    const half = new Set([...keysOf(1), keysOf(2)[0]]);
    expect(ladderState(sets, half)).toEqual({ count: 4, done: 1, current: 2 });
  });

  it('compte les paliers faits un à un, même avec un creux', () => {
    const gap = new Set([...keysOf(1), ...keysOf(3)]);
    expect(ladderState(sets, gap)).toEqual({ count: 4, done: 2, current: 2 });
  });

  it('passe au-delà du dernier quand tout est fait', () => {
    const all = new Set(sets.map((set) => set.key));
    expect(ladderState(sets, all)).toEqual({ count: 4, done: 4, current: 5 });
  });
});

describe('doneUpTo', () => {
  it('coche tout ce qui est sous le palier visé, et rien au-dessus', () => {
    const next = doneUpTo(sets, [...keysOf(4)], 3);
    expect(next.sort()).toEqual([...keysOf(1), ...keysOf(2)].sort());
  });

  it('garde les séries des autres blocs', () => {
    expect(doneUpTo(sets, ['9:1:1'], 1)).toEqual(['9:1:1']);
  });
});

describe('stepHeight', () => {
  it('suit les répétitions, sans descendre sous 28 %', () => {
    expect(stepHeight(8, 8)).toBe(100);
    expect(stepHeight(2, 8)).toBe(46);
    expect(stepHeight(0, 8)).toBe(28);
    expect(stepHeight(3, 0)).toBe(28);
  });
});

describe('minutesSeconds', () => {
  it('écrit « 2:18 », sans zéro devant les minutes', () => {
    expect(minutesSeconds(138)).toBe('2:18');
    expect(minutesSeconds(582)).toBe('9:42');
    expect(minutesSeconds(5)).toBe('0:05');
  });
});
