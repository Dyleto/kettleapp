/**
 * La planche (H2) : chaque cadre de la maquette, et ce que l'application
 * montre dans le même état, côte à côte.
 *
 * La maquette a été perdue une fois avec son conteneur, et quatre choix de
 * la refonte ont été faits sans elle (plan, § 6) : la planche est ce qui
 * permet de la confronter à l'application d'un coup d'œil, cadre par cadre,
 * plutôt que de mémoire.
 *
 * Ce n'est pas une suite du banc — son nom ne commence pas par `verify_`, le
 * lanceur ne la voit pas : elle n'affirme rien, elle montre. Chaque scénario
 * mène l'application dans l'état que la légende du cadre décrit, avec les
 * moyens du banc — le serveur d'essai, une réponse composée, une horloge
 * posée sur un jour choisi.
 *
 *   node board.mjs [maquette.html] [dossier] [préfixe…]
 *
 * Par défaut, la maquette de `docs/` et le dossier `board/`, que git ignore.
 * Un préfixe (`c-accueil`, `k-`) ne refait que les cadres qui le portent.
 * Il faut le front. Le serveur d'essai, la planche le lance elle-même, neuf
 * pour chaque cadre, sur le port de `KETTLE_MOCK_PORT` — 3001 par défaut —,
 * qui doit donc être libre. Elle finit par la page, `board/index.html`, que
 * `board-page.mjs` refait seul après une relecture.
 *
 * Mesuré : 121 cadres en huit minutes.
 */
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  API,
  BASE,
  COACHES,
  MOBILE,
  MOCK_PORT,
  launch,
  markWelcomed,
  settle,
  start,
  START,
  advance,
  passBlock,
  launchClock,
  leaveSession,
  finishFromPause,
  declareDone,
  reachFeeling,
} from './common.mjs';
import { boardPage } from './board-page.mjs';

const [mockupArg, outArg, ...ONLY] = process.argv.slice(2);
const MOCKUP = resolve(
  mockupArg ?? resolve(import.meta.dirname, '../docs/maquette.html')
);
const OUT = resolve(outArg ?? resolve(import.meta.dirname, 'board'));

/** Les trois formats de la maquette : téléphone, téléphone couché, grand
 * écran. Le grand écran est celui de ses cadres, 1 280 × 800. */
const SIZES = {
  m: MOBILE,
  l: { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true },
  d: { viewport: { width: 1280, height: 800 } },
};

const CLIENT = '507f1f77bcf86cd799439012';

/**
 * Un serveur d'essai neuf pour chaque cadre.
 *
 * Sa remise à zéro ne touche pas à l'historique — les suites, qui ont
 * chacune leur serveur, s'en servent d'un cas au suivant. Ici elle laissait
 * passer d'un cadre à l'autre une réaction posée ou une séance envoyée : le
 * fil « À lire » se montrait vide au cadre qui devait y répondre. Le port est
 * celui que `launch` vise ; il doit être libre.
 */
let server;
const freshServer = async () => {
  if (server) {
    server.kill();
    await once(server, 'exit');
  }
  server = spawn(process.execPath, ['mock-server.mjs'], {
    cwd: import.meta.dirname,
    env: { ...process.env, KETTLE_MOCK_PORT: String(MOCK_PORT) },
    stdio: 'ignore',
  });
  for (let i = 0; i < 200; i++) {
    const up = await fetch(`${API}/api/auth/me`)
      .then((r) => r.ok)
      .catch(() => false);
    if (up) return;
    await new Promise((done) => setTimeout(done, 50));
  }
  throw new Error(`le serveur d'essai ne répond pas sur ${API}`);
};

await freshServer();
const browser = await launch();
const base = {
  history: (await (await fetch(`${API}/api/client/history`)).json()).history,
  program: (await (await fetch(`${API}/api/client/program`)).json()).program,
  user: (await (await fetch(`${API}/api/auth/me`)).json()).user,
  client: await (await fetch(`${API}/api/coach/clients/${CLIENT}`)).json(),
  templates: (await (await fetch(`${API}/api/coach/templates`)).json())
    .templates,
};

/** Une séance faite le `date` novembre 2026 à 9 h, sur le modèle du décor
 * — comme `verify_home`. */
const did = (sessionId, date) => ({
  ...(base.history.find((c) => c.originalSessionId === sessionId) ??
    base.history[0]),
  _id: `did-${sessionId}-${date}`,
  originalSessionId: sessionId,
  completedAt: new Date(2026, 10, date, 9).toISOString(),
});

/** Le coach répond, chez le serveur d'essai. */
const coachReplies = (session, body) =>
  fetch(`${API}/api/coach/sessions/completed/${session}/reply`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

/**
 * Un contexte au format du cadre, connecté, et ouvert sur `path`.
 *
 * `date` pose l'horloge du navigateur avant le premier chargement : l'accueil
 * ne dit pas la même chose un mardi et un dimanche. `history` et `program`
 * remplacent les réponses du serveur d'essai ; `routes` en pose d'autres.
 */
const open = async (
  size,
  path,
  { date, history, program, routes = [], welcomed = true, wait } = {}
) => {
  const ctx = await browser.newContext(SIZES[size]);
  if (welcomed) await markWelcomed(ctx);
  // Le serveur d'essai ne rend aucun bilan au coach : chaque suite sert
  // celui du client, comme `verify_journal`. Posée la première, une route
  // d'un cadre passe devant.
  await ctx.route(new RegExp(`/api/coach/clients/${CLIENT}/history`), (r) =>
    fetch(`${API}/api/client/history`)
      .then((res) => res.json())
      .then(({ history }) => r.fulfill({ json: history }))
  );
  if (history)
    await ctx.route(/\/api\/client\/history(\?|$)/, (r) =>
      r.fulfill({ json: { history } })
    );
  if (program)
    await ctx.route(/\/api\/client\/program(\?|$)/, (r) =>
      r.fulfill({ json: { program, coaches: COACHES } })
    );
  for (const [pattern, handler] of routes) await ctx.route(pattern, handler);
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('  [pageerror]', e.message));
  if (date) await p.clock.install({ time: date });
  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
  await p.evaluate(() =>
    fetch('http://localhost:3001/api/auth/dev-login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
  );
  await p.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  if (wait !== false) await settle(p);
  return { ctx, p };
};

/** Toucher sans planter : un bouton absent laisse l'écran tel quel, et la
 * planche le montre — c'est le but. */
const tap = async (locator) => {
  await locator
    .first()
    .click({ timeout: 3000 })
    .catch((e) => console.log('  [absent]', e.message.split('\n')[0]));
  await locator.page().waitForTimeout(0);
  await settle(locator.page());
};

/** Le jeudi 12 novembre 2026 à 10 h : la séance 1 y est conseillée. */
const THURSDAY = new Date(2026, 10, 12, 10);
const DONE_MONDAY = () => [did('sess1', 9), ...base.history];

/** Une séance guidée quittée en route, puis l'accueil. */
const leftHalfway = async (size) => {
  const { ctx, p } = await open(size, '/client', {
    date: THURSDAY,
    history: DONE_MONDAY(),
  });
  await start(p, 'sess1');
  await advance(p);
  await leaveSession(p);
  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  return { ctx, p };
};

/** Un appel qui ne répond jamais : l'écran reste sur son chargement. */
const hang = () => new Promise(() => {});

/**
 * Les scénarios, un par cadre, dans l'ordre de la maquette. `full` prend la
 * page entière, comme les cadres « Page entière ».
 */
const SHOTS = {
  // ── Accueil
  'c-accueil-0': () =>
    open('m', '/client', { date: THURSDAY, history: DONE_MONDAY() }),
  'c-accueil-1': () => leftHalfway('m'),
  'c-accueil-2': () =>
    open('m', '/client', {
      date: new Date(2026, 10, 10, 10),
      history: DONE_MONDAY(),
    }),
  'c-accueil-3': () =>
    open('m', '/client', {
      date: new Date(2026, 10, 15, 10),
      history: [
        ...[0, 7, 14, 21].flatMap((back) => [
          did('sess1', 9 - back),
          did('sess1', 12 - back),
          did('sess2', 14 - back),
        ]),
        ...base.history,
      ],
    }),
  'c-accueil-4': () =>
    open('m', '/client', { date: new Date(2026, 10, 9, 10), history: [] }),
  'c-accueil-5': () =>
    open('m', '/client', {
      date: THURSDAY,
      history: [did('sess1', 10), ...base.history],
      program: {
        ...base.program,
        sessions: base.program.sessions.map((s) => ({
          ...s,
          suggestedDays: [],
        })),
      },
    }),
  'c-accueil-6': async () => {
    await coachReplies('cs6', {
      reaction: 'strong',
      text: 'Bien joué d’être allé au bout. J’allège les swings.',
    });
    return open('m', '/client', { date: THURSDAY });
  },
  'c-accueil-7': () =>
    open('m', '/client', {
      date: THURSDAY,
      program: { ...base.program, sessions: [] },
    }),
  'c-accueil-8': async () => {
    const shot = await open('m', '/client', {
      date: THURSDAY,
      routes: [
        [/\/api\/client\/program(\?|$)/, (r) => r.fulfill({ status: 500 })],
      ],
      wait: false,
    });
    await shot.p
      .getByRole('button', { name: 'Réessayer' })
      .first()
      .waitFor({ timeout: 15000 })
      .catch(() => {});
    await settle(shot.p);
    return shot;
  },
  'c-accueil-9': async () => {
    const shot = await open('m', '/client', {
      date: THURSDAY,
      routes: [[/\/api\/client\/(program|history)(\?|$)/, hang]],
      wait: false,
    });
    await shot.p.waitForTimeout(1500);
    return shot;
  },
  'c-accueil-10': () =>
    open('d', '/client', { date: THURSDAY, history: DONE_MONDAY() }),
  'c-accueil-11': () => leftHalfway('d'),

  // ── Programme
  'c-programme-0': () =>
    open('m', '/client/program', { date: THURSDAY, history: DONE_MONDAY() }),
  'c-programme-1': () =>
    open('m', '/client/program', {
      date: THURSDAY,
      program: { ...base.program, sessions: [] },
    }),
  'c-programme-2': () =>
    open('d', '/client/program', { date: THURSDAY, history: DONE_MONDAY() }),

  // ── Fiche de séance
  'c-seance-0': () => open('m', '/client/session/sess2', { date: THURSDAY }),
  'c-seance-1': async () => {
    const shot = await open('m', '/client/session/sess1', { date: THURSDAY });
    await tap(shot.p.getByRole('button', { name: /^Goblet Squat/ }));
    return shot;
  },
  'c-seance-2': async () => {
    const shot = await open('m', '/client/session/sess1', { date: THURSDAY });
    await tap(shot.p.getByRole('button', { name: /^Je l.ai déjà faite$/ }));
    return shot;
  },
  'c-seance-3': () => open('d', '/client/session/sess2', { date: THURSDAY }),

  // ── Progrès
  'c-progres-0': () => open('m', '/client/history', { date: THURSDAY }),
  'c-progres-1': async () => {
    const shot = await open('m', '/client/history', { date: THURSDAY });
    await tap(shot.p.locator('[data-movement]'));
    return shot;
  },
  'c-progres-2': async () => {
    const shot = await open('m', '/client/history', { date: THURSDAY });
    await tap(shot.p.locator('main [data-session-row="cs6"]'));
    return shot;
  },
  'c-progres-3': () =>
    open('m', '/client/history', { date: THURSDAY, history: [] }),
  'c-progres-4': async () => {
    const shot = await open('d', '/client/history', { date: THURSDAY });
    await tap(shot.p.locator('main [data-session-row="cs6"]'));
    return shot;
  },

  // ── Mon compte
  'c-compte-0': () => open('m', '/client/account'),
  'c-compte-1': () => open('m', '/coach/account'),
  'c-compte-2': async () => {
    const shot = await open('m', '/client/account');
    await tap(shot.p.getByRole('switch', { name: /^Partagées avec/ }));
    return shot;
  },
  'c-compte-3': async () => {
    const shot = await open('m', '/client/account');
    await tap(shot.p.getByRole('button', { name: 'Supprimer mon compte' }));
    return shot;
  },
  'c-compte-4': () => open('d', '/client/account'),

  // ── Premiers pas
  ...Object.fromEntries(
    [0, 1, 2].map((card) => [
      `c-premiers-pas-${card}`,
      async () => {
        const shot = await open('m', '/client', {
          welcomed: false,
          history: [],
          routes: [[/\/api\/auth\/me$/, unansweredMe]],
        });
        for (let i = 0; i < card; i++)
          await tap(shot.p.getByRole('button', { name: 'Suivant' }));
        return shot;
      },
    ])
  ),
  'c-premiers-pas-3': () =>
    open('m', '/client', { routes: [[/\/api\/auth\/me$/, unansweredMe]] }),
  'c-premiers-pas-4': async () => {
    const shot = await open('m', '/client', {
      routes: [[/\/api\/auth\/me$/, unansweredMe]],
    });
    await tap(shot.p.getByRole('button', { name: 'En savoir plus' }));
    return shot;
  },

  // ── Ouverture, décompte, enchaînement
  'g-ouverture-0': async () => {
    const shot = await open('m', '/client/session/sess1', { date: THURSDAY });
    await tap(shot.p.getByRole('button', { name: START }));
    return shot;
  },
  'g-ouverture-1': async () => {
    const shot = await open('m', '/client/session/sess1', { date: THURSDAY });
    await tap(shot.p.getByRole('button', { name: START }));
    await shot.p.getByRole('button', { name: /C'est parti/ }).click();
    await freeze(shot.p);
    return shot;
  },
  'g-ouverture-2': async () => {
    const shot = await guided('m', 'sess2');
    await tap(
      shot.p.getByRole('button', { name: 'Mettre la séance en pause' })
    );
    await shot.p.getByRole('button', { name: 'Passer ce bloc' }).click();
    await freeze(shot.p);
    return shot;
  },
  'g-ouverture-3': async () => {
    const shot = await guided('m', 'sess1');
    await tap(
      shot.p.getByRole('button', { name: 'Mettre la séance en pause' })
    );
    return shot;
  },

  // ── Séries, repos, exercices à durée
  'g-series-0': async () => {
    const shot = await classicSet('m');
    for (let i = 0; i < 2; i++) {
      await tap(shot.p.getByRole('button', { name: 'Série faite' }));
      await tap(shot.p.getByRole('button', { name: 'Passer', exact: true }));
    }
    return shot;
  },
  'g-series-1': async () => {
    const shot = await classicSet('m');
    await tap(shot.p.getByRole('button', { name: 'Série faite' }));
    await freeze(shot.p);
    return shot;
  },
  'g-series-2': () => classicSet('m', { history: [] }),
  // Le décompte court seul, comme chez un client qui pose son téléphone :
  // le franchir d'une touche, comme le fait `start`, ne dirait pas si le
  // chrono part avec lui.
  'g-series-3': async () => {
    const shot = await open('m', '/client/session/sess1', { date: THURSDAY });
    await tap(shot.p.getByRole('button', { name: START }));
    await tap(shot.p.getByRole('button', { name: /C'est parti/ }));
    await shot.p.clock.runFor(4_500);
    await freeze(shot.p);
    await shot.p.clock.runFor(14_000);
    return shot;
  },
  'g-series-4': async () => {
    const shot = await guided('m', 'sess-chipper', {
      program: withSessions(CAPPED_CHIPPER),
    });
    await freeze(shot.p);
    await tap(shot.p.getByRole('button', { name: 'Fait', exact: true }));
    await shot.p.clock.runFor(95_000);
    return shot;
  },
  'g-series-5': () => classicSet('d'),

  // ── Blocs chronométrés
  'g-chrono-0': () => emom('m'),
  'g-chrono-1': () => emom('m', 2 * 60_000 + 18_000),
  'g-chrono-2': () => emom('m', 57_000),
  'g-chrono-3': async () => {
    const shot = await guided('m', 'sess2');
    await freeze(shot.p);
    await shot.p.clock.runFor(30_000 + 8_000);
    return shot;
  },
  'g-chrono-4': async () => {
    const shot = await guided('m', 'sess2');
    await freeze(shot.p);
    await shot.p.clock.runFor(30_000 + 23_000);
    return shot;
  },
  'g-chrono-5': async () => {
    const shot = await amrap('m');
    for (let i = 0; i < 3; i++)
      await tap(shot.p.getByRole('button', { name: /^Ajouter un tour/ }));
    await shot.p.clock.runFor(4 * 60_000);
    return shot;
  },
  'g-chrono-6': async () => {
    const shot = await amrap('m');
    for (let i = 0; i < 5; i++)
      await tap(shot.p.getByRole('button', { name: /^Ajouter un tour/ }));
    await shot.p.clock.runFor(12 * 60_000 + 1_000);
    await settle(shot.p);
    return shot;
  },
  'g-chrono-7': () => emom('l', 2 * 60_000 + 18_000),
  'g-chrono-8': () => emom('d', 2 * 60_000 + 18_000),

  // ── Échelle
  'g-echelle-0': () => ladder(3),
  'g-echelle-1': async () => {
    const shot = await ladder(4);
    await shot.p.clock.runFor(12 * 60_000);
    await settle(shot.p);
    return shot;
  },
  'g-echelle-2': () => ladder(7),

  // ── Fin de séance
  'g-fin-0': async () => {
    const shot = await guided('m', 'sess2');
    await passBlock(shot.p);
    // Le décor : au Goblet, 26 kg au mieux ; aux fentes, 16. 18 est un
    // record — comme dans `verify_recap`.
    for (let i = 0; i < 7; i++) {
      const kg = shot.p
        .locator(
          '[aria-label="Séance guidée"] input[aria-label^="Poids utilisé, en kilos"]'
        )
        .first();
      if (await kg.count()) await kg.fill(String(i < 4 ? 26 : 18));
      await tap(shot.p.getByRole('button', { name: 'Série faite' }));
      const rest = shot.p.getByRole('button', { name: 'Passer', exact: true });
      if (await rest.count()) await tap(rest);
    }
    await tap(shot.p.getByRole('button', { name: 'Terminer', exact: true }));
    await shot.p.waitForTimeout(1200);
    return shot;
  },
  'g-fin-1': async () => {
    const shot = await guided('m', 'sess1');
    await advance(shot.p);
    await finishFromPause(shot.p);
    await shot.p.waitForTimeout(1200);
    return shot;
  },
  'g-fin-2': async () => {
    const shot = await open('m', '/client/session/sess2', { date: THURSDAY });
    await declareDone(shot.p);
    return shot;
  },
  'g-fin-3': () => feeling(),
  'g-fin-4': async () => {
    const shot = await feeling();
    await filledFeeling(shot.p);
    return shot;
  },
  'g-fin-5': () =>
    feeling({
      routes: [
        [
          /\/api\/auth\/me$/,
          (r) =>
            r.fulfill({
              json: {
                user: {
                  ...base.user,
                  healthConsent: {
                    granted: false,
                    decidedAt: '2026-11-01T10:00:00.000Z',
                    version: '1',
                  },
                },
              },
            }),
        ],
      ],
    }),
  'g-fin-6': async () => {
    const shot = await feeling();
    await tap(shot.p.getByRole('radio', { name: /Juste/ }));
    await tap(shot.p.getByRole('button', { name: /^Envoyer à / }));
    await shot.p.waitForTimeout(1800);
    return shot;
  },

  // ── À lire
  'k-a-lire-0': () =>
    open('m', '/coach', {
      routes: [[/\/api\/coach\/inbox/, (r) => inbox(r, FEED)]],
    }),
  'k-a-lire-1': async () => {
    const shot = await open('m', '/coach');
    await tap(shot.p.getByRole('button', { name: 'Réagir : costaud' }));
    return shot;
  },
  'k-a-lire-2': async () => {
    const shot = await open('m', '/coach');
    await tap(shot.p.getByRole('button', { name: 'Répondre', exact: true }));
    return shot;
  },
  'k-a-lire-3': () =>
    open('m', '/coach', {
      routes: [[/\/api\/coach\/inbox/, (r) => inbox(r, [])]],
    }),
  'k-a-lire-4': async () => {
    const shot = await open('d', '/coach');
    await tap(
      shot.p.getByRole('button', { name: /Ouvrir la séance de Sarah/ })
    );
    return shot;
  },

  // ── Clients
  'k-clients-0': () => clients('m'),
  'k-clients-1': async () => {
    const shot = await clients('m');
    await tap(
      shot.p
        .locator('main [data-tag-bar]')
        .getByRole('button', { name: 'Reprise', exact: true })
    );
    return shot;
  },
  'k-clients-2': async () => {
    const shot = await clients('m');
    await shot.p
      .getByRole('searchbox', { name: 'Chercher un client' })
      .fill('Zoé');
    await settle(shot.p);
    return shot;
  },
  'k-clients-3': async () => {
    const shot = await clients('m', {
      routes: [
        [
          /\/api\/coach\/invitation$/,
          (r) =>
            r.fulfill({
              json: {
                token: 'kx82hd0s',
                expiresAt: new Date(Date.now() + 3 * DAY).toISOString(),
              },
            }),
        ],
      ],
    });
    await tap(shot.p.getByRole('button', { name: /^Inviter/ }));
    return shot;
  },
  'k-clients-4': async () => {
    const shot = await clients('m');
    await shot.p
      .locator(`main [data-client-row="${CLIENT}"]`)
      .click({ button: 'right', timeout: 3000 })
      .catch(() => {});
    await settle(shot.p);
    await tap(shot.p.getByRole('menuitem', { name: 'Étiquettes' }));
    return shot;
  },
  'k-clients-5': () => clients('m', { roster: [] }),
  'k-clients-6': async () => {
    const shot = await clients('d');
    await tap(shot.p.locator(`main [data-client-row="${CLIENT}"]`));
    return shot;
  },

  // ── Atelier d'un client
  'k-atelier-0': () => open('m', WORKSHOP),
  'k-atelier-1': async () => {
    const shot = await open('m', WORKSHOP);
    await openRow(shot.p, 'Goblet Squat');
    return shot;
  },
  'k-atelier-2': async () => {
    const shot = await open('m', WORKSHOP);
    await tap(shot.p.getByRole('button', { name: 'Régler le bloc EMOM' }));
    return shot;
  },
  'k-atelier-3': async () => {
    const shot = await open('m', WORKSHOP);
    await tap(shot.p.getByRole('button', { name: 'Ajouter un bloc' }));
    return shot;
  },
  'k-atelier-4': async () => {
    const shot = await open('m', WORKSHOP);
    await tap(
      shot.p
        .locator('main [data-block-type="emom"]')
        .getByRole('button', { name: 'exercice' })
    );
    await shot.p.keyboard.type('swi');
    await settle(shot.p);
    return shot;
  },
  'k-atelier-5': async () => {
    const shot = await open('m', WORKSHOP);
    await tap(shot.p.getByRole('button', { name: /^Menu de la séance/ }));
    return shot;
  },
  'k-atelier-6': async () => {
    const shot = await open('m', WORKSHOP);
    await tap(
      shot.p.getByRole('button', { name: /^Ressentis de la séance 1/ })
    );
    return shot;
  },
  'k-atelier-7': async () => {
    const shot = await open('d', WORKSHOP);
    await openRow(shot.p, 'Goblet Squat');
    return shot;
  },
  'k-atelier-8': async () => {
    const shot = await open('d', WORKSHOP);
    await tap(shot.p.getByRole('button', { name: 'Ajouter un bloc' }));
    return shot;
  },
  'k-atelier-9': async () => {
    const shot = await open('d', WORKSHOP);
    await tap(
      shot.p
        .locator('main [data-block-type="emom"]')
        .getByRole('button', { name: 'exercice' })
    );
    await shot.p.keyboard.type('swi');
    await settle(shot.p);
    return shot;
  },
  'k-atelier-10': async () => {
    const shot = await open('d', WORKSHOP);
    await openRow(shot.p, 'Goblet Squat');
    await tap(
      shot.p.getByRole('button', { name: 'Ouvrir la fiche de Goblet Squat' })
    );
    return shot;
  },
  'k-atelier-11': async () => {
    const shot = await open('d', WORKSHOP);
    await shot.p
      .getByRole('button', { name: /^Séance 1 — Full body A/ })
      .first()
      .click({ button: 'right', timeout: 3000 })
      .catch((e) => console.log('  [absent]', e.message.split('\n')[0]));
    await settle(shot.p);
    return shot;
  },
  'k-atelier-12': async () => {
    const shot = await open('d', WORKSHOP);
    await tap(shot.p.getByRole('button', { name: 'Menu du bloc EMOM' }));
    await tap(shot.p.getByRole('menuitem', { name: /^Supprimer le bloc/ }));
    return shot;
  },
  'k-atelier-13': async () => {
    const shot = await open('d', WORKSHOP);
    await tap(shot.p.getByRole('button', { name: 'Importer un modèle…' }));
    await tap(
      shot.p.getByRole('dialog').getByRole('button', { name: /Prise de masse/ })
    );
    return shot;
  },
  'k-atelier-14': () =>
    open('d', `/coach/clients/${CLIENT}/s/1`, {
      routes: [
        [
          new RegExp(`/api/coach/clients/${CLIENT}$`),
          (r) =>
            r.request().method() === 'GET'
              ? r.fulfill({
                  json: {
                    ...base.client,
                    program: { ...base.client.program, sessions: [] },
                  },
                })
              : r.fallback(),
        ],
      ],
    }),

  // ── Ressentis d'un client
  'k-ressentis-0': () => open('m', JOURNAL),
  'k-ressentis-1': async () => {
    await coachReplies('cs6', REPLY);
    const shot = await open('m', JOURNAL);
    await tap(shot.p.locator('main [data-journal-row]'));
    return shot;
  },
  'k-ressentis-2': () =>
    open('m', JOURNAL, {
      routes: [
        [
          /\/api\/coach\/clients\/[^/]+\/history/,
          (r) => r.fulfill({ json: [] }),
        ],
      ],
    }),
  'k-ressentis-3': async () => {
    await coachReplies('cs6', REPLY);
    const shot = await open('d', JOURNAL);
    await tap(shot.p.locator('main [data-journal-row]'));
    return shot;
  },

  // ── Modèles
  'k-modeles-0': () => templates('m'),
  'k-modeles-1': async () => {
    const shot = await templates('m');
    await tap(shot.p.getByRole('button', { name: /^Nouveau/ }));
    return shot;
  },
  'k-modeles-2': async () => {
    const shot = await open('m', '/coach/templates', {
      routes: [
        [/\/api\/coach\/clients(\?|$)/, (r) => r.fulfill({ json: ROSTER })],
      ],
    });
    await tap(shot.p.getByRole('button', { name: 'Utiliser pour un client' }));
    return shot;
  },
  'k-modeles-3': async () => {
    const shot = await open('m', '/coach/templates');
    await tap(
      shot.p.getByRole('button', { name: 'Menu du modèle Prise de masse' })
    );
    await tap(shot.p.getByRole('menuitem', { name: 'Supprimer' }));
    return shot;
  },
  'k-modeles-4': () =>
    open('m', '/coach/templates', {
      routes: [
        [
          /\/api\/coach\/templates$/,
          (r) =>
            r.request().method() === 'GET'
              ? r.fulfill({ json: { templates: [] } })
              : r.fallback(),
        ],
      ],
    }),
  'k-modeles-5': () => templates('d'),
  'k-modeles-6': () => open('d', '/coach/templates/tpl1/s/1'),

  // ── Exercices
  'k-exercices-0': () => open('m', '/coach/exercises'),
  'k-exercices-1': async () => {
    const shot = await open('m', '/coach/exercises');
    await tap(shot.p.getByRole('button', { name: /^Kettlebell Swing/ }));
    return shot;
  },
  'k-exercices-2': async () => {
    const shot = await open('m', '/coach/exercises');
    await shot.p
      .getByRole('searchbox', { name: 'Chercher ou créer un exercice' })
      .fill('Soulevé de terre');
    await settle(shot.p);
    return shot;
  },
  'k-exercices-3': () =>
    open('m', '/coach/exercises', {
      routes: [
        [
          /\/api\/coach\/exercises$/,
          (r) =>
            r.request().method() === 'GET'
              ? r.fulfill({ json: [] })
              : r.fallback(),
        ],
      ],
    }),
  'k-exercices-4': async () => {
    const shot = await open('d', '/coach/exercises');
    await tap(shot.p.getByRole('button', { name: /^Kettlebell Swing/ }));
    return shot;
  },

  // ── Connexion et invitation
  'x-connexion-0': () => signedOut('m', '/login'),
  'x-connexion-1': async () => {
    const shot = await signedOut('m', '/login');
    await tap(shot.p.getByRole('button', { name: "J'ai reçu une invitation" }));
    return shot;
  },
  'x-connexion-2': async () => {
    const shot = await signedOut('m', '/login');
    await tap(shot.p.getByRole('button', { name: 'Je suis coach' }));
    return shot;
  },
  'x-connexion-3': () => signedOut('m', '/join?token=kx82hd0s'),
  'x-connexion-4': () =>
    signedOut('m', '/join?token=perime', {
      invite: (r) =>
        r.fulfill({ status: 404, json: { message: 'Lien inconnu' } }),
    }),
  'x-connexion-5': () => signedOut('m', '/join'),
  'x-connexion-6': () => signedOut('d', '/login'),

  // ── États du système
  'x-etats-0': async () => {
    const shot = await open('m', '/client', { date: THURSDAY });
    await shot.ctx.setOffline(true);
    await shot.p
      .locator('[data-offline]')
      .first()
      .waitFor({ timeout: 4000 })
      .catch(() => {});
    return shot;
  },
  // Un nom de séance changé, dont l'envoi attend : l'horloge figée, il ne
  // part pas, et la nouvelle version doit l'attendre.
  'x-etats-1': async () => {
    const shot = await open('m', WORKSHOP, { date: new Date() });
    await freeze(shot.p);
    await tap(shot.p.getByRole('button', { name: /^Menu de la séance/ }));
    await shot.p
      .getByRole('dialog')
      .getByRole('textbox')
      .first()
      .fill('Full body A bis')
      .catch(() => {});
    await tap(shot.p.getByRole('button', { name: 'C’est bon' }));
    await shot.p.evaluate(() => window.__kettleNewVersion?.()).catch(() => {});
    await shot.p
      .locator('[data-update-banner]')
      .waitFor({ timeout: 3000 })
      .catch(() => {});
    return shot;
  },
  'x-etats-2': () => open('m', '/une-adresse-inconnue'),
  // Le morceau de code de Progrès refusé : son import échoue au rendu, et
  // c'est l'écran de plantage qui le reçoit — la seule panne que l'on
  // provoque sans toucher au code.
  'x-etats-3': () =>
    open('m', '/client/history', {
      routes: [
        [/\/src\/features\/client\/progress\/History\.tsx/, (r) => r.abort()],
      ],
    }),
  'x-etats-4': () =>
    open('m', '/client', {
      routes: [
        [
          /\/api\/auth\/me$/,
          (r) =>
            r.fulfill({
              json: {
                user: {
                  ...base.user,
                  isCoach: false,
                  coachId: undefined,
                  isClient: false,
                },
              },
            }),
        ],
      ],
    }),
  'x-etats-5': async () => {
    const shot = await open('m', '/client', { date: THURSDAY });
    await tap(shot.p.getByRole('button', { name: /^Menu du compte/ }));
    return shot;
  },

  // ── Administration
  'x-admin-0': () => admin(),
  'x-admin-1': async () => {
    const shot = await admin();
    await tap(shot.p.getByRole('button', { name: 'Nouveau coach' }));
    return shot;
  },
};

const DAY = 86_400_000;
/** La réponse du coach sous la dernière séance de Sarah. */
const REPLY = {
  reaction: 'strong',
  text: 'Bien joué d’être allée au bout. J’allège les swings.',
};
const WORKSHOP = `/coach/clients/${CLIENT}/s/1`;
const JOURNAL = `/coach/clients/${CLIENT}/journal`;

/** Le fil « À lire », servi tel quel ; « Déjà lues » reste au serveur
 * d'essai. */
function inbox(route, items) {
  if (new URL(route.request().url()).searchParams.get('state') === 'read')
    return route.fallback();
  return route.fulfill({ json: { total: items.length, items } });
}

/**
 * Six séances à lire chez trois clients : les bilans du décor, rendus à
 * Sarah, Karim et Léa, chacun avec celui d'avant pour que la carte dise ce
 * qui a bougé.
 */
const FEED = (() => {
  const who = [
    { _id: CLIENT, firstName: 'Sarah', lastName: 'Martin' },
    { _id: 'karim', firstName: 'Karim', lastName: 'Haddad' },
    { _id: 'lea', firstName: 'Léa', lastName: 'Dubois' },
  ];
  const sorted = [...base.history].sort(
    (a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt)
  );
  return sorted.slice(0, 6).map((completed, i) => ({
    client: who[i % 3],
    completed: {
      ...completed,
      _id: `feed-${i}`,
      viewedByCoach: false,
      replies: [],
      completedAt: new Date(Date.now() - (i + 1) * 0.8 * DAY).toISOString(),
    },
    previous: sorted
      .slice(i + 1)
      .find((c) => c.originalSessionId === completed.originalSessionId),
  }));
})();

/** Une ligne de la liste des clients, comme `verify_clients`. */
const clientRow = (o) => ({
  unseenCount: 0,
  linkedAt: new Date(Date.now() - 90 * DAY).toISOString(),
  tagIds: [],
  weekDone: 1,
  weekTarget: 3,
  sessionCount: 3,
  recentEfforts: [3, 3],
  lastCompletedAt: new Date(Date.now() - 2 * DAY).toISOString(),
  ...o,
});
const ago = (days) => new Date(Date.now() - days * DAY).toISOString();
/** Six clients, tous les états d'une ligne — ceux de `verify_clients`. */
const ROSTER = [
  clientRow({
    _id: 'lea',
    firstName: 'Léa',
    lastName: 'Dubois',
    weekDone: 2,
    weekTarget: 2,
    recentEfforts: [1, 3, 3],
    lastCompletedAt: ago(3),
  }),
  clientRow({
    _id: 'karim',
    firstName: 'Karim',
    lastName: 'Haddad',
    weekDone: 0,
    recentEfforts: [3, 4],
    lastCompletedAt: ago(22),
  }),
  clientRow({
    _id: CLIENT,
    firstName: 'Sarah',
    lastName: 'Martin',
    unseenCount: 1,
    weekDone: 1,
    recentEfforts: [3, 3, 3, 4, 5],
    lastCompletedAt: ago(1),
  }),
  clientRow({
    _id: 'manon',
    firstName: 'Manon',
    lastName: 'Petit',
    weekDone: 0,
    weekTarget: 0,
    sessionCount: 0,
    recentEfforts: [],
    lastCompletedAt: undefined,
    linkedAt: ago(2),
  }),
  clientRow({
    _id: 'thomas',
    firstName: 'Thomas',
    lastName: 'Bernard',
    unseenCount: 3,
    weekDone: 3,
    recentEfforts: [3, 3, 3, 3, 3],
    lastCompletedAt: ago(1),
  }),
  clientRow({
    _id: 'julien',
    firstName: 'Julien',
    lastName: 'Moreau',
    unseenCount: 2,
    weekDone: 2,
    recentEfforts: [3, 3, 1, 1],
    lastCompletedAt: ago(3),
  }),
];

/**
 * La liste des clients, avec ses étiquettes : elles sont créées au serveur
 * d'essai, remis à zéro avant chaque cadre, puis posées sur les lignes.
 */
async function clients(size, { roster, routes = [] } = {}) {
  const ids = {};
  for (const name of ['Compétition', 'Prise de masse', 'Reprise', 'Senior']) {
    const tag = await (
      await fetch(`${API}/api/coach/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
    ).json();
    ids[name] = tag._id;
  }
  const tagged = (roster ?? ROSTER).map((c) => ({
    ...c,
    tagIds:
      {
        thomas: [ids['Prise de masse']],
        [CLIENT]: [ids['Compétition'], ids['Reprise'], ids['Senior']],
        julien: [ids['Reprise']],
        lea: [ids['Compétition']],
      }[c._id] ?? [],
  }));
  return open(size, '/coach/clients', {
    routes: [
      [/\/api\/coach\/clients(\?|$)/, (r) => r.fulfill({ json: tagged })],
      [
        /\/api\/coach\/clients\/[^/]+\/history/,
        (r) =>
          new URL(r.request().url()).pathname.includes(CLIENT)
            ? r.fallback()
            : r.fulfill({ json: [] }),
      ],
      ...routes,
    ],
  });
}

/** Ouvrir une ligne d'exercice de l'atelier, comme `verify_picker`. */
async function openRow(p, name) {
  await tap(
    p
      .locator('main [data-exercise-row]')
      .filter({ hasText: name })
      .first()
      .locator(':scope > button')
  );
}

/** Trois modèles : celui du décor, et deux autres qui empruntent sa forme. */
async function templates(size) {
  const [first] = base.templates;
  const rows = [
    first,
    { ...first, _id: 'tpl-force', name: 'Force 3 jours', usageCount: 2 },
    {
      ...first,
      _id: 'tpl-reprise',
      name: 'Reprise en douceur',
      sessionCount: 1,
      preview: first.preview.slice(1),
      usageCount: 1,
    },
  ];
  return open(size, '/coach/templates', {
    routes: [
      [
        /\/api\/coach\/templates$/,
        (r) =>
          r.request().method() === 'GET'
            ? r.fulfill({ json: { templates: rows } })
            : r.fallback(),
      ],
    ],
  });
}

/** Sans session : l'écran de connexion et le lien d'invitation. */
async function signedOut(size, path, { invite } = {}) {
  const ctx = await browser.newContext(SIZES[size]);
  await ctx.route(/\/api\/auth\/me$/, (r) =>
    r.fulfill({ status: 401, json: { message: 'Non connecté' } })
  );
  await ctx.route(
    /\/api\/auth\/verify-invite-token/,
    invite ??
      ((r) =>
        r.fulfill({
          json: {
            valid: true,
            coach: { id: 'c1', firstName: 'Julie', lastName: 'Martin' },
          },
        }))
  );
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('  [pageerror]', e.message));
  await p.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  return { ctx, p };
}

/** L'administration, avec les chiffres et les coachs de `verify_admin`. */
function admin() {
  return open('d', '/admin', {
    routes: [
      [
        /\/api\/auth\/me$/,
        (r) => r.fulfill({ json: { user: { ...base.user, isAdmin: true } } }),
      ],
      [
        /\/api\/admin\/stats$/,
        (r) =>
          r.fulfill({
            json: {
              coachCount: 4,
              clientCount: 31,
              sessionCount: 512,
              sessionTodayCount: 9,
              exerciseCount: 148,
            },
          }),
      ],
      [
        /\/api\/admin\/coaches$/,
        (r) =>
          r.fulfill({
            json: [
              {
                _id: '64c000000000000000000001',
                firstName: 'Julie',
                lastName: 'Martin',
                email: 'julie@example.com',
                clientCount: 12,
                exerciseCount: 64,
                createdAt: '2026-02-10T09:00:00.000Z',
              },
              {
                _id: '64c000000000000000000002',
                firstName: 'Marc',
                lastName: 'Lefèvre',
                email: 'marc@example.com',
                clientCount: 1,
                exerciseCount: 41,
                createdAt: '2026-03-02T09:00:00.000Z',
              },
              {
                _id: '64c000000000000000000003',
                email: 'sam@example.com',
                clientCount: 0,
                exerciseCount: 0,
                createdAt: '2026-05-20T09:00:00.000Z',
              },
            ],
          }),
      ],
    ],
  });
}

/** Le temps de la page s'arrête : il n'avance plus que sur ordre, et la
 * capture montre la seconde qu'on a choisie. */
async function freeze(p) {
  const now = await p.evaluate(() => Date.now());
  await p.clock.pauseAt(now + 300);
}

/** Le programme du décor, plus des séances composées pour un cadre. */
function withSessions(...extra) {
  return { ...base.program, sessions: [...base.program.sessions, ...extra] };
}

/** Une séance guidée ouverte un jeudi, le décompte franchi. */
async function guided(size, sess, options = {}) {
  const shot = await open(size, '/client/program', {
    date: THURSDAY,
    ...options,
  });
  await start(shot.p, sess);
  return shot;
}

/** Le bloc classique de « Haut du corps » : le Tabata passé par la pause. */
async function classicSet(size, options) {
  const shot = await guided(size, 'sess2', options);
  await passBlock(shot.p);
  return shot;
}

/** L'EMOM de « Full body A », prêt ; lancé et avancé de `ms` si on le dit. */
async function emom(size, ms) {
  const shot = await guided(size, 'sess1');
  await passBlock(shot.p);
  if (ms === undefined) return shot;
  await launchClock(shot.p);
  await freeze(shot.p);
  await shot.p.clock.runFor(ms);
  return shot;
}

/** L'AMRAP de « Full body A », lancé, l'horloge arrêtée. */
async function amrap(size) {
  const shot = await guided(size, 'sess1');
  await passBlock(shot.p);
  await passBlock(shot.p);
  await launchClock(shot.p);
  await freeze(shot.p);
  return shot;
}

/**
 * L'échelle de la maquette : deux mouvements, sept paliers, douze minutes —
 * composée à partir de l'échelle à deux du décor, comme `verify_ladder`.
 * `climbed` paliers sont faits.
 */
async function ladder(climbed) {
  const sess6 = base.program.sessions.find((s) => s._id === 'sess6');
  const bounded = {
    ...sess6,
    _id: 'sess-ladder',
    order: 9,
    blocks: [
      {
        ...sess6.blocks[0],
        repsScheme: [2, 4, 6, 8, 6, 4, 2],
        durationMinutes: 12,
      },
    ],
  };
  const shot = await guided('m', 'sess-ladder', {
    program: withSessions(bounded),
  });
  await freeze(shot.p);
  await launchClock(shot.p);
  for (let i = 0; i < climbed; i++) {
    await shot.p.clock.runFor(70_000);
    await tap(shot.p.getByRole('button', { name: 'Palier fait' }));
    const rest = shot.p.getByRole('button', { name: 'Passer', exact: true });
    if (await rest.count()) await tap(rest);
  }
  return shot;
}

/** Le chipper du décor, borné à quinze minutes. */
const CAPPED_CHIPPER = (() => {
  const sess3 = base.program.sessions.find((s) => s._id === 'sess3');
  return {
    ...sess3,
    _id: 'sess-chipper',
    order: 9,
    blocks: [{ ...sess3.blocks[0], durationMinutes: 15 }],
  };
})();

/** Une séance arrêtée en route, jusqu'au ressenti. */
async function feeling(options) {
  const shot = await guided('m', 'sess1', options);
  await advance(shot.p);
  await finishFromPause(shot.p);
  await reachFeeling(shot.p);
  return shot;
}

/** Un visage, une étiquette, un mot. */
async function filledFeeling(p) {
  await tap(p.getByRole('radio', { name: /Juste/ }));
  await tap(p.getByText('Fatigué', { exact: true }));
  await p
    .getByRole('textbox', { name: /^Un mot pour/ })
    .fill('Dur sur la fin, mais tenu.')
    .catch(() => {});
}

/** Un client à qui la question des données de santé n'a pas été posée. */
function unansweredMe(r) {
  return r.fulfill({
    json: {
      user: { ...base.user, needsHealthConsent: true, healthConsent: null },
    },
  });
}

/** Les cadres de la maquette, lus dans la maquette elle-même : chaque écran,
 * son titre, et pour chaque cadre son format, son nom et sa légende. */
const readMockup = async () => {
  const p = await browser.newPage({ viewport: { width: 1800, height: 1000 } });
  await p.goto(`file://${MOCKUP}`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);
  // Les cadres à taille réelle, sans leur coque de téléphone, et les
  // grands écrans hors de leur bande défilante, qui les rognait.
  await p.addStyleTag({
    content:
      ':root,body,*{--ms:1 !important;--ls:1 !important;--ds:1 !important}' +
      '.fr .vp{border:0 !important;border-radius:0 !important;box-shadow:none !important}' +
      '.dscroll{overflow:visible !important}' +
      '*{animation-play-state:paused !important}',
  });
  await p.waitForTimeout(300);
  const screens = await p.evaluate(() =>
    [...document.querySelectorAll('section.spec')]
      .filter((s) => s.querySelector('figure.fr'))
      .map((s) => ({
        id: s.id,
        title: s.querySelector('h2')?.innerText.trim() ?? s.id,
        frames: [...s.querySelectorAll('figure.fr')].map((f, i) => ({
          id: `${s.id}-${i}`,
          size: ['m', 'l', 'd'].find((c) => f.classList.contains(c)),
          name: f.querySelector('figcaption b')?.innerText.trim() ?? '',
          when: (f.querySelector('figcaption')?.innerText ?? '')
            .replace(f.querySelector('figcaption b')?.innerText ?? '', '')
            .replace(f.querySelector('.tagn')?.innerText ?? '', '')
            .replace(/\s+/g, ' ')
            .trim(),
          height: f.querySelector('.k')?.getBoundingClientRect().height ?? 0,
        })),
      }))
  );
  return { p, screens };
};

const wanted = (id) => !ONLY.length || ONLY.some((o) => id.startsWith(o));

mkdirSync(`${OUT}/maquette`, { recursive: true });
mkdirSync(`${OUT}/app`, { recursive: true });
const { p: mockup, screens } = await readMockup();
const frames = screens.flatMap((s) => s.frames).filter((f) => wanted(f.id));
for (const f of frames) {
  const k = mockup.locator(`section#${f.id.replace(/-\d+$/, '')} figure.fr .k`);
  await k.nth(Number(f.id.split('-').at(-1))).screenshot({
    path: `${OUT}/maquette/${f.id}.jpg`,
    type: 'jpeg',
    quality: 72,
    animations: 'disabled',
  });
}
await mockup.close();

let done = 0;
const missing = [];
for (const f of frames) {
  const run = SHOTS[f.id];
  if (!run) {
    missing.push(f.id);
    continue;
  }
  await freshServer();
  const t0 = Date.now();
  try {
    const { ctx, p } = await run();
    // Plus rien ne bouge : les animations d'entrée finies, le curseur
    // d'un champ figé.
    await p.waitForTimeout(400);
    // Un cadre plus haut que l'écran. Au téléphone, c'est une page
    // entière : le cadre grandit jusqu'à elle, plutôt qu'une capture qui
    // défile — celle-ci laissait la barre d'onglets au milieu, là où
    // finissait l'écran. Sur grand écran, c'est un écran plus haut, et
    // l'application en prend la hauteur : ses colonnes défilent seules.
    const { width, height } = SIZES[f.size].viewport;
    if (f.height > height + 1) {
      const full =
        f.size === 'd'
          ? Math.round(f.height)
          : await p.evaluate(() => document.documentElement.scrollHeight);
      await p.setViewportSize({ width, height: Math.max(height, full) });
      await settle(p);
    }
    await p.screenshot({
      path: `${OUT}/app/${f.id}.jpg`,
      type: 'jpeg',
      quality: 72,
      caret: 'hide',
    });
    await ctx.close();
    done++;
    console.log(
      `${f.id.padEnd(22)} ${((Date.now() - t0) / 1000).toFixed(1)} s`
    );
  } catch (e) {
    console.log(`${f.id.padEnd(22)} ÉCHEC ${e.message.split('\n')[0]}`);
  }
}

writeFileSync(`${OUT}/screens.json`, JSON.stringify(screens, null, 2));
writeFileSync(`${OUT}/index.html`, boardPage(OUT));
console.log(
  `\n${done} capture(s) sur ${frames.length} cadre(s)` +
    (missing.length ? ` · sans scénario : ${missing.join(', ')}` : '')
);
await browser.close();
server.kill();
