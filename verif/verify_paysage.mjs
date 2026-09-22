/**
 * Guided mode, phone on its side.
 *
 * A client who props their phone against a wall during an EMOM lays it flat.
 * The screen then goes from 844 px tall to 390, and guided mode's chrome took
 * 186 of them: three bars and two buttons for half the screen. Measured
 * before: 165 usable px for 260 px of content — an EMOM round whose movements
 * you could not see.
 *
 * Two rules hold this suite together:
 *   — what you press stays whole and inside the screen;
 *   — what does not fit scrolls, and nothing is ever cut with no recourse.
 */
import {
  launch,
  BASE,
  ok,
  failureCount,
  signIn,
  start,
  skipRest,
} from './common.mjs';

const browser = await launch();

// iPhone on its side (past the `md` threshold, the trap), and a small Android
// on its side.
const LANDSCAPE = {
  viewport: { width: 844, height: 390 },
  isMobile: true,
  hasTouch: true,
};
const SMALL = {
  viewport: { width: 740, height: 360 },
  isMobile: true,
  hasTouch: true,
};
const PORTRAIT = {
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
};

/** What can be seen of an element, and what sticks out of the screen. */
const boxOf = (p, selector) =>
  p.evaluate((sel) => {
    const el = typeof sel === 'string' ? document.querySelector(sel) : null;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      h: Math.round(r.height),
      w: Math.round(r.width),
      belowFold: Math.round(Math.max(0, r.bottom - window.innerHeight)),
      aboveFold: Math.round(Math.max(0, -r.top)),
    };
  }, selector);

/** The primary button, measured by its name. */
const buttonBox = (p, pattern) =>
  p.evaluate((m) => {
    const el = [...document.querySelectorAll('button')]
      .filter(
        (e) =>
          e.offsetParent !== null || getComputedStyle(e).position === 'fixed'
      )
      .find((e) => new RegExp(m).test(e.innerText.trim()));
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      txt: el.innerText.trim(),
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      h: Math.round(r.height),
      belowFold: Math.round(Math.max(0, r.bottom - window.innerHeight)),
      aboveFold: Math.round(Math.max(0, -r.top)),
    };
  }, pattern);

/** What the screen shows, and what there would be to show. */
const viewport = (p) =>
  p.evaluate(() => {
    const root = document.querySelector('[aria-label="Séance guidée"]');
    if (!root) return null;
    const inside = [...root.querySelectorAll('*')].filter((e) => {
      const st = getComputedStyle(e);
      return st.overflowY === 'auto' || st.overflowY === 'scroll';
    });
    const z = inside[inside.length - 1];
    return z
      ? {
          seen: z.clientHeight,
          content: z.scrollHeight,
          scrolls: z.scrollHeight > z.clientHeight,
        }
      : null;
  });

/** A screen with no scrollbar that overflows cuts with no recourse. */
const cutWithNoRecourse = (p) =>
  p.evaluate(() => {
    const panels = [...document.querySelectorAll('div')].filter(
      (e) =>
        getComputedStyle(e).position === 'fixed' &&
        e.getBoundingClientRect().height > 100
    );
    const el = panels[panels.length - 1];
    if (!el) return null;
    const cuts = (n) => {
      const st = getComputedStyle(n);
      if (
        n.scrollHeight > n.clientHeight + 1 &&
        st.overflowY !== 'auto' &&
        st.overflowY !== 'scroll'
      )
        return {
          tag: n.tagName,
          content: n.scrollHeight,
          seen: n.clientHeight,
          txt: (n.innerText || '').split('\n')[0].slice(0, 30),
        };
      for (const child of n.children) {
        const r = cuts(child);
        if (r) return r;
      }
      return null;
    };
    return cuts(el);
  });

// ── The full screens: none cuts without a scrollbar ─────────────────────
{
  console.log('\n── landscape: the full screens do not cut in silence');
  const ctx = await browser.newContext(LANDSCAPE);
  const p = await signIn(ctx);

  // 1. The opening screen. Session 2 is the case that matters: its coach
  //    wrote a note there, and that is what overflows the screen.
  for (const [what, sess] of [
    ["without the coach's note", 'sess1'],
    ["with the coach's note", 'sess2'],
  ]) {
    await p.goto(`${BASE}/client/session/${sess}`, {
      waitUntil: 'domcontentloaded',
    });
    await p.waitForTimeout(1700);
    await p.getByRole('button', { name: /Démarrer la séance/ }).click();
    await p.waitForTimeout(900);
    const overflow = await cutWithNoRecourse(p);
    ok(
      `the opening screen cuts nothing without recourse (${what})`,
      overflow === null,
      overflow
        ? `${overflow.tag}: ${overflow.seen} px seen of ${overflow.content} — "${overflow.txt}"`
        : ''
    );
    const begin = await buttonBox(p, '^Commencer$');
    ok(
      '  → and "Commencer" is inside the screen',
      begin && begin.belowFold === 0 && begin.aboveFold === 0,
      begin ? `from ${begin.top} to ${begin.bottom} of 390` : '(not found)'
    );
  }

  // We restart from session 1 for what follows: its first block can be
  // ticked.
  await p.goto(`${BASE}/client/session/sess1`, {
    waitUntil: 'domcontentloaded',
  });
  await p.waitForTimeout(1700);
  await p.getByRole('button', { name: /Démarrer la séance/ }).click();
  await p.waitForTimeout(800);
  await p
    .getByRole('button', { name: /^(Commencer|Reprendre)$/ })
    .first()
    .click();
  await p.waitForTimeout(600);

  // 2. The rest triggered by "Fait".
  const kg = p
    .locator('[aria-label="Séance guidée"] input[aria-label^="Poids utilisé"]')
    .first();
  if (await kg.count()) {
    await kg.fill('20');
    await p.waitForTimeout(200);
  }
  await p.getByRole('button', { name: /^Fait$/ }).click();
  await p.waitForTimeout(500);
  const skip = await buttonBox(p, 'Passer le repos');
  if (skip) {
    ok(
      'the rest keeps its button whole and inside the screen',
      skip.belowFold === 0 && skip.aboveFold === 0 && skip.h >= 44,
      `${skip.h} px, bottom at ${skip.bottom}`
    );
    await p.getByRole('button', { name: /^Passer le repos$/ }).click();
    await p.waitForTimeout(300);
  } else {
    ok(
      'the rest keeps its button whole and inside the screen',
      true,
      '(no rest here)'
    );
  }

  // 3. The leave confirmation.
  await p.getByRole('button', { name: /^Quitter$/ }).click();
  await p.waitForTimeout(500);
  const leaving = await cutWithNoRecourse(p);
  ok(
    'the leave confirmation cuts nothing',
    leaving === null,
    leaving
      ? `${leaving.tag}: ${leaving.seen} px seen of ${leaving.content} — "${leaving.txt}"`
      : ''
  );
  const quit = await buttonBox(p, '^Quitter$');
  ok(
    '  → and both its answers are inside the screen',
    quit && quit.belowFold === 0 && quit.aboveFold === 0,
    quit ? `bottom at ${quit.bottom} of 390` : '(not found)'
  );
  await p.getByRole('button', { name: /^Quitter$/ }).click();
  await p.waitForTimeout(700);

  // 4. The resume screen.
  await p.getByRole('button', { name: /Démarrer la séance/ }).click();
  await p.waitForTimeout(900);
  const resume = await cutWithNoRecourse(p);
  ok(
    'the resume screen cuts nothing',
    resume === null,
    resume
      ? `${resume.tag}: ${resume.seen} px seen of ${resume.content} — "${resume.txt}"`
      : ''
  );
  const resumeBtn = await buttonBox(p, '^Reprendre$');
  ok(
    '  → "Reprendre" is inside the screen',
    resumeBtn && resumeBtn.belowFold === 0 && resumeBtn.aboveFold === 0,
    resumeBtn ? `bottom at ${resumeBtn.bottom} of 390` : '(not found)'
  );
  await ctx.close();
}

// ── An EMOM round fits on a landscape screen ────────────────────────────
for (const [name, vp] of [
  ['iPhone on its side', LANDSCAPE],
  ['small Android on its side', SMALL],
]) {
  console.log(`\n── ${name}: the EMOM round`);
  const ctx = await browser.newContext(vp);
  const p = await signIn(ctx);
  await start(p, 'sess1');
  for (let i = 0; i < 3; i++) {
    const btn = p.getByRole('button', {
      name: /^(Fait|Suivant|Bloc suivant)$/,
    });
    if (await btn.count()) {
      await btn.first().click();
      await p.waitForTimeout(250);
    }
    await skipRest(p);
  }

  const z = await viewport(p);
  ok(
    'the whole round fits in the screen',
    z && z.content <= z.seen,
    z ? `${z.seen} px seen for ${z.content} px of content` : '(no zone)'
  );

  const btn = await buttonBox(p, '^Suivant$');
  ok(
    '  → the primary button stays whole and inside the screen',
    btn && btn.belowFold === 0 && btn.aboveFold === 0 && btn.h >= 44,
    btn
      ? `${btn.h} px tall, bottom at ${btn.bottom} of ${vp.viewport.height}`
      : '(not found)'
  );

  const q = await buttonBox(p, '^Quitter$');
  ok(
    '  → and the way out is still reachable',
    q && q.belowFold === 0 && q.aboveFold === 0 && q.h >= 44,
    q ? `${q.h} px, top at ${q.top}` : '(not found)'
  );

  const duplicates = await p.$$eval(
    'button',
    (l) =>
      l.filter(
        (e) => e.offsetParent !== null && e.innerText.trim() === 'Quitter'
      ).length
  );
  ok(
    '  → one way out in the tree, not two',
    duplicates === 1,
    `${duplicates} button(s)`
  );
  await ctx.close();
}

// ── A list block: what does not fit must be able to scroll ──────────────
{
  console.log('\n── landscape: a block of seven sets');
  const ctx = await browser.newContext(LANDSCAPE);
  const p = await signIn(ctx);
  await start(p, 'sess2');
  for (let i = 0; i < 8; i++) {
    await p.getByRole('button', { name: /^(Suivant|Bloc suivant)$/ }).click();
    await p.waitForTimeout(180);
  }
  const z = await viewport(p);
  ok(
    'seven sets do not fit — and it is the list that scrolls',
    z && (z.content <= z.seen || z.scrolls),
    z ? `${z.seen} px seen for ${z.content} px` : '(no zone)'
  );

  // The current set carries the input field: that is what has to be visible.
  const field = await boxOf(
    p,
    '[aria-label="Séance guidée"] input[aria-label^="Poids utilisé"]'
  );
  ok(
    '  → the current set is visible without scrolling',
    field && field.belowFold === 0 && field.aboveFold === 0,
    field ? `from ${field.top} to ${field.bottom} of 390` : '(no field)'
  );
  const btn = await buttonBox(p, '^Fait$');
  ok(
    '  → and "Fait" stays whole',
    btn && btn.belowFold === 0 && btn.h >= 44,
    btn ? `${btn.h} px, bottom at ${btn.bottom}` : '(not found)'
  );
  await ctx.close();
}

// ── The end-of-session wrap-up, in landscape ────────────────────────────
{
  console.log('\n── landscape: the recap and its question');
  const ctx = await browser.newContext(LANDSCAPE);
  const p = await signIn(ctx);
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
  const submit = await buttonBox(p, '^Valider$');
  ok(
    '"Valider" stays whole and inside the screen',
    submit && submit.belowFold === 0 && submit.aboveFold === 0,
    submit ? `from ${submit.top} to ${submit.bottom} of 390` : '(not found)'
  );
  const body = await p.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    const b =
      d &&
      [...d.querySelectorAll('*')].find((e) => {
        const st = getComputedStyle(e);
        return st.overflowY === 'auto' || st.overflowY === 'scroll';
      });
    return b ? { seen: b.clientHeight, content: b.scrollHeight } : null;
  });
  ok(
    '  → and the statement stays readable: the body scrolls',
    body && body.seen > 0,
    body ? `${body.seen} px seen for ${body.content} px` : '(no scrolling body)'
  );
  await ctx.close();
}

// ── In portrait, nothing moved ──────────────────────────────────────────
{
  console.log('\n── portrait: the validated mock-up does not move');
  const ctx = await browser.newContext(PORTRAIT);
  const p = await signIn(ctx);
  await start(p, 'sess1');
  for (let i = 0; i < 3; i++) {
    const btn = p.getByRole('button', {
      name: /^(Fait|Suivant|Bloc suivant)$/,
    });
    if (await btn.count()) {
      await btn.first().click();
      await p.waitForTimeout(250);
    }
    await skipRest(p);
  }
  const measures = await p.evaluate(() => {
    const card = document.querySelector(
      '[aria-label="Séance guidée"]'
    ).firstElementChild;
    const clock = [...card.querySelectorAll('*')].find(
      (e) => /^\d+:\d\d$/.test(e.textContent.trim()) && e.children.length === 0
    );
    return {
      heights: [...card.children].map((e) =>
        Math.round(e.getBoundingClientRect().height)
      ),
      size: clock ? getComputedStyle(clock).fontSize : null,
    };
  });
  ok(
    '"Quitter" keeps a line of its own',
    measures.heights[0] === 76,
    `${measures.heights[0]} px`
  );
  ok(
    '  → and the clock its 72 px',
    measures.size === '72px',
    measures.size ?? '(none)'
  );
  const q = await p.$$eval(
    'button',
    (l) =>
      l.filter(
        (e) => e.offsetParent !== null && e.innerText.trim() === 'Quitter'
      ).length
  );
  ok('  → one way out here too', q === 1, `${q} button(s)`);
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
