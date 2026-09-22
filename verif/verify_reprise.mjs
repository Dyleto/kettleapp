/**
 * Resuming, or starting over.
 *
 * Leaving guided mode erases nothing: you find your place and your loads on
 * coming back. To start from scratch, the resume screen offers it — and
 * "recommencer" then has to really put everything back to zero.
 *
 * The previous suite checked that the loads survive "recommencer" — which
 * must persist — without ever checking what must go back to zero. That is
 * exactly where the defect slipped through.
 */
import {
  launch,
  BASE,
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

/** Leaves the session, comes back to it, and clicks "Recommencer". */
const startOver = async (p) => {
  await p.getByRole('button', { name: /^Quitter$/ }).click();
  await p.waitForTimeout(300);
  await p.getByRole('button', { name: /^Quitter$/ }).click();
  await p.waitForTimeout(900);
  await p.getByRole('button', { name: /Démarrer la séance/ }).click();
  await p.waitForTimeout(900);
  await p.getByRole('button', { name: /Recommencer depuis le début/ }).click();
  await p.waitForTimeout(800);
};

// ── A list block: the case where "recommencer" did nothing ──────────────
//
// A chipper is a single step. Resetting the step therefore changed nothing,
// and the ticked movements stayed ticked.
{
  console.log('\n── starting over unticks what had been ticked');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess3');
  for (let i = 0; i < 3; i++) {
    const kg = p
      .locator(
        '[aria-label="Séance guidée"] input[aria-label^="Poids utilisé"]'
      )
      .first();
    if (await kg.count()) {
      await kg.fill(String(20 + i));
      await p.waitForTimeout(150);
    }
    await p.getByRole('button', { name: /^Fait$/ }).click();
    await p.waitForTimeout(280);
    await skipRest(p);
  }
  const before = await record(p, 'sess3');
  ok(
    'three movements are ticked before leaving',
    before.done.length === 3,
    JSON.stringify(before.done)
  );

  await startOver(p);
  const after = await record(p, 'sess3');
  ok(
    'after "recommencer", nothing is ticked any more',
    after.done.length === 0,
    JSON.stringify(after.done)
  );

  const screen = await guidedScreen(p);
  ok(
    '  → and the block says so: zero out of four',
    /0 sur 4 faits/.test(screen),
    (screen.match(/[^\n]*faits dans ce bloc[^\n]*/) ?? ['(nothing)'])[0]
  );
  ok(
    '  → the cursor is back on the first movement',
    /Burpee[\s\S]{0,40}21 reps/.test(screen),
    screen.split('\n').filter(Boolean).slice(2, 5).join(' · ')
  );

  // The loads, on the other hand, stay: that is the deliberate part.
  ok(
    '  → but the recorded loads are still there',
    Object.keys(after.performed).length === 3,
    JSON.stringify(Object.keys(after.performed))
  );
  const value = await p
    .locator('[aria-label="Séance guidée"] input[aria-label^="Poids utilisé"]')
    .first()
    .inputValue();
  ok(
    '  → and the first one reads back in its field',
    value === '20',
    value || '(empty)'
  );
  await ctx.close();
}

// ── A loop: the round counter restarts too ──────────────────────────────
{
  console.log('\n── starting over puts the round counter back to zero');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess1');
  for (let i = 0; i < 24; i++) {
    const btn = p.getByRole('button', {
      name: /^(Suivant|Fait|Bloc suivant)$/,
    });
    if (!(await btn.count())) break;
    await btn.first().click();
    await p.waitForTimeout(160);
    await skipRest(p);
    if (await p.getByRole('button', { name: /^\+1 tour$/ }).count()) break;
  }
  const plus = p.getByRole('button', { name: /^\+1 tour$/ });
  for (let i = 0; i < 6; i++) {
    await plus.click();
    await p.waitForTimeout(120);
  }
  const before = await record(p, 'sess1');
  ok(
    'six rounds are counted, and the step has advanced',
    before.rounds['3'] === 6 && before.step > 0,
    `step ${before.step}, rounds ${JSON.stringify(before.rounds)}`
  );

  await startOver(p);
  const after = await record(p, 'sess1');
  ok(
    'after "recommencer", everything is at zero',
    after.step === 0 &&
      after.done.length === 0 &&
      Object.keys(after.rounds).length === 0,
    `step ${after.step}, done ${after.done.length}, rounds ${JSON.stringify(after.rounds)}`
  );
  ok(
    '  → and the progress bar says so',
    /Étape 1 sur/.test(await where(p)),
    await where(p)
  );
  await ctx.close();
}

// ── And we really do start clean ────────────────────────────────────────
//
// Started over then left, coming back still offered to resume: the session
// believed itself started because it counted ticked sets.
{
  console.log('\n── after starting over, we start from a fresh session');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess3');
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(300);
  await skipRest(p);
  await startOver(p);

  await p.getByRole('button', { name: /^Quitter$/ }).click();
  await p.waitForTimeout(300);
  await p.getByRole('button', { name: /^Quitter$/ }).click();
  await p.waitForTimeout(900);
  await p.getByRole('button', { name: /Démarrer la séance/ }).click();
  await p.waitForTimeout(900);
  const panel = await p.evaluate(() => {
    const d = [...document.querySelectorAll('div')].filter(
      (e) =>
        getComputedStyle(e).position === 'fixed' &&
        /Reprendre|Commencer/.test(e.innerText)
    );
    return d[d.length - 1]?.innerText ?? '';
  });
  ok(
    'we no longer offer to resume a session that was reset',
    !/Reprendre où tu en étais/i.test(panel),
    panel.split('\n').filter(Boolean)[0] ?? '(nothing)'
  );
  await ctx.close();
}

// ── A record from before the move to English still reads ───────────────
//
// The local-storage fields carried French names. A client mid-session when
// the build shipped would have lost everything: their record is still there,
// but none of its fields answer to their new name.
{
  console.log('\n── a session started before the release is found again');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.evaluate(() => {
    localStorage.setItem(
      'kettle-seance-sess3',
      JSON.stringify({
        version: 1,
        etape: 0,
        performed: { '1:1': { sets: [{ weight: 37 }] } },
        faits: ['1:1:1', '1:2:1'],
        tours: {},
        debutLe: Date.now() - 20 * 60_000,
        majLe: Date.now(),
      })
    );
  });
  await p.goto(`${BASE}/client/session/sess3`, {
    waitUntil: 'domcontentloaded',
  });
  await p.waitForTimeout(1700);
  await p.getByRole('button', { name: /Démarrer la séance/ }).click();
  await p.waitForTimeout(900);
  const panel = await p.evaluate(() => {
    const d = [...document.querySelectorAll('div')].filter(
      (e) =>
        getComputedStyle(e).position === 'fixed' &&
        /Reprendre|Commencer/.test(e.innerText)
    );
    return (d[d.length - 1]?.innerText ?? '').replace(/ /g, ' ');
  });
  ok(
    'we offer to resume a session stored in the old format',
    /Reprendre où tu en étais/i.test(panel),
    panel.split('\n').filter(Boolean)[0] ?? '(nothing)'
  );
  ok(
    '  → and the load recorded before the release is announced',
    /charges sur 1 exercice/i.test(panel),
    (panel.match(/[^\n]*charges[^\n]*/) ?? ['(nothing)'])[0]
  );

  await p.getByRole('button', { name: /^Reprendre$/ }).click();
  await p.waitForTimeout(800);
  // We resume at the first unticked exercise: the third. The first two are
  // behind, ticked, with the load from the old format.
  const screen = await guidedScreen(p);
  ok(
    '  → we resume after the two exercises already ticked',
    /2 sur 4 faits/.test(screen),
    (screen.match(/[^\n]*faits dans ce bloc[^\n]*/) ?? ['(nothing)'])[0]
  );
  ok(
    '  → and the load from the old format is still displayed',
    /37 kg/.test(screen),
    (screen.match(/[^\n]*37 kg[^\n]*/) ?? ['(nothing)'])[0]
  );

  // The first write rewrites the record in the new format, without losing
  // anything it carried.
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(400);
  const migrated = await record(p, 'sess3');
  ok(
    '  → on the first write, it moves to the new format',
    migrated.version === 2,
    `version ${migrated.version}`
  );
  ok(
    '  → keeping what it carried',
    migrated.done.length === 3 &&
      migrated.performed['1:1'].sets[0].weight === 37,
    `${migrated.done.length} done, ${JSON.stringify(migrated.performed['1:1'])}`
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
