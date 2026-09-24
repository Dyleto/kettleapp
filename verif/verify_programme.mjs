/**
 * "Mon programme": when did I last do this session?
 *
 * From the field: "I changed my programme by editing the sessions rather
 * than deleting and recreating them, so they kept the same id, and it marks
 * a session as done that I have never done. I don't think that's a useful
 * thing to show — the last time you did the session would be more useful,
 * but compare the content too, not just the id."
 *
 * The chips were built on `originalSessionId`, and an id outlives an edit.
 * It said "TERMINÉE" about a session that had been rewritten from top to
 * bottom. The same id also fed "7 séances sur 2 déjà faites" — a count of
 * wrap-ups whose sessions no longer all exist, over a programme that has
 * since shrunk.
 *
 * So the card carries a date, and the date is earned by comparing what
 * there is to do — not by matching an identifier.
 */
import {
  launch,
  BASE,
  MOBILE,
  ok,
  failureCount,
  signIn,
  start,
  skipRest,
  clean,
} from './common.mjs';

const browser = await launch();

/** Every session card, by its title, with the line it carries on the right. */
const cards = async (p) => {
  await p.goto(`${BASE}/client/program`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1800);
  return p.evaluate(() => {
    const out = {};
    for (const el of document.querySelectorAll('*')) {
      if (el.children.length !== 2) continue;
      const [left, right] = el.children;
      const title = (left.textContent || '').trim();
      if (!/^Séance \d/.test(title)) continue;
      out[title.split(/\s*—\s*/)[0]] = (right.textContent || '').trim();
    }
    return out;
  });
};

// ── The three answers ───────────────────────────────────────────────────
{
  console.log('\n── each session says when it was last done');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  const rows = await cards(p);
  const line = (n) => clean(rows[`Séance ${n}`] ?? '(absente)');

  ok(
    'the programme lists its sessions',
    Object.keys(rows).length >= 5,
    Object.keys(rows).join(' · ')
  );

  // Sessions 1 and 2 were done with the content they still carry.
  ok(
    'a session done as it stands today carries its date',
    /^Faite le \d+ \S+$/.test(line(1)),
    line(1)
  );
  ok('  → and so does the other one', /^Faite le /.test(line(2)), line(2));

  // Session 3 was done once, then reworked. The id matches, the content no
  // longer does — and this is the exact case the id-based chip got wrong.
  ok(
    'a session reworked since it was done says so',
    line(3) === 'Modifiée depuis',
    line(3)
  );
  ok('  → and is never called "Terminée"', !/Terminée/i.test(line(3)), line(3));

  // Sessions 4 and 5 carry no wrap-up at all.
  ok(
    'a session never done says it plainly',
    line(4) === 'Jamais faite',
    line(4)
  );
  ok('  → and so does the last one', line(5) === 'Jamais faite', line(5));
  await ctx.close();
}

// ── What the chips used to say is gone ─────────────────────────────────
{
  console.log('\n── the status chips and the proportion are gone');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/client/program`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1800);
  const text = clean(await p.evaluate(() => document.body.innerText));

  ok('no "TERMINÉE" chip', !/TERMINÉE/i.test(text));
  ok('  → no "À VENIR" either', !/À VENIR/i.test(text));
  ok(
    '  → and no proportion of the programme',
    !/séances? sur \d+ déjà faite/i.test(text),
    (text.match(/[^\n]*déjà faite[^\n]*/) ?? ['(nothing)'])[0]
  );

  // The next session still stands out — it is the one carrying an action.
  // It just does it with the card rather than with a badge.
  const nextIsMarked = await p.evaluate(() => {
    const cards = [...document.querySelectorAll('*')].filter((e) =>
      /^Séance \d/.test((e.children[0]?.textContent || '').trim())
    );
    const surfaces = cards.map((e) => {
      const box = e.closest('[class]');
      return box ? getComputedStyle(box).backgroundColor : '';
    });
    return new Set(surfaces).size > 1;
  });
  ok(
    'the next session is still set apart from the others',
    nextIsMarked,
    nextIsMarked ? '' : 'toutes les cartes ont le même fond'
  );
  await ctx.close();
}

// ── Doing a session makes its date appear ──────────────────────────────
//
// The round trip that matters: a session in "Jamais faite" is done, and the
// card that was silent now carries today's date. If the comparison were too
// strict — comparing a coach's note, say — this would stay "Jamais faite"
// forever, and nothing else would reveal it.
{
  console.log('\n── finishing a session updates its own card');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);

  const before = await cards(p);
  ok(
    'session 5 has never been done',
    clean(before['Séance 5'] ?? '') === 'Jamais faite',
    clean(before['Séance 5'] ?? '(absente)')
  );

  // Session 5 is a pyramid: one block, seven rungs.
  await start(p, 'sess5');
  for (let i = 0; i < 7; i++) {
    const f = p.getByRole('button', { name: /^Fait$/ });
    if (!(await f.count())) break;
    await f.click();
    await p.waitForTimeout(300);
    await skipRest(p);
  }
  await p.getByRole('button', { name: 'Terminer', exact: true }).click();
  await p.waitForTimeout(1400);
  // No load was recorded, so the wrap-up asks about them first. We step past
  // it: what is under test here is the card, not the form.
  const toFeeling = p.getByRole('button', { name: /Passer au ressenti/ });
  if (await toFeeling.count()) {
    await toFeeling.click();
    await p.waitForTimeout(900);
  }
  await p.getByRole('radio', { name: /Juste/ }).click();
  await p.waitForTimeout(200);
  await p.getByRole('button', { name: /^Valider$/ }).click();
  await p.waitForTimeout(2200);

  const after = await cards(p);
  ok(
    '  → and now carries the date it was done',
    /^Faite le /.test(clean(after['Séance 5'] ?? '')),
    clean(after['Séance 5'] ?? '(absente)')
  );
  ok(
    '  → without disturbing the others',
    clean(after['Séance 4'] ?? '') === 'Jamais faite',
    clean(after['Séance 4'] ?? '(absente)')
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
