/**
 * Un chipper borné : la liste qu'on écoule, et la limite qui tombe.
 *
 * Le coach réglait une limite que l'écran ignorait : la liste se cochait
 * comme un bloc classique, sans chrono, et rien ne restait ni du temps ni
 * de l'endroit où il était écoulé. Le chrono vit maintenant autour de la
 * liste — « Lancer », la puce qui descend, la feuille « Temps écoulé » — et
 * ce qu'il donne part avec le bilan.
 *
 * Le décor n'a qu'un chipper sans limite : on compose les séances bornées à
 * partir de lui. L'horloge de la page est menée à la main.
 */
import {
  launch,
  ok,
  failureCount,
  signIn,
  start,
  MOBILE,
  clean,
  launchClock,
  API,
  COACHES,
  settle,
  skipRest,
  pastInterlude,
  guidedScreen,
} from './common.mjs';

const browser = await launch();

const press = async (p, name) => {
  const button = p.getByRole('button', { name, exact: true });
  if (await button.count()) await button.first().click();
  await settle(p);
};
/** Ce que l'appareil a gardé de la séance. */
const record = (p, id) =>
  p.evaluate(
    (key) => JSON.parse(localStorage.getItem(`kettle-seance-${key}`) || '{}'),
    id
  );
/** L'étiquette de la puce du temps visible : « Temps restant — 01:30 ». */
const chip = (p) =>
  p
    .locator('[role="timer"]')
    .evaluateAll((all) =>
      all
        .filter((e) => e.offsetParent !== null)
        .map((e) => e.getAttribute('aria-label'))
    )
    .then((labels) => clean(labels[0] ?? ''));
const sheetText = (p) =>
  p
    .getByRole('dialog', { name: 'Temps écoulé' })
    .innerText()
    .then(clean)
    .catch(() => '');
/** Le temps de la page s'arrête : il n'avance plus que sur ordre. */
const freeze = async (p) => {
  const now = await p.evaluate(() => Date.now());
  await p.clock.pauseAt(now + 300);
};

const { program } = await (await fetch(`${API}/api/client/program`)).json();
const sess3 = program.sessions.find((s) => s._id === 'sess3');
const chipper = { ...sess3.blocks[0], durationMinutes: 2 };
const warmup = program.sessions.find((s) => s._id === 'sess1').blocks[0];
/** Le chipper seul, borné à deux minutes. */
const alone = { ...sess3, _id: 'sess-cap', order: 9, blocks: [chipper] };
/** Le même, après un échauffement : il attend alors « Lancer ». */
const second = {
  ...sess3,
  _id: 'sess-cap-2',
  order: 10,
  blocks: [
    { ...warmup, order: 1 },
    { ...chipper, order: 2 },
  ],
};
const cappedContext = async () => {
  const ctx = await browser.newContext(MOBILE);
  await ctx.route(/\/api\/client\/program(\?|$)/, (r) =>
    r.fulfill({
      json: {
        program: {
          ...program,
          sessions: [...program.sessions, alone, second],
        },
        coaches: COACHES,
      },
    })
  );
  return ctx;
};

{
  console.log('\n── sans limite, un chipper se coche sans chrono');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess3');
  ok(
    'ni « Lancer », ni temps : « Fait » attend',
    (await p.getByRole('button', { name: 'Lancer', exact: true }).count()) ===
      0 &&
      (await p.locator('[role="timer"]').count()) === 0 &&
      (await p.getByRole('button', { name: 'Fait', exact: true }).count()) === 1
  );
  await ctx.close();
}

{
  console.log('\n── la limite tombe : le mouvement atteint et le temps');
  const ctx = await cappedContext();
  let sent;
  ctx.on('request', (r) => {
    if (r.method() === 'POST' && /\/complete$/.test(new URL(r.url()).pathname))
      sent = r.postDataJSON();
  });
  const p = await signIn(ctx);
  await p.clock.install();
  await start(p, 'sess-cap', { beforeGo: freeze });
  const screen = await guidedScreen(p);
  ok(
    "premier bloc : le décompte de l'ouverture a lancé le chrono",
    (await chip(p)) === 'Temps restant — 02:00' &&
      (await p.getByRole('button', { name: 'Fait', exact: true }).count()) ===
        1,
    await chip(p)
  );
  ok(
    '  → le rang se lit en mouvements, la limite à côté',
    /MOUVEMENT 1 SUR 4/i.test(screen) && /limite 2 min/.test(screen),
    screen.replace(/\n+/g, ' | ').slice(0, 120)
  );
  // Si l'ouverture ne l'a pas lancé, on le lance : la suite juge le reste.
  await launchClock(p);

  await press(p, 'Fait');
  await p.clock.runFor(30_000);
  await settle(p);
  ok(
    'le chrono descend depuis la limite',
    (await chip(p)) === 'Temps restant — 01:30',
    await chip(p)
  );

  await p.clock.runFor(91_000);
  await settle(p);
  const said = await sheetText(p);
  ok(
    'à zéro, « Temps écoulé » propose le mouvement en cours',
    /Mouvement 2 sur 4 · en cours/.test(said),
    said.replace(/\n+/g, ' | ').slice(0, 160)
  );
  await p
    .getByRole('dialog', { name: 'Temps écoulé' })
    .getByRole('radio')
    .nth(2)
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    '  → il se corrige d’une touche',
    /Mouvement 3 sur 4 · en cours/.test(await sheetText(p)),
    (await sheetText(p)).replace(/\n+/g, ' | ').slice(0, 160)
  );
  await p
    .getByRole('dialog', { name: 'Temps écoulé' })
    .getByRole('button', { name: 'Valider', exact: true })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const kept = await record(p, 'sess-cap');
  ok(
    '  → « Valider » retient deux mouvements faits et la limite',
    JSON.stringify(kept.chipper?.['1']) === '{"movements":2,"seconds":120}' &&
      ['1:1:1', '1:2:1'].every((key) => kept.done?.includes(key)),
    `${JSON.stringify(kept.chipper)} · ${JSON.stringify(kept.done)}`
  );

  // La séance n'avait que ce bloc : on va jusqu'au bilan.
  await p.clock.runFor(2_000);
  await settle(p);
  await press(p, 'Continuer');
  await p.clock.runFor(1_000);
  await settle(p);
  await p
    .locator('[role="radiogroup"] [role="radio"]')
    .nth(2)
    .click({ timeout: 2000 })
    .catch(() => {});
  await press(p, 'Envoyer à Julie');
  await p.clock.runFor(2_000);
  await settle(p);
  ok(
    'le bilan envoie le résultat du chipper',
    JSON.stringify(sent?.chipperDone) ===
      '[{"blockOrder":1,"movements":2,"seconds":120}]',
    JSON.stringify(sent?.chipperDone ?? null)
  );
  await ctx.close();
}

{
  console.log('\n── la liste écoulée avant la limite : son temps');
  const ctx = await cappedContext();
  const p = await signIn(ctx);
  await p.clock.install();
  await start(p, 'sess-cap-2', { beforeGo: freeze });
  for (let i = 0; i < 2; i++) {
    await press(p, 'Fait');
    await skipRest(p);
  }
  await pastInterlude(p);
  ok(
    'second bloc : le chrono attend « Lancer », et rien ne se coche avant',
    (await p.getByRole('button', { name: 'Lancer', exact: true }).count()) ===
      1 &&
      (await p.getByRole('button', { name: 'Fait', exact: true }).count()) ===
        0 &&
      (await chip(p)) === 'Temps restant — 02:00',
    await chip(p)
  );
  await launchClock(p);
  for (let i = 0; i < 4; i++) {
    await p.clock.runFor(10_000);
    await press(p, 'Fait');
  }
  const kept = await record(p, 'sess-cap-2');
  ok(
    'la dernière série arrête le chrono : quatre mouvements en 40 s',
    JSON.stringify(kept.chipper?.['2']) === '{"movements":4,"seconds":40}',
    JSON.stringify(kept.chipper)
  );
  const stopped = await chip(p);
  await p.clock.runFor(10_000);
  await settle(p);
  ok(
    '  → et la puce reste arrêtée sur ce temps',
    stopped === 'Temps restant — 01:20' && (await chip(p)) === stopped,
    `${stopped} → ${await chip(p)}`
  );
  await ctx.close();
}

{
  // Téléphone couché, le haut de la scène disparaît, et la puce avec lui :
  // elle passe dans la scène, à côté du nom du bloc.
  console.log('\n── à plat, la puce du temps reste à l’écran');
  const ctx = await browser.newContext({
    viewport: { width: 844, height: 390 },
    isMobile: true,
    hasTouch: true,
  });
  await ctx.route(/\/api\/client\/program(\?|$)/, (r) =>
    r.fulfill({
      json: {
        program: { ...program, sessions: [...program.sessions, alone] },
        coaches: COACHES,
      },
    })
  );
  const p = await signIn(ctx);
  await p.clock.install();
  await start(p, 'sess-cap', { beforeGo: freeze });
  const box = await p.evaluate(() => {
    const el = [...document.querySelectorAll('[role="timer"]')].find(
      (e) => e.offsetParent !== null
    );
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
  });
  ok(
    'la puce se lit dans la scène, entière',
    (await chip(p)) === 'Temps restant — 02:00' &&
      box !== null &&
      box.top >= 0 &&
      box.bottom <= 390,
    `${await chip(p)} · ${JSON.stringify(box)}`
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
