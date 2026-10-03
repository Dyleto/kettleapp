/**
 * La semaine, reconstruite à l'affichage.
 *
 * Elle n'est enregistrée nulle part : les jours conseillés vivent sur la
 * séance, et la semaine se recompose à chaque rendu. Une seule source de
 * vérité, et supprimer une séance ne laisse jamais un agenda à réparer.
 *
 * Ce qui se vérifie mal par l'écran : le jour conseillé est indicatif. Rien
 * ne doit produire de retard, de dette, ni d'alerte — et c'est une absence,
 * donc impossible à voir sur une capture. Les cas de bord non plus : une
 * séance conseillée sept jours sur sept, un jour conseillé hors bornes, deux
 * séances le même jour.
 */
import { describe, expect, it } from 'vitest';
import {
  buildWeekPlan,
  getSessionForToday,
  hasSuggestedDays,
} from './weekPlan';
import { bilan, seance } from './fixtures';
import { dayKey } from './sessionDates';

// Un mercredi, pour que la semaine ait un avant et un après.
const MERCREDI = new Date(2026, 8, 23, 10, 0);

describe('la semaine', () => {
  it('fait sept jours, du lundi au dimanche', () => {
    const semaine = buildWeekPlan([], [], MERCREDI);
    expect(semaine).toHaveLength(7);
    expect(semaine.map((j) => j.index)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(semaine[0].key).toBe('2026-09-21');
    expect(semaine[6].key).toBe('2026-09-27');
  });

  it('part du lundi même si on est dimanche soir', () => {
    const semaine = buildWeekPlan([], [], new Date(2026, 8, 27, 23, 0));
    expect(semaine[0].key).toBe('2026-09-21');
  });

  it('range une séance faite au jour où elle a été faite', () => {
    const fait = bilan({ completedAt: '2026-09-22T18:00:00.000Z' });
    const semaine = buildWeekPlan([], [fait], MERCREDI);
    expect(semaine[1].done).toHaveLength(1);
    expect(semaine.filter((j) => j.done.length > 0)).toHaveLength(1);
  });

  it('en range deux le même jour sans en perdre une', () => {
    const semaine = buildWeekPlan(
      [],
      [
        bilan({ _id: 'b1', completedAt: '2026-09-22T07:00:00.000Z' }),
        bilan({ _id: 'b2', completedAt: '2026-09-22T19:00:00.000Z' }),
      ],
      MERCREDI
    );
    expect(semaine[1].done.map((c) => c._id)).toEqual(['b1', 'b2']);
  });

  it('ignore une séance faite une autre semaine', () => {
    const vieux = bilan({ completedAt: '2026-09-10T10:00:00.000Z' });
    const semaine = buildWeekPlan([], [vieux], MERCREDI);
    expect(semaine.every((j) => j.done.length === 0)).toBe(true);
  });

  it('place les séances conseillées à leurs jours, dans l’ordre du programme', () => {
    const deuxieme = seance({ _id: 's2', order: 2, suggestedDays: [0] });
    const premiere = seance({ _id: 's1', order: 1, suggestedDays: [0, 3] });
    const semaine = buildWeekPlan([deuxieme, premiere], [], MERCREDI);
    expect(semaine[0].suggested.map((s) => s._id)).toEqual(['s1', 's2']);
    expect(semaine[3].suggested.map((s) => s._id)).toEqual(['s1']);
    expect(semaine[1].suggested).toEqual([]);
  });

  it('accepte une séance conseillée les sept jours', () => {
    const tous = seance({ suggestedDays: [0, 1, 2, 3, 4, 5, 6] });
    const semaine = buildWeekPlan([tous], [], MERCREDI);
    expect(semaine.every((j) => j.suggested.length === 1)).toBe(true);
  });

  it('ne place pas deux fois une séance dont un jour est répété', () => {
    const double = seance({ suggestedDays: [0, 0, 3] });
    const semaine = buildWeekPlan([double], [], MERCREDI);
    expect(semaine[0].suggested).toHaveLength(1);
  });

  it('écarte un jour hors bornes plutôt que de le placer n’importe où', () => {
    const faux = seance({ suggestedDays: [-1, 7, 2.5, 2] });
    const semaine = buildWeekPlan([faux], [], MERCREDI);
    expect(semaine[2].suggested).toHaveLength(1);
    expect(semaine.flatMap((j) => j.suggested)).toHaveLength(1);
  });

  it('ne calcule aucun retard : un jour passé sans séance reste vide', () => {
    // Lundi conseillé, rien de fait, on est mercredi. Le lundi ne porte ni
    // marque ni dette — il reste un lundi avec un conseil et rien de fait.
    const semaine = buildWeekPlan(
      [seance({ suggestedDays: [0] })],
      [],
      MERCREDI
    );
    expect(semaine[0].suggested).toHaveLength(1);
    expect(semaine[0].done).toEqual([]);
    expect(Object.keys(semaine[0]).sort()).toEqual([
      'date',
      'done',
      'index',
      'key',
      'suggested',
    ]);
  });

  it('donne une date dont la clé est celle du jour', () => {
    const semaine = buildWeekPlan([], [], MERCREDI);
    expect(semaine.every((j) => dayKey(j.date) === j.key)).toBe(true);
  });
});

describe('le programme conseille-t-il quelque chose', () => {
  it('non sur un programme vide', () => {
    expect(hasSuggestedDays([])).toBe(false);
  });

  it('non quand aucune séance ne porte de jour', () => {
    expect(hasSuggestedDays([seance(), seance({ suggestedDays: [] })])).toBe(
      false
    );
  });

  it('oui dès qu’une seule en porte un', () => {
    expect(hasSuggestedDays([seance(), seance({ suggestedDays: [4] })])).toBe(
      true
    );
  });
});

describe('la séance conseillée aujourd’hui', () => {
  it('est celle dont le jour est aujourd’hui', () => {
    const mercredi = seance({ _id: 's-mer', suggestedDays: [2] });
    const jeudi = seance({ _id: 's-jeu', order: 2, suggestedDays: [3] });
    expect(getSessionForToday([mercredi, jeudi], [], MERCREDI)?._id).toBe(
      's-mer'
    );
  });

  it('se tait quand rien n’est conseillé aujourd’hui', () => {
    const jeudi = seance({ suggestedDays: [3] });
    expect(getSessionForToday([jeudi], [], MERCREDI)).toBeUndefined();
  });

  it('se tait une fois la séance faite aujourd’hui', () => {
    const mercredi = seance({ _id: 's-mer', suggestedDays: [2] });
    const faitAujourdhui = bilan({
      originalSessionId: 's-mer',
      completedAt: new Date(2026, 8, 23, 9, 0).toISOString(),
    });
    expect(
      getSessionForToday([mercredi], [faitAujourdhui], MERCREDI)
    ).toBeUndefined();
  });

  it('reste proposée si elle a été faite un autre jour', () => {
    const mercredi = seance({ _id: 's-mer', suggestedDays: [2] });
    const faitHier = bilan({
      originalSessionId: 's-mer',
      completedAt: new Date(2026, 8, 22, 9, 0).toISOString(),
    });
    expect(getSessionForToday([mercredi], [faitHier], MERCREDI)?._id).toBe(
      's-mer'
    );
  });

  it('passe à la suivante quand la première du jour est faite', () => {
    // Un dimanche où l'on a fait la 4 ne rend pas la 3 inexistante.
    const trois = seance({ _id: 's3', order: 3, suggestedDays: [2] });
    const quatre = seance({ _id: 's4', order: 4, suggestedDays: [2] });
    const faitQuatre = bilan({
      originalSessionId: 's4',
      completedAt: new Date(2026, 8, 23, 8, 0).toISOString(),
    });
    expect(
      getSessionForToday([quatre, trois], [faitQuatre], MERCREDI)?._id
    ).toBe('s3');
  });

  it('suit l’ordre du programme, pas celui du tableau', () => {
    const deux = seance({ _id: 's2', order: 2, suggestedDays: [2] });
    const un = seance({ _id: 's1', order: 1, suggestedDays: [2] });
    expect(getSessionForToday([deux, un], [], MERCREDI)?._id).toBe('s1');
  });
});
