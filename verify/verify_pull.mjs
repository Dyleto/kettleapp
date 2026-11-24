/**
 * Tirer pour recharger (G6), sur les quatre écrans que la maquette
 * prévoit : l'accueil, le programme et Progrès du client, « À lire » du
 * coach.
 *
 * Le doigt est un vrai doigt : des événements tactiles envoyés au
 * navigateur, posés, déplacés, levés. Ce que l'écran relit se voit à ce
 * qu'il affiche ensuite — la réponse servie a changé entre deux tirages —
 * et aux requêtes parties, comptées.
 */
import {
  API,
  BASE,
  COACHES,
  MOBILE,
  launch,
  ok,
  failureCount,
  signIn,
  settle,
  gone,
  clean,
  markWelcomed,
} from './common.mjs';

const indicator = (p) => p.locator('[data-pull]');
const phase = (p) =>
  indicator(p)
    .getAttribute('data-pull', { timeout: 500 })
    .catch(() => null);
const said = (p) =>
  indicator(p)
    .innerText({ timeout: 500 })
    .then(clean)
    .catch(() => '');

/**
 * Un doigt sur l'écran : posé en (195, 160), déplacé de `dx`, `dy` en dix
 * pas. Levé, sauf si `hold` : la suite lit alors ce que dit l'indicateur
 * pendant la traction, et lève le doigt elle-même.
 */
const finger = async (p) => {
  const cdp = await p.context().newCDPSession(p);
  const send = (type, at) =>
    cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: type === 'touchEnd' ? [] : [at],
    });
  return {
    drag: async (dx, dy, { hold = false, from = { x: 195, y: 160 } } = {}) => {
      await send('touchStart', from);
      for (let i = 1; i <= 10; i++)
        await send('touchMove', {
          x: from.x + (dx * i) / 10,
          y: from.y + (dy * i) / 10,
        });
      if (!hold) await send('touchEnd');
    },
    lift: () => send('touchEnd'),
  };
};

/** Les requêtes parties vers `pattern`, comptées depuis l'appel. */
const counter = (p, pattern) => {
  const seen = { count: 0 };
  p.on('request', (r) => {
    if (pattern.test(r.url())) seen.count += 1;
  });
  return seen;
};

/**
 * Fige l'horloge de la page à l'instant présent. Cinquante millisecondes
 * d'avance, et on recommence si la page les a déjà dépassées : sous la
 * charge, `pauseAt` refusait de revenir en arrière.
 */
const freeze = async (p) => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const now = await p.evaluate(() => Date.now());
    const paused = await p.clock
      .pauseAt(now + 50)
      .then(() => true)
      .catch(() => false);
    if (paused) return;
  }
};

const browser = await launch();

// ── Le client ──────────────────────────────────────────────────────────
const { history: BASE_HISTORY } = await (
  await fetch(`${API}/api/client/history`)
).json();
const { program: PROGRAM } = await (
  await fetch(`${API}/api/client/program`)
).json();
const did = (sessionId, date) => ({
  ...(BASE_HISTORY.find((c) => c.originalSessionId === sessionId) ??
    BASE_HISTORY[0]),
  _id: `did-${sessionId}-${date}`,
  originalSessionId: sessionId,
  completedAt: new Date(2026, 10, date, 9).toISOString(),
});
// Le décor conseille trois jours ; le jeudi 12 novembre, une séance faite
// lundi — puis, faite ailleurs entre deux tirages, une seconde mardi.
const ONE = [did('sess1', 9), ...BASE_HISTORY];
const TWO = [did('sess2', 10), ...ONE];

/**
 * Le client, le jeudi 12 novembre 2026, avec l'historique et le programme
 * que `serve` dit — changés en cours de route, c'est ce qui a bougé
 * ailleurs. `serve.gate`, quand il est posé, retient la réponse de
 * l'historique jusqu'à ce qu'on l'ouvre : l'indicateur se lit pendant.
 */
const clientContext = async (options = {}) => {
  const ctx = await browser.newContext({ ...MOBILE, ...options });
  await markWelcomed(ctx);
  const serve = { history: ONE, program: PROGRAM, gate: null, fail: false };
  await ctx.route(/\/api\/client\/history(\?|$)/, async (r) => {
    if (serve.gate) await serve.gate.promise;
    if (serve.fail) return r.fulfill({ status: 503, json: {} });
    return r.fulfill({ json: { history: serve.history } });
  });
  await ctx.route(/\/api\/client\/program(\?|$)/, (r) =>
    r.fulfill({ json: { program: serve.program, coaches: COACHES } })
  );
  const p = await ctx.newPage();
  await p.clock.install({ time: new Date(2026, 10, 12, 10) });
  await p.goto(`${BASE}/client/history`, { waitUntil: 'domcontentloaded' });
  await p.evaluate(() =>
    fetch('http://localhost:3001/api/auth/dev-login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
  );
  return { ctx, p, serve };
};
const gate = () => {
  let open;
  const promise = new Promise((resolve) => (open = resolve));
  return { promise, open };
};
const ringLabel = (p) =>
  p
    .locator('[data-week-ring]')
    .getAttribute('aria-label', { timeout: 2000 })
    .catch(() => null);

{
  console.log('\n── l’accueil');
  const { ctx, p, serve } = await clientContext();
  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
  await p
    .locator('[data-week-ring]')
    .waitFor({ timeout: 8000 })
    .catch(() => {});
  await settle(p);
  const history = counter(p, /\/api\/client\/history/);
  const program = counter(p, /\/api\/client\/program/);
  const touch = await finger(p);

  await touch.drag(0, 80, { hold: true });
  const short = { phase: await phase(p), said: await said(p) };
  await touch.lift();
  await settle(p);
  ok(
    'un geste court dit « Tire pour actualiser », et relâché ne relit rien',
    short.phase === 'pulling' &&
      short.said === 'Tire pour actualiser' &&
      history.count === 0 &&
      (await indicator(p).count()) === 0,
    `${short.phase} « ${short.said} » · ${history.count} requête(s)`
  );

  // Chaque geste part d'un écran au repos : une relecture encore en vol
  // ferait ignorer la traction, et l'assertion d'après tomberait par
  // ricochet.
  await gone(indicator(p), 5000);
  serve.history = TWO;
  serve.gate = gate();
  await touch.drag(0, 220, { hold: true });
  const armed = { phase: await phase(p), said: await said(p) };
  await touch.lift();
  await indicator(p)
    .and(p.locator('[data-pull="refreshing"]'))
    .waitFor({ timeout: 2000 })
    .catch(() => {});
  const spinning = { phase: await phase(p), said: await said(p) };
  // Une seconde traction pendant la relecture : ignorée.
  await touch.drag(0, 220);
  ok(
    'tiré assez loin, il dit « Relâche pour actualiser »',
    armed.phase === 'armed' && armed.said === 'Relâche pour actualiser',
    `${armed.phase} « ${armed.said} »`
  );
  ok(
    '  → relâché, il tourne le temps de la relecture',
    spinning.phase === 'refreshing' && spinning.said === 'Actualisation…',
    `${spinning.phase} « ${spinning.said} »`
  );
  serve.gate.open();
  serve.gate = null;
  await gone(indicator(p), 5000);
  await settle(p);
  ok(
    '  → puis l’accueil montre ce qui a changé, relu une fois malgré une seconde traction',
    (await ringLabel(p)) === '2 séances sur 3' &&
      history.count === 1 &&
      program.count === 1 &&
      (await indicator(p).count()) === 0,
    `${await ringLabel(p)} · ${history.count} historique · ${program.count} programme`
  );

  // Une feuille ouverte : tirer dedans ne relit pas l'écran derrière.
  await gone(indicator(p), 5000);
  await p
    .getByRole('button', { name: /^Menu du compte/ })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const sheet = await p
    .getByRole('dialog', { name: 'Menu du compte' })
    .boundingBox({ timeout: 2000 })
    .catch(() => null);
  const inSheet = history.count;
  await touch.drag(0, 220, {
    hold: true,
    from: sheet ? { x: sheet.x + sheet.width / 2, y: sheet.y + 24 } : undefined,
  });
  const fromSheet = await indicator(p).count();
  await touch.lift();
  await settle(p);
  ok(
    'dans une feuille ouverte, tirer ne relit pas l’écran derrière',
    sheet !== null && fromSheet === 0 && history.count === inSheet,
    `${sheet ? 'feuille ouverte' : 'aucune feuille'} · ${fromSheet} indicateur · ${history.count - inSheet} requête(s)`
  );
  await p.keyboard.press('Escape');
  await settle(p);

  // Hors connexion : il le dit, et ne tente rien.
  await gone(indicator(p), 5000);
  await ctx.setOffline(true);
  await settle(p);
  const offlineBefore = history.count;
  await touch.drag(0, 220, { hold: true });
  const offline = { phase: await phase(p), said: await said(p) };
  await touch.lift();
  await settle(p);
  ok(
    'hors connexion, il le dit pendant la traction, et relâché ne tente rien',
    offline.phase === 'offline' &&
      offline.said === 'Hors connexion : rien à actualiser' &&
      history.count === offlineBefore &&
      (await indicator(p).count()) === 0,
    `${offline.phase} « ${offline.said} » · ${history.count - offlineBefore} requête(s)`
  );
  await ctx.setOffline(false);
  await settle(p);

  // Une panne : le message dit ce qui est sauf, et l'accueil reste.
  await gone(indicator(p), 5000);
  serve.fail = true;
  await touch.drag(0, 220);
  // Trois nouvelles tentatives, à 1, 2 et 4 s : l'horloge de la page les
  // franchit sans les attendre.
  const toast = p.locator('[data-scope="toast"][data-part="title"]');
  for (let i = 0; i < 12 && !(await toast.count()); i++) {
    await p.clock.runFor(1000).catch(() => {});
    await settle(p);
  }
  const message = clean(
    await toast
      .first()
      .innerText({ timeout: 1000 })
      .catch(() => '')
  );
  ok(
    'une relecture qui échoue le dit, et l’accueil garde ce qu’il montrait',
    message === 'Actualisation impossible' &&
      (await ringLabel(p)) === '2 séances sur 3',
    `« ${message} » · ${await ringLabel(p)}`
  );
  await ctx.close();
}

{
  console.log('\n── le programme');
  const { ctx, p, serve } = await clientContext();
  await p.goto(`${BASE}/client/program`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  const first = PROGRAM.sessions[0].name;
  serve.program = {
    ...PROGRAM,
    sessions: PROGRAM.sessions.map((s, i) =>
      i === 0 ? { ...s, name: `${s.name} revue` } : s
    ),
  };
  const touch = await finger(p);
  // L'horloge de la page figée : la relecture répond, et l'indicateur
  // tourne encore — ses 600 ms ne passent qu'à la main. Sans cela,
  // l'assertion dépendait du temps que mettait la réponse.
  await freeze(p);
  await touch.drag(0, 220);
  await settle(p);
  const early = await phase(p);
  for (let i = 0; i < 70 && (await indicator(p).count()); i++)
    await p.clock.runFor(10).catch(() => {});
  ok(
    'une relecture éclair tourne tout de même un instant, puis s’efface',
    early === 'refreshing' && (await indicator(p).count()) === 0,
    `${early} une fois tout reçu · ${await indicator(p).count()} indicateur après 700 ms`
  );
  await p.clock.resume().catch(() => {});
  await settle(p);
  const text = clean(await p.locator('main').innerText());
  ok(
    'tirer le programme montre la séance que le coach vient de renommer',
    text.includes(`${first} revue`),
    text.split('\n').slice(0, 8).join(' | ')
  );

  // Au milieu de la page — six séances la font défiler : le même geste
  // fait défiler, et rien ne se relit.
  const history = counter(p, /\/api\/client\/history/);
  await p.evaluate(() => window.scrollTo(0, 400));
  await settle(p);
  const scrolled = await p.evaluate(() => window.scrollY);
  const before = history.count;
  await touch.drag(0, 220, { hold: true });
  const midway = await indicator(p).count();
  await touch.lift();
  await settle(p);
  ok(
    'au milieu de la page, le même geste fait défiler : rien ne se relit',
    scrolled > 0 && midway === 0 && history.count === before,
    `défilé de ${scrolled} px · ${midway} indicateur · ${history.count - before} requête(s)`
  );

  await ctx.close();
}

// ── Le coach ───────────────────────────────────────────────────────────
{
  console.log('\n── « À lire »');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  const inbox = await (
    await fetch(`${API}/api/coach/inbox?state=unread`)
  ).json();
  const serve = { unread: inbox };
  await ctx.route(/\/api\/coach\/inbox\?state=unread/, (r) =>
    r.fulfill({ json: serve.unread })
  );
  await p.goto(`${BASE}/coach`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  const requests = counter(p, /\/api\/coach\/inbox/);
  const touch = await finger(p);

  // De côté sur une ligne, moins loin que le glisser qui lit : ni l'un ni
  // l'autre.
  const line = await p
    .locator('[data-swipeable]')
    .first()
    .boundingBox({ timeout: 3000 })
    .catch(() => null);
  await touch.drag(-60, 6, {
    hold: true,
    from: line
      ? {
          x: line.x + line.width / 2,
          y: line.y + Math.min(40, line.height / 2),
        }
      : undefined,
  });
  const sideways = await indicator(p).count();
  await touch.lift();
  await settle(p);
  ok(
    'de côté, c’est le glisser d’une ligne : il ne tire rien',
    line !== null && sideways === 0 && requests.count === 0,
    `${line ? 'une ligne' : 'aucune ligne'} · ${sideways} indicateur · ${requests.count} requête(s)`
  );

  serve.unread = { total: 0, items: [] };
  await touch.drag(0, 220);
  await gone(indicator(p), 5000);
  await settle(p);
  ok(
    'tirer « À lire » relit le fil : tout a été lu ailleurs, il le dit',
    (await p.getByText('Tout est lu', { exact: true }).count()) === 1 &&
      requests.count >= 1,
    `${requests.count} requête(s)`
  );
  await ctx.close();
}

{
  console.log('\n── Progrès');
  // Une séance notée sur un autre appareil : l'historique a grandi sans
  // que cet écran le sache.
  const { history } = await (await fetch(`${API}/api/client/history`)).json();
  const elsewhere = {
    ...history[0],
    _id: 'ailleurs',
    completedAt: new Date().toISOString(),
  };
  const serve = { history };
  const ctx = await browser.newContext(MOBILE);
  await ctx.route(/\/api\/client\/history(\?|$)/, (r) =>
    r.fulfill({ json: { history: serve.history } })
  );
  const p = await signIn(ctx);
  await p.goto(`${BASE}/client/history`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  const rows = () => p.locator('main [data-session-row]').count();
  const before = await rows();
  serve.history = [elsewhere, ...history];
  const touch = await finger(p);
  await touch.drag(0, 220);
  await gone(indicator(p), 5000);
  await settle(p);
  const after = await rows();
  ok(
    'tirer Progrès montre la séance notée sur un autre appareil',
    before === history.length && after === history.length + 1,
    `${before} séance(s) avant · ${after} après`
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
