/**
 * L'échelle : les paliers en haut, la dose en grand, les mouvements dessous,
 * et un chrono quand le coach a fixé une limite.
 *
 * Retour du terrain, à l'origine de ce qui précédait : « le Pyramide ne
 * fonctionne pas comme espéré, il marche que pour 1 exo et pas plusieurs » —
 * le format s'appelait encore ainsi. Elle déroulait tout le premier
 * mouvement, puis tout le second ; corrigée, elle restait une liste où un
 * palier à deux mouvements demandait deux « Palier fait ». « Palier fait »
 * coche maintenant le palier entier : c'est ce qu'il est, une dose pour
 * tous les mouvements.
 *
 * Avec une limite, le chrono descend depuis elle, et la fin demande le
 * palier atteint et le temps, que le coach lira « palier 5 sur 7 en
 * 12:00 ». C'est ce qui part avec le bilan qu'on vérifie en dernier, à la
 * source : la requête elle-même.
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
} from './common.mjs';

const API = 'http://localhost:3001';
const browser = await launch();
const settle = (p) => p.waitForTimeout(300);

const press = async (p, name) => {
  const button = p.getByRole('button', { name, exact: true });
  if (await button.count()) await button.first().click();
  await settle(p);
};
/** Un bouton de la feuille ouverte : les marches existent aussi derrière
 * elle, sous le voile, avec le même nom. */
const inSheet = async (p, sheet, name) => {
  const button = p
    .getByRole('dialog', { name: sheet })
    .getByRole('button', { name, exact: true });
  if (await button.count()) await button.first().click();
  await settle(p);
};
/** « PALIER 2 SUR 3 », tel que l'écran l'écrit au-dessus des marches. */
const eyebrow = (p) =>
  p
    .locator('[aria-label="Séance guidée"]')
    .innerText()
    .then(
      (t) => clean(t).match(/(PALIER \d+ SUR \d+|\d+ PALIERS SUR \d+)/i)?.[0]
    )
    .catch(() => null);
const doneOf = (p, id) =>
  p.evaluate(
    (key) =>
      JSON.parse(localStorage.getItem(`kettle-seance-${key}`) || '{}').done ??
      [],
    id
  );
const ladderOf = (p, id) =>
  p.evaluate(
    (key) =>
      JSON.parse(localStorage.getItem(`kettle-seance-${key}`) || '{}').ladder ??
      {},
    id
  );
const chip = (p) =>
  p
    .locator('[role="timer"]')
    .evaluateAll((all) =>
      all
        .filter((e) => e.offsetParent !== null)
        .map((e) => e.getAttribute('aria-label'))
    )
    .then((labels) => clean(labels[0] ?? ''));
const sheetText = (p, name) =>
  p
    .getByRole('dialog', { name })
    .innerText()
    .then(clean)
    .catch(() => '');

// ── Sans limite : une échelle qui se coche palier par palier ────────────
{
  console.log('\n── « Palier fait » coche le palier entier');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess6');

  ok(
    'pas de chrono sans limite : ni « Lancer », ni temps',
    (await p.getByRole('button', { name: 'Lancer', exact: true }).count()) ===
      0 && (await p.locator('[role="timer"]').count()) === 0
  );
  ok(
    'on commence au premier palier, sa dose en grand',
    (await eyebrow(p)) === 'PALIER 1 SUR 3',
    await eyebrow(p)
  );

  await press(p, 'Palier fait');
  const done = await doneOf(p, 'sess6');
  ok(
    'un seul geste coche les deux mouvements du palier',
    done.length === 2 && done.every((k) => /^1:\d:1$/.test(k)),
    JSON.stringify(done)
  );
  ok(
    '  → et le repos prescrit suit la fin du palier',
    (await p.getByRole('button', { name: 'Passer', exact: true }).count()) === 1
  );
  await press(p, 'Passer');
  ok(
    '  → puis la marche suivante s’allume',
    (await eyebrow(p)) === 'PALIER 2 SUR 3',
    await eyebrow(p)
  );

  await press(p, 'Palier 3 — 15 reps, à faire');
  ok(
    'toucher une marche y va : tout ce qui est dessous est fait',
    (await eyebrow(p)) === 'PALIER 3 SUR 3' &&
      (await doneOf(p, 'sess6')).length === 4,
    `${await eyebrow(p)} · ${(await doneOf(p, 'sess6')).length} séries`
  );
  await press(p, 'Palier précédent');
  ok(
    '« Palier précédent » redescend d’une marche',
    (await eyebrow(p)) === 'PALIER 2 SUR 3' &&
      (await doneOf(p, 'sess6')).length === 2,
    `${await eyebrow(p)} · ${(await doneOf(p, 'sess6')).length} séries`
  );

  await press(p, 'Palier 3 — 15 reps, à faire');
  await press(p, 'Palier fait');
  ok(
    'au dernier bloc, le dernier palier laisse « Terminer » : finir reste un geste',
    (await p.getByRole('button', { name: 'Terminer', exact: true }).count()) ===
      1,
    await eyebrow(p)
  );
  await ctx.close();
}

// ── Avec une limite ──────────────────────────────────────────────────────
//
// Le décor n'a pas d'échelle bornée : on compose celle du document — sept
// paliers, douze minutes — à partir de l'échelle à deux mouvements.
const { program } = await (await fetch(`${API}/api/client/program`)).json();
const base = program.sessions.find((s) => s._id === 'sess6');
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
const boundedContext = async () => {
  const ctx = await browser.newContext(MOBILE);
  await ctx.route(/\/api\/client\/program(\?|$)/, (r) =>
    r.fulfill({
      json: {
        program: { ...program, sessions: [...program.sessions, bounded] },
      },
    })
  );
  return ctx;
};
const freeze = async (p) => {
  const now = await p.evaluate(() => Date.now());
  await p.clock.pauseAt(now + 300);
};
/** Un palier, puis le repos qui le suit passé. */
const climb = async (p) => {
  await press(p, 'Palier fait');
  await press(p, 'Passer');
};

{
  console.log('\n── la limite tombe : le palier atteint et le temps');
  const ctx = await boundedContext();
  let sent;
  ctx.on('request', (r) => {
    if (r.method() === 'POST' && /\/complete$/.test(new URL(r.url()).pathname))
      sent = r.postDataJSON();
  });
  const p = await signIn(ctx);
  await p.clock.install();
  await start(p, 'sess-ladder');
  await freeze(p);
  ok(
    "premier bloc : le décompte de l'ouverture a lancé le chrono",
    (await chip(p)) === 'Temps restant — 12:00' &&
      (await p.getByRole('button', { name: 'Palier fait' }).count()) === 1,
    await chip(p)
  );
  // Si l'ouverture ne l'a pas lancé, on le lance : la suite juge le reste
  // de l'échelle, pas une seconde fois ce départ.
  await launchClock(p);
  for (let i = 0; i < 4; i++) await climb(p);
  await p.clock.runFor(258_000);
  await settle(p);
  ok(
    'le chrono descend depuis la limite',
    (await chip(p)) === 'Temps restant — 07:42',
    await chip(p)
  );

  await p.clock.runFor(463_000);
  await settle(p);
  const said = await sheetText(p, 'Temps écoulé');
  ok(
    'à zéro, « Temps écoulé » présélectionne le palier en cours',
    /Palier 5 sur 7 · en cours/.test(said) && /12:00/.test(said),
    said.replace(/\n+/g, ' | ').slice(0, 160)
  );
  await inSheet(p, 'Temps écoulé', 'Palier 4 — 8 reps, fait');
  await inSheet(p, 'Temps écoulé', 'Quinze secondes de moins');
  const corrected = await sheetText(p, 'Temps écoulé');
  ok(
    '  → le palier et le temps se corrigent',
    /Palier 4 sur 7 · en cours/.test(corrected) && /11:45/.test(corrected),
    corrected.replace(/\n+/g, ' | ').slice(0, 160)
  );
  await inSheet(p, 'Temps écoulé', 'Valider');
  ok(
    '  → « Valider » retient trois paliers faits et 705 secondes',
    JSON.stringify((await ladderOf(p, 'sess-ladder'))['1']) ===
      '{"rungs":3,"seconds":705}',
    JSON.stringify(await ladderOf(p, 'sess-ladder'))
  );

  // La séance n'avait que ce bloc : on va jusqu'au bilan.
  await p.clock.runFor(2_000);
  await p.waitForTimeout(900);
  await p
    .getByRole('button', { name: /Passer au ressenti/ })
    .click()
    .catch(() => {});
  await p.clock.runFor(1_000);
  await p.waitForTimeout(700);
  await p
    .locator('[role="radiogroup"] [role="radio"]')
    .nth(2)
    .click()
    .catch(() => {});
  await press(p, 'Valider');
  await p.clock.runFor(2_000);
  await p.waitForTimeout(900);
  ok(
    'le bilan envoie le résultat de l’échelle',
    JSON.stringify(sent?.ladderDone) ===
      '[{"blockOrder":1,"rungs":3,"seconds":705}]',
    JSON.stringify(sent?.ladderDone ?? null)
  );
  await ctx.close();
}

{
  console.log("\n── « J'arrête là », puis l'échelle bouclée");
  const ctx = await boundedContext();
  const p = await signIn(ctx);
  await p.clock.install();
  await start(p, 'sess-ladder');
  await freeze(p);
  await launchClock(p);
  await climb(p);
  await p.clock.runFor(95_000);
  await settle(p);
  await press(p, 'J’arrête là');
  const stopped = await sheetText(p, 'Fin de l’échelle');
  ok(
    "« J'arrête là » arrête le chrono et demande où l'on en est",
    /Palier 2 sur 7 · en cours/.test(stopped) && /01:35/.test(stopped),
    stopped.replace(/\n+/g, ' | ').slice(0, 160)
  );
  await ctx.close();

  const ctx2 = await boundedContext();
  const q = await signIn(ctx2);
  await q.clock.install();
  await start(q, 'sess-ladder');
  await freeze(q);
  await launchClock(q);
  for (let i = 0; i < 7; i++) {
    await q.clock.runFor(60_000);
    await climb(q);
  }
  const loop = await sheetText(q, 'Échelle bouclée');
  ok(
    'le dernier palier fait avant la limite : « Échelle bouclée »',
    /7 paliers sur 7/.test(loop),
    loop.replace(/\n+/g, ' | ').slice(0, 160)
  );
  ok(
    '  → avec son temps, et son avance sur la limite',
    /07:00\s*au chrono/.test(loop) &&
      /5:00\s*d’avance sur la limite/.test(loop),
    loop.replace(/\n+/g, ' | ').slice(0, 160)
  );
  await inSheet(q, 'Échelle bouclée', 'Continuer');
  ok(
    '  → « Continuer » retient sept paliers en 420 secondes',
    JSON.stringify((await ladderOf(q, 'sess-ladder'))['1']) ===
      '{"rungs":7,"seconds":420}',
    JSON.stringify(await ladderOf(q, 'sess-ladder'))
  );
  await ctx2.close();
}

{
  console.log(
    '\n── une échelle bornée qui n’est pas le premier bloc attend « Lancer »'
  );
  const ctx = await browser.newContext(MOBILE);
  const warm = program.sessions.find((s) => s._id === 'sess1').blocks[0];
  const second = {
    ...bounded,
    _id: 'sess-ladder-2',
    blocks: [
      { ...warm, order: 1 },
      { ...bounded.blocks[0], order: 2 },
    ],
  };
  await ctx.route(/\/api\/client\/program(\?|$)/, (r) =>
    r.fulfill({
      json: {
        program: { ...program, sessions: [...program.sessions, second] },
      },
    })
  );
  const p = await signIn(ctx);
  await start(p, 'sess-ladder-2');
  await press(p, 'Mettre la séance en pause');
  await press(p, 'Passer ce bloc');
  ok(
    'le chrono attend : « Lancer », et pas encore « Palier fait »',
    (await p.getByRole('button', { name: 'Lancer', exact: true }).count()) ===
      1 && (await p.getByRole('button', { name: 'Palier fait' }).count()) === 0,
    await chip(p)
  );
  await launchClock(p);
  ok(
    '  → une fois lancé, « Palier fait » et « J’arrête là »',
    (await p.getByRole('button', { name: 'Palier fait' }).count()) === 1 &&
      (await p.getByRole('button', { name: 'J’arrête là' }).count()) === 1
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
