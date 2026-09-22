/**
 * Ticking a block's last exercise is moving on to the next one.
 *
 * The block used to stay there, every row ticked, waiting for a tap on
 * "Bloc suivant" that said nothing the screen did not already say. A dead end
 * between two blocks, and one more gesture in the middle of a session.
 *
 * Only when there is somewhere to go. On the last block, "Terminer" stays a
 * deliberate act: finishing a session is a decision, not the side effect of a
 * tick box.
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
  skipRest,
} from './common.mjs';

const browser = await launch();

const record = (p, sess) =>
  p.evaluate(
    (s) => JSON.parse(localStorage.getItem(`kettle-seance-${s}`) || 'null'),
    sess
  );

// ── A finished list block hands over ────────────────────────────────────
{
  console.log('\n── ticking the last exercise chains onto the next block');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess1');
  ok(
    'we start on the warm-up',
    /— Échauffement$/.test(await where(p)),
    await where(p)
  );

  // The warm-up carries two movements.
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(450);
  await skipRest(p);
  ok(
    '  → after the first, we are still there',
    /— Échauffement$/.test(await where(p)),
    await where(p)
  );

  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(700);
  ok(
    '  → after the last, we are on the next block',
    /— EMOM$/.test(await where(p)),
    await where(p)
  );

  // No dead screen: we never had a "Bloc suivant" to tap.
  ok(
    '  → without ever having to tap "Bloc suivant"',
    (await p.getByRole('button', { name: /^Bloc suivant$/ }).count()) === 0
  );

  // The block we land on really is fresh.
  ok(
    '  → and the block we land on waits to be started',
    /Toucher pour lancer/.test(await guidedScreen(p)),
    (await guidedScreen(p)).match(/[^\n]*[Tt]oucher[^\n]*/)?.[0] ?? '(nothing)'
  );

  // Nothing is lost on the way: both movements stay ticked.
  const g = await record(p, 'sess1');
  ok(
    '  → the two ticked exercises are recorded',
    g.done.length === 2,
    JSON.stringify(g.done)
  );
  ok('  → and the step too', g.step === 1, String(g.step));
  await ctx.close();
}

// ── The last block does not finish by itself ───────────────────────────
{
  console.log('\n── finishing the session stays a decision');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  // Session 5 is a pyramid: one block, seven rungs.
  await start(p, 'sess5');
  for (let i = 0; i < 7; i++) {
    const f = p.getByRole('button', { name: /^Fait$/ });
    if (!(await f.count())) break;
    await f.click();
    await p.waitForTimeout(350);
    await skipRest(p);
  }
  const screen = await guidedScreen(p);
  ok(
    'the seven rungs are ticked',
    /7 sur 7 faits/.test(screen),
    (screen.match(/[^\n]*faits dans ce bloc[^\n]*/) ?? ['(nothing)'])[0]
  );
  ok(
    '  → we are still inside the session',
    /— Pyramide$/i.test(await where(p)),
    await where(p)
  );
  ok(
    '  → and it is "Terminer" that waits, not a recap already open',
    (await p.getByRole('button', { name: 'Terminer', exact: true }).count()) ===
      1 &&
      (await p.locator('[role="dialog"] >> text=/Cette séance/').count()) === 0
  );
  await ctx.close();
}

// ── A loop never moves on by itself ────────────────────────────────────
{
  console.log('\n── an AMRAP does not chain on: the client stops it');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess1');
  for (let i = 0; i < 24; i++) {
    const btn = p.getByRole('button', {
      name: /^(Suivant|Fait|Bloc suivant)$/,
    });
    if (!(await btn.count())) break;
    await btn.first().click();
    await p.waitForTimeout(200);
    await skipRest(p);
    if (await p.getByRole('button', { name: /^\+1 tour$/ }).count()) break;
  }
  ok('we reach the loop', /— AMRAP$/.test(await where(p)), await where(p));
  const before = await where(p);
  for (let i = 0; i < 4; i++) {
    await p.getByRole('button', { name: /^\+1 tour$/ }).click();
    await p.waitForTimeout(150);
  }
  ok(
    '  → counting rounds does not advance an inch',
    (await where(p)) === before,
    `${before} → ${await where(p)}`
  );
  await ctx.close();
}

// ── Going back to a finished block stays possible ──────────────────────
{
  console.log('\n── you can go back to a block you have finished');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess1');
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(400);
  await skipRest(p);
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(700);
  ok('we moved on to the EMOM', /— EMOM$/.test(await where(p)), await where(p));

  await p.getByRole('button', { name: /^Précédent$/ }).click();
  await p.waitForTimeout(500);
  ok(
    '  → "Précédent" brings us back to the warm-up',
    /— Échauffement$/.test(await where(p)),
    await where(p)
  );
  ok(
    '  → it is still ticked',
    /2 sur 2 faits/.test(await guidedScreen(p)),
    (await guidedScreen(p)).match(/[^\n]*faits dans ce bloc[^\n]*/)?.[0] ??
      '(nothing)'
  );
  ok(
    '  → and "Bloc suivant" is there to get out again',
    (await p.getByRole('button', { name: /^Bloc suivant$/ }).count()) === 1
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
