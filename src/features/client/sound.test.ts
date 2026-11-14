import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CUES,
  isSoundEnabled,
  playCue,
  setSoundEnabled,
  subscribeToSound,
  unlockSound,
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

/**
 * Une sortie audio simulée, qui ne s'ouvre que lorsqu'on le lui dit.
 *
 * Le banc ne peut pas éprouver ce cas : dans son navigateur la sortie
 * s'ouvre dans l'instant, et le chemin d'attente n'est jamais emprunté.
 * C'est pourtant celui d'un téléphone, où le premier bip du décompte est
 * demandé dans le geste même qui ouvre la sortie.
 */
class SlowOutput {
  state: 'suspended' | 'running' = 'suspended';
  currentTime = 0;
  destination = {};
  /** La hauteur de chaque note effectivement lancée. */
  started: number[] = [];
  private pending: (() => void)[] = [];

  resume() {
    return new Promise<void>((resolve) => {
      this.pending.push(() => {
        this.state = 'running';
        resolve();
      });
    });
  }

  /** La sortie finit de s'ouvrir. */
  async open() {
    this.pending.splice(0).forEach((finish) => finish());
    await Promise.resolve();
    await Promise.resolve();
  }

  createOscillator() {
    const { started } = this;
    return {
      type: '',
      frequency: { value: 0 },
      connect() {},
      start() {
        started.push(this.frequency.value);
      },
      stop() {},
    };
  }

  createGain() {
    return {
      gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
      connect() {},
    };
  }
}

describe('le lecteur, pendant que la sortie s’ouvre', () => {
  // Le module garde une seule sortie pour toute sa vie : les deux cas
  // partagent donc la même, refermée entre les deux.
  let output: SlowOutput;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    });
    // Une fonction qui rend la sortie simulée : `new` rend alors cet objet,
    // et le test garde la main dessus sans que le module en sache rien.
    vi.stubGlobal('window', {
      AudioContext: function SimulatedContext() {
        output = new SlowOutput();
        return output;
      },
    });
    unlockSound();
    output.state = 'suspended';
    output.started.length = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('joue le signal demandé un instant avant que la sortie soit ouverte', async () => {
    playCue('tick');
    expect(output.started).toEqual([]);

    vi.advanceTimersByTime(120);
    await output.open();
    expect(output.started).toEqual([CUES.tick[0].frequency]);
  });

  it('ne joue pas un signal resté en attente trop longtemps', async () => {
    // Personne n'a touché l'écran pendant une minute : ce bip-là
    // n'annonce plus rien, et le jouer à la première touche serait un
    // bruit sans cause.
    playCue('tick');
    vi.advanceTimersByTime(60_000);
    await output.open();
    expect(output.started).toEqual([]);
  });

  it('joue tout de suite quand la sortie est déjà ouverte', () => {
    output.state = 'running';
    playCue('go');
    expect(output.started).toEqual([CUES.go[0].frequency]);
  });
});
