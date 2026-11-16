import { describe, expect, it } from 'vitest';
import { homeFocus, pastDayLabel, weekWords } from './home';
import { makeCompleted, makeSession } from '@/domain/fixtures';

// La semaine du lundi 7 au dimanche 13 septembre 2026, le programme du
// décor : A le lundi et le jeudi, B le samedi, C sans jour.
const A = makeSession({ _id: 'a', order: 1, suggestedDays: [0, 3] });
const B = makeSession({ _id: 'b', order: 2, suggestedDays: [5] });
const C = makeSession({ _id: 'c', order: 3, suggestedDays: [] });
const PROGRAM = [A, B, C];
const day = (date: number, hour = 18) => new Date(2026, 8, date, hour, 0);
const did = (sessionId: string, date: number, id = `${sessionId}-${date}`) =>
  makeCompleted({
    _id: id,
    originalSessionId: sessionId,
    completedAt: day(date, 9).toISOString(),
  });
// Une séance d'il y a longtemps : le client n'en est plus à sa première.
const OLD = did('c', 1 - 30);

describe('homeFocus', () => {
  it('la toute première fois passe devant tout', () => {
    expect(homeFocus(PROGRAM, [], A, day(7)).kind).toBe('first');
  });

  it('met en avant la séance conseillée aujourd’hui', () => {
    expect(homeFocus(PROGRAM, [OLD], C, day(10))).toEqual({
      kind: 'today',
      session: A,
    });
  });

  it('un jour sans conseil, annonce le prochain jour conseillé', () => {
    expect(homeFocus(PROGRAM, [OLD, did('a', 7)], B, day(8))).toEqual({
      kind: 'rest',
      session: A,
      day: 3,
      doneToday: false,
    });
  });

  it('la séance du jour faite, le reste de la semaine attend', () => {
    const focus = homeFocus(PROGRAM, [OLD, did('a', 10)], B, day(10));
    expect(focus).toMatchObject({ kind: 'rest', session: B, day: 5 });
    expect(focus.kind === 'rest' && focus.doneToday).toBe(true);
  });

  it('une semaine pleine passe devant le jour conseillé', () => {
    const three = [did('c', 7, 'x'), did('c', 8, 'y'), did('c', 9, 'z')];
    expect(homeFocus(PROGRAM, three, A, day(10)).kind).toBe('full');
  });

  it('les jours conseillés passés, la suivante du cycle sans commentaire', () => {
    expect(homeFocus(PROGRAM, [OLD], B, day(13))).toEqual({
      kind: 'next',
      session: B,
    });
  });

  it('sans jour conseillé nulle part, la suivante du cycle', () => {
    const free = PROGRAM.map((s) => ({ ...s, suggestedDays: [] }));
    expect(homeFocus(free, [OLD], free[1], day(10)).kind).toBe('next');
  });
});

describe('weekWords', () => {
  const words = (
    history: ReturnType<typeof did>[],
    today: number,
    streak = 0
  ) => weekWords({ sessions: PROGRAM, history, streak, today: day(today) });

  it('nomme les jours qui restent, pas ceux qui sont passés', () => {
    expect(words([OLD, did('a', 7)], 8)).toEqual({
      title: 'Une séance sur trois',
      line: 'Il te reste jeudi et samedi.',
    });
  });

  it('compte aujourd’hui tant que la séance du jour n’est pas faite', () => {
    expect(words([OLD, did('a', 7)], 10).line).toBe(
      "Il te reste aujourd'hui et samedi."
    );
    expect(words([OLD, did('a', 7), did('a', 10)], 10).line).toBe(
      'Il te reste samedi.'
    );
  });

  it('la première semaine, annonce les jours conseillés', () => {
    expect(words([], 7)).toEqual({
      title: 'Trois séances cette semaine',
      line: 'Lundi, jeudi et samedi.',
    });
  });

  it('pleine, dit le rang de la semaine dans la suite', () => {
    const three = [did('a', 7), did('a', 10), did('b', 12)];
    expect(words(three, 12, 5)).toEqual({
      title: 'Semaine pleine',
      line: 'Trois séances sur trois. Cinquième semaine de suite.',
    });
    expect(words(three, 12, 1).line).toBe('Trois séances sur trois.');
  });

  it('au-delà du prévu, dit le vrai nombre', () => {
    const four = [did('a', 7), did('a', 8), did('a', 10), did('b', 12)];
    expect(words(four, 12).line).toBe('Quatre séances pour trois prévues.');
  });

  it('sans jour conseillé, seulement le compte', () => {
    const free = PROGRAM.map((s) => ({ ...s, suggestedDays: [] }));
    expect(
      weekWords({
        sessions: free,
        history: [did('a', 7), did('b', 9)],
        streak: 0,
        today: day(10),
      })
    ).toEqual({
      title: 'Deux séances cette semaine',
      line: "Ton coach n'a pas fixé de jours : fais-les quand tu veux.",
    });
    // Le coach se nomme quand on sait qui c'est.
    expect(
      weekWords({
        sessions: free,
        history: [],
        streak: 0,
        coach: 'Julie',
        today: day(10),
      }).line
    ).toBe("Julie n'a pas fixé de jours : fais-les quand tu veux.");
  });

  it('les jours passés sans séance ne se nomment pas', () => {
    expect(words([OLD], 13)).toEqual({
      title: 'Trois séances cette semaine',
      line: 'Plus de jour conseillé cette semaine.',
    });
  });
});

describe('pastDayLabel', () => {
  const sunday = day(13, 20);
  it('dit le jour tant qu’on est dans la semaine écoulée', () => {
    expect(pastDayLabel(day(13, 7), sunday)).toBe("Aujourd'hui");
    expect(pastDayLabel(day(12, 23), sunday)).toBe('Hier');
    expect(pastDayLabel(day(10), sunday)).toBe('Jeudi');
    expect(pastDayLabel(day(7), sunday)).toBe('Lundi');
  });
  it('au-delà, la date', () => {
    expect(pastDayLabel(day(6), sunday)).toBe('6 septembre');
  });
});
