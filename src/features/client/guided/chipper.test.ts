/**
 * Ce que compte un chipper borné : des mouvements entiers.
 *
 * Le banc mène la feuille « Temps écoulé » ; ici, ce qu'elle décide — le
 * mouvement proposé, ce que confirmer coche, et une correction qui recule
 * sans rien effacer.
 */
import { describe, expect, it } from 'vitest';
import { setsOfBlock } from '@/domain/session/sets';
import { makeBlock, makeBlockExercise, makeExercise } from '@/domain/fixtures';
import {
  doneBefore,
  isCappedList,
  movementReached,
  movementsDone,
} from './chipper';

const chipper = makeBlock({
  order: 1,
  type: 'chipper',
  durationMinutes: 20,
  exercises: [
    makeBlockExercise({
      order: 1,
      exercise: makeExercise({ _id: 'ex-burpee', name: 'Burpee' }),
      reps: 21,
    }),
    makeBlockExercise({
      order: 2,
      exercise: makeExercise({ _id: 'ex-swing', name: 'Kettlebell Swing' }),
      reps: 15,
    }),
    makeBlockExercise({
      order: 3,
      exercise: makeExercise({ _id: 'ex-pompe', name: 'Pompes' }),
      reps: 9,
    }),
  ],
});
const sets = setsOfBlock(chipper);
const [burpee, swing, pompe] = sets.map((set) => set.key);

describe('un chipper borné', () => {
  it('compte les mouvements faits', () => {
    expect(movementsDone(sets, [])).toBe(0);
    expect(movementsDone(sets, [burpee, swing])).toBe(2);
  });

  it('propose le premier mouvement qui n’est pas fait', () => {
    expect(movementReached(sets, [])).toBe(1);
    expect(movementReached(sets, [burpee])).toBe(2);
    // Un mouvement passé n'est pas fait : c'est lui qu'on proposait de
    // reprendre, pas le suivant.
    expect(movementReached(sets, [burpee, pompe])).toBe(2);
  });

  it('au-delà du dernier, le dernier', () => {
    expect(movementReached(sets, [burpee, swing, pompe])).toBe(3);
  });

  it('confirmer un mouvement coche tout ce qui le précède', () => {
    const done = doneBefore(sets, [], 3);
    expect(done).toEqual([burpee, swing]);
    expect(movementsDone(sets, done)).toBe(2);
  });

  it('un mouvement à deux séries ne compte qu’une fois les deux cochées', () => {
    // Le découpage d'un chipper n'en donne qu'une ; celui d'un bloc
    // classique en donne deux, et le compte doit tenir le jour où un
    // chipper en recevrait.
    const twice = setsOfBlock(
      makeBlock({
        order: 2,
        exercises: [
          makeBlockExercise({ order: 1, sets: 2, reps: 10 }),
          makeBlockExercise({ order: 2, reps: 8 }),
        ],
      })
    );
    const [first] = twice.map((set) => set.key);
    expect(movementsDone(twice, [first])).toBe(0);
    expect(movementReached(twice, [first])).toBe(1);
  });

  it('sans effacer ce qui a été coché plus loin', () => {
    // Reculer d'un mouvement garde la série de pompes notée.
    expect(doneBefore(sets, [burpee, pompe], 2)).toEqual([pompe, burpee]);
  });
});

describe('une liste bornée', () => {
  it('un chipper ou un TimeCap dont le coach a fixé la limite', () => {
    expect(isCappedList({ type: 'chipper', durationMinutes: 20 })).toBe(true);
    expect(isCappedList({ type: 'timecap', durationMinutes: 12 })).toBe(true);
  });

  it('sans limite, ou d’un autre format, la liste se coche sans chrono', () => {
    expect(isCappedList({ type: 'chipper' })).toBe(false);
    // `durationMinutes` traîne sur des blocs qui n'en font rien : c'est le
    // format qui décide.
    expect(isCappedList({ type: 'warmup', durationMinutes: 8 })).toBe(false);
  });
});
