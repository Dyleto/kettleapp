import { describe, expect, it } from 'vitest';
import { startedAgo, unfinishedSession } from './unfinished';
import { buildGuidedSteps } from '@/features/client/guided/steps';
import { setsOfBlock } from '@/domain/session/sets';
import type { readProgress } from '@/features/client/guided/sessionProgress';
import { makeBlock, makeBlockExercise, makeSession } from '@/domain/fixtures';

type Saved = NonNullable<ReturnType<typeof readProgress>>;

const classic = makeBlock({
  _id: 'bloc-2',
  order: 2,
  exercises: [makeBlockExercise({ sets: 4 })],
});
const SESSION = makeSession({
  _id: 's',
  updatedAt: '2026-09-01T08:00:00.000Z',
  blocks: [
    makeBlock({ _id: 'bloc-1', order: 1, type: 'warmup' }),
    classic,
    makeBlock({ _id: 'bloc-3', order: 3, type: 'emom', rounds: 10 }),
  ],
});
const STEPS = buildGuidedSteps(SESSION);
const stepOf = (order: number, round = 1) =>
  STEPS.findIndex(
    (s) =>
      s.type !== 'rest' &&
      s.block.order === order &&
      (s.type !== 'round' || s.round === round)
  );
const STARTED = new Date('2026-09-01T09:00:00.000Z').getTime();
const saved = (patch: Partial<Saved> = {}): Saved => ({
  version: 2,
  step: 0,
  performed: {},
  done: [],
  rounds: {},
  skipped: [],
  ladder: {},
  startedAt: STARTED,
  updatedAt: STARTED + 20 * 60000,
  ...patch,
});
const reader =
  (records: Record<string, Saved>): typeof readProgress =>
  (id) =>
    records[id] ?? null;

describe('unfinishedSession', () => {
  const warmupKeys = setsOfBlock(SESSION.blocks[0]).map((s) => s.key);
  const [first, second] = setsOfBlock(classic);

  it('rien d’enregistré : rien à reprendre', () => {
    expect(unfinishedSession([SESSION], reader({}))).toBeUndefined();
  });

  it('une ouverture regardée n’est pas une séance commencée', () => {
    expect(
      unfinishedSession([SESSION], reader({ s: saved() }))
    ).toBeUndefined();
  });

  it('dit le bloc et la série où l’on s’est arrêté', () => {
    const found = unfinishedSession(
      [SESSION],
      reader({
        s: saved({
          step: stepOf(2),
          done: [...warmupKeys, first.key, second.key],
        }),
      })
    );
    expect(found?.where).toEqual(['Bloc 2 sur 3', 'Série 3 sur 4']);
    expect(found?.blocks).toEqual([1, 0.5, 0]);
    expect(found?.changed).toBe(false);
  });

  it('un bloc dont tout est coché ne s’annonce pas « terminé »', () => {
    // On a coché la dernière série puis fermé avant de passer au bloc
    // suivant : la carte dit où l'on est, pas un « Terminé » sur une
    // séance « En cours ».
    const found = unfinishedSession(
      [SESSION],
      reader({
        s: saved({
          step: stepOf(2),
          done: [...warmupKeys, ...setsOfBlock(classic).map((s) => s.key)],
        }),
      })
    );
    expect(found?.where).toEqual(['Bloc 2 sur 3']);
  });

  it('dans un bloc mené par l’horloge, compte les tours passés', () => {
    const found = unfinishedSession(
      [SESSION],
      reader({
        s: saved({
          step: stepOf(3, 4),
          done: [...warmupKeys, ...setsOfBlock(classic).map((s) => s.key)],
        }),
      })
    );
    expect(found?.where).toEqual(['Bloc 3 sur 3']);
    expect(found?.blocks).toEqual([1, 1, 0.3]);
  });

  it('plusieurs séances commencées : la plus récente', () => {
    const other = { ...SESSION, _id: 'o', order: 2 };
    const found = unfinishedSession(
      [SESSION, other],
      reader({
        s: saved({ step: 1 }),
        o: saved({ step: 1, updatedAt: STARTED + 40 * 60000 }),
      })
    );
    expect(found?.session._id).toBe('o');
  });

  it('une séance modifiée par le coach depuis le départ ne se reprend pas', () => {
    const edited = { ...SESSION, updatedAt: '2026-09-01T09:10:00.000Z' };
    expect(
      unfinishedSession([edited], reader({ s: saved({ step: 1 }) }))?.changed
    ).toBe(true);
  });
});

describe('startedAgo', () => {
  it('en minutes, puis en heures', () => {
    expect(startedAgo(STARTED, STARTED + 20 * 60000)).toBe(
      'commencée il y a 20 min'
    );
    expect(startedAgo(STARTED, STARTED + 20000)).toBe('commencée il y a 1 min');
    expect(startedAgo(STARTED, STARTED + 135 * 60000)).toBe(
      'commencée il y a 2 h'
    );
  });
});
