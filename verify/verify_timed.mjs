/**
 * Les blocs menés par l'horloge : EMOM, Tabata, On-Off.
 *
 * Chaque tour avait son propre décompte, qui partait de zéro à son montage.
 * Un téléphone verrouillé pendant un EMOM — on le pose pour soulever —
 * retrouvait le tour où il l'avait laissé, avec sa minute pleine, alors que
 * le client en était trois plus loin. Le bloc n'a plus qu'une horloge, dont
 * on déduit le tour : c'est ce que cette suite vérifie d'abord, en sautant
 * le temps sans laisser battre la page, comme le fait un onglet en
 * arrière-plan.
 *
 * Puis ce que l'écran fait de cette horloge : les trois dernières secondes
 * qui se voient, le tour qu'on recale d'un balayage ou d'une flèche,
 * l'écran qu'on touche pour mettre en pause, et le fond d'un Tabata qui
 * change avec la phase.
 */
import {
  launch,
  MOBILE,
  ok,
  failureCount,
  signIn,
  start,
  where,
  guidedScreen,
  launchClock,
  passBlock,
  timerLabel,
} from './common.mjs';

const browser = await launch();
const settle = (p) => p.waitForTimeout(300);

/** La séance 1, à l'EMOM qui attend « Lancer », horloge de la page figée. */
const emom = async (ctx) => {
  const p = await signIn(ctx);
  await p.clock.install();
  await start(p, 'sess1');
  await passBlock(p);
  return p;
};

/** Fige le temps de la page : il ne s'écoule plus que sur ordre. */
const freeze = async (p) => {
  const now = await p.evaluate(() => Date.now());
  await p.clock.pauseAt(now + 300);
};

/** Un balayage du doigt sur l'anneau, de `dx` pixels. */
const swipe = async (p, dx) => {
  const box = await p.locator('[role="timer"]').first().boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await p.mouse.move(x, y);
  await p.mouse.down();
  await p.mouse.move(x + dx, y, { steps: 6 });
  await p.mouse.up();
  await settle(p);
};

const pauseOpen = (p) =>
  p.locator('[role="dialog"][aria-label="Pause"]').count();

// ── L'état réel, après un temps sans battre ─────────────────────────────
{
  console.log('\n── un téléphone verrouillé retrouve le bon tour');
  const ctx = await browser.newContext(MOBILE);
  const p = await emom(ctx);
  await freeze(p);
  await launchClock(p);
  // Trois minutes et dix-huit secondes d'un coup : les minuteurs de la page
  // ne tournent qu'une fois, comme ceux d'un onglet en arrière-plan.
  await p.clock.fastForward(198_000);
  await settle(p);
  ok(
    "l'horloge dit le tour 4, quarante-deux secondes restantes",
    (await timerLabel(p)) === 'Tour 4 sur 10 — 42 secondes restantes',
    await timerLabel(p)
  );
  ok(
    '  → et la séance est passée au tour 4 avec elle',
    /tour 4 sur 10/.test(await where(p)),
    await where(p)
  );
  await ctx.close();
}

// ── Les trois dernières secondes ────────────────────────────────────────
{
  console.log('\n── les trois dernières secondes se voient');
  const ctx = await browser.newContext(MOBILE);
  const p = await emom(ctx);
  await freeze(p);
  await launchClock(p);
  await p.clock.runFor(50_000);
  await settle(p);
  const calm = await guidedScreen(p);
  ok(
    'à dix secondes, l’anneau dit le tour et le pied le bloc suivant',
    /Tour 1 sur 10/.test(calm) && /Ensuite · AMRAP 12 · 12 min/.test(calm),
    calm.replace(/\n+/g, ' | ').slice(0, 160)
  );
  await p.clock.runFor(7_000);
  await settle(p);
  const hot = await guidedScreen(p);
  ok(
    'à trois secondes, il annonce le tour qui vient',
    /Tour 2 dans 3 secondes/.test(hot),
    hot.match(/[^\n]*dans[^\n]*/)?.[0] ?? '(rien)'
  );
  ok(
    '  → et le pied, ce qu’on va entendre',
    /Trois bips, puis un long/.test(hot),
    hot.split('\n').at(-1)
  );
  const color = await p.evaluate(() => {
    const timer = document.querySelector('[role="timer"]');
    const face = [...timer.querySelectorAll('*')].find(
      (e) => /^\d+:\d\d$/.test(e.textContent.trim()) && !e.children.length
    );
    return getComputedStyle(face).color;
  });
  ok('  → le chiffre passe au corail', color === 'rgb(236, 128, 121)', color);
  await ctx.close();
}

// ── Se recaler d'un tour ────────────────────────────────────────────────
{
  console.log('\n── un balayage, une flèche ou le clavier recalent le tour');
  const ctx = await browser.newContext(MOBILE);
  const p = await emom(ctx);
  await freeze(p);
  await launchClock(p);
  await p.clock.runFor(20_000);
  await settle(p);

  await swipe(p, -160);
  ok(
    'balayer vers la gauche part au début du tour suivant',
    (await timerLabel(p)) === 'Tour 2 sur 10 — 60 secondes restantes',
    await timerLabel(p)
  );
  ok('  → sans ouvrir la pause', (await pauseOpen(p)) === 0);
  await p.clock.runFor(10_000);
  await settle(p);
  ok(
    "  → et l'horloge repart de là",
    (await timerLabel(p)) === 'Tour 2 sur 10 — 50 secondes restantes',
    await timerLabel(p)
  );

  await swipe(p, 160);
  ok(
    'balayer vers la droite revient au tour précédent',
    (await timerLabel(p)) === 'Tour 1 sur 10 — 60 secondes restantes',
    await timerLabel(p)
  );

  await p.getByRole('button', { name: 'Tour suivant', exact: true }).click();
  await settle(p);
  ok(
    'la flèche « Tour suivant » fait de même, pour qui ne balaie pas',
    /^Tour 2 sur 10 — /.test((await timerLabel(p)) ?? ''),
    await timerLabel(p)
  );
  await p.keyboard.press('ArrowRight');
  await settle(p);
  ok(
    '  → et la flèche du clavier aussi',
    /^Tour 3 sur 10 — /.test((await timerLabel(p)) ?? '') &&
      /tour 3 sur 10/.test(await where(p)),
    await timerLabel(p)
  );
  await ctx.close();
}

// ── Toucher l'écran met en pause ────────────────────────────────────────
{
  console.log("\n── l'écran entier met en pause, une fois l'horloge lancée");
  const ctx = await browser.newContext(MOBILE);
  const p = await emom(ctx);
  await p.locator('[role="timer"]').first().click();
  await settle(p);
  ok(
    "avant « Lancer », toucher l'anneau n'ouvre rien",
    (await pauseOpen(p)) === 0
  );
  // Ouverte à tort, la feuille cacherait « Lancer » : on la referme pour que
  // la suite juge le reste.
  if (await pauseOpen(p)) {
    await p.keyboard.press('Escape');
    await settle(p);
  }
  await launchClock(p);
  await p.locator('[role="timer"]').first().click();
  await settle(p);
  ok(
    'horloge lancée, le même toucher ouvre la pause',
    (await pauseOpen(p)) === 1
  );
  await ctx.close();
}

// ── Le fond d'un Tabata suit la phase ───────────────────────────────────
{
  console.log(
    "\n── le Tabata : l'effort en ambre sombre, le repos en sarcelle"
  );
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.clock.install();
  await start(p, 'sess2');
  await freeze(p);
  await p.clock.runFor(6_000);
  await p.waitForTimeout(800);
  const phase = () =>
    p.evaluate(() => {
      const layer = document.querySelector('[data-phase]');
      return layer
        ? `${layer.dataset.phase} ${getComputedStyle(layer).backgroundColor}`
        : null;
    });
  ok(
    "pendant l'effort, le fond est ambre sombre",
    (await phase()) === 'work rgb(59, 42, 18)',
    await phase()
  );
  await p.clock.runFor(17_000);
  await p.waitForTimeout(800);
  ok(
    'pendant le repos, il passe au sarcelle',
    (await phase()) === 'rest rgb(18, 50, 47)',
    await phase()
  );
  const screen = await guidedScreen(p);
  ok(
    '  → « Souffle », et ce qui vient ensuite',
    /Souffle/.test(screen) && /Ensuite · Pompes, tour 2 sur 8/.test(screen),
    screen.replace(/\n+/g, ' | ').slice(0, 140)
  );
  await ctx.close();
}

// ── La fin du bloc, et ce qui ne doit pas s'y perdre ────────────────────
{
  console.log('\n── dix minutes plus tard, le bloc suivant');
  const ctx = await browser.newContext(MOBILE);
  const p = await emom(ctx);
  await freeze(p);
  await launchClock(p);
  await p
    .getByRole('button', { name: 'Voir la consigne — Kettlebell Swing' })
    .click();
  await settle(p);
  await p.clock.runFor(61_000);
  await settle(p);
  ok(
    'une consigne ouverte reste ouverte quand le tour change',
    /tour 2 sur 10/.test(await where(p)) &&
      (await p.getByRole('button', { name: 'Revenir à la séance' }).count()) >
        0,
    await where(p)
  );
  await p.clock.runFor(9 * 60_000);
  await settle(p);
  ok(
    'le dernier tour tombé, la séance passe au bloc suivant',
    /— AMRAP$/.test(await where(p)),
    await where(p)
  );
  await ctx.close();
}

// ── Revenir en arrière, tant que l'horloge attend ───────────────────────
{
  console.log("\n── « Bloc précédent », tant que rien n'est lancé");
  const ctx = await browser.newContext(MOBILE);
  const p = await emom(ctx);
  const back = p.getByRole('button', { name: 'Bloc précédent', exact: true });
  ok('un bloc qui attend propose de revenir', (await back.count()) === 1);
  if (await back.count()) await back.click();
  await settle(p);
  ok(
    '  → et ramène au bloc d’avant',
    /— Échauffement$/.test(await where(p)),
    await where(p)
  );
  await ctx.close();
}

// ── Un EMOM sans limite ─────────────────────────────────────────────────
//
// Le coach peut vider le nombre de tours : l'éditeur affiche alors « sans
// limite ». Le mode guidé en faisait une liste à cocher, sans horloge. Le
// décor n'a pas de séance de cette forme : on la compose.
{
  console.log("\n── un EMOM sans limite tourne jusqu'à ce qu'on l'arrête");
  const { program } = await (
    await fetch('http://localhost:3001/api/client/program')
  ).json();
  const base = program.sessions.find((s) => s._id === 'sess1');
  const emomBlock = base.blocks.find((b) => b.type === 'emom');
  const amrapBlock = base.blocks.find((b) => b.type === 'amrap');
  const open = {
    ...base,
    _id: 'sess-open',
    order: 9,
    name: 'Jusqu’à ce que ça casse',
    blocks: [
      { ...emomBlock, order: 1, rounds: undefined },
      { ...amrapBlock, order: 2 },
    ],
  };
  const ctx = await browser.newContext(MOBILE);
  await ctx.route(/\/api\/client\/program(\?|$)/, (r) =>
    r.fulfill({
      json: { program: { ...program, sessions: [...program.sessions, open] } },
    })
  );
  const p = await signIn(ctx);
  await p.clock.install();
  await start(p, 'sess-open');
  await freeze(p);
  ok(
    'il tourne, et ne dit pas « sur »',
    /^Tour 1 — \d+ secondes restantes$/.test((await timerLabel(p)) ?? ''),
    await timerLabel(p)
  );
  const track = await p.evaluate(
    () => document.querySelector('[data-round-track]')?.dataset.roundTrack
  );
  ok(
    '  → sans points ni barre : il n’y a pas de fin à dessiner',
    track === 'open',
    track
  );
  await p.clock.fastForward(25 * 60_000 + 18_000);
  await settle(p);
  ok(
    'vingt-cinq minutes plus tard, le tour 26',
    (await timerLabel(p)) === 'Tour 26 — 42 secondes restantes',
    await timerLabel(p)
  );
  ok(
    '  → et la séance le sait',
    /^Bloc 1 sur 2 · tour 26 — EMOM$/.test(await where(p)),
    await where(p)
  );
  await p
    .getByRole('button', { name: 'Mettre la séance en pause', exact: true })
    .click();
  await settle(p);
  const end = p.getByRole('button', { name: 'Terminer le bloc', exact: true });
  ok("la pause propose d'y mettre fin", (await end.count()) === 1);
  if (await end.count()) await end.click();
  await settle(p);
  ok(
    '  → et on passe au bloc suivant',
    /— AMRAP$/.test(await where(p)),
    await where(p)
  );
  await ctx.close();
}

// ── Ailleurs, la pause ne propose pas de terminer le bloc ───────────────
{
  console.log('\n── un bloc à tours comptés se termine de lui-même');
  const ctx = await browser.newContext(MOBILE);
  const p = await emom(ctx);
  await p
    .getByRole('button', { name: 'Mettre la séance en pause', exact: true })
    .click();
  await settle(p);
  ok(
    '« Terminer le bloc » n’apparaît que sans limite',
    (await p
      .getByRole('button', { name: 'Terminer le bloc', exact: true })
      .count()) === 0
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
