/**
 * The test server: an in-memory Kettle API, with no database.
 *
 * It exists to drive the application for real in a browser — clicking,
 * typing, finishing a session — and to read what it shows. The test data
 * covers the cases that break: an EMOM, a Tabata, an AMRAP, a chipper, a
 * pyramid, an "Every" block from before the merge, and a history that gives
 * something to compare against.
 *
 * It lives in the repository, not in a temporary directory: the first version
 * was erased along with its container, and with it everything that made it
 * possible to verify anything at all.
 */
import http from 'node:http';

const COACH_ID = '507f1f77bcf86cd799439011';
const CLIENT_ID = '507f1f77bcf86cd799439012';
const PROGRAM_ID = '507f1f77bcf86cd799439013';

const ex = (id, name, videoUrl, usageCount = 0, description = '') => ({
  _id: id,
  name,
  description,
  videoUrl: videoUrl || '',
  createdBy: COACH_ID,
  createdAt: '2026-06-01T10:00:00.000Z',
  updatedAt: '2026-06-01T10:00:00.000Z',
  usageCount,
});

const EXERCISES = [
  // Two exercises carry a library description: it is the only way to check
  // that a session's instruction and the movement's general technique read as
  // distinct. "Pompes" has none.
  ex(
    'ex1',
    'Kettlebell Swing',
    'https://www.youtube.com/watch?v=sswzD1Q7dTk',
    12,
    'Dos plat, la poussée vient des hanches et non des bras.'
  ),
  ex(
    'ex2',
    'Goblet Squat',
    '',
    9,
    'Kettlebell contre la poitrine, descendre entre les talons.'
  ),
  ex('ex3', 'Burpee', '', 7),
  ex('ex4', 'Row (rameur)', '', 3),
  ex('ex5', 'Fentes marchées', '', 2),
  ex('ex6', 'Pompes', '', 6),
  ex('ex7', 'Mountain Climbers', '', 1),
  ex('ex8', 'Corde à sauter', '', 0),
  // Outside this client's program: feeds "Vos plus utilisés".
  ex('ex9', 'Turkish Get-Up', '', 5),
  ex('ex10', 'Planche', '', 0),
];

const blockExercise = (exercise, order, extra = {}) => ({
  exercise,
  order,
  ...extra,
});

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
      // An "Every" block from before the merge with EMOM: no new one can be
      // created, but those in existing programs have to display.
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
        type: 'pyramid',
        order: 1,
        repsScheme: [2, 4, 6, 8, 6, 4, 2],
        exercises: [blockExercise(EXERCISES[1], 1, {})],
      },
    ],
  },
];

const EMPTY_PROGRAM = process.env.MOCK_EMPTY === '1';

const program = () => ({
  _id: PROGRAM_ID,
  clientId: CLIENT_ID,
  createdAt: '2026-06-01T10:00:00.000Z',
  updatedAt: '2026-06-01T10:00:00.000Z',
  sessions: EMPTY_PROGRAM ? [] : SESSIONS,
});

// Deep clone of the blocks so `performed` can be placed on them without
// altering the program itself.
const snapshot = (session) => JSON.parse(JSON.stringify(session.blocks));

const isEmptySet = (set) =>
  set.weight === undefined &&
  set.reps === undefined &&
  set.duration === undefined;

// Mirrors `normalize` on the API side: an empty set stops the exercise there.
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

/** The score of blocks counted in rounds — an AMRAP. */
const withRounds = (blocks, entries) =>
  blocks.map((b) => {
    const hit = (entries || []).find((r) => r.blockOrder === b.order);
    return hit ? { ...b, performedRounds: hit.rounds } : b;
  });

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
      },
      {
        _id: 'cs3',
        completedAt: '2026-08-16T18:00:00.000Z',
        originalSessionId: 'sess1',
        sessionOrder: 1,
        sessionName: 'Full body A',
        blocks: snapshot(SESSIONS[0]),
        coachNotes: '',
        // A report from before the rework: five axes, no effort rating.
        metrics: { stress: 1, mood: 5, energy: 4, sleep: 5, soreness: 1 },
        clientNotes: 'Très bonne séance, forme du jour excellente.',
        viewedByCoach: true,
      },
      // Three recorded attempts at session 1, harder each time.
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
      },
    ];

const USER = {
  id: '69345f880326b1ba42100de8',
  email: 'corentin@example.com',
  firstName: 'Corentin',
  lastName: 'Le Moullec',
  isAdmin: false,
  isCoach: true,
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
  const { pathname } = new URL(req.url, 'http://localhost:3001');
  const method = req.method;

  if (method === 'OPTIONS') return sendJson(res, 204, {});

  const body = ['POST', 'PATCH', 'PUT'].includes(method)
    ? await readBody(req)
    : {};

  if (pathname === '/api/auth/dev-login')
    return sendJson(res, 200, { user: USER });
  if (pathname === '/api/auth/me') return sendJson(res, 200, { user: USER });
  if (pathname === '/api/auth/logout') return sendJson(res, 200, {});

  if (pathname === '/api/client/program')
    return sendJson(res, 200, { program: program() });
  if (pathname === '/api/client/history')
    return sendJson(res, 200, { history: HISTORY });

  if (pathname === '/api/account') {
    return sendJson(res, 200, {
      summary: {
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
      },
    });
  }

  const completeMatch = pathname.match(
    /^\/api\/client\/sessions\/([^/]+)\/complete$/
  );
  if (completeMatch && method === 'POST') {
    const source = SESSIONS.find((s) => s._id === completeMatch[1]);
    if (!source) return sendJson(res, 404, { message: 'introuvable' });
    const completed = {
      _id: `cs-${Date.now()}`,
      completedAt: body.completedAt || new Date().toISOString(),
      originalSessionId: source._id,
      sessionOrder: source.order,
      sessionName: source.name,
      blocks: withRounds(
        withPerformed(snapshot(source), body.performed || []),
        body.roundsDone || []
      ),
      coachNotes: '',
      feedback: body.feedback,
      clientNotes: body.clientNotes || '',
      viewedByCoach: false,
    };
    HISTORY = [completed, ...HISTORY];
    return sendJson(res, 201, { completed });
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

  // The rest of the API is not covered by this reconstruction: we answer
  // with nothing rather than pretend the test data is complete.
  return sendJson(res, 200, {});
});

server.listen(3001, () => console.log('mock sur http://localhost:3001'));
