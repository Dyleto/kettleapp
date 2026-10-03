/**
 * « Combien j'ai mis la dernière fois ? »
 *
 * L'index se construit entièrement depuis l'historique déjà chargé, et c'est
 * ce qui le rend vérifiable ici : aucune requête, aucune horloge, une entrée
 * et une sortie.
 *
 * Deux choses ne se construisent pas par l'écran. Un bilan qui porte un
 * exercice figé sans identifiant lisible — le serveur a figé ce qu'il avait,
 * et la forme a changé depuis — et un historique qui n'arrive pas dans
 * l'ordre, ce que l'API ne garantit nulle part.
 */
import { describe, expect, it } from 'vitest';
import {
  buildLastPerformanceIndex,
  formatLastPerformance,
  performedKey,
} from './lastPerformance';
import { bilan, blocFige, poseFigee } from './fixtures';
import type { PerformedValues } from '@/shared/types';

describe('l’adresse d’un exercice dans l’instantané', () => {
  it('joint le rang du bloc et celui de l’exercice', () => {
    expect(performedKey(2, 3)).toBe('2:3');
  });

  it('part de ce que l’API attend, rangs compris', () => {
    // Les rangs commencent à 1 côté serveur : un `0:0` voudrait dire qu'on a
    // décalé quelque chose.
    expect(performedKey(1, 1)).toBe('1:1');
  });
});

/** Un bilan avec un seul exercice noté, daté. */
const fait = (
  at: string,
  sets: { weight?: number; reps?: number; duration?: number }[],
  id = 'ex-goblet'
) =>
  bilan({
    _id: `bilan-${at}`,
    completedAt: at,
    blocks: [
      blocFige({
        exercises: [
          poseFigee({
            exercise: { _id: id, name: 'Goblet Squat' },
            performed: { sets },
          }),
        ],
      }),
    ],
  });

describe('le dernier `performed` de chaque exercice', () => {
  it('retient ce qui a été noté', () => {
    const index = buildLastPerformanceIndex([
      fait('2026-09-01T10:00:00.000Z', [{ weight: 20, reps: 12 }]),
    ]);
    expect(index.get('ex-goblet')?.sets).toEqual([{ weight: 20, reps: 12 }]);
  });

  it('garde la tentative la plus récente', () => {
    const index = buildLastPerformanceIndex([
      fait('2026-09-01T10:00:00.000Z', [{ weight: 20 }]),
      fait('2026-09-08T10:00:00.000Z', [{ weight: 24 }]),
    ]);
    expect(index.get('ex-goblet')?.sets).toEqual([{ weight: 24 }]);
  });

  it('même quand l’historique arrive en désordre', () => {
    // L'API ne garantit pas d'ordre, et le tri est ce qui décide quelle
    // tentative gagne. Un historique déjà trié ne le vérifierait pas.
    const index = buildLastPerformanceIndex([
      fait('2026-09-08T10:00:00.000Z', [{ weight: 24 }]),
      fait('2026-09-01T10:00:00.000Z', [{ weight: 20 }]),
    ]);
    expect(index.get('ex-goblet')?.sets).toEqual([{ weight: 24 }]);
  });

  it('porte la date de la séance, en `Date`', () => {
    const index = buildLastPerformanceIndex([
      fait('2026-09-08T10:00:00.000Z', [{ weight: 24 }]),
    ]);
    const at = index.get('ex-goblet')?.completedAt;
    expect(at).toBeInstanceOf(Date);
    expect(at?.toISOString()).toBe('2026-09-08T10:00:00.000Z');
  });

  it('indexe par exercice et non par position', () => {
    // C'est tout le propos : « combien la dernière fois ? » porte sur le
    // mouvement, pas sur la place qu'il occupait ce jour-là. Le même exercice
    // au bloc 3 en quatrième position est le même exercice.
    const index = buildLastPerformanceIndex([
      fait('2026-09-01T10:00:00.000Z', [{ weight: 20 }]),
      bilan({
        _id: 'bilan-2',
        completedAt: '2026-09-08T10:00:00.000Z',
        blocks: [
          blocFige({
            order: 3,
            exercises: [
              poseFigee({ order: 4, performed: { sets: [{ weight: 24 }] } }),
            ],
          }),
        ],
      }),
    ]);
    expect(index.size).toBe(1);
    expect(index.get('ex-goblet')?.sets).toEqual([{ weight: 24 }]);
  });

  it('tient plusieurs exercices à part', () => {
    const index = buildLastPerformanceIndex([
      fait('2026-09-01T10:00:00.000Z', [{ weight: 20 }], 'ex-goblet'),
      fait('2026-09-02T10:00:00.000Z', [{ reps: 10 }], 'ex-swing'),
    ]);
    expect(index.size).toBe(2);
    expect(index.get('ex-swing')?.sets).toEqual([{ reps: 10 }]);
  });

  it('parcourt tous les blocs d’une même séance', () => {
    const index = buildLastPerformanceIndex([
      bilan({
        blocks: [
          blocFige({
            order: 1,
            exercises: [poseFigee({ performed: { sets: [{ weight: 20 }] } })],
          }),
          blocFige({
            order: 2,
            exercises: [
              poseFigee({
                exercise: { _id: 'ex-swing', name: 'Swing' },
                performed: { sets: [{ reps: 15 }] },
              }),
            ],
          }),
        ],
      }),
    ]);
    expect([...index.keys()].sort()).toEqual(['ex-goblet', 'ex-swing']);
  });

  it('ne rend rien sur un historique vide', () => {
    expect(buildLastPerformanceIndex([]).size).toBe(0);
  });
});

describe('ce que l’index laisse de côté', () => {
  it('un exercice que personne n’a noté', () => {
    const index = buildLastPerformanceIndex([
      bilan({ blocks: [blocFige({ exercises: [poseFigee()] })] }),
    ]);
    expect(index.size).toBe(0);
  });

  it('un exercice dont toutes les séries sont vides', () => {
    const index = buildLastPerformanceIndex([
      fait('2026-09-01T10:00:00.000Z', [{}, {}]),
    ]);
    expect(index.size).toBe(0);
  });

  it('un exercice sans aucune série', () => {
    const index = buildLastPerformanceIndex([
      fait('2026-09-01T10:00:00.000Z', []),
    ]);
    expect(index.size).toBe(0);
  });

  it('ce qui suit une série vide, qui marque l’arrêt', () => {
    // Une série laissée vide veut dire que l'exercice s'est arrêté là. Un
    // `performed` qui ne commence que par du vide ne dit donc rien, même s'il
    // porte des valeurs ensuite — la même règle que celle du serveur.
    const index = buildLastPerformanceIndex([
      fait('2026-09-01T10:00:00.000Z', [{}, { weight: 24 }]),
    ]);
    expect(index.size).toBe(0);
  });

  it('un exercice figé sans identifiant lisible', () => {
    const index = buildLastPerformanceIndex([
      bilan({
        blocks: [
          blocFige({
            exercises: [
              poseFigee({
                exercise: {},
                performed: { sets: [{ weight: 24 }] },
              }),
            ],
          }),
        ],
      }),
    ]);
    expect(index.size).toBe(0);
  });

  it('un identifiant qui n’est pas une chaîne', () => {
    // Un bilan ancien peut porter l'exercice tel que Mongo le rendait : un
    // `_id` objet. Il ne sert pas de clé, et surtout il ne doit pas en
    // devenir une par `String(...)` accidentel.
    const index = buildLastPerformanceIndex([
      bilan({
        blocks: [
          blocFige({
            exercises: [
              poseFigee({
                exercise: { _id: { $oid: 'ex-goblet' } },
                performed: { sets: [{ weight: 24 }] },
              }),
            ],
          }),
        ],
      }),
    ]);
    expect(index.size).toBe(0);
  });

  it('un `performed` auquel il manque ses séries, sans vider la page', () => {
    // Le contrat déclare `sets` obligatoire et l'API le filtre : ce cas ne
    // devrait pas arriver. Il arrive quand le front déployé est plus vieux
    // que l'API — c'est l'ordre de déploiement, l'API part la première. Un
    // `findIndex` sur `undefined` lèverait, et c'est tout l'historique qui
    // disparaîtrait au lieu d'une ligne. C'est ce que garde le `?? []`.
    const index = buildLastPerformanceIndex([
      bilan({
        blocks: [
          blocFige({
            exercises: [poseFigee({ performed: {} as PerformedValues })],
          }),
        ],
      }),
    ]);
    expect(index.size).toBe(0);
  });

  it('mais une séance plus récente sans valeur n’efface pas la précédente', () => {
    // Rouvrir une séance et ne rien noter ne doit pas faire oublier ce qu'on
    // avait mis la semaine d'avant : l'entrée n'est écrite que s'il y a
    // quelque chose à écrire.
    const index = buildLastPerformanceIndex([
      fait('2026-09-01T10:00:00.000Z', [{ weight: 20 }]),
      fait('2026-09-08T10:00:00.000Z', []),
    ]);
    expect(index.get('ex-goblet')?.sets).toEqual([{ weight: 20 }]);
  });
});

describe('ce qu’on en affiche', () => {
  it('rien quand il n’y a rien', () => {
    expect(formatLastPerformance(undefined)).toBeNull();
  });

  it('la ligne de ce qui a été fait', () => {
    expect(
      formatLastPerformance({
        sets: [{ weight: 26, reps: 12 }],
        completedAt: new Date('2026-09-01T10:00:00.000Z'),
      })
    ).toBe('12 reps · 26 kg');
  });

  it('rien quand les séries ne portent aucune valeur', () => {
    expect(
      formatLastPerformance({
        sets: [{}],
        completedAt: new Date('2026-09-01T10:00:00.000Z'),
      })
    ).toBeNull();
  });

  it('rien non plus quand les séries manquent tout à fait', () => {
    // Même frontière que ci-dessus : une entrée venue d'une API plus récente
    // que le front ne doit pas faire lever l'affichage.
    expect(
      formatLastPerformance({
        completedAt: new Date('2026-09-01T10:00:00.000Z'),
      } as unknown as Parameters<typeof formatLastPerformance>[0])
    ).toBeNull();
  });
});
