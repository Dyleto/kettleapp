import { describe, expect, it } from 'vitest';
import {
  blockMarker,
  blockTitle,
  distinctExerciseCount,
  estimatedMinutes,
  getCompletedSessionBlockTypes,
  getSessionBlockTypes,
  getSessionSummary,
} from './measure';
import {
  makeBlock,
  makeBlockExercise,
  makeBlockSnapshot,
  makeCompleted,
  makeExercise,
  makeSession,
} from '@/domain/fixtures';

const swing = makeExercise({ _id: 'ex-swing', name: 'Kettlebell Swing' });
const lunge = makeExercise({ _id: 'ex-lunge', name: 'Fentes marchées' });

describe('distinctExerciseCount', () => {
  it('compte les mouvements, pas les lignes', () => {
    // Le défaut d'origine : « 12 exercices » pour une séance de sept, parce
    // que l'écran comptait ses étapes.
    const session = makeSession({
      blocks: [
        makeBlock({
          order: 1,
          exercises: [
            makeBlockExercise({ order: 1, sets: 4 }),
            makeBlockExercise({ order: 2, exercise: swing, sets: 3 }),
          ],
        }),
      ],
    });
    expect(distinctExerciseCount(session)).toBe(2);
  });

  it('ne compte qu’une fois un mouvement repris dans deux blocs', () => {
    const session = makeSession({
      blocks: [
        makeBlock({ order: 1 }),
        makeBlock({
          _id: 'bloc-2',
          order: 2,
          type: 'emom',
          exercises: [
            makeBlockExercise({ order: 1 }),
            makeBlockExercise({ order: 2, exercise: swing }),
          ],
        }),
      ],
    });
    expect(distinctExerciseCount(session)).toBe(2);
  });

  it('vaut zéro pour une séance sans bloc', () => {
    expect(distinctExerciseCount(makeSession({ blocks: [] }))).toBe(0);
  });
});

describe('blockTitle', () => {
  it('prend le nom que le coach a donné', () => {
    expect(blockTitle({ type: 'classic', label: 'Renfo' })).toBe('Renfo');
  });

  it('retombe sur le nom du format, y compris pour un nom vide', () => {
    expect(blockTitle({ type: 'emom' })).toBe('EMOM');
    expect(blockTitle({ type: 'emom', label: '   ' })).toBe('EMOM');
  });
});

describe('blockMarker', () => {
  it('compte un EMOM en tours et en minutes', () => {
    expect(blockMarker(makeBlock({ type: 'emom', rounds: 10 }))).toBe(
      '10 tours · 10 min'
    );
    expect(
      blockMarker(makeBlock({ type: 'emom', rounds: 6, intervalMinutes: 2 }))
    ).toBe('6 tours · 12 min');
  });

  it('dit qu’un EMOM sans nombre de tours est sans limite', () => {
    // « 1 tour » s'affichait : le défaut du champ vide, lu comme un tour.
    expect(blockMarker(makeBlock({ type: 'emom', intervalMinutes: 1 }))).toBe(
      'sans limite'
    );
  });

  it('compte un Tabata avec son repos', () => {
    // 8 × (20 s + 10 s) = 4 min : le temps réel du bloc, repos compris.
    expect(
      blockMarker(
        makeBlock({
          type: 'tabata',
          rounds: 8,
          workDuration: 20,
          restDuration: 10,
        })
      )
    ).toBe('8 tours · 4 min');
  });

  it('donne à un AMRAP sa durée, ou dit qu’il n’en a pas', () => {
    expect(blockMarker(makeBlock({ type: 'amrap', durationMinutes: 12 }))).toBe(
      '12 min'
    );
    expect(blockMarker(makeBlock({ type: 'amrap' }))).toBe('sans limite');
  });

  it('compte un bloc classique en séries', () => {
    const block = makeBlock({
      exercises: [
        makeBlockExercise({ order: 1, sets: 4 }),
        makeBlockExercise({ order: 2, exercise: lunge, sets: 3 }),
      ],
    });
    expect(blockMarker(block)).toBe('7 séries');
  });

  it('compte en exercices un bloc où chaque mouvement n’a qu’une série', () => {
    const block = makeBlock({
      type: 'warmup',
      exercises: [
        makeBlockExercise({ order: 1 }),
        makeBlockExercise({ order: 2, exercise: swing }),
      ],
    });
    expect(blockMarker(block)).toBe('2 exercices');
  });

  it('compte une échelle en paliers et un chipper en mouvements', () => {
    expect(
      blockMarker(makeBlock({ type: 'ladder', repsScheme: [2, 4, 6, 4, 2] }))
    ).toBe('5 paliers');
    expect(
      blockMarker(
        makeBlock({
          type: 'chipper',
          durationMinutes: 20,
          exercises: [
            makeBlockExercise({ order: 1 }),
            makeBlockExercise({ order: 2, exercise: swing }),
            makeBlockExercise({ order: 3, exercise: lunge }),
          ],
        })
      )
    ).toBe('3 mouvements · 20 min');
  });

  it('ajoute sa limite à une échelle bornée', () => {
    expect(
      blockMarker(
        makeBlock({
          type: 'ladder',
          repsScheme: [2, 4, 6, 8, 6, 4, 2],
          durationMinutes: 12,
        })
      )
    ).toBe('7 paliers · 12 min');
  });

  it('s’accorde au singulier', () => {
    expect(blockMarker(makeBlock({ type: 'emom', rounds: 1 }))).toBe(
      '1 tour · 1 min'
    );
    expect(blockMarker(makeBlock())).toBe('1 exercice');
  });
});

describe('estimatedMinutes', () => {
  it('est exacte pour ce que l’horloge fixe', () => {
    const session = makeSession({
      blocks: [makeBlock({ type: 'emom', rounds: 10 })],
    });
    expect(estimatedMinutes(session)).toBe(10);
  });

  it('compte les repos écrits par le coach', () => {
    // 4 séries à 40 s + 3 repos d'une minute = 5 min 40, soit 5 arrondi à
    // cinq ; avec deux minutes de repos, 8 min 40, soit 10.
    const block = (rest: number) =>
      makeBlock({
        exercises: [makeBlockExercise({ sets: 4, restBetweenSets: rest })],
      });
    expect(estimatedMinutes(makeSession({ blocks: [block(60)] }))).toBe(5);
    expect(estimatedMinutes(makeSession({ blocks: [block(120)] }))).toBe(10);
  });

  it('ne descend jamais sous cinq minutes, même pour une séance vide', () => {
    expect(estimatedMinutes(makeSession({ blocks: [] }))).toBe(5);
  });

  it('est toujours un multiple de cinq', () => {
    const session = makeSession({
      blocks: [
        makeBlock({ order: 1, type: 'amrap', durationMinutes: 12 }),
        makeBlock({ _id: 'bloc-2', order: 2, type: 'emom', rounds: 7 }),
      ],
    });
    expect(estimatedMinutes(session) % 5).toBe(0);
  });
});

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

// Un bilan peut porter un format de bloc qui n'existe plus. On ne peut pas
// en créer par l'écran — le format a disparu de l'éditeur — et l'historique
// en contient : seul ce test le voit.
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
