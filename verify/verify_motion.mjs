/**
 * Le mouvement (G5) : la valeur qui saute, l'entrée d'une scène, la coche
 * qui se dessine, l'anneau de l'accueil quand il a changé — et rien de tout
 * cela sous « réduire les animations ».
 *
 * Une animation ne se lit pas à l'écran : elle a fini avant qu'on la
 * regarde. La suite pose un enregistreur dans la page, qui note chaque
 * animation qui démarre et chaque transition qui se lance, avec l'endroit
 * où elle a lieu. Il se pose après le chargement, et une navigation complète
 * l'efface : on navigue donc par les onglets quand il doit tout voir.
 *
 * Les valeurs sont celles du tableau « Mouvement » de la maquette : le saut
 * à 128 % en 280 ms, chaque élément d'une scène monté de 14 px en 420 ms,
 * décalé de 50 ms du précédent, la coche en 300 ms — série, palier, jour —,
 * l'anneau en 1,1 s qui décélère. L'enregistreur les lit sur l'animation
 * elle-même : sa durée, son retard, ses images.
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
  start,
  skipRest,
  pastInterlude,
  launchClock,
  passBlock,
  leaveSession,
  markWelcomed,
} from './common.mjs';

const reset = () => fetch(`${API}/api/mock/reset`, { method: 'POST' });

/**
 * L'enregistreur : chaque animation qui démarre, chaque transition qui se
 * lance, avec la pièce qui la porte — le nombre qui saute, la scène, la
 * coche, l'anneau. Pour l'anneau, la part de départ et la part d'arrivée,
 * lues sur le cercle qui s'anime.
 */
const record = (p) =>
  p.evaluate(() => {
    window.__motion = [];
    if (window.__motionInstalled) return;
    window.__motionInstalled = true;
    const note = (kind) => (event) => {
      const target = event.target;
      const entry = {
        kind,
        name: kind === 'animation' ? event.animationName : event.propertyName,
        jump: target.closest?.('[data-jump]')?.dataset.jump ?? null,
        scene: target.closest?.('[data-scene]')?.dataset.scene ?? null,
        check: target.closest?.('[data-check]')?.dataset.check ?? null,
        row: !!target.closest?.('[data-list-side]'),
        day: !!target.closest?.('[data-day]'),
        dialog:
          target.closest?.('[role="dialog"]')?.getAttribute('aria-label') ??
          null,
        // L'anneau de l'accueil, ou celui de l'écran de fin.
        ring: (() => {
          const ring = target.closest?.('[data-week-ring]');
          if (!ring) return null;
          return ring.dataset.weekRing === 'end' ? 'end' : 'home';
        })(),
      };
      // L'animation bouge-t-elle quelque chose ? Un nom qui démarre ne le
      // dit pas : des images toutes pareilles démarrent aussi.
      if (kind === 'animation') {
        const frames = target
          .getAnimations()
          .find((a) => a.animationName === event.animationName)
          ?.effect?.getKeyframes()
          .map((frame) =>
            JSON.stringify(
              Object.fromEntries(
                Object.entries(frame).filter(
                  ([key]) =>
                    ![
                      'offset',
                      'computedOffset',
                      'easing',
                      'composite',
                    ].includes(key)
                )
              )
            )
          );
        entry.moves = !!frames && new Set(frames).size > 1;
        const animation = target
          .getAnimations()
          .find((a) => a.animationName === event.animationName);
        const timing = animation?.effect?.getTiming();
        const images = animation?.effect?.getKeyframes() ?? [];
        entry.duration = timing ? Math.round(Number(timing.duration)) : null;
        entry.delay = timing ? Math.round(timing.delay) : null;
        entry.easing = images[0]?.easing ?? timing?.easing ?? null;
        const scales = images
          .map((f) => /scale\(([\d.]+)\)/.exec(f.transform ?? '')?.[1])
          .filter(Boolean)
          .map(Number);
        entry.peak = scales.length ? Math.max(...scales) : null;
        entry.rise =
          Number(
            /translateY\(([\d.]+)px\)/.exec(images[0]?.transform ?? '')?.[1]
          ) || null;
      }
      if (entry.ring && entry.name === 'ringFill') {
        const style = getComputedStyle(target);
        const dash = parseFloat(style.strokeDasharray);
        const part = (offset) =>
          Math.round((1 - parseFloat(offset) / dash) * 100) / 100;
        entry.from = part(style.getPropertyValue('--ring-from'));
        entry.to = part(style.getPropertyValue('--ring-to'));
      }
      window.__motion.push(entry);
    };
    document.addEventListener('animationstart', note('animation'), true);
    document.addEventListener('transitionrun', note('transition'), true);
  });
/** Ce qui a bougé depuis la dernière lecture. */
const moved = async (p) => {
  await settle(p);
  return p.evaluate(() => (window.__motion ?? []).splice(0));
};
/** Les animations de ce nom qui bougent quelque chose. */
const named = (all, pattern) =>
  all.filter((m) => pattern.test(m.name) && m.moves !== false);
const show = (all) =>
  all
    .map(
      (m) =>
        `${m.name}${m.moves === false ? '(immobile)' : ''}${m.jump ? `@${m.jump}` : ''}${m.scene ? `@${m.scene}` : ''}${m.check ? `@${m.check}` : ''}${m.from !== undefined ? ` ${m.from}→${m.to}` : ''}`
    )
    .join(' · ') || '(rien)';

const press = async (p, name) => {
  await p
    .getByRole('button', { name, exact: true })
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
};
const LOAD = '[data-set-hero] input[aria-label^="Poids utilisé"]';

/** La séance 2 jusqu'au bloc « Renfo » : le Tabata passé par la pause. */
const toRenfo = async (p) => {
  await start(p, 'sess2');
  await record(p);
  await passBlock(p).catch(() => {});
};

const browser = await launch();

{
  console.log('\n── la séance');
  await reset();
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess2');
  await record(p);
  await p
    .getByRole('button', { name: 'Mettre la séance en pause' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  await p
    .getByRole('button', { name: 'Passer ce bloc' })
    .click({ timeout: 2000 })
    .catch(() => {});
  const interlude = await moved(p);
  await pastInterlude(p);
  const block = await moved(p);
  const enteredNext = named(interlude, /^sceneEnter/).some((m) =>
    m.scene?.startsWith('next-')
  );
  const enteredBlock = named(block, /^sceneEnter/).some((m) =>
    m.scene?.startsWith('block-')
  );
  ok(
    'un bloc passé : l’écran « Bloc suivant » entre, puis le bloc',
    enteredNext && enteredBlock,
    `${show(interlude)} | ${show(block)}`
  );
  const parts = named(block, /^sceneEnter/).filter((m) =>
    m.scene?.startsWith('block-')
  );
  const delays = [...new Set(parts.map((m) => m.delay))].sort((a, b) => a - b);
  ok(
    '  → élément par élément : 14 px, 420 ms, 50 ms de l’un au suivant',
    parts.length >= 3 &&
      parts.every((m) => m.rise === 14 && m.duration === 420) &&
      delays.slice(0, 3).join() === '0,50,100',
    `${parts.length} élément(s) · ${delays.join('/')} ms · ${[
      ...new Set(parts.map((m) => `${m.rise} px ${m.duration} ms`)),
    ].join(', ')}`
  );
  ok(
    '  → la coche du bloc fini s’y dessine',
    named(interlude, /^checkDraw$/).some(
      (m) => m.scene?.startsWith('next-') && m.check === 'drawn'
    ),
    show(interlude)
  );

  await press(p, 'Un kilo de plus');
  const plus = await moved(p);
  ok(
    '« + » fait sauter la charge',
    named(plus, /^valueJump/).some((m) => m.jump === 'stepper'),
    show(plus)
  );
  const jump = named(plus, /^valueJump/).find((m) => m.jump === 'stepper');
  ok(
    '  → à 128 %, en 280 ms',
    jump?.peak === 1.28 && jump?.duration === 280,
    `${jump?.peak ?? '?'} · ${jump?.duration ?? '?'} ms`
  );
  await press(p, 'Un kilo de plus');
  const again = await moved(p);
  ok(
    '  → et la refait sauter au pas suivant',
    named(again, /^valueJump/).some((m) => m.jump === 'stepper'),
    show(again)
  );
  await p
    .locator(LOAD)
    .fill('30', { timeout: 2000 })
    .catch(() => {});
  await p.keyboard.press('Tab');
  const typed = await moved(p);
  ok(
    '  → pas à la frappe : le nombre ne saute pas sous les doigts',
    named(typed, /^valueJump/).length === 0 &&
      (await p
        .locator(LOAD)
        .inputValue({ timeout: 1000 })
        .catch(() => '')) === '30',
    show(typed)
  );
  await p
    .locator(LOAD)
    .fill('', { timeout: 2000 })
    .catch(() => {});
  await p.keyboard.press('Tab');
  await moved(p);
  await press(p, 'Un kilo de moins');
  const stop = await moved(p);
  ok(
    '  → ni contre une butée : « − » sans charge ne change rien, et rien ne saute',
    named(stop, /^valueJump/).length === 0,
    show(stop)
  );

  await press(p, 'Série faite');
  const checked = await moved(p);
  ok(
    'cocher la série dessine sa coche dans la liste',
    named(checked, /^checkDraw$/).some((m) => m.row && m.check === 'drawn'),
    show(checked)
  );
  const drawn = named(checked, /^checkDraw$/).find(
    (m) => m.row && m.check === 'drawn'
  );
  ok('  → en 300 ms', drawn?.duration === 300, `${drawn?.duration ?? '?'} ms`);
  ok(
    '  → sans faire entrer de scène : on est toujours dans le bloc',
    named(checked, /^sceneEnter/).length === 0,
    show(checked)
  );
  await skipRest(p);

  await leaveSession(p).catch(() => {});
  await start(p, 'sess2');
  const marks = await p
    .locator('[data-list-side] [data-check]')
    .evaluateAll((all) => all.map((e) => e.dataset.check))
    .catch(() => []);
  ok(
    'la séance reprise : la série faite est tracée, sans se redessiner',
    marks.length === 1 && marks[0] === 'still',
    marks.join(' ') || '(aucune coche)'
  );

  // La série cochée avant la reprise, rouverte, défaite, refaite : vue à
  // faire, puis faite — sa coche se dessine.
  await record(p);
  await p
    .getByRole('button', { name: /^Rouvrir / })
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  await press(p, 'Refaire');
  await settle(p);
  await press(p, 'Série faite');
  const redone = await moved(p);
  ok(
    '  → défaite puis refaite, elle se dessine de nouveau',
    named(redone, /^checkDraw$/).some((m) => m.row && m.check === 'drawn'),
    show(redone)
  );
  await ctx.close();
}

{
  console.log('\n── l’AMRAP');
  await reset();
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess1');
  await passBlock(p);
  await passBlock(p);
  await launchClock(p);
  await record(p);
  await p
    .getByRole('button', { name: /^Ajouter un tour/ })
    .click({ timeout: 2000 })
    .catch(() => {});
  const round = await moved(p);
  ok(
    'un tour bouclé fait sauter le compte',
    named(round, /^valueJump/).some((m) => m.jump === 'rounds'),
    show(round)
  );
  await ctx.close();
}

// ── L'anneau de l'accueil ───────────────────────────────────────────────
const { history: BASE_HISTORY } = await (
  await fetch(`${API}/api/client/history`)
).json();
const { program: PROGRAM } = await (
  await fetch(`${API}/api/client/program`)
).json();
/** Une séance faite le `date` novembre 2026 à 9 h. */
const did = (sessionId, date) => ({
  ...(BASE_HISTORY.find((c) => c.originalSessionId === sessionId) ??
    BASE_HISTORY[0]),
  _id: `did-${sessionId}-${date}`,
  originalSessionId: sessionId,
  completedAt: new Date(2026, 10, date, 9).toISOString(),
});
// Le décor conseille le lundi, le jeudi et le samedi : trois séances. Le
// jeudi 12 novembre, une séance faite lundi, puis une seconde mardi.
const ONE = [did('sess1', 9), ...BASE_HISTORY];
const TWO = [did('sess2', 10), ...ONE];

/**
 * Un contexte où l'historique est celui qu'on lui donne, le jeudi 12
 * novembre 2026. `serve.history` se change en cours de route : c'est la
 * semaine qui avance entre deux visites.
 */
const homeContext = async (options = {}) => {
  const ctx = await browser.newContext({ ...MOBILE, ...options });
  await markWelcomed(ctx);
  const serve = { history: ONE };
  await ctx.route(/\/api\/client\/history(\?|$)/, (r) =>
    r.fulfill({ json: { history: serve.history } })
  );
  await ctx.route(/\/api\/client\/program(\?|$)/, (r) =>
    r.fulfill({ json: { program: PROGRAM, coaches: COACHES } })
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
/**
 * Ouvrir l'accueil depuis Progrès, page rechargée : rien en cache, et
 * l'enregistreur posé avant que l'anneau n'existe.
 */
const visitHome = async (p) => {
  await p.goto(`${BASE}/client/history`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  await record(p);
  await p
    .getByRole('link', { name: 'Aujourd’hui' })
    .or(p.getByRole('link', { name: "Aujourd'hui" }))
    .first()
    .click({ timeout: 3000 })
    .catch(() => {});
  await p
    .locator('[data-week-ring]')
    .waitFor({ timeout: 5000 })
    .catch(() => {});
  const all = await moved(p);
  return {
    ring: all.filter((m) => m.ring === 'home'),
    label: await p
      .locator('[data-week-ring]')
      .getAttribute('aria-label', { timeout: 1000 })
      .catch(() => null),
  };
};
const ringLine = (visit) => `${visit.label} · ${show(visit.ring)}`;
/** Une courbe qui décélère : elle part plus vite qu'elle n'arrive. */
const decelerates = (easing) => {
  if (easing === 'ease-out' || easing === 'ease') return true;
  const [x1, y1, x2, y2] = (
    /cubic-bezier\(([^)]+)\)/.exec(easing ?? '')?.[1] ?? ''
  )
    .split(',')
    .map(Number);
  return y1 > x1 && y2 >= x2;
};

{
  console.log('\n── l’échelle bouclée');
  // Celle de la maquette : deux mouvements, sept paliers, douze minutes —
  // composée sur l'échelle à deux du décor, comme `verify_ladder`.
  const base = PROGRAM.sessions.find((s) => s._id === 'sess6');
  const bounded = {
    ...base,
    _id: 'sess-ladder',
    order: 9,
    blocks: [
      {
        ...base.blocks[0],
        repsScheme: [2, 4, 6, 8, 6, 4, 2],
        durationMinutes: 12,
      },
    ],
  };
  await reset();
  const ctx = await browser.newContext(MOBILE);
  await ctx.route(/\/api\/client\/program(\?|$)/, (r) =>
    r.fulfill({
      json: {
        program: { ...PROGRAM, sessions: [...PROGRAM.sessions, bounded] },
        coaches: COACHES,
      },
    })
  );
  const p = await signIn(ctx);
  await start(p, 'sess-ladder');
  await launchClock(p);
  for (let i = 0; i < 6; i++) {
    await press(p, 'Palier fait');
    await settle(p);
    await skipRest(p);
  }
  await record(p);
  await press(p, 'Palier fait');
  const closed = await moved(p);
  ok(
    '« Échelle bouclée » dessine sa coche',
    named(closed, /^checkDraw$/).some(
      (m) => m.dialog === 'Échelle bouclée' && m.check === 'drawn'
    ),
    show(closed)
  );
  await ctx.close();
}

{
  console.log('\n── l’anneau de l’accueil');
  const { ctx, p, serve } = await homeContext();
  const first = await visitHome(p);
  ok(
    'la première visite : l’anneau est à sa place, sans se remplir',
    first.label === '1 séance sur 3' && first.ring.length === 0,
    ringLine(first)
  );
  serve.history = TWO;
  const changed = await visitHome(p);
  ok(
    'une séance de plus depuis la dernière visite : l’anneau part d’un tiers et monte aux deux',
    changed.label === '2 séances sur 3' &&
      changed.ring.some(
        (m) => m.name === 'ringFill' && m.from === 0.33 && m.to === 0.67
      ),
    ringLine(changed)
  );
  const same = await visitHome(p);
  const fill = changed.ring.find((m) => m.name === 'ringFill');
  ok(
    '  → en 1,1 s, en décélérant',
    fill?.duration === 1100 && decelerates(fill?.easing),
    `${fill?.duration ?? '?'} ms · ${fill?.easing ?? '?'}`
  );
  ok(
    '  → la visite suivante, rien n’a changé : il ne bouge plus',
    same.label === '2 séances sur 3' && same.ring.length === 0,
    ringLine(same)
  );
  await ctx.close();
}

{
  console.log('\n── l’écran de fin a déjà montré l’anneau');
  await reset();
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
  await p
    .locator('[data-week-ring]')
    .waitFor({ timeout: 5000 })
    .catch(() => {});
  // Le serveur d'essai garde les séances envoyées d'une suite à l'autre,
  // quand on la relance seule : le compte de départ se lit.
  const before = await p
    .locator('[data-week-ring]')
    .getAttribute('aria-label', { timeout: 1000 })
    .catch(() => null);
  const count = Number(/^(\d+)/.exec(before ?? '')?.[1] ?? NaN);
  // Relancée seule, la suite peut trouver le jour déjà fait : il n'a alors
  // rien à gagner, et sa coche ne se redessine pas.
  const todayDone =
    (await p
      .locator('[data-day][data-today]')
      .first()
      .getAttribute('data-day', { timeout: 1000 })
      .catch(() => null)) === 'done';
  await start(p, 'sess3');
  for (let i = 0; i < 4; i++) {
    const done = p.getByRole('button', {
      name: /^(Fait|Série faite|Palier fait)$/,
    });
    if (!(await done.count())) break;
    await done.click();
    await settle(p);
    await skipRest(p);
  }
  await press(p, 'Terminer');
  await settle(p);
  await press(p, 'Continuer');
  await settle(p);
  await p
    .getByRole('radio', { name: /Juste/ })
    .click({ timeout: 2000 })
    .catch(() => {});
  await record(p);
  await press(p, 'Envoyer à Julie');
  await p
    .locator('[data-week-ring="end"]')
    .waitFor({ timeout: 5000 })
    .catch(() => {});
  const sent = await moved(p);
  const end = sent.filter((m) => m.ring === 'end');
  const third = (n) => Math.round((n / 3) * 100) / 100;
  ok(
    '« Ta semaine » remplit son anneau de la séance qu’on vient de faire',
    end.some(
      (m) =>
        m.name === 'ringFill' &&
        m.from === third(count) &&
        m.to === third(count + 1)
    ),
    `${before} · ${show(end)}`
  );
  const days = named(sent, /^checkDraw$/).filter(
    (m) => m.day && m.check === 'drawn'
  );
  ok(
    '  → et la coche du jour se dessine',
    days.length === (todayDone ? 0 : 1),
    `${todayDone ? 'jour déjà fait' : 'jour gagné'} · ${show(days)}`
  );
  await p
    .locator('[role="dialog"][aria-label="Ta semaine"]')
    .getByRole('button', { name: 'Terminer', exact: true })
    .click({ timeout: 2000 })
    .catch(() => {});
  const home = p.locator('[data-week-ring]:not([data-week-ring="end"])');
  await home.waitFor({ timeout: 5000 }).catch(() => {});
  const after = (await moved(p)).filter((m) => m.ring === 'home');
  const label = await home
    .getAttribute('aria-label', { timeout: 1000 })
    .catch(() => null);
  ok(
    '  → et l’accueil, derrière, ne le remplit pas une seconde fois',
    label === `${count + 1} séance${count + 1 > 1 ? 's' : ''} sur 3` &&
      after.length === 0,
    `${label} · ${show(after)}`
  );
  await ctx.close();
}

{
  console.log('\n── réduire les animations');
  await reset();
  const ctx = await browser.newContext({ ...MOBILE, reducedMotion: 'reduce' });
  const p = await signIn(ctx);
  await toRenfo(p);
  await pastInterlude(p);
  await press(p, 'Un kilo de plus');
  await settle(p);
  await press(p, 'Série faite');
  const session = named(await moved(p), /^(sceneEnter|valueJump|checkDraw)/);
  ok(
    'rien n’entre, ne saute ni ne se dessine : la scène, la charge, la coche',
    session.length === 0,
    show(session)
  );
  await ctx.close();

  const home = await homeContext({ reducedMotion: 'reduce' });
  await visitHome(home.p);
  home.serve.history = TWO;
  const changed = await visitHome(home.p);
  ok(
    '  → et l’anneau qui a changé est à sa nouvelle place, sans se remplir',
    changed.label === '2 séances sur 3' && changed.ring.length === 0,
    ringLine(changed)
  );
  await home.ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
