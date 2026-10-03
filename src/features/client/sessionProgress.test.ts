/**
 * Ce qu'une séance en cours garde d'elle-même.
 *
 * Le module existe parce que l'application retenait la position et oubliait
 * les charges : un rechargement, un appel entrant qui tue l'onglet, et
 * quarante minutes de notes disparaissaient. C'est l'inverse de ce qui mérite
 * d'être gardé — une position se retrouve, une charge qu'on a soulevée non.
 *
 * Trois choses ne se vérifient que d'ici.
 *
 * Les trois `catch`. Le stockage refuse plus souvent qu'on ne le croit :
 * navigation privée, quota plein, donnée abîmée. Un navigateur piloté ne
 * refuse pas sur commande, et c'est pourtant le seul chemin qui décide si une
 * séance continue sans mémoire ou s'arrête net.
 *
 * La péremption. Reprendre une séance de la semaine dernière repeuplerait les
 * champs avec des charges qui partiraient sans être relues. Le banc
 * n'attendra pas douze heures pour le voir.
 *
 * La relecture d'un enregistrement d'avant le passage aux noms anglais. Le
 * banc la couvre — c'est une de ses assertions — mais par un seul chemin ; la
 * table complète des champs se décrit ici.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  countRecorded,
  forgetProgress,
  readProgress,
  writeProgress,
} from './sessionProgress';

/**
 * Un `localStorage` en mémoire, qui sait aussi refuser.
 *
 * Plus léger qu'un jsdom, et surtout : jsdom ne sait pas lever sur commande.
 * Les trois `catch` du module ne se vérifient pas autrement.
 */
const makeStorage = () => {
  let store = new Map<string, string>();
  const state = { throws: false };
  const check = () => {
    if (state.throws) throw new DOMException('refusé', 'SecurityError');
  };
  return {
    state,
    reset: () => (store = new Map()),
    raw: store,
    api: {
      getItem: (k: string) => (check(), store.get(k) ?? null),
      setItem: (k: string, v: string) => (check(), void store.set(k, v)),
      removeItem: (k: string) => (check(), void store.delete(k)),
      clear: () => (check(), store.clear()),
      key: () => null,
      length: 0,
    } as unknown as Storage,
    read: (k: string) => store.get(k) ?? null,
    put: (k: string, v: string) => store.set(k, v),
  };
};

let storage = makeStorage();

beforeEach(() => {
  storage = makeStorage();
  vi.stubGlobal('localStorage', storage.api);
});

const KEY = 'kettle-seance-sess1';

describe('l’aller-retour', () => {
  it('écrit puis relit', () => {
    writeProgress('sess1', { step: 3, done: ['1:1:1'] });
    const reloaded = readProgress('sess1');
    expect(reloaded?.step).toBe(3);
    expect(reloaded?.done).toEqual(['1:1:1']);
    expect(reloaded?.version).toBe(2);
  });

  it('range sous une clé propre à la séance', () => {
    writeProgress('sess1', { step: 1 });
    writeProgress('sess2', { step: 7 });
    expect(readProgress('sess1')?.step).toBe(1);
    expect(readProgress('sess2')?.step).toBe(7);
    expect(storage.read(KEY)).not.toBeNull();
  });

  it('ne rend rien pour une séance jamais ouverte', () => {
    expect(readProgress('jamais-vue')).toBeNull();
  });

  it('écrit ce qui change et garde le reste', () => {
    writeProgress('sess1', {
      step: 2,
      performed: { '1:1': { sets: [{ weight: 26 }] } },
    });
    writeProgress('sess1', { step: 5 });
    const reloaded = readProgress('sess1');
    expect(reloaded?.step).toBe(5);
    expect(reloaded?.performed['1:1'].sets[0].weight).toBe(26);
  });

  it('une première écriture partielle laisse le reste à sa forme vide', () => {
    // La toute première écriture n'est pas forcément un déplacement : noter
    // une charge avant d'avoir bougé est le cas ordinaire. Ce qu'elle ne dit
    // pas vient de la forme vide, et rien d'autre ne l'observait.
    writeProgress('sess1', {
      performed: { '1:1': { sets: [{ weight: 20 }] } },
    });
    expect(readProgress('sess1')).toEqual({
      version: 2,
      step: 0,
      performed: { '1:1': { sets: [{ weight: 20 }] } },
      done: [],
      rounds: {},
      updatedAt: expect.any(Number),
    });
  });

  it('efface sur demande', () => {
    writeProgress('sess1', { step: 2 });
    forgetProgress('sess1');
    expect(readProgress('sess1')).toBeNull();
  });
});

describe('la péremption', () => {
  it('ne rend rien au-delà de douze heures', () => {
    storage.put(
      KEY,
      JSON.stringify({
        version: 2,
        step: 4,
        performed: {},
        done: [],
        rounds: {},
        updatedAt: Date.now() - 13 * 3600_000,
      })
    );
    expect(readProgress('sess1')).toBeNull();
  });

  it('et efface l’enregistrement périmé plutôt que de le laisser traîner', () => {
    storage.put(
      KEY,
      JSON.stringify({
        version: 2,
        step: 4,
        performed: {},
        done: [],
        rounds: {},
        updatedAt: Date.now() - 13 * 3600_000,
      })
    );
    readProgress('sess1');
    expect(storage.read(KEY)).toBeNull();
  });

  it('rend encore un enregistrement de onze heures', () => {
    storage.put(
      KEY,
      JSON.stringify({
        version: 2,
        step: 4,
        performed: {},
        done: [],
        rounds: {},
        updatedAt: Date.now() - 11 * 3600_000,
      })
    );
    expect(readProgress('sess1')?.step).toBe(4);
  });
});

describe('un enregistrement d’avant le passage aux noms anglais', () => {
  const legacyRecord = (overrides: Record<string, unknown> = {}) =>
    JSON.stringify({
      version: 1,
      etape: 2,
      performed: { '1:1': { sets: [{ weight: 37 }] } },
      faits: ['1:1:1', '1:2:1'],
      tours: { '3': 5 },
      debutLe: 1_700_000_000_000,
      majLe: Date.now(),
      ...overrides,
    });

  it('se relit, champ par champ', () => {
    storage.put(KEY, legacyRecord());
    const reloaded = readProgress('sess1');
    expect(reloaded).toEqual({
      version: 2,
      step: 2,
      performed: { '1:1': { sets: [{ weight: 37 }] } },
      done: ['1:1:1', '1:2:1'],
      rounds: { '3': 5 },
      startedAt: 1_700_000_000_000,
      updatedAt: expect.any(Number),
    });
  });

  it('passe au nouveau format à la première écriture', () => {
    storage.put(KEY, legacyRecord());
    writeProgress('sess1', { step: 3 });
    const stored = JSON.parse(storage.read(KEY)!);
    expect(stored.version).toBe(2);
    expect(stored.etape).toBeUndefined();
    expect(stored.faits).toBeUndefined();
  });

  it('sans rien perdre de ce qu’il portait', () => {
    storage.put(KEY, legacyRecord());
    writeProgress('sess1', { step: 3 });
    const reloaded = readProgress('sess1');
    expect(reloaded?.done).toEqual(['1:1:1', '1:2:1']);
    expect(reloaded?.performed['1:1'].sets[0].weight).toBe(37);
    expect(reloaded?.startedAt).toBe(1_700_000_000_000);
  });

  it('se périme sur `majLe`, comme l’autre sur `updatedAt`', () => {
    storage.put(KEY, legacyRecord({ majLe: Date.now() - 13 * 3600_000 }));
    expect(readProgress('sess1')).toBeNull();
  });
});

describe('ce qu’on refuse de relire', () => {
  it('une version inconnue', () => {
    storage.put(
      KEY,
      JSON.stringify({ version: 99, step: 4, updatedAt: Date.now() })
    );
    expect(readProgress('sess1')).toBeNull();
  });

  it('un enregistrement sans date de mise à jour', () => {
    storage.put(KEY, JSON.stringify({ version: 2, step: 4 }));
    expect(readProgress('sess1')).toBeNull();
  });

  it('du JSON abîmé', () => {
    storage.put(KEY, '{ ceci n’est pas du JSON');
    expect(readProgress('sess1')).toBeNull();
  });
});

describe('ce qu’on redresse plutôt que de refuser', () => {
  const withFields = (overrides: Record<string, unknown>) =>
    JSON.stringify({
      version: 2,
      step: 0,
      performed: {},
      done: [],
      rounds: {},
      updatedAt: Date.now(),
      ...overrides,
    });

  it('une étape négative repart de zéro', () => {
    storage.put(KEY, withFields({ step: -3 }));
    expect(readProgress('sess1')?.step).toBe(0);
  });

  it('une étape qui n’est pas un entier aussi', () => {
    storage.put(KEY, withFields({ step: 2.5 }));
    expect(readProgress('sess1')?.step).toBe(0);
  });

  it('un `done` qui n’est pas un tableau devient vide', () => {
    storage.put(KEY, withFields({ done: 'pas un tableau' }));
    expect(readProgress('sess1')?.done).toEqual([]);
  });

  it('des champs absents prennent leur forme vide', () => {
    storage.put(KEY, JSON.stringify({ version: 2, updatedAt: Date.now() }));
    // `toEqual` et non `toMatchObject` : un `{}` attendu par `toMatchObject`
    // est satisfait par un `undefined` reçu — mesuré. L'assertion restait
    // verte alors que les formes vides avaient disparu du module.
    expect(readProgress('sess1')).toEqual({
      version: 2,
      step: 0,
      performed: {},
      done: [],
      rounds: {},
      startedAt: undefined,
      updatedAt: expect.any(Number),
    });
  });
});

describe('quand le stockage refuse', () => {
  // Navigation privée, quota plein. La séance doit continuer sans mémoire,
  // jamais s'arrêter : c'est le seul chemin qui en décide, et aucun
  // navigateur piloté ne refuse sur commande.
  it('la lecture rend `null` au lieu de lever', () => {
    storage.state.throws = true;
    expect(() => readProgress('sess1')).not.toThrow();
    expect(readProgress('sess1')).toBeNull();
  });

  it('l’écriture se tait au lieu de lever', () => {
    storage.state.throws = true;
    expect(() => writeProgress('sess1', { step: 2 })).not.toThrow();
  });

  it('l’effacement se tait aussi', () => {
    storage.state.throws = true;
    expect(() => forgetProgress('sess1')).not.toThrow();
  });
});

describe('combien d’exercices portent une valeur', () => {
  it('compte ceux qui ont au moins une série renseignée', () => {
    expect(
      countRecorded({
        '1:1': { sets: [{ weight: 26 }] },
        '1:2': { sets: [{ reps: 10 }] },
        '2:1': { sets: [{ duration: 45 }] },
      })
    ).toBe(3);
  });

  it('ignore un exercice dont toutes les séries sont vides', () => {
    expect(countRecorded({ '1:1': { sets: [{}, {}] } })).toBe(0);
  });

  it('ignore un exercice sans série du tout', () => {
    expect(countRecorded({ '1:1': { sets: [] } })).toBe(0);
  });

  it('compte un zéro : ce n’est pas une absence', () => {
    expect(countRecorded({ '1:1': { sets: [{ weight: 0 }] } })).toBe(1);
  });

  it('vaut zéro sur un ensemble vide', () => {
    expect(countRecorded({})).toBe(0);
  });
});
