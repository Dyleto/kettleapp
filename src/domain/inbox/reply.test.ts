/**
 * La réponse du coach vue de son côté : la sienne, celle qu'il peut encore
 * modifier, et ce qu'il en lit une fois partie.
 */
import { describe, expect, it } from 'vitest';
import {
  activeReaction,
  myLastReply,
  sentLabel,
  toggledReaction,
  type Reply,
} from './reply';

const JULIE = 'coach-julie';
const MARC = 'coach-marc';
const reply = (coachId: string, fields: Partial<Reply> = {}): Reply => ({
  coachId,
  firstName: coachId === JULIE ? 'Julie' : 'Marc',
  sentAt: '2026-11-17T08:00:00.000Z',
  ...fields,
});

describe('la réponse de ce coach', () => {
  it('la dernière des siennes, pas celle d’un autre coach', () => {
    const mine = reply(JULIE, { text: 'Bien.' });
    expect(myLastReply([mine, reply(MARC)], JULIE)).toBe(mine);
  });

  it('sans identifiant de coach, rien n’est à lui', () => {
    expect(myLastReply([reply(JULIE)], undefined)).toBeUndefined();
  });
});

describe('la réaction allumée', () => {
  it('celle de sa dernière réponse, tant qu’elle n’est pas lue', () => {
    expect(activeReaction([reply(JULIE, { reaction: 'fire' })], JULIE)).toBe(
      'fire'
    );
  });

  // Lue, elle ne bouge plus : une touche en crée une nouvelle.
  it('lue par le client, plus rien n’est allumé', () => {
    expect(
      activeReaction(
        [reply(JULIE, { reaction: 'fire', readAt: '2026-11-17T09:00:00Z' })],
        JULIE
      )
    ).toBeUndefined();
  });

  it('celle d’un autre coach ne s’allume pas chez celui-ci', () => {
    expect(
      activeReaction([reply(MARC, { reaction: 'clap' })], JULIE)
    ).toBeUndefined();
  });

  it('toucher l’allumée l’éteint, une autre la remplace', () => {
    expect(toggledReaction('fire', 'fire')).toBeNull();
    expect(toggledReaction('fire', 'clap')).toBe('clap');
    expect(toggledReaction(undefined, 'strong')).toBe('strong');
  });
});

describe('ce qui se lit sous la réponse', () => {
  const now = new Date(2026, 10, 18, 10);

  it('« Envoyée hier · lue par Sarah »', () => {
    expect(
      sentLabel(
        reply(JULIE, {
          sentAt: new Date(2026, 10, 17, 18).toISOString(),
          readAt: new Date(2026, 10, 17, 20).toISOString(),
        }),
        'Sarah',
        now
      )
    ).toBe('Envoyée hier · lue par Sarah');
  });

  // C'est ce qui dit au coach qu'il peut encore la modifier.
  it('« pas encore lue » tant que le client ne l’a pas ouverte', () => {
    expect(
      sentLabel(
        reply(JULIE, { sentAt: new Date(2026, 10, 18, 8).toISOString() }),
        'Sarah',
        now
      )
    ).toBe('Envoyée aujourd’hui · pas encore lue');
  });

  it('un client sans prénom : « lue », sans nom inventé', () => {
    expect(
      sentLabel(
        reply(JULIE, {
          sentAt: new Date(2026, 10, 15, 8).toISOString(),
          readAt: new Date(2026, 10, 16, 8).toISOString(),
        }),
        undefined,
        now
      )
    ).toBe('Envoyée il y a 3 jours · lue');
  });
});
