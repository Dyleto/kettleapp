/**
 * The end-of-session wrap-up, on a phone held upright.
 *
 * From the field: "the modal is a touch too small, and when you tap to set
 * another date there is a little scroll, which is a shame."
 *
 * Measured, the complaint was two things, and the second was the one that
 * shows. The body already overflowed by 261 px before anything was tapped —
 * a recap, a scale, the tags, a comment and a date do not fit in 610 px. But
 * unfolding the date then added 48 px, and what you notice is not a
 * scrollbar that was already there: it is the whole wrap-up jumping under
 * your thumb at the exact moment you reach for it.
 *
 * So the row now keeps its height open or closed, and the footer stops
 * taking rows from the body — a footer does not scroll, so every line it
 * wraps onto is a line the body loses on every session.
 */
import {
  launch,
  MOBILE,
  ok,
  failureCount,
  signIn,
  start,
  skipRest,
} from './common.mjs';

const browser = await launch();

/** Finishes session 3's chipper and opens the wrap-up. */
const finishSess3 = async (p) => {
  await start(p, 'sess3');
  for (let i = 0; i < 4; i++) {
    const kg = p
      .locator(
        '[aria-label="Séance guidée"] input[aria-label^="Poids utilisé"]'
      )
      .first();
    if (await kg.count()) {
      await kg.fill(String(10 + i));
      await p.waitForTimeout(150);
    }
    const done = p.getByRole('button', { name: /^Fait$/ });
    if (!(await done.count())) break;
    await done.click();
    await p.waitForTimeout(250);
    await skipRest(p);
  }
  await p.getByRole('button', { name: 'Terminer', exact: true }).click();
  await p.waitForTimeout(1500);
};

/** The dialog, its scrolling body, and what sticks out of the screen. */
const measure = (p) =>
  p.evaluate(() => {
    const content = document.querySelector('[role="dialog"]');
    if (!content) return null;
    const body = [...content.querySelectorAll('*')].find((e) => {
      const st = getComputedStyle(e);
      return st.overflowY === 'auto' || st.overflowY === 'scroll';
    });
    const r = content.getBoundingClientRect();
    const cs = getComputedStyle(content);
    return {
      screen: window.innerHeight,
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      marginTop: Math.round(parseFloat(cs.marginTop)),
      marginBottom: Math.round(parseFloat(cs.marginBottom)),
      seen: body?.clientHeight ?? null,
      content: body?.scrollHeight ?? null,
    };
  });

const buttonBox = (p, name) =>
  p.evaluate((n) => {
    const el = [...document.querySelectorAll('button')].find(
      (e) => e.offsetParent !== null && e.innerText.trim() === n
    );
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      h: Math.round(r.height),
      bottom: Math.round(r.bottom),
      belowFold: Math.round(Math.max(0, r.bottom - window.innerHeight)),
      aboveFold: Math.round(Math.max(0, -r.top)),
    };
  }, name);

// ── Unfolding the date must not move anything ───────────────────────────
{
  console.log('\n── setting another date costs no height');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await finishSess3(p);

  const before = await measure(p);
  ok('the wrap-up is open', before !== null);
  ok(
    '  → and stays inside the screen',
    before && before.bottom <= before.screen && before.top >= 0,
    before ? `${before.top} → ${before.bottom} of ${before.screen}` : '(none)'
  );

  // The height has to be what is left once the dialog's own margin is taken
  // off, not a fraction of the whole screen. `maxH="90dvh"` ignored a 64 px
  // margin at each end and let the box hang past it — invisible upright,
  // fatal in landscape, where "Valider" left the viewport. Here we check the
  // box uses the room it has without spilling out of its margin.
  const room = before.screen - before.marginTop - before.marginBottom;
  const used = before.bottom - before.top;
  ok(
    '  → it fills the room its margin leaves, and no more',
    used <= room + 1,
    `${used} px used for ${room} px of room ` +
      `(marge ${before.marginTop}/${before.marginBottom})`
  );
  ok(
    '  → and it does take that room, rather than leaving it empty',
    used >= room - 1 || before.content <= before.seen,
    `${used} px used for ${room} px of room`
  );

  await p.getByRole('button', { name: /Ce n.était pas aujourd/ }).click();
  await p.waitForTimeout(500);
  const after = await measure(p);

  // The point of the whole fix: the content is the same size before and
  // after, so nothing under the thumb moves.
  ok(
    'the body is exactly as tall once the date is open',
    before && after && after.content === before.content,
    `${before?.content} → ${after?.content}`
  );
  // Chakra's date picker renders a text input, not `type="date"`: we find it
  // by the name it is announced under, which is also what a screen reader
  // uses.
  const field = p.getByRole('textbox', {
    name: 'Date de réalisation de la séance',
  });
  ok(
    '  → and the field really did open',
    (await field.count()) === 1,
    `${await field.count()} champ(s)`
  );
  ok(
    '  → carrying the date of the day',
    /\d{2}\/\d{2}\/\d{4}/.test(await field.inputValue()),
    await field.inputValue()
  );
  ok(
    '  → the dialog still fits the screen',
    after && after.bottom <= after.screen && after.top >= 0,
    after ? `${after.top} → ${after.bottom} of ${after.screen}` : '(none)'
  );
  await ctx.close();
}

// ── The footer keeps to one row, so the body keeps its height ──────────
{
  console.log('\n── the footer does not take rows from the body');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await finishSess3(p);

  const submit = await buttonBox(p, 'Valider');
  const cancel = await buttonBox(p, 'Annuler');
  ok(
    '"Valider" is whole and inside the screen',
    submit && submit.belowFold === 0 && submit.aboveFold === 0,
    submit ? `bottom at ${submit.bottom}` : '(not found)'
  );
  ok(
    '  → "Annuler" shares its row rather than a row of its own',
    submit && cancel && Math.abs(submit.bottom - cancel.bottom) < 4,
    submit && cancel ? `${cancel.bottom} vs ${submit.bottom}` : '(not found)'
  );

  // Nothing has been chosen yet, so the hint is on screen. It has to sit on
  // the buttons' row: on its own row it costs the body 30 px, every session.
  const hint = await p.evaluate(() => {
    const el = [...document.querySelectorAll('*')].find(
      (e) => e.children.length === 0 && /Choisis un cran/.test(e.textContent)
    );
    return el ? Math.round(el.getBoundingClientRect().bottom) : null;
  });
  ok(
    '  → and the hint shares it too',
    hint !== null && submit && Math.abs(hint - submit.bottom) < 24,
    hint === null ? '(no hint)' : `${hint} vs ${submit?.bottom}`
  );
  await ctx.close();
}

// ── What moved out of the footer is still said ─────────────────────────
{
  console.log('\n── moving a sentence must not lose it');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await finishSess3(p);
  const text = await p.evaluate(
    () =>
      document.querySelector('[role="dialog"]')?.innerText.replace(/ /g, ' ') ??
      ''
  );
  ok(
    'the loads already recorded are still announced',
    /Tes charges sont déjà enregistrées/.test(text),
    (text.match(/[^\n]*déjà enregistrées[^\n]*/) ?? ['(nothing)'])[0]
  );
  ok(
    '  → and the statement still opens the wrap-up',
    /C'est fait\./.test(text),
    text.split('\n').filter(Boolean)[0] ?? '(nothing)'
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
