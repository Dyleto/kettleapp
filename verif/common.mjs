/**
 * What every suite redoes: open a browser, sign in, start a guided session,
 * read the screen.
 */
import { chromium } from 'playwright-core';

export const BASE = 'http://localhost:5173';
export const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
export const MOBILE = {
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
};

export const launch = () => chromium.launch({ executablePath: CHROME });

let failures = 0;
export const ok = (label, cond, extra = '') => {
  if (!cond) failures++;
  console.log(`${cond ? 'OK  ' : 'FAIL'}  ${label}${extra ? ' — ' + extra : ''}`);
};
export const failureCount = () => failures;

/** Non-breaking spaces break hand-written expressions. */
export const clean = (t) => (t ?? '').replace(/[   ]/g, ' ');

export const signIn = async (ctx) => {
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
  await p.evaluate(async () => {
    await fetch('http://localhost:3001/api/auth/dev-login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
  });
  return p;
};

export const start = async (p, sess) => {
  await p.goto(`${BASE}/client/session/${sess}`, {
    waitUntil: 'domcontentloaded',
  });
  await p.waitForTimeout(1700);
  await p.getByRole('button', { name: /Démarrer la séance/ }).click();
  await p.waitForTimeout(800);
  // The opening screen carries the coach's note: we step past it to reach
  // the session itself.
  const c = p.getByRole('button', { name: /^Commencer$/ });
  if (await c.count()) {
    await c.click();
    await p.waitForTimeout(400);
  }
};

/**
 * Where we are, read off the progress bar.
 *
 * It is the only reliable marker: the screen's text announces the next block
 * from the last round onwards, which makes it look as though we are already
 * there.
 */
export const where = (p) =>
  p.evaluate(
    () =>
      document
        .querySelector('[aria-label="Séance guidée"] [role="progressbar"]')
        ?.getAttribute('aria-valuetext') ?? ''
  );

export const guidedScreen = (p) =>
  p
    .evaluate(
      () =>
        document.querySelector('[aria-label="Séance guidée"]')?.innerText ?? ''
    )
    .then(clean);

export const dialogs = (p) =>
  p
    .evaluate(() =>
      [...document.querySelectorAll('[role="dialog"]')]
        .map((d) => d.innerText)
        .join('\n')
    )
    .then(clean);

/**
 * The rest between two sets sits in the list, not full screen: its button
 * says "Passer", and nothing else carries that exact name.
 */
export const skipRest = async (p) => {
  const r = p.getByRole('button', { name: 'Passer', exact: true });
  if (await r.count()) {
    await r.click();
    await p.waitForTimeout(250);
  }
};
