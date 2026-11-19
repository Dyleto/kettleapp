/**
 * Le pouls d'une séance : la dérive, depuis quand, le dernier mot, les
 * étiquettes et ce qui reste à lire.
 */
import { describe, expect, it } from 'vitest';
import type { CompletedSession, FeedbackTag } from '@/shared/types';
import { makeCompleted } from '@/domain/fixtures';
import {
  effortDrift,
  painSite,
  pulseHeadline,
  sessionPulse,
  tagLabel,
} from './pulse';

let day = 0;
/** Un passage de la séance 1, un jour après le précédent. */
const passage = (
  effort?: number,
  extra: Partial<CompletedSession> & { tags?: FeedbackTag[] } = {}
) => {
  day += 1;
  const { tags, ...rest } = extra;
  return makeCompleted({
    _id: `bilan-${day}`,
    completedAt: `2026-09-${String(day).padStart(2, '0')}T10:00:00.000Z`,
    feedback: effort === undefined ? undefined : { effort, tags: tags ?? [] },
    viewedByCoach: true,
    ...rest,
  });
};

describe('la dérive', () => {
  it('trois ressentis qui montent de deux crans : trop dure', () => {
    expect(effortDrift([3, 4, 5])).toBe('harder');
  });

  it('qui descendent : trop facile', () => {
    expect(effortDrift([4, 3, 2])).toBe('easier');
  });

  // Deux ressentis ne font pas une tendance.
  it('rien sous trois ressentis', () => {
    expect(effortDrift([3, 5])).toBeNull();
  });

  it('rien quand le sens change en route', () => {
    expect(effortDrift([3, 5, 4, 5])).toBeNull();
  });

  it('rien sous deux crans', () => {
    expect(effortDrift([3, 3, 4])).toBeNull();
  });
});

describe('le pouls d’une séance', () => {
  it('« Devient trop dure depuis deux passages »', () => {
    const history = [
      passage(3),
      passage(3),
      passage(3),
      passage(4),
      passage(5),
    ];
    const pulse = sessionPulse(history, 'seance-1');
    expect(pulse.drift).toBe('harder');
    expect(pulse.streak).toBe(2);
    expect(pulseHeadline(pulse)).toEqual({
      text: 'Devient trop dure',
      tone: 'hard',
      since: 'depuis deux passages',
    });
  });

  // Un « depuis un passage » ne dirait rien que « Devient » ne dise déjà.
  it('pas de « depuis » pour un seul passage au bout', () => {
    const history = [passage(2), passage(3), passage(4)];
    const pulse = sessionPulse(history, 'seance-1');
    expect(pulse.streak).toBe(1);
    expect(pulseHeadline(pulse).since).toBeUndefined();
  });

  it('sans dérive, le dernier ressenti', () => {
    const pulse = sessionPulse(
      [passage(3), passage(4), passage(3)],
      'seance-1'
    );
    expect(pulseHeadline(pulse)).toEqual({
      text: 'Juste en dernier',
      tone: 'target',
    });
  });

  // La dérive se lit dans ce qu'on a sous les yeux : les cinq points.
  it('la dérive ne porte que sur les cinq derniers passages', () => {
    const history = [
      passage(1),
      passage(2),
      passage(3),
      passage(3),
      passage(3),
      passage(3),
      passage(3),
    ];
    expect(sessionPulse(history, 'seance-1').drift).toBeNull();
    expect(sessionPulse(history, 'seance-1').passages).toBe(7);
  });

  it('les autres séances ne comptent pas', () => {
    const history = [
      passage(3),
      passage(5, { originalSessionId: 'seance-2' }),
      passage(5, { originalSessionId: 'seance-2' }),
    ];
    const pulse = sessionPulse(history, 'seance-1');
    expect(pulse.passages).toBe(1);
    expect(pulse.drift).toBeNull();
  });

  // Un passage sans mot n'efface pas le dernier que le client a écrit.
  it('le dernier mot écrit, même si le dernier passage n’en a pas', () => {
    const history = [
      passage(3, { clientNotes: 'Bon rythme.' }),
      passage(4, { clientNotes: '  Dur sur la fin.  ' }),
      passage(4),
    ];
    expect(sessionPulse(history, 'seance-1').lastWord).toEqual({
      at: history[1].completedAt,
      note: 'Dur sur la fin.',
    });
  });

  it('les étiquettes comptées, la douleur d’abord, avec son endroit', () => {
    const history = [
      passage(3, { tags: ['fatigue'] }),
      passage(4, { tags: ['fatigue', 'pain'], clientNotes: 'Les épaules.' }),
      passage(4, { tags: ['great_shape'] }),
    ];
    const tags = sessionPulse(history, 'seance-1').tags.map(tagLabel);
    expect(tags).toEqual(['Douleur · épaule', 'Fatigue × 2', 'En forme']);
  });

  it('les passages que le coach n’a pas lus', () => {
    const history = [passage(3), passage(4, { viewedByCoach: false })];
    expect(sessionPulse(history, 'seance-1').unread).toBe(1);
  });

  it('un passage sans ressenti ne compte ni pour la dérive ni pour le dernier', () => {
    const pulse = sessionPulse([passage(3), passage(undefined)], 'seance-1');
    expect(pulse.last?.label).toBe('Juste');
    expect(pulse.zones.slice(-2)).toEqual(['target', null]);
  });
});

describe('l’endroit d’une douleur', () => {
  it('au pluriel, avec ou sans accent', () => {
    expect(painSite('mal aux genoux')).toBe('genou');
    expect(painSite('epaule droite')).toBe('épaule');
    expect(painSite('Le bas du dos tire')).toBe('dos');
  });

  // Une liste qui ne connaît pas un mot se tait plutôt que de deviner.
  it('rien quand la note ne nomme aucun endroit connu', () => {
    expect(painSite('ça tire un peu')).toBeUndefined();
    expect(painSite(undefined)).toBeUndefined();
  });
});
