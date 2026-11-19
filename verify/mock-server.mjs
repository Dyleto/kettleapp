/**
 * Le serveur d'essai : une API Kettle en mémoire, sans base de données.
 *
 * Il existe pour mener l'application pour de vrai dans un navigateur —
 * cliquer, taper, terminer une séance — et pour lire ce qu'elle affiche. Le
 * jeu de données couvre les cas qui cassent : un EMOM, un Tabata, un AMRAP,
 * un chipper, une échelle, un bloc « Every » d'avant la fusion, et un
 * historique qui donne de quoi comparer.
 *
 * Il vit dans le dépôt et non dans un dossier temporaire : la première
 * version a été effacée avec son conteneur, et avec elle tout ce qui
 * permettait de vérifier quoi que ce soit.
 */
import http from 'node:http';

/**
 * Le décor est typé par le contrat de l'API : un champ que l'API n'envoie
 * pas, ou un type qui a changé, est refusé par `npm run typecheck` avant
 * d'avoir trompé une seule assertion. Le décor décrivait la même charge que
 * le contrat, à la main, et les deux pouvaient diverger sans bruit.
 *
 * @typedef {import('../src/shared/types/contract.js').ExercisePayload} ExercisePayload
 * @typedef {import('../src/shared/types/contract.js').BlockExercisePayload} BlockExercisePayload
 * @typedef {import('../src/shared/types/contract.js').SessionPayload} SessionPayload
 * @typedef {import('../src/shared/types/contract.js').ProgramPayload} ProgramPayload
 * @typedef {import('../src/shared/types/contract.js').TemplatePayload} TemplatePayload
 * @typedef {import('../src/shared/types/contract.js').TemplateRowPayload} TemplateRowPayload
 * @typedef {import('../src/shared/types/contract.js').CompletedSessionPayload} CompletedSessionPayload
 * @typedef {import('../src/shared/types/contract.js').UserPayload} UserPayload
 */

const COACH_ID = '507f1f77bcf86cd799439011';
const CLIENT_ID = '507f1f77bcf86cd799439012';
const PROGRAM_ID = '507f1f77bcf86cd799439013';

/** @returns {ExercisePayload} */
const ex = (
  id,
  name,
  videoUrl,
  usageCount = 0,
  description = '',
  clientCount = usageCount > 0 ? 1 : 0
) => ({
  _id: id,
  name,
  description,
  videoUrl: videoUrl || '',
  createdBy: COACH_ID,
  createdAt: '2026-06-01T10:00:00.000Z',
  updatedAt: '2026-06-01T10:00:00.000Z',
  usageCount,
  clientCount,
});

/** @type {ExercisePayload[]} */
const EXERCISES = [
  // Deux exercices portent une description de bibliothèque : c'est le seul
  // moyen de vérifier que la consigne d'une séance et la technique générale du
  // mouvement se lisent bien comme distinctes. « Pompes » n'en a pas.
  ex(
    'ex1',
    'Kettlebell Swing',
    'https://www.youtube.com/watch?v=sswzD1Q7dTk',
    12,
    'Dos plat, la poussée vient des hanches et non des bras.',
    4
  ),
  ex(
    'ex2',
    'Goblet Squat',
    '',
    9,
    'Kettlebell contre la poitrine, descendre entre les talons.',
    4
  ),
  ex('ex3', 'Burpee', '', 7),
  ex('ex4', 'Row (rameur)', '', 3),
  ex('ex5', 'Fentes marchées', '', 2),
  ex('ex6', 'Pompes', '', 6),
  ex('ex7', 'Mountain Climbers', '', 1),
  ex('ex8', 'Corde à sauter', '', 0),
  // Hors du programme de ce client : alimente « Tes plus utilisés ».
  ex('ex9', 'Turkish Get-Up', '', 5),
  ex('ex10', 'Planche', '', 0),
];

/**
 * Un exercice tel qu'un programme le porte : sans ses compteurs.
 *
 * L'API ne calcule `usageCount` et `clientCount` que pour la bibliothèque
 * (`GET /coach/exercises`) ; un programme repeuple ses exercices sans eux.
 * Les laisser ici faisait lire à la fiche d'un exercice des compteurs que
 * la vraie API ne lui donne pas — et un sabotage qui l'en privait passait
 * inaperçu.
 *
 * @param {ExercisePayload} exercise
 */
const asPlaced = (exercise) => {
  if (!exercise) return exercise;
  const placed = { ...exercise };
  delete placed.usageCount;
  delete placed.clientCount;
  return placed;
};

/**
 * @param {ExercisePayload} exercise
 * @param {number} order
 * @param {Partial<BlockExercisePayload>} [extra]
 * @returns {BlockExercisePayload}
 */
const blockExercise = (exercise, order, extra = {}) => ({
  exercise: asPlaced(exercise),
  order,
  ...extra,
});

/** @type {SessionPayload[]} */
const SESSIONS = [
  {
    _id: 'sess1',
    order: 1,
    name: 'Full body A',
    notes: '',
    suggestedDays: [0, 3],
    createdAt: '2026-06-01T10:00:00.000Z',
    updatedAt: '2026-06-01T10:00:00.000Z',
    blocks: [
      {
        _id: 'blk1',
        type: 'warmup',
        order: 1,
        durationMinutes: 8,
        exercises: [
          blockExercise(EXERCISES[7], 1, { duration: 120 }),
          blockExercise(EXERCISES[6], 2, { reps: 15 }),
        ],
      },
      {
        _id: 'blk2',
        type: 'emom',
        order: 2,
        intervalMinutes: 1,
        rounds: 10,
        exercises: [
          blockExercise(EXERCISES[0], 1, { reps: 15 }),
          blockExercise(EXERCISES[1], 2, { reps: 12 }),
        ],
      },
      {
        _id: 'blk3',
        type: 'amrap',
        label: 'AMRAP 12',
        order: 3,
        durationMinutes: 12,
        notes: 'Rythme régulier, viser 5-6 tours',
        exercises: [
          blockExercise(EXERCISES[2], 1, { reps: 10 }),
          blockExercise(EXERCISES[3], 2, { duration: 60 }),
          blockExercise(EXERCISES[4], 3, { reps: 20 }),
        ],
      },
    ],
  },
  {
    _id: 'sess2',
    order: 2,
    name: 'Haut du corps',
    notes: 'Focus qualité de mouvement, pas de charge lourde.',
    suggestedDays: [5],
    createdAt: '2026-06-01T10:00:00.000Z',
    updatedAt: '2026-06-01T10:00:00.000Z',
    blocks: [
      {
        _id: 'blk4',
        type: 'tabata',
        order: 1,
        rounds: 8,
        workDuration: 20,
        restDuration: 10,
        exercises: [blockExercise(EXERCISES[5], 1, {})],
      },
      {
        _id: 'blk5',
        type: 'classic',
        label: 'Renfo',
        order: 2,
        exercises: [
          blockExercise(EXERCISES[1], 1, {
            sets: 4,
            reps: 10,
            restBetweenSets: 60,
          }),
          blockExercise(EXERCISES[4], 2, {
            sets: 3,
            reps: 12,
            restBetweenSets: 45,
          }),
        ],
      },
    ],
  },
  {
    _id: 'sess3',
    order: 3,
    notes: '',
    createdAt: '2026-06-01T10:00:00.000Z',
    updatedAt: '2026-06-01T10:00:00.000Z',
    blocks: [
      {
        _id: 'blk6',
        type: 'chipper',
        order: 1,
        notes: 'À faire une seule fois, du haut vers le bas.',
        exercises: [
          blockExercise(EXERCISES[2], 1, { reps: 21 }),
          blockExercise(EXERCISES[0], 2, { reps: 15 }),
          blockExercise(EXERCISES[6], 3, { reps: 12 }),
          blockExercise(EXERCISES[5], 4, { reps: 9 }),
        ],
      },
    ],
  },
  {
    _id: 'sess4',
    order: 4,
    notes: '',
    createdAt: '2026-06-01T10:00:00.000Z',
    updatedAt: '2026-06-01T10:00:00.000Z',
    blocks: [
      {
        _id: 'blk7',
        type: 'onoff',
        order: 1,
        rounds: 8,
        workDuration: 40,
        restDuration: 20,
        exercises: [blockExercise(EXERCISES[0], 1, {})],
      },
      // Un bloc « Every » d'avant la fusion avec l'EMOM : on n'en crée plus,
      // mais ceux des programmes existants doivent s'afficher.
      {
        _id: 'blk9',
        type: 'every',
        order: 2,
        intervalMinutes: 3,
        rounds: 5,
        exercises: [
          blockExercise(EXERCISES[2], 1, { reps: 10 }),
          blockExercise(EXERCISES[3], 2, { reps: 12 }),
        ],
      },
    ],
  },
  {
    _id: 'sess5',
    order: 5,
    notes: '',
    createdAt: '2026-06-01T10:00:00.000Z',
    updatedAt: '2026-06-01T10:00:00.000Z',
    blocks: [
      {
        _id: 'blk8',
        type: 'ladder',
        order: 1,
        repsScheme: [2, 4, 6, 8, 6, 4, 2],
        exercises: [blockExercise(EXERCISES[1], 1, {})],
      },
    ],
  },
  // Une échelle à deux mouvements, ajoutée pour un retour du terrain : « le
  // Pyramide ne fonctionne pas comme espéré, il marche que pour 1 exo et pas
  // plusieurs » — le format s'appelait encore ainsi. Une séance à part et non
  // un exercice ajouté à `sess5` :
  // deux suites comptent ses sept paliers, et un décor doit rester déterminé.
  {
    _id: 'sess6',
    order: 6,
    name: 'Échelle à deux',
    notes: '',
    suggestedDays: [],
    createdAt: '2026-06-01T10:00:00.000Z',
    updatedAt: '2026-06-01T10:00:00.000Z',
    blocks: [
      {
        _id: 'blk10',
        type: 'ladder',
        order: 1,
        repsScheme: [5, 10, 15],
        restBetweenRounds: 45,
        exercises: [
          blockExercise(EXERCISES[5], 1, {}),
          blockExercise(EXERCISES[9], 2, {}),
        ],
      },
    ],
  },
];

const EMPTY_PROGRAM = process.env.MOCK_EMPTY === '1';

/** @returns {ProgramPayload} */
const program = () => ({
  _id: PROGRAM_ID,
  createdAt: '2026-06-01T10:00:00.000Z',
  updatedAt: '2026-06-01T10:00:00.000Z',
  sessions: EMPTY_PROGRAM ? [] : SESSIONS,
});

/**
 * Ce que la base du coach contient, et que le PUT remplace entièrement.
 *
 * Une copie profonde de `SESSIONS` : les suites client lisent `SESSIONS`, et
 * un enregistrement du coach ne doit pas déplacer ce qu'elles observent.
 */
let COACH_SESSIONS = JSON.parse(JSON.stringify(SESSIONS));

/** Le nombre d'enregistrements que le serveur a réellement acceptés. */
let PUT_COUNT = 0;

/**
 * Ce que l'API rend d'un lot de séances reçu : rangs posés, identifiants
 * attribués, mouvements repeuplés.
 *
 * Une seule fonction pour le programme d'un client et pour un modèle, parce
 * que c'est un seul code côté API — `replaceProgramSessions` et
 * `replaceTemplateSessions` passent par le même schéma. Deux copies ici
 * auraient laissé le banc valider une forme que l'API n'envoie pas.
 */
const shaped = (sessions, idPrefix) =>
  (sessions || []).map((session, si) => ({
    ...session,
    _id: session._id || `${idPrefix}-sess-${si + 1}`,
    order: si + 1,
    createdAt: '2026-06-01T10:00:00.000Z',
    updatedAt: new Date().toISOString(),
    blocks: (session.blocks || []).map((block, bi) => ({
      ...block,
      _id: block._id || `${idPrefix}-blk-${si + 1}-${bi + 1}`,
      order: bi + 1,
      exercises: (block.exercises || []).map((ex, ei) => ({
        ...ex,
        _id: ex._id || `${idPrefix}-bex-${si + 1}-${bi + 1}-${ei + 1}`,
        order: ei + 1,
        // Le front envoie `exerciseId` et relit `exercise` : c'est l'API
        // qui repeuple le mouvement. Sans cela l'atelier perdrait ses
        // exercices au premier aller-retour. Les séances d'un modèle, à
        // l'import, portent le mouvement entier et pas d'`exerciseId` : on
        // le relit de là, comme l'API — sans quoi tout s'appelait
        // « Mouvement ».
        exercise: asPlaced(
          EXERCISES.find((e) => e._id === (ex.exerciseId ?? ex.exercise?._id))
        ) ?? {
          _id: ex.exerciseId ?? ex.exercise?._id,
          name: 'Mouvement',
          category: 'other',
        },
      })),
    })),
  }));

/**
 * Les modèles de programme du coach.
 *
 * Un seul au départ, et il porte deux séances : de quoi vérifier qu'un import
 * remplace vraiment le programme du client — qui en compte davantage — plutôt
 * que de s'y ajouter.
 */
/** @returns {TemplatePayload[]} */
const initialTemplates = () => [
  {
    _id: 'tpl1',
    name: 'Prise de masse',
    sessions: JSON.parse(JSON.stringify(SESSIONS.slice(0, 2))),
    createdAt: '2026-06-01T10:00:00.000Z',
    updatedAt: '2026-06-01T10:00:00.000Z',
  },
];

let TEMPLATES = initialTemplates();

/** Ce qu'une ligne de liste porte : le nom et le compte, pas les séances. */
/** @returns {TemplateRowPayload} */
const templateRow = (template) => ({
  _id: template._id,
  name: template.name,
  sessionCount: template.sessions.length,
  // Le banc n'importe aucun modèle chez un client : chez personne, donc.
  usageCount: (template.importedFor ?? []).length,
  updatedAt: template.updatedAt,
});

/** Les exercices créés pendant un tour, pour pouvoir les retirer au suivant. */
const CREATED_EXERCISES = [];

// Copie profonde des blocs, pour pouvoir y poser `performed` sans altérer le
// programme lui-même.
const snapshot = (session) => JSON.parse(JSON.stringify(session.blocks));

/**
 * L'instantané d'une séance telle qu'elle était AVANT que le coach ne la
 * remanie.
 *
 * C'est le cas que l'écran du programme se trompait à traiter : le coach
 * modifie une séance au lieu de la supprimer et de la recréer, donc
 * l'identifiant survit et l'on annonce au client qu'il a déjà fait quelque
 * chose qui n'existait pas la semaine dernière. Un bilan dont les blocs ne
 * correspondent plus à la séance qui porte son identifiant est la seule façon
 * de le reproduire.
 */
const reworkedSnapshot = (session) => {
  const blocks = snapshot(session);
  // Le premier exercice demandait autre chose ce jour-là. Rien d'autre ne
  // diffère : la comparaison doit donc attraper cela seul.
  if (blocks[0]?.exercises?.[0]) {
    const ex = blocks[0].exercises[0];
    if (ex.reps !== undefined) ex.reps += 5;
    else if (ex.duration !== undefined) ex.duration += 30;
  }
  return blocks;
};

const isEmptySet = (set) =>
  set.weight === undefined &&
  set.reps === undefined &&
  set.duration === undefined;

// Reproduit `normalize` côté API : une série vide arrête là l'exercice.
const normalizeSets = (sets) => {
  const kept = [];
  for (const set of sets || []) {
    if (isEmptySet(set)) break;
    kept.push(set);
  }
  return kept;
};

const withPerformed = (blocks, entries) =>
  blocks.map((b) => ({
    ...b,
    exercises: b.exercises.map((e) => {
      const hit = (entries || []).find(
        (p) => p.blockOrder === b.order && p.exerciseOrder === e.order
      );
      if (!hit) return e;
      return { ...e, performed: { sets: normalizeSets(hit.sets) } };
    }),
  }));

/** Le score des blocs qui se comptent en tours — un AMRAP. */
const withRounds = (blocks, entries) =>
  blocks.map((b) => {
    const hit = (entries || []).find((r) => r.blockOrder === b.order);
    return hit ? { ...b, performedRounds: hit.rounds } : b;
  });

// Le pendant d'`applyLadderDone` côté API : les paliers faits et le temps
// d'une échelle bornée, posés sur le bloc à côté de sa prescription.
const withLadder = (blocks, entries) =>
  blocks.map((b) => {
    const hit = (entries || []).find((r) => r.blockOrder === b.order);
    return hit
      ? { ...b, performedRungs: hit.rungs, performedSeconds: hit.seconds }
      : b;
  });

/**
 * Les clés d'envoi reçues, et le bilan de chacune : l'index unique
 * `{ clientId, sendKey }` de l'API. Hors de `HISTORY`, parce que la clé ne
 * sort pas — l'API ne la renvoie pas, le faux serveur non plus.
 *
 * @type {Map<string, string>}
 */
const RECEIVED = new Map();

/** @type {CompletedSessionPayload[]} */
let HISTORY = EMPTY_PROGRAM
  ? []
  : [
      {
        _id: 'cs2',
        completedAt: '2026-08-19T07:15:00.000Z',
        originalSessionId: 'sess2',
        sessionOrder: 2,
        sessionName: 'Haut du corps',
        blocks: withPerformed(snapshot(SESSIONS[1]), [
          {
            blockOrder: 2,
            exerciseOrder: 1,
            sets: [
              { weight: 24, reps: 12 },
              { weight: 24, reps: 12 },
              { weight: 24, reps: 10 },
              { weight: 22, reps: 8 },
            ],
          },
          {
            blockOrder: 2,
            exerciseOrder: 2,
            sets: [{ weight: 16 }, { weight: 16 }, { weight: 16 }],
          },
        ]),
        coachNotes: '',
        feedback: { effort: 4, tags: ['fatigue', 'poor_sleep'] },
        clientNotes:
          "Fatigué ce matin, j'ai réduit un peu les charges sur le renfo.",
        viewedByCoach: true,
        replies: [],
      },
      {
        _id: 'cs3',
        completedAt: '2026-08-16T18:00:00.000Z',
        originalSessionId: 'sess1',
        sessionOrder: 1,
        sessionName: 'Full body A',
        blocks: snapshot(SESSIONS[0]),
        coachNotes: '',
        // Un bilan d'avant la refonte : cinq axes, aucune note d'effort.
        metrics: { stress: 1, mood: 5, energy: 4, sleep: 5, soreness: 1 },
        clientNotes: 'Très bonne séance, forme du jour excellente.',
        viewedByCoach: true,
        replies: [],
      },
      // Trois tentatives enregistrées de la séance 1, plus dures à chaque
      // fois.
      {
        _id: 'cs4',
        completedAt: '2026-08-22T18:00:00.000Z',
        originalSessionId: 'sess1',
        sessionOrder: 1,
        sessionName: 'Full body A',
        blocks: withPerformed(snapshot(SESSIONS[0]), [
          { blockOrder: 2, exerciseOrder: 1, sets: [{ weight: 16, reps: 15 }] },
          { blockOrder: 2, exerciseOrder: 2, sets: [{ weight: 20, reps: 12 }] },
        ]),
        coachNotes: '',
        feedback: { effort: 3, tags: [] },
        clientNotes: 'Bon rythme.',
        viewedByCoach: true,
        replies: [],
      },
      {
        _id: 'cs5',
        completedAt: '2026-08-26T18:00:00.000Z',
        originalSessionId: 'sess1',
        sessionOrder: 1,
        sessionName: 'Full body A',
        blocks: withPerformed(snapshot(SESSIONS[0]), [
          { blockOrder: 2, exerciseOrder: 1, sets: [{ weight: 20, reps: 15 }] },
          { blockOrder: 2, exerciseOrder: 2, sets: [{ weight: 24, reps: 12 }] },
        ]),
        coachNotes: '',
        feedback: { effort: 4, tags: ['pain'] },
        clientNotes: 'Épaule un peu sensible sur les swings.',
        viewedByCoach: true,
        replies: [],
      },
      {
        _id: 'cs6',
        completedAt: '2026-08-30T18:00:00.000Z',
        originalSessionId: 'sess1',
        sessionOrder: 1,
        sessionName: 'Full body A',
        blocks: withPerformed(snapshot(SESSIONS[0]), [
          { blockOrder: 2, exerciseOrder: 1, sets: [{ weight: 20, reps: 15 }] },
          { blockOrder: 2, exerciseOrder: 2, sets: [{ weight: 26, reps: 12 }] },
          { blockOrder: 3, exerciseOrder: 3, sets: [{ weight: 12, reps: 20 }] },
        ]),
        coachNotes: '',
        feedback: { effort: 5, tags: ['fatigue'] },
        clientNotes: 'Dur sur la fin.',
        viewedByCoach: false,
        replies: [],
      },
      {
        // La séance 3 a été faite une fois, puis remaniée : même
        // identifiant, autre contenu.
        _id: 'cs7',
        completedAt: '2026-08-12T17:30:00.000Z',
        originalSessionId: 'sess3',
        sessionOrder: 3,
        blocks: reworkedSnapshot(SESSIONS[2]),
        feedback: { effort: 3 },
        viewedByCoach: true,
        replies: [],
      },
    ];

/** @type {UserPayload} */
const USER = {
  id: '69345f880326b1ba42100de8',
  email: 'corentin@example.com',
  firstName: 'Corentin',
  lastName: 'Le Moullec',
  isAdmin: false,
  isCoach: true,
  coachId: '69345f880326b1ba42100dc1',
  isClient: true,
  healthConsent: {
    granted: true,
    decidedAt: '2026-06-01T10:00:00.000Z',
    version: '1',
  },
  needsHealthConsent: false,
};

const sendJson = (res, code, body) => {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
  });
  res.end(JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3001');
  const { pathname } = url;
  const method = req.method;

  if (method === 'OPTIONS') return sendJson(res, 204, {});

  const body = ['POST', 'PATCH', 'PUT'].includes(method)
    ? await readBody(req)
    : {};

  if (pathname === '/api/auth/dev-login')
    return sendJson(res, 200, { user: USER });
  if (pathname === '/api/auth/me') return sendJson(res, 200, { user: USER });
  if (pathname === '/api/auth/logout') return sendJson(res, 200, {});

  // Le coach du client voyage avec son programme : c'est par là que ses
  // écrans apprennent son prénom. Le même que dans le compte, plus bas.
  if (pathname === '/api/client/program')
    return sendJson(res, 200, {
      program: program(),
      coaches: [{ firstName: 'Julie' }],
    });
  if (pathname === '/api/client/history')
    return sendJson(res, 200, { history: HISTORY });

  // ── Le côté coach ────────────────────────────────────────────────────────
  //
  // Ajouté pour reproduire une perte de travail signalée depuis le terrain :
  // « quand ça me marque enregistré, que je quitte la page et que je reviens,
  // tout ce que j'ai écrit dans les 5 min a disparu ». Le banc ne menait que
  // l'espace client, donc l'atelier du coach — l'écran où l'on écrit le plus —
  // n'était couvert par rien.
  //
  // `COACH_SESSIONS` tient le rôle de la base : le PUT la remplace
  // entièrement, comme `replaceProgramSessions` le fait, et le GET la relit.
  // C'est cette sémantique de remplacement qui transforme un affichage périmé
  // en perte réelle.
  const detailMatch = pathname.match(/^\/api\/coach\/clients\/([^/]+)$/);
  if (detailMatch && method === 'GET') {
    return sendJson(res, 200, {
      _id: CLIENT_ID,
      firstName: 'Sarah',
      lastName: 'Martin',
      email: 'sarah@example.com',
      program: { ...program(), sessions: COACH_SESSIONS },
      unseenCount: 0,
    });
  }

  // Le fil « À lire », tel que l'API le compose : les séances non lues de
  // Sarah — la seule cliente du banc —, les plus récentes d'abord, chacune
  // avec la même séance juste avant. « Déjà lues » remonte trente jours.
  if (pathname === '/api/coach/inbox' && method === 'GET') {
    const read = url.searchParams.get('state') === 'read';
    const since = Date.now() - 30 * 86_400_000;
    const byDate = [...HISTORY].sort(
      (a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt)
    );
    const items = byDate
      .filter((c) =>
        read
          ? c.viewedByCoach && Date.parse(c.completedAt) >= since
          : !c.viewedByCoach
      )
      .map((completed) => ({
        client: { _id: CLIENT_ID, firstName: 'Sarah', lastName: 'Martin' },
        completed,
        previous: byDate.find(
          (c) =>
            c.originalSessionId === completed.originalSessionId &&
            Date.parse(c.completedAt) < Date.parse(completed.completedAt)
        ),
      }));
    return sendJson(res, 200, {
      total: items.length,
      items: items.slice(0, 100),
    });
  }

  // Lues ou non lues, plusieurs à la fois — la route de « Annuler ».
  if (
    pathname === '/api/coach/sessions/completed/viewed' &&
    method === 'PATCH'
  ) {
    const ids = body.ids ?? [];
    HISTORY = HISTORY.map((c) =>
      ids.includes(c._id) ? { ...c, viewedByCoach: body.viewed } : c
    );
    return sendJson(res, 200, { count: ids.length });
  }

  // Répondre, avec la règle de l'API : la dernière réponse de ce coach se
  // modifie tant qu'elle n'est pas lue ; une clé absente laisse en place,
  // `null` efface ; vidée, elle disparaît. Répondre, c'est avoir lu.
  const replyMatch = pathname.match(
    /^\/api\/coach\/sessions\/completed\/([^/]+)\/reply$/
  );
  if (replyMatch && method === 'PATCH') {
    const i = HISTORY.findIndex((c) => c._id === replyMatch[1]);
    if (i < 0) return sendJson(res, 404, { message: 'Séance introuvable' });
    const replies = [...(HISTORY[i].replies ?? [])];
    const mine = replies.map((r) => r.coachId).lastIndexOf(USER.coachId);
    const editable = mine !== -1 && !replies[mine].readAt;
    const base = editable ? replies[mine] : {};
    const reaction =
      body.reaction === undefined
        ? base.reaction
        : (body.reaction ?? undefined);
    const text =
      body.text === undefined ? base.text : body.text?.trim() || undefined;
    const written = {
      coachId: USER.coachId,
      firstName: USER.firstName,
      ...(reaction ? { reaction } : {}),
      ...(text ? { text } : {}),
      sentAt: new Date().toISOString(),
    };
    const next =
      !reaction && !text
        ? editable
          ? replies.filter((_, k) => k !== mine)
          : replies
        : editable
          ? replies.map((r, k) => (k === mine ? written : r))
          : [...replies, written];
    const completed = { ...HISTORY[i], replies: next, viewedByCoach: true };
    HISTORY = HISTORY.map((c, k) => (k === i ? completed : c));
    return sendJson(res, 200, { completed });
  }

  if (pathname === '/api/coach/clients' && method === 'GET')
    return sendJson(res, 200, []);

  if (/^\/api\/coach\/clients\/[^/]+\/history$/.test(pathname))
    return sendJson(res, 200, []);

  const saveMatch = pathname.match(
    /^\/api\/coach\/clients\/([^/]+)\/program\/sessions$/
  );
  if (saveMatch && method === 'PUT') {
    COACH_SESSIONS = shaped(body.sessions, 'new');
    PUT_COUNT += 1;
    return sendJson(res, 200, COACH_SESSIONS);
  }

  // Un import écrase le programme du client par les séances du modèle. Le
  // contenu ne voyage pas : le front nomme le modèle, le serveur le relit.
  const importMatch = pathname.match(
    /^\/api\/coach\/clients\/([^/]+)\/program\/import$/
  );
  if (importMatch && method === 'POST') {
    const template = TEMPLATES.find((t) => t._id === body.templateId);
    if (!template) return sendJson(res, 404, { message: 'Modèle introuvable' });
    // Les identifiants de séance sont retirés avant façonnage : ils
    // appartiennent au modèle, et les réutiliser ferait deux documents sous
    // la même clé — c'est le défaut que `sessionsForImport` évite côté API.
    COACH_SESSIONS = shaped(
      JSON.parse(JSON.stringify(template.sessions)).map((session) => ({
        ...session,
        _id: undefined,
      })),
      'imported'
    );
    PUT_COUNT += 1;
    return sendJson(res, 200, COACH_SESSIONS);
  }

  // ── Les modèles de programme ─────────────────────────────────────────────
  if (pathname === '/api/coach/templates' && method === 'GET')
    return sendJson(res, 200, { templates: TEMPLATES.map(templateRow) });

  // « Enregistrer comme modèle » : les séances du client, relues chez le
  // serveur — toutes, ou celles qu'on nomme. Rien à copier répond 404,
  // comme l'API.
  if (pathname === '/api/coach/templates/from-program' && method === 'POST') {
    const picked = body.sessionIds
      ? COACH_SESSIONS.filter((s) => body.sessionIds.includes(s._id))
      : COACH_SESSIONS;
    if (picked.length === 0)
      return sendJson(res, 404, { message: 'Aucune séance à enregistrer' });
    const created = {
      _id: `tpl-new-${TEMPLATES.length + 1}`,
      name: body.name ?? 'Sans nom',
      sessions: JSON.parse(JSON.stringify(picked)).map((session, i) => ({
        ...session,
        _id: `tpl-sess-${TEMPLATES.length + 1}-${i + 1}`,
        order: i + 1,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    TEMPLATES.push(created);
    return sendJson(res, 201, { template: created });
  }

  if (pathname === '/api/coach/templates' && method === 'POST') {
    const created = {
      _id: `tpl-new-${TEMPLATES.length + 1}`,
      name: body.name ?? 'Sans nom',
      sessions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    TEMPLATES.push(created);
    return sendJson(res, 201, { template: created });
  }

  const templateMatch = pathname.match(/^\/api\/coach\/templates\/([^/]+)$/);
  if (templateMatch) {
    const template = TEMPLATES.find((t) => t._id === templateMatch[1]);
    if (!template) return sendJson(res, 404, { message: 'Modèle introuvable' });

    if (method === 'GET') return sendJson(res, 200, { template });
    if (method === 'PATCH') {
      template.name = body.name ?? template.name;
      template.updatedAt = new Date().toISOString();
      return sendJson(res, 200, { template });
    }
    if (method === 'DELETE') {
      TEMPLATES = TEMPLATES.filter((t) => t !== template);
      return sendJson(res, 200, {});
    }
  }

  const templateSessionsMatch = pathname.match(
    /^\/api\/coach\/templates\/([^/]+)\/sessions$/
  );
  if (templateSessionsMatch && method === 'PUT') {
    const template = TEMPLATES.find((t) => t._id === templateSessionsMatch[1]);
    if (!template) return sendJson(res, 404, { message: 'Modèle introuvable' });
    template.sessions = shaped(body.sessions, 'tpl');
    template.updatedAt = new Date().toISOString();
    PUT_COUNT += 1;
    return sendJson(res, 200, { template });
  }

  if (pathname === '/api/coach/exercises' && method === 'GET')
    return sendJson(res, 200, EXERCISES);

  // La création depuis le programme n'envoyait que le nom : la fiche s'ouvre
  // maintenant par-dessus pour que la vidéo et la consigne se posent sans
  // quitter la séance. Le serveur d'essai rend donc un exercice créé, et
  // accepte qu'on le complète ensuite.
  if (pathname === '/api/coach/exercises' && method === 'POST') {
    // Ce que l'API rend d'un exercice créé, ni plus ni moins : il portait un
    // `isPublic` qu'elle n'envoie pas, et pas son auteur ni ses dates.
    /** @type {ExercisePayload} */
    const created = {
      _id: `ex-new-${CREATED_EXERCISES.length + 1}`,
      name: body.name ?? 'Sans nom',
      description: body.description ?? '',
      videoUrl: body.videoUrl ?? '',
      createdBy: COACH_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      clientCount: 0,
    };
    CREATED_EXERCISES.push(created);
    EXERCISES.push(created);
    return sendJson(res, 201, created);
  }

  const exerciseMatch = pathname.match(/^\/api\/coach\/exercises\/([^/]+)$/);
  if (exerciseMatch && method === 'PUT') {
    const target = EXERCISES.find((e) => e._id === exerciseMatch[1]);
    if (!target) return sendJson(res, 404, { message: 'Exercice introuvable' });
    Object.assign(target, body);
    return sendJson(res, 200, target);
  }

  // Le décor repart à l'identique : la suite écrit dans `COACH_SESSIONS`, et
  // un tour qui hériterait de l'état du tour précédent ferait se télescoper
  // les noms — ce qui est arrivé, et a rendu deux assertions illisibles.
  if (pathname === '/api/mock/reset' && method === 'POST') {
    COACH_SESSIONS = JSON.parse(JSON.stringify(SESSIONS));
    TEMPLATES = initialTemplates();
    PUT_COUNT = 0;
    // Les exercices créés repartent aussi : la bibliothèque doit retrouver sa
    // taille, sinon une assertion qui la compte dérive d'un tour à l'autre.
    CREATED_EXERCISES.splice(0).forEach((created) => {
      const at = EXERCISES.indexOf(created);
      if (at >= 0) EXERCISES.splice(at, 1);
    });
    return sendJson(res, 200, { reset: true });
  }

  // Combien d'enregistrements ont réellement abouti. Une assertion qui
  // constate un écran vide ne dit pas si l'envoi est parti : ce compteur le
  // dit, et il empêche de prendre un « rien n'a été envoyé » pour un « tout a
  // été perdu ».
  if (pathname === '/api/mock/put-count')
    return sendJson(res, 200, { count: PUT_COUNT });

  // La forme exacte de `accountSummaryPayload` : les deux rôles à la racine.
  // Ce décor les rangeait sous un champ `summary` que l'API n'envoie pas, si
  // bien que « Mon compte » s'affichait sans aucune de ses sections — et
  // qu'aucune suite ne pouvait y lire quoi que ce soit.
  if (pathname === '/api/account') {
    return sendJson(res, 200, {
      asClient: {
        coaches: [
          {
            firstName: 'Julie',
            lastName: 'Martin',
            linkedAt: '2026-06-01T10:00:00.000Z',
          },
        ],
        completedCount: HISTORY.length,
        healthDataCount: HISTORY.filter((c) => c.feedback).length,
        healthConsent: USER.healthConsent,
        since: '2026-06-01T10:00:00.000Z',
      },
      asCoach: { clientCount: 7, since: '2026-06-01T10:00:00.000Z' },
    });
  }

  const completeMatch = pathname.match(
    /^\/api\/client\/sessions\/([^/]+)\/complete$/
  );
  if (completeMatch && method === 'POST') {
    // Un renvoi d'un bilan déjà reçu sous la même clé : rendu tel quel, en
    // 200, sans rien créer, et avant de chercher la séance — comme l'API.
    const known =
      body.sendKey && HISTORY.find((c) => c._id === RECEIVED.get(body.sendKey));
    if (known) return sendJson(res, 200, { completed: known });
    const source = SESSIONS.find((s) => s._id === completeMatch[1]);
    if (!source) return sendJson(res, 404, { message: 'introuvable' });
    const completed = {
      _id: `cs-${Date.now()}`,
      completedAt: body.completedAt || new Date().toISOString(),
      originalSessionId: source._id,
      sessionOrder: source.order,
      sessionName: source.name,
      blocks: withLadder(
        withRounds(
          withPerformed(snapshot(source), body.performed || []),
          body.roundsDone || []
        ),
        body.ladderDone || []
      ),
      coachNotes: '',
      feedback: body.feedback,
      clientNotes: body.clientNotes || '',
      viewedByCoach: false,
      replies: [],
    };
    HISTORY = [completed, ...HISTORY];
    if (body.sendKey) RECEIVED.set(body.sendKey, completed._id);
    return sendJson(res, 201, { completed });
  }

  // Le client a lu les réponses de son coach : toutes datées maintenant,
  // celles déjà lues gardant leur date.
  const readMatch = pathname.match(
    /^\/api\/client\/sessions\/completed\/([^/]+)\/replies\/read$/
  );
  if (readMatch && method === 'PATCH') {
    const i = HISTORY.findIndex((c) => c._id === readMatch[1]);
    if (i < 0) return sendJson(res, 404, { message: 'Séance introuvable' });
    const now = new Date().toISOString();
    const completed = {
      ...HISTORY[i],
      replies: (HISTORY[i].replies ?? []).map((r) =>
        r.readAt ? r : { ...r, readAt: now }
      ),
    };
    HISTORY = HISTORY.map((c, k) => (k === i ? completed : c));
    return sendJson(res, 200, { completed });
  }

  const patchMatch = pathname.match(
    /^\/api\/client\/sessions\/completed\/([^/]+)$/
  );
  if (patchMatch && method === 'PATCH') {
    const i = HISTORY.findIndex((c) => c._id === patchMatch[1]);
    if (i < 0) return sendJson(res, 404, { message: 'introuvable' });
    const before = HISTORY[i];
    const completed = {
      ...before,
      ...(body.feedback !== undefined ? { feedback: body.feedback } : {}),
      ...(body.clientNotes !== undefined
        ? { clientNotes: body.clientNotes }
        : {}),
      ...(body.completedAt !== undefined
        ? { completedAt: body.completedAt }
        : {}),
      ...(body.performed !== undefined
        ? { blocks: withPerformed(before.blocks, body.performed) }
        : {}),
      ...(body.roundsDone !== undefined
        ? {
            blocks: withRounds(
              body.performed !== undefined
                ? withPerformed(before.blocks, body.performed)
                : before.blocks,
              body.roundsDone
            ),
          }
        : {}),
    };
    HISTORY = HISTORY.map((c, k) => (k === i ? completed : c));
    return sendJson(res, 200, { completed });
  }

  // Le reste de l'API n'est pas couvert par cette reconstitution : on répond
  // vide plutôt que de faire croire que le jeu de données est complet.
  return sendJson(res, 200, {});
});

// Le port vient de l'environnement quand le lanceur fait tourner plusieurs
// suites à la fois : chacune a son serveur, donc son état. 3001 sinon, celui
// que le front de développement vise.
const PORT = Number(process.env.KETTLE_MOCK_PORT ?? 3001);
server.listen(PORT, () =>
  console.log(`serveur d'essai sur http://localhost:${PORT}`)
);
