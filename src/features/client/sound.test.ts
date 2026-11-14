import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CUES,
  isSoundEnabled,
  setSoundEnabled,
  subscribeToSound,
  type Note,
} from './sound';

/** La fin de la dernière note d'un signal. */
const length = (notes: Note[]) =>
  Math.max(...notes.map((note) => note.at + note.duration));

describe('les signaux', () => {
  it('le bip des dernières secondes est court', () => {
    // Trois se suivent à une seconde d'écart : au-delà de quelques dixièmes
    // ils se toucheraient presque.
    expect(CUES.tick).toHaveLength(1);
    expect(CUES.tick[0].duration).toBeLessThanOrEqual(120);
  });

  it('le départ est plus long et plus aigu que les secondes qui le précèdent', () => {
    // C'est ce qui le fait reconnaître sans regarder : « prêt… partez ».
    expect(CUES.go).toHaveLength(1);
    expect(CUES.go[0].duration).toBeGreaterThan(CUES.tick[0].duration * 3);
    expect(CUES.go[0].frequency).toBeGreaterThan(CUES.tick[0].frequency);
  });

  it('la fin d’un bloc monte en deux notes, celle de la séance en trois', () => {
    const rising = (notes: Note[]) =>
      notes.every(
        (note, index) =>
          index === 0 || note.frequency > notes[index - 1].frequency
      );
    expect(CUES.blockEnd).toHaveLength(2);
    expect(CUES.sessionEnd).toHaveLength(3);
    expect(rising(CUES.blockEnd)).toBe(true);
    expect(rising(CUES.sessionEnd)).toBe(true);
  });

  it('les notes d’un même signal ne se recouvrent pas', () => {
    for (const notes of Object.values(CUES)) {
      notes.forEach((note, index) => {
        if (index === 0) return;
        const previous = notes[index - 1];
        expect(note.at).toBeGreaterThanOrEqual(previous.at + previous.duration);
      });
    }
  });

  it('aucun signal ne déborde sur la seconde suivante', () => {
    // Un signal plus long qu'une seconde serait encore en train de jouer
    // quand le suivant part — et le suivant le couperait.
    for (const notes of Object.values(CUES)) {
      expect(length(notes)).toBeLessThan(1000);
    }
  });
});

describe('le réglage du son', () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('est actif tant que personne ne l’a coupé', () => {
    expect(isSoundEnabled()).toBe(true);
  });

  it('retient le refus, et lui seul', () => {
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
    expect(store.size).toBe(1);

    // Remettre le son efface la clé au lieu d'écrire « oui » : l'absence de
    // clé est déjà le réglage par défaut.
    setSoundEnabled(true);
    expect(isSoundEnabled()).toBe(true);
    expect(store.size).toBe(0);
  });

  it('reste actif quand le stockage est refusé', () => {
    // Navigation privée : lire lève. Le défaut doit être le son, pas un
    // silence que personne n'a demandé.
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('refusé');
      },
    });
    const quiet = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(isSoundEnabled()).toBe(true);
    quiet.mockRestore();
  });

  it('prévient ceux qui l’affichent, jusqu’à leur désabonnement', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToSound(listener);
    setSoundEnabled(false);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    setSoundEnabled(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
