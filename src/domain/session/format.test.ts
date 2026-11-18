/**
 * Changer le format d'un bloc : ce qu'il garde, ce qu'il perd, ce qu'il
 * reprend d'un bloc neuf.
 */
import { describe, expect, it } from 'vitest';
import { makeBlock, makeBlockExercise } from '@/domain/fixtures';
import { blockDefaults, withFormat } from './format';

describe('changer de format', () => {
  it('les réglages que le nouveau format lit aussi sont gardés', () => {
    const tabata = makeBlock({
      type: 'tabata',
      rounds: 6,
      workDuration: 40,
      restDuration: 20,
    });
    expect(withFormat(tabata, 'onoff')).toMatchObject({
      type: 'onoff',
      rounds: 6,
      workDuration: 40,
      restDuration: 20,
    });
  });

  // Les garder les renverrait à l'API sous un format qui ne les lit pas.
  it('les autres partent', () => {
    const emom = makeBlock({ type: 'emom', rounds: 10, intervalMinutes: 2 });
    const amrap = withFormat(emom, 'amrap');
    expect(amrap.rounds).toBeUndefined();
    expect(amrap.intervalMinutes).toBeUndefined();
  });

  it('ce qui manque reprend la valeur d’un bloc neuf', () => {
    const emom = makeBlock({ type: 'emom', rounds: 10, intervalMinutes: 2 });
    expect(withFormat(emom, 'amrap').durationMinutes).toBe(
      blockDefaults('amrap').durationMinutes
    );
  });

  it('une limite de temps passe d’un AMRAP à une échelle', () => {
    const amrap = makeBlock({ type: 'amrap', durationMinutes: 12 });
    expect(withFormat(amrap, 'ladder')).toMatchObject({
      durationMinutes: 12,
      repsScheme: [5, 10, 15, 20],
      restBetweenRounds: 60,
    });
  });

  // C'est le même bloc, qu'on fait autrement.
  it('les exercices, le nom et la consigne ne bougent pas', () => {
    const exercises = [makeBlockExercise({ reps: 12 })];
    const block = makeBlock({
      type: 'classic',
      label: 'Renfo',
      notes: 'Dos plat',
      exercises,
    });
    const emom = withFormat(block, 'emom');
    expect(emom.exercises).toBe(exercises);
    expect(emom.label).toBe('Renfo');
    expect(emom.notes).toBe('Dos plat');
    expect(emom._id).toBe(block._id);
  });

  it('vers un bloc classique, plus aucun réglage de format', () => {
    const ladder = makeBlock({
      type: 'ladder',
      repsScheme: [2, 4, 6],
      restBetweenRounds: 30,
      durationMinutes: 12,
    });
    const classic = withFormat(ladder, 'classic');
    expect([
      classic.repsScheme,
      classic.restBetweenRounds,
      classic.durationMinutes,
    ]).toEqual([undefined, undefined, undefined]);
  });
});
