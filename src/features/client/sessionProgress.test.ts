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
const faireStockage = () => {
  let contenu = new Map<string, string>();
  const etat = { leve: false };
  const verifier = () => {
    if (etat.leve) throw new DOMException('refusé', 'SecurityError');
  };
  return {
    etat,
    vider: () => (contenu = new Map()),
    brut: contenu,
    api: {
      getItem: (k: string) => (verifier(), contenu.get(k) ?? null),
      setItem: (k: string, v: string) => (verifier(), void contenu.set(k, v)),
      removeItem: (k: string) => (verifier(), void contenu.delete(k)),
      clear: () => (verifier(), contenu.clear()),
      key: () => null,
      length: 0,
    } as unknown as Storage,
    lire: (k: string) => contenu.get(k) ?? null,
    poser: (k: string, v: string) => contenu.set(k, v),
  };
};

let stockage = faireStockage();

beforeEach(() => {
  stockage = faireStockage();
  vi.stubGlobal('localStorage', stockage.api);
});

const CLE = 'kettle-seance-sess1';

describe('l’aller-retour', () => {
  it('écrit puis relit', () => {
    writeProgress('sess1', { step: 3, done: ['1:1:1'] });
    const relu = readProgress('sess1');
    expect(relu?.step).toBe(3);
    expect(relu?.done).toEqual(['1:1:1']);
    expect(relu?.version).toBe(2);
  });

  it('range sous une clé propre à la séance', () => {
    writeProgress('sess1', { step: 1 });
    writeProgress('sess2', { step: 7 });
    expect(readProgress('sess1')?.step).toBe(1);
    expect(readProgress('sess2')?.step).toBe(7);
    expect(stockage.lire(CLE)).not.toBeNull();
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
    const relu = readProgress('sess1');
    expect(relu?.step).toBe(5);
    expect(relu?.performed['1:1'].sets[0].weight).toBe(26);
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
    stockage.poser(
      CLE,
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
    stockage.poser(
      CLE,
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
    expect(stockage.lire(CLE)).toBeNull();
  });

  it('rend encore un enregistrement de onze heures', () => {
    stockage.poser(
      CLE,
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
  const ancien = (ecarts: Record<string, unknown> = {}) =>
    JSON.stringify({
      version: 1,
      etape: 2,
      performed: { '1:1': { sets: [{ weight: 37 }] } },
      faits: ['1:1:1', '1:2:1'],
      tours: { '3': 5 },
      debutLe: 1_700_000_000_000,
      majLe: Date.now(),
      ...ecarts,
    });

  it('se relit, champ par champ', () => {
    stockage.poser(CLE, ancien());
    const relu = readProgress('sess1');
    expect(relu).toEqual({
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
    stockage.poser(CLE, ancien());
    writeProgress('sess1', { step: 3 });
    const stocke = JSON.parse(stockage.lire(CLE)!);
    expect(stocke.version).toBe(2);
    expect(stocke.etape).toBeUndefined();
    expect(stocke.faits).toBeUndefined();
  });

  it('sans rien perdre de ce qu’il portait', () => {
    stockage.poser(CLE, ancien());
    writeProgress('sess1', { step: 3 });
    const relu = readProgress('sess1');
    expect(relu?.done).toEqual(['1:1:1', '1:2:1']);
    expect(relu?.performed['1:1'].sets[0].weight).toBe(37);
    expect(relu?.startedAt).toBe(1_700_000_000_000);
  });

  it('se périme sur `majLe`, comme l’autre sur `updatedAt`', () => {
    stockage.poser(CLE, ancien({ majLe: Date.now() - 13 * 3600_000 }));
    expect(readProgress('sess1')).toBeNull();
  });
});

describe('ce qu’on refuse de relire', () => {
  it('une version inconnue', () => {
    stockage.poser(
      CLE,
      JSON.stringify({ version: 99, step: 4, updatedAt: Date.now() })
    );
    expect(readProgress('sess1')).toBeNull();
  });

  it('un enregistrement sans date de mise à jour', () => {
    stockage.poser(CLE, JSON.stringify({ version: 2, step: 4 }));
    expect(readProgress('sess1')).toBeNull();
  });

  it('du JSON abîmé', () => {
    stockage.poser(CLE, '{ ceci n’est pas du JSON');
    expect(readProgress('sess1')).toBeNull();
  });
});

describe('ce qu’on redresse plutôt que de refuser', () => {
  const avec = (ecarts: Record<string, unknown>) =>
    JSON.stringify({
      version: 2,
      step: 0,
      performed: {},
      done: [],
      rounds: {},
      updatedAt: Date.now(),
      ...ecarts,
    });

  it('une étape négative repart de zéro', () => {
    stockage.poser(CLE, avec({ step: -3 }));
    expect(readProgress('sess1')?.step).toBe(0);
  });

  it('une étape qui n’est pas un entier aussi', () => {
    stockage.poser(CLE, avec({ step: 2.5 }));
    expect(readProgress('sess1')?.step).toBe(0);
  });

  it('un `done` qui n’est pas un tableau devient vide', () => {
    stockage.poser(CLE, avec({ done: 'pas un tableau' }));
    expect(readProgress('sess1')?.done).toEqual([]);
  });

  it('des champs absents prennent leur forme vide', () => {
    stockage.poser(CLE, JSON.stringify({ version: 2, updatedAt: Date.now() }));
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
    stockage.etat.leve = true;
    expect(() => readProgress('sess1')).not.toThrow();
    expect(readProgress('sess1')).toBeNull();
  });

  it('l’écriture se tait au lieu de lever', () => {
    stockage.etat.leve = true;
    expect(() => writeProgress('sess1', { step: 2 })).not.toThrow();
  });

  it('l’effacement se tait aussi', () => {
    stockage.etat.leve = true;
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
