import { describe, expect, it } from 'vitest';
import { blockDrawing, MAX_BARS } from './drawing';
import { makeBlock, makeBlockExercise } from '@/domain/fixtures';

describe('blockDrawing', () => {
  it('une échelle monte comme ses paliers', () => {
    const { bars } = blockDrawing(
      makeBlock({ type: 'ladder', repsScheme: [5, 10, 20] })
    );
    expect(bars).toEqual([0.25, 0.5, 1]);
  });

  it('un palier minuscule reste un trait, pas un point', () => {
    const { bars } = blockDrawing(
      makeBlock({ type: 'ladder', repsScheme: [1, 20] })
    );
    expect(bars[0]).toBe(0.18);
  });

  it('un Tabata alterne effort et repos, un tour par trait', () => {
    expect(
      blockDrawing(
        makeBlock({
          type: 'tabata',
          rounds: 8,
          workDuration: 20,
          restDuration: 10,
        })
      )
    ).toEqual({ bars: Array(8).fill(1), alternates: true });
  });

  it('un On / Off sans repos n’alterne pas : il n’y a rien à dessiner bas', () => {
    expect(
      blockDrawing(
        makeBlock({
          type: 'onoff',
          rounds: 4,
          workDuration: 40,
          restDuration: 0,
        })
      ).alternates
    ).toBe(false);
  });

  it('un bloc classique a un trait par série', () => {
    const block = makeBlock({
      type: 'classic',
      exercises: [
        makeBlockExercise({ sets: 3 }),
        makeBlockExercise({ sets: 2 }),
      ],
    });
    expect(blockDrawing(block).bars).toHaveLength(5);
  });

  it('au-delà de douze, le rythme et non l’inventaire', () => {
    expect(
      blockDrawing(makeBlock({ type: 'emom', rounds: 30 })).bars
    ).toHaveLength(MAX_BARS);
  });
});
