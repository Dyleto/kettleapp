/**
 * Le vocabulaire de la semaine, et la frontière des jours.
 *
 * Deux choses s'y jouent, et toutes deux cassent en silence.
 *
 * La semaine commence un lundi. `Date.getDay()` la fait commencer un
 * dimanche, et le décalage ne se voit qu'un jour sur sept — le dimanche,
 * précisément, où un client qui a fait sa séance la verrait tomber dans la
 * semaine suivante.
 *
 * La clé d'un jour se lit en heure locale. `toISOString()` bascule en UTC :
 * une séance enregistrée à 22 h à Paris tombe la veille. Le défaut est muet
 * entre minuit et une heure du matin l'hiver, deux heures l'été, et un test
 * qui ne fixe pas l'heure ne le voit jamais.
 */
import { describe, expect, it } from 'vitest';
import {
  dayKey,
  formatDayLabel,
  mondayIndex,
  startOfWeek,
  WEEKDAY_FULL,
  WEEKDAY_LETTERS,
  WEEKDAY_SHORT,
} from './sessionDates';

describe('la clé d’un jour', () => {
  it('complète le mois et le jour sur deux chiffres', () => {
    expect(dayKey(new Date(2026, 2, 7))).toBe('2026-03-07');
  });

  it('se lit en heure locale, et non en UTC', () => {
    // Le cas qui sépare les deux lectures : 0 h 30 à Paris, c'est 22 h 30 la
    // veille en UTC. `toISOString()` rendrait donc le 20.
    const tot = new Date(2026, 8, 21, 0, 30);
    expect(tot.toISOString().slice(0, 10)).toBe('2026-09-20');
    expect(dayKey(tot)).toBe('2026-09-21');
  });

  it("vaut aussi l'hiver, où Paris n'est qu'à une heure", () => {
    const tot = new Date(2026, 0, 15, 0, 30);
    expect(tot.toISOString().slice(0, 10)).toBe('2026-01-14');
    expect(dayKey(tot)).toBe('2026-01-15');
  });

  it('ne bouge pas à une minute de minuit', () => {
    expect(dayKey(new Date(2026, 8, 20, 23, 59))).toBe('2026-09-20');
    expect(dayKey(new Date(2026, 8, 21, 0, 1))).toBe('2026-09-21');
  });

  it('tient un 31 décembre', () => {
    expect(dayKey(new Date(2026, 11, 31, 23, 0))).toBe('2026-12-31');
  });
});

describe('lundi = 0', () => {
  // 2026-09-21 est un lundi. Les sept jours qui suivent couvrent la semaine.
  const semaine = [
    ['lundi', new Date(2026, 8, 21), 0],
    ['mardi', new Date(2026, 8, 22), 1],
    ['mercredi', new Date(2026, 8, 23), 2],
    ['jeudi', new Date(2026, 8, 24), 3],
    ['vendredi', new Date(2026, 8, 25), 4],
    ['samedi', new Date(2026, 8, 26), 5],
    ['dimanche', new Date(2026, 8, 27), 6],
  ] as const;

  it.each(semaine)('%s vaut %i', (_nom, date, attendu) => {
    expect(mondayIndex(date)).toBe(attendu);
  });

  it('le dimanche ferme la semaine, il ne l’ouvre pas', () => {
    // Le défaut qu'on écarte : `getDay()` rend 0 pour un dimanche.
    expect(mondayIndex(new Date(2026, 8, 27))).toBe(6);
  });
});

describe('le lundi de la semaine', () => {
  it('depuis un mercredi, remonte au lundi', () => {
    expect(dayKey(startOfWeek(new Date(2026, 8, 23, 14, 0)))).toBe(
      '2026-09-21'
    );
  });

  it('depuis un lundi, ne bouge pas', () => {
    expect(dayKey(startOfWeek(new Date(2026, 8, 21, 8, 0)))).toBe('2026-09-21');
  });

  it('depuis un dimanche, reste dans la semaine qui finit', () => {
    expect(dayKey(startOfWeek(new Date(2026, 8, 27, 20, 0)))).toBe(
      '2026-09-21'
    );
  });

  it('rend minuit local, pas l’heure qu’on lui a donnée', () => {
    const lundi = startOfWeek(new Date(2026, 8, 23, 14, 37, 12));
    expect([lundi.getHours(), lundi.getMinutes(), lundi.getSeconds()]).toEqual([
      0, 0, 0,
    ]);
  });

  it('traverse un changement de mois', () => {
    // Le mercredi 1er octobre 2026 ; son lundi est le 28 septembre.
    expect(dayKey(startOfWeek(new Date(2026, 9, 1)))).toBe('2026-09-28');
  });

  it('traverse un changement d’année', () => {
    // Le vendredi 1er janvier 2027 ; son lundi est le 28 décembre 2026.
    expect(dayKey(startOfWeek(new Date(2027, 0, 1)))).toBe('2026-12-28');
  });
});

describe('les trois longueurs de nom', () => {
  it('ont sept entrées chacune, dans le même ordre', () => {
    expect(WEEKDAY_LETTERS).toHaveLength(7);
    expect(WEEKDAY_SHORT).toHaveLength(7);
    expect(WEEKDAY_FULL).toHaveLength(7);
    expect(WEEKDAY_LETTERS[0]).toBe('L');
    expect(WEEKDAY_SHORT[0]).toBe('Lun');
    expect(WEEKDAY_FULL[0]).toBe('lundi');
    expect(WEEKDAY_FULL[6]).toBe('dimanche');
  });

  it('s’indexent avec `mondayIndex`', () => {
    const dimanche = new Date(2026, 8, 27);
    expect(WEEKDAY_FULL[mondayIndex(dimanche)]).toBe('dimanche');
  });
});

describe('le titre d’un jour', () => {
  it('écrit « lundi 21 septembre » à partir d’une clé', () => {
    expect(formatDayLabel('2026-09-21')).toBe('lundi 21 septembre');
  });

  it('tient sur toute l’année', () => {
    expect(formatDayLabel('2026-01-01')).toBe('jeudi 1 janvier');
    expect(formatDayLabel('2026-12-31')).toBe('jeudi 31 décembre');
  });

  // Ce qu'aucun test d'ici ne couvre, et il vaut mieux l'écrire que de le
  // laisser croire couvert.
  //
  // `formatDayLabel` construit sa date champ par champ — `new Date(year,
  // month - 1, day)` — au lieu de passer la clé à `new Date(key)`, qui
  // l'interpréterait en UTC. Remplacer l'un par l'autre ne fait tomber aucun
  // test, et ce n'est pas un trou dans les assertions : à Paris, minuit UTC
  // tombe à 2 h du matin le même jour, donc les deux lectures donnent le même
  // résultat. L'écart n'apparaît qu'à l'ouest de Greenwich, où minuit UTC est
  // la veille au soir.
  //
  // On garde la construction explicite — elle est juste partout — sans
  // prétendre qu'un test la retient. Le jour où Kettle s'adresse à des
  // francophones du Québec, ce fichier tournera sous deux fuseaux et cette
  // ligne sera couverte.
});
