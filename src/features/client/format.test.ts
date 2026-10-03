/**
 * Ce qui tient sous le nom d'une séance, et la date telle qu'on la lit.
 *
 * Deux choses ne se vérifient que d'ici.
 *
 * Les bascules d'heure. Entre le dimanche et le lundi du changement d'heure,
 * deux minuits locaux sont séparés de 23 h au printemps et de 25 h à
 * l'automne — mesuré : 82 800 000 et 90 000 000 ms. C'est `Math.round` qui
 * les ramène tous les deux à « Hier », et cela ne se voit que sous un fuseau
 * qui change d'heure : la suite tourne en `Europe/Paris`.
 *
 * Un bilan portant un format de bloc qui n'existe plus. On ne peut pas en
 * créer par l'écran — le format a disparu de l'éditeur — et l'historique en
 * contient.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getCompletedSessionBlockTypes,
  getEffortSummary,
  getRelativeDate,
  getSessionBlockTypes,
  getSessionSummary,
} from './format';
import {
  makeCompleted,
  makeBlockSnapshot,
  makeBlock,
  makeBlockExercise,
  makeSession,
} from './fixtures';

afterEach(() => vi.useRealTimers());

describe('l’ampleur d’une séance, sans l’ouvrir', () => {
  it('compte ses blocs et ses exercices', () => {
    expect(
      getSessionSummary(
        makeSession({
          blocks: [
            makeBlock({
              exercises: [makeBlockExercise(), makeBlockExercise({ order: 2 })],
            }),
            makeBlock({
              _id: 'bloc-2',
              order: 2,
              exercises: [makeBlockExercise()],
            }),
          ],
        })
      )
    ).toBe('2 blocs · 3 exercices');
  });

  it('reste au singulier à un seul de chaque', () => {
    expect(getSessionSummary(makeSession())).toBe('1 bloc · 1 exercice');
  });

  it('et au singulier à zéro, comme le veut le français', () => {
    // « 0 blocs » est une faute ; en français le pluriel commence à deux.
    expect(getSessionSummary(makeSession({ blocks: [] }))).toBe(
      '0 bloc · 0 exercice'
    );
  });
});

describe('les formats d’une séance', () => {
  it('se lisent en clair', () => {
    expect(
      getSessionBlockTypes(
        makeSession({
          blocks: [
            makeBlock({ type: 'warmup' }),
            makeBlock({ _id: 'bloc-2', order: 2, type: 'amrap' }),
          ],
        })
      )
    ).toBe('Échauffement · AMRAP');
  });

  it('sans répéter un format présent deux fois', () => {
    // « AMRAP · AMRAP » ne dit rien de plus que « AMRAP », et une séance de
    // quatre blocs identiques remplirait la ligne pour rien.
    expect(
      getSessionBlockTypes(
        makeSession({
          blocks: [
            makeBlock({ type: 'amrap' }),
            makeBlock({ _id: 'bloc-2', order: 2, type: 'amrap' }),
            makeBlock({ _id: 'bloc-3', order: 3, type: 'emom' }),
          ],
        })
      )
    ).toBe('AMRAP · EMOM');
  });

  it('dans l’ordre des blocs, et non dans celui de la liste des formats', () => {
    expect(
      getSessionBlockTypes(
        makeSession({
          blocks: [
            makeBlock({ type: 'amrap' }),
            makeBlock({ _id: 'bloc-2', order: 2, type: 'warmup' }),
          ],
        })
      )
    ).toBe('AMRAP · Échauffement');
  });

  it('rien du tout sur une séance sans bloc', () => {
    expect(getSessionBlockTypes(makeSession({ blocks: [] }))).toBe('');
  });
});

describe('les formats d’un bilan', () => {
  it('se lisent comme ceux d’une séance', () => {
    expect(
      getCompletedSessionBlockTypes(
        makeCompleted({
          blocks: [
            makeBlockSnapshot({ type: 'warmup' }),
            makeBlockSnapshot({ order: 2, type: 'tabata' }),
          ],
        })
      )
    ).toBe('Échauffement · Tabata');
  });

  it('sans répéter un format présent deux fois, comme sur une séance', () => {
    // Le dédoublonnage est écrit deux fois, une par fonction : ne le
    // vérifier que du côté séance laissait celui du bilan sans assertion.
    expect(
      getCompletedSessionBlockTypes(
        makeCompleted({
          blocks: [
            makeBlockSnapshot({ type: 'amrap' }),
            makeBlockSnapshot({ order: 2, type: 'amrap' }),
            makeBlockSnapshot({ order: 3, type: 'emom' }),
          ],
        })
      )
    ).toBe('AMRAP · EMOM');
  });

  it('et un format disparu se montre tel qu’il a été figé', () => {
    // Le type d'un bloc figé est une chaîne libre : un bilan d'il y a un an
    // peut porter un format retiré depuis de l'éditeur. Mieux vaut afficher
    // le mot brut qu'un vide ou un « Classique » inventé — le client, lui,
    // se souvient de ce qu'il a fait.
    expect(
      getCompletedSessionBlockTypes(
        makeCompleted({
          blocks: [makeBlockSnapshot({ type: 'ladder-inverse' })],
        })
      )
    ).toBe('ladder-inverse');
  });
});

describe('le cran d’effort d’un bilan', () => {
  it('rend le cran que le client a choisi', () => {
    expect(
      getEffortSummary(makeCompleted({ feedback: { effort: 3 } }))?.label
    ).toBe('Juste');
  });

  it('rien sur un bilan d’avant la refonte de l’échelle', () => {
    // La question ne lui a jamais été posée : on n'invente pas de réponse, et
    // surtout pas un « Juste » par défaut, qui se lirait comme un ressenti.
    expect(getEffortSummary(makeCompleted())).toBeNull();
  });

  it('rien non plus sur un cran hors échelle', () => {
    expect(
      getEffortSummary(makeCompleted({ feedback: { effort: 9 } }))
    ).toBeNull();
  });
});

describe('la date telle qu’on la lit', () => {
  /** L'horloge figée au jour et à l'heure dits, en heure locale. */
  const freezeClock = (iso: string) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(iso));
  };

  it('« Aujourd’hui », quelle que soit l’heure', () => {
    freezeClock('2026-09-15T22:30:00');
    expect(getRelativeDate(new Date('2026-09-15T06:00:00'))).toBe(
      "Aujourd'hui"
    );
  });

  it('« Hier » à deux heures d’écart, quand ce n’est pas le même jour', () => {
    // C'est tout le propos : une séance d'hier 23 h et une lecture
    // d'aujourd'hui 1 h sont à deux heures d'écart. Comparer les
    // millisecondes dirait « Aujourd'hui », et c'est le jour qui se lit.
    freezeClock('2026-09-16T01:00:00');
    expect(getRelativeDate(new Date('2026-09-15T23:00:00'))).toBe('Hier');
  });

  it('les jours se comptent jusqu’à six', () => {
    freezeClock('2026-09-16T12:00:00');
    expect(getRelativeDate(new Date('2026-09-14T12:00:00'))).toBe(
      'Il y a 2 jours'
    );
    expect(getRelativeDate(new Date('2026-09-10T12:00:00'))).toBe(
      'Il y a 6 jours'
    );
  });

  it('au-delà, c’est la date', () => {
    // « Il y a 23 jours » ne se situe pas : à une semaine, une date est plus
    // courte à lire qu'un compte à rebours.
    freezeClock('2026-09-16T12:00:00');
    expect(getRelativeDate(new Date('2026-09-09T12:00:00'))).toBe('9 sept.');
    expect(getRelativeDate(new Date('2026-08-24T12:00:00'))).toBe('24 août');
  });

  it('une date à venir donne la date, pas un compte négatif', () => {
    // Rien n'empêche un bilan daté d'une horloge mal réglée. « Il y a -1
    // jours » n'est pas une phrase.
    freezeClock('2026-09-16T12:00:00');
    expect(getRelativeDate(new Date('2026-09-20T12:00:00'))).toBe('20 sept.');
  });

  it('accepte aussi une date en chaîne, comme l’API l’envoie', () => {
    freezeClock('2026-09-16T12:00:00');
    expect(getRelativeDate('2026-09-15T08:00:00.000Z')).toBe('Hier');
  });

  describe('les bascules d’heure', () => {
    it('23 heures au printemps font quand même « Hier »', () => {
      // Mesuré : du 29 au 30 mars 2026 à Paris, deux minuits locaux sont à
      // 82 800 000 ms. Divisé par 86 400 000, cela fait 0,958 — un
      // `Math.floor` dirait « Aujourd'hui » pour une séance de la veille.
      freezeClock('2026-03-30T10:00:00');
      expect(getRelativeDate(new Date('2026-03-29T18:00:00'))).toBe('Hier');
    });

    it('25 heures à l’automne aussi', () => {
      // Et dans l'autre sens : 90 000 000 ms, soit 1,042 — un `Math.ceil`
      // dirait « Il y a 2 jours ».
      freezeClock('2026-10-26T10:00:00');
      expect(getRelativeDate(new Date('2026-10-25T18:00:00'))).toBe('Hier');
    });
  });
});
