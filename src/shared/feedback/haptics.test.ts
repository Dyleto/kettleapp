/**
 * Les vibrations : nommées, réglables, et muettes là où rien ne vibre.
 *
 * Le défaut que ce module répare ne se voyait pas au banc, qui ne vibre
 * pas : seize motifs écrits à la main, et aucun moyen de les couper sans
 * couper le son avec.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BUZZES,
  buzz,
  canVibrate,
  isVibrationEnabled,
  setVibrationEnabled,
  subscribeToVibration,
} from './haptics';

const vibrate = vi.fn(() => true);
// Les tests tournent sans navigateur : un stockage de poche, comme pour le
// son.
let store: Map<string, string>;

beforeEach(() => {
  store = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  });
  vibrate.mockClear();
  vi.stubGlobal('navigator', { vibrate });
});

afterEach(() => vi.unstubAllGlobals());

describe('les motifs', () => {
  it('un geste défait se distingue d’un geste fait', () => {
    expect(BUZZES.undo).not.toEqual(BUZZES.tap);
    expect(Array.isArray(BUZZES.undo)).toBe(true);
  });

  it('« tick » est un coup, « go » en est deux', () => {
    expect(typeof BUZZES.tick).toBe('number');
    expect(BUZZES.go).toHaveLength(3);
  });
});

describe('vibrer', () => {
  it('joue le motif nommé', () => {
    buzz('go');
    expect(vibrate).toHaveBeenCalledWith([120, 80, 120]);
  });

  it('se tait quand le réglage est coupé', () => {
    setVibrationEnabled(false);
    buzz('tap');
    expect(vibrate).not.toHaveBeenCalled();
  });

  it('se tait, sans planter, là où rien ne vibre', () => {
    vi.stubGlobal('navigator', {});
    expect(canVibrate()).toBe(false);
    expect(() => buzz('tap')).not.toThrow();
  });

  it('un refus du navigateur n’est pas une panne', () => {
    vi.stubGlobal('navigator', {
      vibrate: () => {
        throw new Error('refusé');
      },
    });
    expect(() => buzz('tick')).not.toThrow();
  });
});

describe('le réglage', () => {
  it('actif par défaut : seul le refus s’écrit', () => {
    expect(isVibrationEnabled()).toBe(true);
    setVibrationEnabled(false);
    expect(store.get('kettle-vibration')).toBe('off');
    setVibrationEnabled(true);
    expect(store.has('kettle-vibration')).toBe(false);
  });

  it('prévient ceux qui l’affichent', () => {
    const notify = vi.fn();
    const stop = subscribeToVibration(notify);
    setVibrationEnabled(false);
    stop();
    setVibrationEnabled(true);
    expect(notify).toHaveBeenCalledTimes(1);
  });
});
