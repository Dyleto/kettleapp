/**
 * The rest between two sets, placed inside the list.
 *
 * It used to take the whole screen: you ticked "Fait", and the block you
 * were reading disappeared behind a wall of teal. From the field: "not
 * pleasant to suddenly get a full page REPOS".
 *
 * A rest is not an event, it is an interval between two sets — and it
 * belongs where that interval is.
 */
import {
  launch,
  MOBILE,
  ok,
  failureCount,
  signIn,
  start,
  guidedScreen,
} from './common.mjs';

const browser = await launch();

/** Walks to session 2's classic block and ticks the first set. */
const tickOneSet = async (p) => {
  await start(p, 'sess2');
  for (let i = 0; i < 8; i++) {
    await p.getByRole('button', { name: /^(Suivant|Bloc suivant)$/ }).click();
    await p.waitForTimeout(180);
  }
  await p
    .locator('[aria-label="Séance guidée"] input[aria-label^="Poids utilisé"]')
    .first()
    .fill('26');
  await p.waitForTimeout(200);
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(600);
};

// ── The rest no longer hides the block ───────────────────────────────────
{
  console.log('\n── the rest sits in the list, it no longer covers it');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await tickOneSet(p);

  const screen = await guidedScreen(p);
  const lines = screen.split('\n').filter(Boolean);

  const strips = await p
    .getByRole('button', { name: 'Passer', exact: true })
    .count();
  ok('a rest strip appears in the list', strips === 1, `${strips} strip(s)`);
  ok(
    '  → carrying what comes next',
    /ensuite Goblet Squat/i.test(screen),
    (lines.find((l) => /ensuite/i.test(l)) ?? '(nothing)').slice(0, 60)
  );

  // The heart of the matter: the whole block stays readable during the rest.
  // `innerText` also reads what is hidden behind a panel, so we have to ask
  // the browser what a finger would actually land on at that spot.
  const trulyVisible = await p.evaluate(() => {
    const root = document.querySelector('[aria-label="Séance guidée"]');
    const target = [...root.querySelectorAll('*')].find(
      (e) => e.children.length === 0 && /Fentes marchées/.test(e.textContent)
    );
    if (!target) return { found: false };
    const r = target.getBoundingClientRect();
    const onTop = document.elementFromPoint(r.left + 4, r.top + r.height / 2);
    return {
      found: true,
      covered: onTop !== target && !target.contains(onTop),
    };
  });
  ok(
    'the block stays entirely readable during the rest',
    trulyVisible.found && !trulyVisible.covered,
    JSON.stringify(trulyVisible)
  );
  ok(
    '  → and its last lines too',
    /Fentes marchées/.test(screen) && /série 4 \/ 4/.test(screen),
    lines.filter((l) => /Fentes/.test(l)).length + ' lunge line(s)'
  );
  ok(
    "  → including the block's header and its progress",
    /CLASSIQUE/.test(screen) && /1 sur 7 faits/.test(screen),
    lines.find((l) => /faits dans ce bloc/.test(l)) ?? '(nothing)'
  );

  // It sits between the ticked set and the one that follows.
  const iDone = lines.findIndex((l) => /^26 kg$/.test(l.trim()));
  const iRest = lines.findIndex((l) => /REPOS/i.test(l));
  const iNext = lines.findIndex((l) => /série 2 \/ 4/.test(l));
  ok(
    '  → exactly between the set just done and the next one',
    iDone >= 0 && iDone < iRest && iRest < iNext,
    `done ${iDone}, rest ${iRest}, next ${iNext}`
  );

  // No panel covers the block.
  const overlays = await p.evaluate(() => {
    const root = document.querySelector('[aria-label="Séance guidée"]');
    return [...root.querySelectorAll('div')].some((e) => {
      const st = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      return (
        st.position === 'absolute' &&
        r.height > 300 &&
        /repos/i.test(e.innerText || '')
      );
    });
  });
  ok('  → and nothing overlays the block', !overlays);
  await ctx.close();
}

// ── You can work during the rest ────────────────────────────────────────
//
// That is what the inlining buys: correcting a load, re-reading the next
// movement's dose, reopening an instruction — what you actually do while
// waiting.
{
  console.log('\n── during the rest, the session stays usable');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await tickOneSet(p);

  const field = p
    .locator('[aria-label="Séance guidée"] input[aria-label^="Poids utilisé"]')
    .first();
  ok('the current set still carries its field', (await field.count()) > 0);
  await field.fill('28');
  await p.waitForTimeout(300);
  ok(
    '  → and a load can be entered without waiting out the rest',
    (await field.inputValue()) === '28',
    await field.inputValue()
  );
  ok(
    '  → while the rest strip keeps running',
    (await p.getByRole('button', { name: 'Passer', exact: true }).count()) === 1
  );
  await ctx.close();
}

// ── "Passer" hands back control without undoing anything ────────────────
{
  console.log('\n── skipping the rest undoes nothing');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await tickOneSet(p);
  await p.getByRole('button', { name: 'Passer', exact: true }).click();
  await p.waitForTimeout(400);
  const screen = await guidedScreen(p);
  ok(
    'the rest strip disappears',
    (await p.getByRole('button', { name: 'Passer', exact: true }).count()) === 0
  );
  ok(
    '  → the ticked set stays ticked',
    /1 sur 7 faits/.test(screen),
    (screen.match(/[^\n]*faits dans ce bloc[^\n]*/) ?? ['(nothing)'])[0]
  );
  ok('  → and the recorded load is still there', /26 kg/.test(screen));
  await ctx.close();
}

// ── No rest where the coach prescribed none ─────────────────────────────
{
  console.log('\n── no rest invented after the last exercise');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  // Session 3's chipper prescribes no rest between its movements.
  await start(p, 'sess3');
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(600);
  ok(
    'a block with no prescribed rest shows no strip',
    (await p.getByRole('button', { name: 'Passer', exact: true }).count()) === 0
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
