/**
 * Reopening an exercise already done.
 *
 * A ticked row was dead: you could neither re-read it, nor fix the load you
 * had just mistyped into it, nor redo it. Yet the three things you want from
 * a past exercise have nothing to do with the cursor — so they happen in
 * place, without moving where you are.
 *
 * Correcting and redoing are two distinct gestures: whoever is repairing a
 * typo does not want the set back in front of them.
 */
import {
  launch,
  MOBILE,
  ok,
  failureCount,
  signIn,
  start,
  guidedScreen,
  skipRest,
} from './common.mjs';

const browser = await launch();

const record = (p) =>
  p.evaluate(() =>
    JSON.parse(localStorage.getItem('kettle-seance-sess2') || 'null')
  );

/** Ticks the classic block's first two sets, at 24 then 25 kg. */
const tickTwoSets = async (p) => {
  await start(p, 'sess2');
  for (let i = 0; i < 8; i++) {
    await p.getByRole('button', { name: /^(Suivant|Bloc suivant)$/ }).click();
    await p.waitForTimeout(180);
  }
  for (let i = 0; i < 2; i++) {
    const kg = p
      .locator(
        '[aria-label="Séance guidée"] input[aria-label^="Poids utilisé"]'
      )
      .first();
    if (await kg.count()) {
      await kg.fill(String(24 + i));
      await p.waitForTimeout(250);
    }
    await p.getByRole('button', { name: /^Fait$/ }).click();
    await p.waitForTimeout(300);
    await skipRest(p);
  }
};

// ── A ticked row opens ──────────────────────────────────────────────────
{
  console.log('\n── an exercise already done reopens');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await tickTwoSets(p);

  const reopenable = await p.getByRole('button', { name: /^Rouvrir/ }).count();
  ok(
    'the exercises already done are touchable',
    reopenable === 2,
    `${reopenable} reopenable`
  );

  // What is not done does not reopen: the current set already carries its
  // field, and the ones still to come have nothing to reopen.
  const current = await p
    .getByRole('button', { name: /^Rouvrir Goblet Squat série 3/ })
    .count();
  ok('  → what is not done yet is not', current === 0);

  await p
    .getByRole('button', { name: /^Rouvrir Goblet Squat série 1/ })
    .click();
  await p.waitForTimeout(400);

  const field = p.locator('input[aria-label^="Corriger le poids"]');
  const howMany = await field.count();
  const read = howMany > 0 ? await field.first().inputValue() : null;
  ok(
    'the row opens on the load that was put into it',
    howMany === 1 && read === '24',
    read === null ? '(no field)' : read
  );
  const screen = await guidedScreen(p);
  ok('  → with the means to redo it', /Refaire/.test(screen));
  ok('  → the means to review the movement', /Revoir le mouvement/.test(screen));
  ok('  → and the means to close it again', /Fermer/.test(screen));

  // One at a time: two editable loads on screen would bring the form back to
  // every row, which the list was rewritten to remove.
  await p
    .getByRole('button', { name: /^Rouvrir Goblet Squat série 2/ })
    .click();
  await p.waitForTimeout(400);
  ok(
    '  → only one row open at a time',
    (await p.locator('input[aria-label^="Corriger le poids"]').count()) === 1
  );
  await ctx.close();
}

// ── Correcting is not unticking ────────────────────────────────────────
{
  console.log('\n── correcting a load undoes nothing');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await tickTwoSets(p);
  await p
    .getByRole('button', { name: /^Rouvrir Goblet Squat série 1/ })
    .click();
  await p.waitForTimeout(400);
  await p.locator('input[aria-label^="Corriger le poids"]').first().fill('30');
  await p.waitForTimeout(400);

  const g = await record(p);
  ok(
    'the correction lands in the right place',
    g.performed['2:1'].sets[0].weight === 30,
    JSON.stringify(g.performed['2:1'].sets)
  );
  ok(
    '  → without touching the next set',
    g.performed['2:1'].sets[1].weight === 25
  );
  ok(
    '  → and the set stays ticked',
    g.done.length === 2,
    JSON.stringify(g.done)
  );
  ok(
    '  → the block still says so',
    /2 sur 7 faits/.test(await guidedScreen(p)),
    (await guidedScreen(p)).match(/[^\n]*faits dans ce bloc[^\n]*/)?.[0] ??
      '(nothing)'
  );

  await p.getByRole('button', { name: /^Fermer$/ }).click();
  await p.waitForTimeout(300);
  ok(
    '  → closing it again undoes nothing either',
    (await record(p)).done.length === 2 &&
      (await p.locator('input[aria-label^="Corriger le poids"]').count()) === 0
  );
  await ctx.close();
}

// ── Redoing puts the set back in front of you ──────────────────────────
{
  console.log('\n── "Refaire" makes the set to-do again');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await tickTwoSets(p);
  await p
    .getByRole('button', { name: /^Rouvrir Goblet Squat série 1/ })
    .click();
  await p.waitForTimeout(400);
  await p.getByRole('button', { name: /^Refaire$/ }).click();
  await p.waitForTimeout(500);

  const g = await record(p);
  ok('the set is unticked', !g.done.includes('2:1:1'), JSON.stringify(g.done));
  ok(
    '  → the block counts it',
    /1 sur 7 faits/.test(await guidedScreen(p)),
    (await guidedScreen(p)).match(/[^\n]*faits dans ce bloc[^\n]*/)?.[0] ??
      '(nothing)'
  );

  // The cursor follows on its own: it is the first exercise not done.
  const currentLabel = await p
    .locator('[aria-label="Séance guidée"] input[aria-label^="Poids utilisé"]')
    .first()
    .getAttribute('aria-label');
  ok(
    '  → and it becomes the current exercise again',
    /série 1 \/ 4/.test(currentLabel ?? ''),
    currentLabel ?? '(none)'
  );

  // Redoing is not forgetting what you lifted.
  ok(
    '  → the recorded load stays',
    g.performed?.['2:1']?.sets?.[0]?.weight === 24,
    JSON.stringify(g.performed?.['2:1']?.sets?.[0] ?? null)
  );
  await ctx.close();
}

// ── Reviewing the movement ─────────────────────────────────────────────
{
  console.log('\n── reviewing a movement already done');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await tickTwoSets(p);
  await p
    .getByRole('button', { name: /^Rouvrir Goblet Squat série 1/ })
    .click();
  await p.waitForTimeout(400);
  await p.getByRole('button', { name: /^Revoir le mouvement$/ }).click();
  await p.waitForTimeout(500);
  const screen = await guidedScreen(p);
  ok(
    "the movement's instruction opens",
    /Kettlebell contre la poitrine/.test(screen),
    screen.split('\n').filter(Boolean).slice(0, 3).join(' · ')
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
