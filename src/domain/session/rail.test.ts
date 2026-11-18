/**
 * Ce que le rail dit d'une séance sans l'ouvrir : sa durée, ses jours, et
 * les cinq derniers ressentis du client.
 */
import { describe, expect, it } from 'vitest';
import type { CompletedSession } from '@/shared/types';
import {
  makeBlock,
  makeBlockExercise,
  makeCompleted,
  makeSession,
} from '@/domain/fixtures';
import {
  cardLine,
  daysChip,
  daysLine,
  durationLabel,
  pulseOf,
  railLine,
} from './rail';

const session = makeSession({
  _id: 'seance-1',
  suggestedDays: [3, 0],
  blocks: [makeBlock({ exercises: [makeBlockExercise({ reps: 10 })] })],
});
const empty = makeSession({ _id: 'vide', blocks: [] });

const done = (day: number, effort?: number, sessionId = 'seance-1') =>
  makeCompleted({
    _id: `bilan-${sessionId}-${day}`,
    originalSessionId: sessionId,
    completedAt: `2026-09-${String(day).padStart(2, '0')}T10:00:00.000Z`,
    feedback:
      effort === undefined
        ? undefined
        : ({ effort, tags: [] } as CompletedSession['feedback']),
  });

describe('la ligne du rail', () => {
  it('« ≈ 5 min · lun, jeu » : la durée, puis les jours dans l’ordre', () => {
    expect(railLine(session, { tracked: true, done: true })).toBe(
      '≈ 5 min · lun, jeu'
    );
  });

  it('« jamais faite » quand le client ne l’a jamais faite', () => {
    expect(railLine(session, { tracked: true, done: false })).toBe(
      '≈ 5 min · lun, jeu · jamais faite'
    );
  });

  // Un modèle n'est fait par personne.
  it('dans un modèle, jamais « jamais faite »', () => {
    expect(railLine(session, { tracked: false, done: false })).toBe(
      '≈ 5 min · lun, jeu'
    );
  });

  it('une séance sans bloc se dit vide', () => {
    expect(durationLabel(empty)).toBe('vide');
  });
});

describe('la ligne d’une carte de la bande', () => {
  // 176 px de large : les jours n'y tiennent pas avec le reste.
  it('la durée seule, sans les jours', () => {
    expect(cardLine(session, { tracked: true, done: true })).toBe('≈ 5 min');
  });

  it('« jamais faite » reste, faute d’être dit ailleurs sur téléphone', () => {
    expect(cardLine(session, { tracked: true, done: false })).toBe(
      '≈ 5 min · jamais faite'
    );
  });

  it('dans un modèle, la durée seule', () => {
    expect(cardLine(session, { tracked: false, done: false })).toBe('≈ 5 min');
  });
});

describe('les jours', () => {
  it('dans la ligne, en minuscules ; dans la pastille, en capitales', () => {
    expect(daysLine([3, 0])).toBe('lun, jeu');
    expect(daysChip([3, 0])).toBe('Lun · Jeu');
  });

  it('sans jour, la pastille invite à en choisir', () => {
    expect(daysChip([])).toBe('Jours conseillés');
  });
});

describe('le pouls d’une séance', () => {
  it('cinq points, du plus ancien au plus récent', () => {
    const history = [
      done(5, 4),
      done(1, 3),
      done(3, 3),
      done(7, 5),
      done(2, 3),
    ];
    expect(pulseOf(history, 'seance-1')).toEqual([
      'target',
      'target',
      'target',
      'hard',
      'hard',
    ]);
  });

  // Le plus récent se lit à droite, sur toutes les lignes du rail.
  it('faite une fois : quatre places vides, puis la sienne', () => {
    expect(pulseOf([done(1, 1)], 'seance-1')).toEqual([
      null,
      null,
      null,
      null,
      'easy',
    ]);
  });

  it('les cinq derniers seulement, et ceux de cette séance', () => {
    const history = [
      done(1, 1),
      ...[2, 3, 4, 5, 6].map((d) => done(d, 3)),
      done(9, 5, 'autre'),
    ];
    expect(pulseOf(history, 'seance-1')).toEqual(Array(5).fill('target'));
  });

  it('un bilan sans ressenti laisse sa place vide', () => {
    expect(pulseOf([done(1, 3), done(2)], 'seance-1').slice(-2)).toEqual([
      'target',
      null,
    ]);
  });
});
