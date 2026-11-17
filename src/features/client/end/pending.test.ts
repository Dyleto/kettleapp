/**
 * Le ressenti qui attend le réseau, et ce que décide son envoi.
 *
 * Le banc mène la coupure de bout en bout, dans un navigateur ; ici, ce qui
 * ne se provoque pas à l'écran : un refus du serveur, une coupure au milieu
 * d'une tournée, deux envois qui se croisent.
 */
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@/shared/types';
import { makeSession } from '@/domain/fixtures';
import {
  readProgress,
  writeProgress,
} from '@/features/client/guided/sessionProgress';

const completeSession = vi.fn();
vi.mock('@/features/client/common/client.service', () => ({
  clientService: {
    completeSession: (...args: unknown[]) => completeSession(...args),
  },
}));

const { flushPending, queueFeeling, sendCompletion } =
  await import('./pending');

/** Un `localStorage` en mémoire : rien de plus n'est demandé ici. */
const stubStorage = () => {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
};

const refusal = () =>
  new AxiosError('refusé', 'ERR_BAD_REQUEST', undefined, undefined, {
    status: 404,
  } as never);
const cut = () => new AxiosError('Network Error', 'ERR_NETWORK');

const first = makeSession({ _id: 'sess-a' }) as Session;
const second = makeSession({ _id: 'sess-b' }) as Session;
const feeling = { feedback: { effort: 3 }, clientNotes: '' };

beforeEach(() => {
  stubStorage();
  completeSession.mockReset();
});

describe('garder le ressenti', () => {
  it('fige la date au moment de l’échec', () => {
    queueFeeling('sess-a', feeling, new Date('2026-11-17T21:30:00.000Z'));
    expect(readProgress('sess-a')?.pending?.completedAt).toBe(
      '2026-11-17T21:30:00.000Z'
    );
  });

  it('garde la date choisie, quand il y en a une', () => {
    queueFeeling('sess-a', { ...feeling, completedAt: '2026-11-15' });
    expect(readProgress('sess-a')?.pending?.completedAt).toBe('2026-11-15');
  });
});

describe('le retour du réseau', () => {
  it('parti, l’enregistrement s’efface', async () => {
    completeSession.mockResolvedValue({});
    queueFeeling('sess-a', feeling);
    const outcomes = await flushPending([first]);
    expect(outcomes).toEqual([{ session: first, sent: true }]);
    expect(readProgress('sess-a')).toBeNull();
  });

  it('refusé, le ressenti part de l’attente, la séance reste', async () => {
    completeSession.mockRejectedValue(refusal());
    writeProgress('sess-a', { finishedAt: 1 });
    queueFeeling('sess-a', feeling);
    const outcomes = await flushPending([first]);
    expect(outcomes).toEqual([{ session: first, sent: false }]);
    expect(readProgress('sess-a')).toMatchObject({ finishedAt: 1 });
    expect(readProgress('sess-a')?.pending).toBeUndefined();
  });

  it('coupé, tout reste, et la tournée s’arrête', async () => {
    completeSession.mockRejectedValue(cut());
    queueFeeling('sess-a', feeling);
    queueFeeling('sess-b', feeling);
    expect(await flushPending([first, second])).toEqual([]);
    expect(completeSession).toHaveBeenCalledTimes(1);
    expect(readProgress('sess-a')?.pending).toBeDefined();
    expect(readProgress('sess-b')?.pending).toBeDefined();
  });

  it('rien en attente, rien ne part', async () => {
    writeProgress('sess-a', { finishedAt: 1 });
    expect(await flushPending([first])).toEqual([]);
    expect(completeSession).not.toHaveBeenCalled();
  });
});

describe('deux envois qui se croisent', () => {
  it('partagent la même requête', async () => {
    let resolve: (value: unknown) => void = () => {};
    completeSession.mockReturnValue(new Promise((r) => (resolve = r)));
    const a = sendCompletion('sess-a', { feedback: { effort: 3 } });
    const b = sendCompletion('sess-a', { feedback: { effort: 3 } });
    resolve({});
    await Promise.all([a, b]);
    expect(completeSession).toHaveBeenCalledTimes(1);
  });

  it('une fois partie, la suivante repart', async () => {
    completeSession.mockResolvedValue({});
    await sendCompletion('sess-a', { feedback: { effort: 3 } });
    await sendCompletion('sess-a', { feedback: { effort: 3 } });
    expect(completeSession).toHaveBeenCalledTimes(2);
  });
});
