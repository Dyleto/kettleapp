/**
 * L'AMRAP : autant de tours que possible dans le temps donné.
 *
 * L'écran d'effort portait les champs « reps / kg » de chaque mouvement et
 * un minuteur par ligne — l'un d'eux affichait « rest 45 s », un libellé
 * que le renommage des identifiants avait réécrit en anglais sans que
 * personne ne le voie. Il ne porte plus qu'un geste : taper le rond à
 * chaque tour bouclé. Le temps passe dans une puce, l'objectif du coach se
 * lit dans les repères, et à zéro une feuille demande le score, prérempli
 * de ce qui a été tapé.
 */
import {
  launch,
  MOBILE,
  ok,
  failureCount,
  signIn,
  start,
  where,
  clean,
  launchClock,
  passBlock,
  API,
  COACHES,
  settle,
} from './common.mjs';

const browser = await launch();

const pad = (p) => p.getByRole('button', { name: /^Ajouter un tour/ });
const padName = async (p) =>
  clean(await pad(p).getAttribute('aria-label', { timeout: 1000 }));
const chip = (p) =>
  p
    .locator('[role="timer"]')
    .evaluateAll((all) =>
      all
        .filter((e) => e.offsetParent !== null)
        .map((e) => e.getAttribute('aria-label'))
    )
    .then((labels) => clean(labels[0] ?? ''));
const roundsOf = (p, id) =>
  p.evaluate(
    (key) =>
      JSON.parse(localStorage.getItem(`kettle-seance-${key}`) || '{}').rounds ??
      {},
    id
  );

// ── L'AMRAP de la séance 1, dans l'ordre où on le vit ───────────────────
{
  console.log('\n── un AMRAP de douze minutes, de « Lancer » au score');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.clock.install();
  await start(p, 'sess1');
  await passBlock(p);
  await passBlock(p);
  ok('on est sur l’AMRAP', /— AMRAP$/.test(await where(p)), await where(p));

  const scene = '[aria-label="Séance guidée"]';
  const inputs = await p.locator(`${scene} input`).count();
  const text = await p.locator(scene).innerText();
  ok(
    'aucun champ à remplir pendant l’effort',
    inputs === 0,
    `${inputs} champ(s)`
  );
  ok(
    '  → et plus de « rest » en anglais',
    !/\brest\b/i.test(text),
    text.match(/[^\n]*\brest\b[^\n]*/i)?.[0] ?? ''
  );
  ok(
    'la puce montre les douze minutes, en attente',
    (await chip(p)) === 'Temps restant — 12:00',
    await chip(p)
  );
  const targets = await p.locator(`${scene} [data-target]`).count();
  ok(
    "l'objectif du coach, « viser 5-6 tours », encadre deux repères",
    targets === 2 && /l’objectif du coach est encadré/.test(text),
    `${targets} repère(s) encadré(s)`
  );

  // Forcé : le rond se dit inactif, et c'est justement ce qu'on éprouve —
  // un doigt qui le touche quand même.
  ok(
    'avant « Lancer », le rond se dit inactif',
    (await pad(p).getAttribute('aria-disabled')) === 'true'
  );
  await pad(p).click({ force: true });
  await settle(p);
  ok(
    '  → et un toucher ne compte rien',
    ((await roundsOf(p, 'sess1'))['3'] ?? 0) === 0,
    JSON.stringify(await roundsOf(p, 'sess1'))
  );

  const now = await p.evaluate(() => Date.now());
  await p.clock.pauseAt(now + 300);
  await launchClock(p);
  for (let i = 0; i < 4; i++) {
    await pad(p).click();
    await settle(p);
  }
  ok(
    'une fois lancé, chaque toucher compte un tour',
    (await roundsOf(p, 'sess1'))['3'] === 4 &&
      (await padName(p)) === 'Ajouter un tour — 4 tours bouclés',
    `${JSON.stringify(await roundsOf(p, 'sess1'))} · ${await padName(p)}`
  );

  // L'appui long : le doigt reste posé plus d'une demi-seconde.
  const box = await pad(p).boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await p.mouse.down();
  await p.clock.runFor(700);
  await p.mouse.up();
  await settle(p);
  ok(
    'un appui long retire un tour, sans en rajouter au relâchement',
    (await roundsOf(p, 'sess1'))['3'] === 3,
    JSON.stringify(await roundsOf(p, 'sess1'))
  );
  const remove = p.getByRole('button', {
    name: 'Retirer un tour',
    exact: true,
  });
  if (await remove.count()) await remove.click();
  await settle(p);
  ok(
    '  → « Retirer un tour » fait de même, pour qui ne peut pas appuyer longtemps',
    (await roundsOf(p, 'sess1'))['3'] === 2,
    JSON.stringify(await roundsOf(p, 'sess1'))
  );

  await p.clock.runFor(228_000);
  await settle(p);
  ok(
    'la puce descend avec le temps',
    (await chip(p)) === 'Temps restant — 08:12',
    await chip(p)
  );

  await p.clock.runFor(489_000);
  await settle(p);
  const color = await p
    .locator('[role="timer"]')
    .evaluateAll(
      (all) =>
        all.find((e) => e.offsetParent !== null) &&
        getComputedStyle(all.find((e) => e.offsetParent !== null)).color
    );
  ok(
    'à trois secondes, la puce passe au corail',
    color === 'rgb(236, 128, 121)',
    `${await chip(p)} · ${color}`
  );

  await p.clock.runFor(3_500);
  await settle(p);
  const sheet = p.getByRole('dialog', { name: 'Temps écoulé' });
  ok(
    'à zéro, la feuille « Temps écoulé » demande le score',
    (await sheet.count()) === 1
  );
  const said = clean(await sheet.innerText().catch(() => ''));
  ok(
    '  → préremplie de ce qui a été tapé, avec l’objectif',
    /\b2\s*tours\b/.test(said) && /l’objectif était 5 à 6/.test(said),
    said.replace(/\n+/g, ' | ').slice(0, 160)
  );
  ok(
    "  → et la séance n'a pas bougé d'elle-même",
    /— AMRAP$/.test(await where(p)),
    await where(p)
  );

  // Chaque bouton n'est pressé que s'il est là : une feuille absente fait
  // tomber les assertions, pas la suite.
  const tap = async (name) => {
    const button = p.getByRole('button', { name, exact: true });
    if (await button.count()) await button.click();
  };
  await tap('Un tour de plus');
  await tap('Un tour de plus');
  await tap('Un tour de moins');
  await settle(p);
  ok(
    'le score se corrige dans la feuille',
    (await roundsOf(p, 'sess1'))['3'] === 3,
    JSON.stringify(await roundsOf(p, 'sess1'))
  );
  await tap('Valider');
  await p.clock.runFor(2_000);
  await settle(p);
  // L'écran de fin : ses tuiles s'annoncent par leur valeur finale.
  const tiles = await p.evaluate(() =>
    [...document.querySelectorAll('[role="dialog"] [role="group"]')].map(
      (g) => g.getAttribute('aria-label') ?? ''
    )
  );
  ok(
    '« Valider » termine la séance, et la fin compte trois tours',
    tiles.map((x) => clean(x)).includes('3 tours bouclés'),
    tiles.map((x) => clean(x)).join(' · ') || '(aucune tuile)'
  );
  await ctx.close();
}

// ── Sans durée, le chrono monte ─────────────────────────────────────────
{
  console.log(
    '\n── un AMRAP sans limite : le chrono monte, on termine soi-même'
  );
  const { program } = await (await fetch(`${API}/api/client/program`)).json();
  const base = program.sessions.find((s) => s._id === 'sess1');
  const amrap = base.blocks.find((b) => b.type === 'amrap');
  const free = {
    ...base,
    _id: 'sess-free',
    order: 9,
    name: 'Sans limite',
    blocks: [
      { ...amrap, order: 1, durationMinutes: undefined, notes: undefined },
    ],
  };
  const ctx = await browser.newContext(MOBILE);
  await ctx.route(/\/api\/client\/program(\?|$)/, (r) =>
    r.fulfill({
      json: {
        program: { ...program, sessions: [...program.sessions, free] },
        coaches: COACHES,
      },
    })
  );
  const p = await signIn(ctx);
  await p.clock.install();
  await start(p, 'sess-free');
  const now = await p.evaluate(() => Date.now());
  await p.clock.pauseAt(now + 300);
  ok(
    "premier bloc : le décompte de l'ouverture l'a lancé, le chrono part de zéro",
    (await chip(p)) === 'Temps passé — 00:00',
    await chip(p)
  );
  ok(
    '  → sans objectif, aucun repère encadré',
    (await p.locator('[data-target]').count()) === 0
  );
  await p.clock.runFor(192_400);
  await settle(p);
  ok('il monte', (await chip(p)) === 'Temps passé — 03:12', await chip(p));
  const finish = p.getByRole('button', { name: 'Terminer le bloc' });
  ok('« Terminer le bloc » est là, sous le rond', (await finish.count()) === 1);
  if (await finish.count()) await finish.click();
  await settle(p);
  ok(
    '  → et demande le score',
    (await p.getByRole('dialog', { name: 'Fin du bloc' }).count()) === 1
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
