/**
 * La clé d'envoi : une par séance terminée, la même à chaque essai.
 *
 * Le banc mène la réponse perdue de bout en bout ; ici, ce qui ne se
 * provoque pas à l'écran : un navigateur sans `randomUUID`, un stockage
 * refusé, une clé abîmée, une séance recommencée.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isSendKey,
  readProgress,
  restartProgress,
  writeProgress,
} from '@/features/client/guided/sessionProgress';
import { completionPayload } from './sending';
import { newSendKey, sendKeyFor } from './sendKey';

/** Un `localStorage` en mémoire : rien de plus n'est demandé ici. */
const stubStorage = () => {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
  return store;
};

const KEY = '2f1c9a7e-4b6d-4e8a-9c3f-0d5e7b1a2c4f';
const feeling = { feedback: { effort: 3 }, clientNotes: '' };

beforeEach(() => {
  vi.unstubAllGlobals();
  stubStorage();
});

describe('une clé neuve', () => {
  it('un UUID quand le navigateur en fabrique', () => {
    const key = newSendKey({ randomUUID: () => KEY } as unknown as Crypto);
    expect(key).toBe(KEY);
  });

  // HTTP sur le réseau local, en développement : pas de `randomUUID`.
  it('sinon trente-deux caractères hexadécimaux, que le serveur accepte', () => {
    const key = newSendKey({
      // Dix s'écrit « a » en hexadécimal : sans zéro devant, la clé ferait
      // seize caractères et non trente-deux.
      getRandomValues: (bytes: Uint8Array) => bytes.fill(10),
    } as unknown as Crypto);
    expect(key).toBe('0a'.repeat(16));
    expect(isSendKey(key)).toBe(true);
  });

  it('celle du navigateur passe aussi', () => {
    expect(isSendKey(newSendKey())).toBe(true);
  });
});

describe('la clé d’une séance', () => {
  it('posée une fois, gardée aussitôt', () => {
    const key = sendKeyFor('s1', () => KEY);
    expect(key).toBe(KEY);
    expect(readProgress('s1')?.sendKey).toBe(KEY);
  });

  // L'enjeu : le renvoi porte la clé du premier essai.
  it('un second essai reprend la même', () => {
    sendKeyFor('s1', () => KEY);
    expect(sendKeyFor('s1', () => 'autre-cle-neuve')).toBe(KEY);
  });

  it('deux séances, deux clés', () => {
    sendKeyFor('s1', () => KEY);
    expect(sendKeyFor('s2', () => 'autre-cle-neuve')).toBe('autre-cle-neuve');
  });

  // Navigation privée : rien n'est gardé, l'envoi part quand même avec une
  // clé — il n'y aura simplement pas de renvoi.
  it('sans stockage, une clé quand même', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('refusé');
      },
      setItem: () => {
        throw new Error('refusé');
      },
      removeItem: () => {},
    });
    expect(sendKeyFor('s1', () => KEY)).toBe(KEY);
  });

  // Une clé abîmée serait refusée, et le bilan avec elle, à chaque retour
  // du réseau : elle est relue comme absente, et une neuve la remplace.
  it('une clé abîmée ne se relit pas', () => {
    writeProgress('s1', { sendKey: 'clé abîmée' });
    expect(readProgress('s1')?.sendKey).toBeUndefined();
    expect(sendKeyFor('s1', () => KEY)).toBe(KEY);
  });

  // Recommencer, c'est une autre tentative : l'ancienne clé désigne un
  // bilan que le serveur a peut-être déjà.
  it('recommencer la séance efface la clé', () => {
    sendKeyFor('s1', () => KEY);
    restartProgress('s1');
    expect(readProgress('s1')?.sendKey).toBeUndefined();
  });
});

describe('ce qui part', () => {
  /** Ce que l'appareil a gardé d'une séance sans résultat à compter. */
  const kept = (sendKey: string) => ({
    rounds: {},
    ladder: {},
    chipper: {},
    sendKey,
  });

  it('la clé gardée part avec le bilan', () => {
    expect(completionPayload(kept(KEY), feeling).sendKey).toBe(KEY);
  });

  // L'écran la tient lui-même quand le stockage a refusé de la garder.
  it('celle que l’écran tient passe devant', () => {
    expect(
      completionPayload(kept(KEY), feeling, {}, 'tenue-par-ecran').sendKey
    ).toBe('tenue-par-ecran');
  });

  it('sans clé, rien : le serveur accepte un bilan d’avant', () => {
    expect(completionPayload(null, feeling)).not.toHaveProperty('sendKey');
  });
});
