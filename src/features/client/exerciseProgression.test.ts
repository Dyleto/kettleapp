/**
 * « Goblet Squat : 20 → 24 → 26 kg ».
 *
 * La lecture verticale de l'historique : le client voyait ses séances une à
 * une, et pour savoir s'il ajoutait de la charge il fallait ouvrir trois
 * bilans et se souvenir.
 *
 * Ce qui ne se construit pas par l'écran, et qui se décide ici : sept
 * séances pour voir le plafond à cinq points, un exercice dont la quantité
 * suivie change en cours de route — des répétitions, puis des kilos —, et un
 * historique qui n'arrive pas dans l'ordre.
 */
import { describe, expect, it } from 'vitest';
import {
  buildExerciseProgressions,
  isRising,
  METRIC_UNIT,
  sessionTotals,
} from './exerciseProgression';
import type { ExerciseProgression } from './exerciseProgression';
import {
  makeCompleted,
  makeBlockSnapshot,
  makeExerciseSnapshot,
} from './fixtures';
import type { PerformedSet } from '@/shared/types';

describe('ce qu’une séance retient d’un exercice', () => {
  it('rien, sans la moindre série', () => {
    expect(sessionTotals([])).toBeNull();
  });

  it('rien, quand la première série est vide', () => {
    expect(sessionTotals([{}])).toBeNull();
  });

  it('la charge la plus lourde tenue, et non la dernière', () => {
    // Un exercice se finit souvent en descendant la charge : c'est le haut
    // qui dit où on en est, pas la fin de la série.
    expect(
      sessionTotals([{ weight: 20 }, { weight: 26 }, { weight: 24 }])?.weight
    ).toBe(26);
  });

  it('les répétitions s’additionnent : c’est un volume', () => {
    expect(sessionTotals([{ reps: 12 }, { reps: 10 }, { reps: 8 }])?.reps).toBe(
      30
    );
  });

  it('les secondes aussi', () => {
    expect(sessionTotals([{ duration: 45 }, { duration: 30 }])?.duration).toBe(
      75
    );
  });

  it('les trois cohabitent sur la même séance', () => {
    expect(
      sessionTotals([
        { weight: 20, reps: 12, duration: 40 },
        { weight: 24, reps: 10, duration: 20 },
      ])
    ).toEqual({ weight: 24, reps: 22, duration: 60 });
  });

  it('ne compte pas ce qui suit une série vide', () => {
    // Une série laissée vide marque l'arrêt de l'exercice. Ce qui la suit n'a
    // pas eu lieu, et un 100 oublié dans un champ ne doit pas devenir un
    // record.
    expect(sessionTotals([{ weight: 20 }, {}, { weight: 100 }])?.weight).toBe(
      20
    );
  });

  it('n’invente pas la quantité qui n’a pas été notée', () => {
    const totals = sessionTotals([{ weight: 20 }]);
    expect(totals).toEqual({ weight: 20 });
    expect(totals?.reps).toBeUndefined();
  });
});

describe('le libellé de la quantité suivie', () => {
  it('dit « au total » là où c’en est un', () => {
    // Sans le mot, « 30 reps » se lirait comme la valeur d'une série : c'est
    // la somme de la séance.
    expect(METRIC_UNIT.reps).toBe('reps au total');
    expect(METRIC_UNIT.duration).toBe('s au total');
  });

  it('et ne le dit pas sur une charge, qui est un maximum', () => {
    expect(METRIC_UNIT.weight).toBe('kg');
  });
});

/** Un bilan daté portant un exercice et ses séries. */
const completedWith = (
  at: string,
  sets: PerformedSet[],
  exercise: Record<string, unknown> = { _id: 'ex-goblet', name: 'Goblet Squat' }
) =>
  makeCompleted({
    _id: `bilan-${at}`,
    completedAt: at,
    blocks: [
      makeBlockSnapshot({
        exercises: [makeExerciseSnapshot({ exercise, performed: { sets } })],
      }),
    ],
  });

/** Le jour `n` de septembre 2026, à 10 h UTC. */
const day = (n: number) =>
  `2026-09-${String(n).padStart(2, '0')}T10:00:00.000Z`;

describe('la courbe d’un exercice', () => {
  it('se tait sur un seul point : une valeur n’est pas une progression', () => {
    expect(
      buildExerciseProgressions([completedWith(day(1), [{ weight: 20 }])])
    ).toEqual([]);
  });

  it('se lit de gauche à droite, du plus ancien au plus récent', () => {
    const [p] = buildExerciseProgressions([
      completedWith(day(1), [{ weight: 20 }]),
      completedWith(day(8), [{ weight: 24 }]),
    ]);
    expect(p.points.map((pt) => pt.value)).toEqual([20, 24]);
    expect(p.exerciseId).toBe('ex-goblet');
    expect(p.name).toBe('Goblet Squat');
    expect(p.metric).toBe('weight');
  });

  it('même si l’historique arrive en désordre', () => {
    const [p] = buildExerciseProgressions([
      completedWith(day(8), [{ weight: 24 }]),
      completedWith(day(1), [{ weight: 20 }]),
    ]);
    expect(p.points.map((pt) => pt.value)).toEqual([20, 24]);
  });

  it('garde les cinq derniers points, pas les cinq premiers', () => {
    // Au-delà de cinq, la ligne cesse d'être lisible. Sept séances font donc
    // une courbe de cinq, et ce sont les récentes qui restent.
    const [p] = buildExerciseProgressions(
      [20, 22, 24, 26, 28, 30, 32].map((w, i) =>
        completedWith(day(i + 1), [{ weight: w }])
      )
    );
    expect(p.points.map((pt) => pt.value)).toEqual([24, 26, 28, 30, 32]);
  });

  it('porte la date de son dernier point', () => {
    const [p] = buildExerciseProgressions([
      completedWith(day(1), [{ weight: 20 }]),
      completedWith(day(8), [{ weight: 24 }]),
    ]);
    expect(p.lastAt.toISOString()).toBe(day(8));
    expect(p.points[1].completedAt.toISOString()).toBe(day(8));
  });

  it('met devant l’exercice travaillé le plus récemment', () => {
    // C'est de celui-là qu'on se demande « combien je mets la prochaine
    // fois ? ».
    const swing = { _id: 'ex-swing', name: 'Swing' };
    const progressions = buildExerciseProgressions([
      completedWith(day(1), [{ weight: 20 }]),
      completedWith(day(2), [{ weight: 24 }]),
      completedWith(day(3), [{ reps: 15 }], swing),
      completedWith(day(4), [{ reps: 20 }], swing),
    ]);
    expect(progressions.map((p) => p.exerciseId)).toEqual([
      'ex-swing',
      'ex-goblet',
    ]);
  });
});

describe('la quantité suivie se décide sur la tentative la plus récente', () => {
  it('une charge notée en dernier impose les kilos', () => {
    // Mêler des kilos et des répétitions sur la même flèche ne voudrait rien
    // dire : une seule quantité par exercice.
    const [p] = buildExerciseProgressions([
      completedWith(day(1), [{ weight: 20, reps: 12 }]),
      completedWith(day(8), [{ weight: 24, reps: 10 }]),
    ]);
    expect(p.metric).toBe('weight');
    expect(p.points.map((pt) => pt.value)).toEqual([20, 24]);
  });

  it('des répétitions seules imposent les répétitions', () => {
    const [p] = buildExerciseProgressions([
      completedWith(day(1), [{ reps: 12 }, { reps: 10 }]),
      completedWith(day(8), [{ reps: 15 }, { reps: 15 }]),
    ]);
    expect(p.metric).toBe('reps');
    expect(p.points.map((pt) => pt.value)).toEqual([22, 30]);
  });

  it('du temps seul impose les secondes', () => {
    const [p] = buildExerciseProgressions([
      completedWith(day(1), [{ duration: 40 }]),
      completedWith(day(8), [{ duration: 60 }]),
    ]);
    expect(p.metric).toBe('duration');
  });

  it('les séances qui ne portent pas cette quantité sortent de la courbe', () => {
    // Un mouvement travaillé au poids de corps pendant un mois, puis chargé :
    // les semaines sans kilos n'ont pas de point sur une flèche en kilos.
    const [p] = buildExerciseProgressions([
      completedWith(day(1), [{ reps: 12 }]),
      completedWith(day(8), [{ weight: 20 }]),
      completedWith(day(15), [{ weight: 24 }]),
    ]);
    expect(p.metric).toBe('weight');
    expect(p.points.map((pt) => pt.value)).toEqual([20, 24]);
  });

  it('et s’il n’en reste qu’un, il n’y a plus de courbe', () => {
    const progressions = buildExerciseProgressions([
      completedWith(day(1), [{ reps: 12 }]),
      completedWith(day(8), [{ reps: 10 }]),
      completedWith(day(15), [{ weight: 20 }]),
    ]);
    expect(progressions).toEqual([]);
  });
});

describe('ce que la courbe laisse de côté', () => {
  it('un exercice que personne n’a noté', () => {
    expect(
      buildExerciseProgressions([
        makeCompleted({
          blocks: [makeBlockSnapshot({ exercises: [makeExerciseSnapshot()] })],
        }),
        makeCompleted({
          _id: 'bilan-2',
          completedAt: day(8),
          blocks: [makeBlockSnapshot({ exercises: [makeExerciseSnapshot()] })],
        }),
      ])
    ).toEqual([]);
  });

  it('un exercice figé sans identifiant lisible', () => {
    expect(
      buildExerciseProgressions([
        completedWith(day(1), [{ weight: 20 }], {}),
        completedWith(day(8), [{ weight: 24 }], {}),
      ])
    ).toEqual([]);
  });

  it('un identifiant qui n’est pas une chaîne', () => {
    // Un bilan ancien peut porter l'exercice tel que Mongo le rendait : un
    // `_id` objet. Il ne doit pas devenir une clé par un `String(...)`
    // accidentel — la courbe porterait alors « [object Object] ».
    expect(
      buildExerciseProgressions([
        completedWith(day(1), [{ weight: 20 }], { _id: { $oid: 'ex-goblet' } }),
        completedWith(day(8), [{ weight: 24 }], { _id: { $oid: 'ex-goblet' } }),
      ])
    ).toEqual([]);
  });

  it('un historique vide', () => {
    expect(buildExerciseProgressions([])).toEqual([]);
  });

  it('un `performed` auquel il manque ses séries, sans vider la page', () => {
    // Même frontière que dans `lastPerformance` : le contrat déclare `sets`
    // obligatoire et l'API le filtre, mais le front déployé peut être plus
    // vieux que l'API — elle part la première. Un `findIndex` sur `undefined`
    // ferait disparaître toute la page de progression.
    expect(
      buildExerciseProgressions([
        makeCompleted({
          blocks: [
            makeBlockSnapshot({
              exercises: [
                makeExerciseSnapshot({
                  performed: {} as unknown as { sets: PerformedSet[] },
                }),
              ],
            }),
          ],
        }),
      ])
    ).toEqual([]);
  });
});

describe('le nom affiché', () => {
  it('suit le dernier instantané, pas le premier', () => {
    // Le coach renomme un exercice : c'est le nom d'aujourd'hui qui compte,
    // celui d'il y a trois mois ne se retrouve nulle part dans la
    // bibliothèque.
    const [p] = buildExerciseProgressions([
      completedWith(day(1), [{ weight: 20 }], {
        _id: 'ex-goblet',
        name: 'Squat',
      }),
      completedWith(day(8), [{ weight: 24 }], {
        _id: 'ex-goblet',
        name: 'Goblet Squat',
      }),
    ]);
    expect(p.name).toBe('Goblet Squat');
  });

  it('tient un libellé de repli quand l’instantané n’en porte pas', () => {
    const [p] = buildExerciseProgressions([
      completedWith(day(1), [{ weight: 20 }], { _id: 'ex-goblet' }),
      completedWith(day(8), [{ weight: 24 }], { _id: 'ex-goblet' }),
    ]);
    expect(p.name).toBe('Exercice');
  });
});

describe('la flèche monte-t-elle ?', () => {
  const curve = (...valeurs: number[]): ExerciseProgression => ({
    exerciseId: 'ex-goblet',
    name: 'Goblet Squat',
    metric: 'weight',
    points: valeurs.map((value, i) => ({
      value,
      completedAt: new Date(day(i + 1)),
    })),
    lastAt: new Date(day(valeurs.length)),
  });

  it('oui quand le dernier point dépasse le précédent', () => {
    expect(isRising(curve(20, 24))).toBe(true);
  });

  it('non quand il l’égale : tenir n’est pas monter', () => {
    expect(isRising(curve(24, 24))).toBe(false);
  });

  it('non quand il descend', () => {
    expect(isRising(curve(24, 20))).toBe(false);
  });

  it('ne regarde que les deux derniers points', () => {
    // Trois semaines de hausse puis une baisse ne monte pas : la flèche dit
    // la dernière séance, pas la tendance du mois.
    expect(isRising(curve(20, 22, 24, 22))).toBe(false);
  });
});
