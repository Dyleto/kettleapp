/**
 * The clock waits to be started.
 *
 * It used to start on its own. On a round, that meant the countdown was
 * already running before the client had picked up their kettlebell: you open
 * the session, you arrive at round 1 of an EMOM, and you are already behind.
 *
 * Starting is a decision, and it belongs to whoever is about to do the work.
 * The chaining, though, is the format: asking for a tap on every round would
 * destroy the EMOM — "every minute on the minute" means the minutes follow
 * each other, not that you restart them.
 */
import {
  launch,
  MOBILE,
  ok,
  failureCount,
  signIn,
  start,
  guidedScreen,
  where,
  skipRest,
} from './common.mjs';

const browser = await launch();

/** What the round's clock says: its time, and what its button offers. */
const clock = (p) =>
  p.evaluate(() => {
    const r = document.querySelector('[aria-label="Séance guidée"]');
    const t = [...r.querySelectorAll('*')].find(
      (e) => /^\d+:\d\d$/.test(e.textContent.trim()) && !e.children.length
    );
    const btn = [...r.querySelectorAll('button')].find((e) =>
      /décompte|pause/i.test(e.getAttribute('aria-label') || '')
    );
    const clean = (x) => (x ?? '').replace(/[   ]/g, ' ');
    return {
      time: clean(t?.textContent.trim()) || null,
      name: clean(btn?.getAttribute('aria-label')) || null,
    };
  });

/** Steps past session 1's warm-up to reach the EMOM. */
const goToEmom = async (p) => {
  await start(p, 'sess1');
  // We stop as soon as we are there: counting clicks goes wrong the moment a
  // finished block chains onto the next by itself.
  for (let i = 0; i < 6; i++) {
    if (/— EMOM$/.test(await where(p))) return;
    const btn = p.getByRole('button', {
      name: /^(Fait|Suivant|Bloc suivant)$/,
    });
    if (!(await btn.count())) return;
    await btn.first().click();
    await p.waitForTimeout(300);
    await skipRest(p);
  }
};

// ── It does not leave without us ────────────────────────────────────────
{
  console.log("\n── a round's countdown waits for a tap");
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await goToEmom(p);
  ok(
    'we are indeed on the EMOM',
    /— EMOM$/.test(await where(p)),
    await where(p)
  );

  const before = await clock(p);
  ok('the clock shows the whole time', before.time === '1:00', before.time);
  ok(
    '  → and offers to start it, not to pause it',
    /^Lancer le décompte/.test(before.name ?? ''),
    before.name
  );
  ok(
    '  → the screen says so too',
    /Toucher pour lancer/.test(await guidedScreen(p)),
    (await guidedScreen(p)).match(/[^\n]*[Tt]oucher[^\n]*/)?.[0] ?? '(nothing)'
  );

  // The point that matters: waiting costs no time.
  await p.waitForTimeout(3000);
  const after = await clock(p);
  ok(
    'three seconds of waiting do not eat into the round',
    after.time === '1:00',
    after.time
  );

  await p.getByRole('button', { name: /Lancer le décompte/ }).click();
  await p.waitForTimeout(2500);
  const started = await clock(p);
  ok(
    'a tap starts it',
    /^Mettre en pause/.test(started.name ?? ''),
    started.name
  );
  ok(
    '  → and it runs',
    /5[0-9] s restant/.test(started.name ?? ''),
    started.name
  );
  await ctx.close();
}

// ── Once started, the EMOM chains on ───────────────────────────────────
//
// That is the format: the minutes follow each other. Asking for a tap again
// on every round would amount to no longer doing an EMOM at all.
{
  console.log('\n── once started, the following rounds go on their own');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await goToEmom(p);
  await p.getByRole('button', { name: /Lancer le décompte/ }).click();
  await p.waitForTimeout(800);

  await p.getByRole('button', { name: /^Suivant$/ }).click();
  await p.waitForTimeout(1200);
  const round2 = await clock(p);
  ok(
    'the next round of the same block asks for nothing',
    /^Mettre en pause/.test(round2.name ?? ''),
    round2.name
  );
  ok(
    '  → and we really are on round 2',
    /Tour 2/.test(await guidedScreen(p)),
    (await guidedScreen(p)).match(/Tour \d+[^\n]*/)?.[0] ?? '(nothing)'
  );
  await ctx.close();
}

// ── Changing block puts the clock back on hold ─────────────────────────
{
  console.log('\n── another block, another decision');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess4');
  // Session 4 chains an 8-round On-Off then an "Every" block.
  ok('we start on the On-Off', /— On/i.test(await where(p)), await where(p));
  await p.getByRole('button', { name: /Lancer le décompte/ }).click();
  await p.waitForTimeout(600);
  for (let i = 0; i < 8; i++) {
    const b = p.getByRole('button', { name: /^(Suivant|Bloc suivant)$/ });
    if (!(await b.count())) break;
    await b.click();
    await p.waitForTimeout(220);
    if (/— Every/i.test(await where(p))) break;
  }
  ok(
    'we reach the next block',
    /— Every/i.test(await where(p)),
    await where(p)
  );
  const fresh = await clock(p);
  ok(
    '  → its clock waits in turn',
    /^Lancer le décompte/.test(fresh.name ?? ''),
    fresh.name
  );
  await ctx.close();
}

// ── The rest, on the other hand, starts by itself ──────────────────────
//
// It was triggered by the gesture that finished the set: asking for a tap
// right afterwards would be one gesture too many.
{
  console.log('\n── the rest between two sets does not wait');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await start(p, 'sess2');
  for (let i = 0; i < 8; i++) {
    await p.getByRole('button', { name: /^(Suivant|Bloc suivant)$/ }).click();
    await p.waitForTimeout(180);
  }
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(2200);
  const r = await clock(p);
  ok(
    "the rest's countdown runs as soon as it appears",
    /^Mettre en pause/.test(r.name ?? ''),
    r.name
  );
  ok(
    '  → and it has indeed started',
    /5[0-9] s restant/.test(r.name ?? ''),
    r.name
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
