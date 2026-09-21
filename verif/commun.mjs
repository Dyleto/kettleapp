/**
 * Ce que toutes les suites refont : ouvrir un navigateur, se connecter,
 * démarrer une séance guidée, lire l'écran.
 */
import { chromium } from 'playwright-core';

export const BASE = 'http://localhost:5173';
export const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
export const MOBILE = {
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
};

export const lancer = () => chromium.launch({ executablePath: CHROME });

let echecs = 0;
export const ok = (l, c, e = '') => {
  if (!c) echecs++;
  console.log(`${c ? 'OK  ' : 'FAIL'}  ${l}${e ? ' — ' + e : ''}`);
};
export const bilanDesEchecs = () => echecs;

/** Les espaces insécables cassent les expressions écrites à la main. */
export const net = (t) => (t ?? '').replace(/[   ]/g, ' ');

export const connecter = async (ctx) => {
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

export const demarrer = async (p, sess) => {
  await p.goto(`${BASE}/client/session/${sess}`, {
    waitUntil: 'domcontentloaded',
  });
  await p.waitForTimeout(1700);
  await p.getByRole('button', { name: /Démarrer la séance/ }).click();
  await p.waitForTimeout(800);
  // L'écran d'ouverture porte le mot du coach : on le franchit pour
  // atteindre la séance elle-même.
  const c = p.getByRole('button', { name: /^Commencer$/ });
  if (await c.count()) {
    await c.click();
    await p.waitForTimeout(400);
  }
};

/**
 * Où l'on en est, lu sur la barre d'avancement.
 *
 * C'est le seul repère fiable : le texte de l'écran annonce le bloc suivant
 * dès le dernier tour, ce qui fait croire qu'on y est déjà.
 */
export const ou = (p) =>
  p.evaluate(
    () =>
      document
        .querySelector('[aria-label="Séance guidée"] [role="progressbar"]')
        ?.getAttribute('aria-valuetext') ?? ''
  );

export const ecranGuide = (p) =>
  p
    .evaluate(
      () =>
        document.querySelector('[aria-label="Séance guidée"]')?.innerText ?? ''
    )
    .then(net);

export const boites = (p) =>
  p
    .evaluate(() =>
      [...document.querySelectorAll('[role="dialog"]')]
        .map((d) => d.innerText)
        .join('\n')
    )
    .then(net);

/**
 * Le repos entre deux séries se pose dans la liste, pas en plein écran :
 * son bouton dit « Passer », et rien d'autre ne porte ce nom exact.
 */
export const passerRepos = async (p) => {
  const r = p.getByRole('button', { name: 'Passer', exact: true });
  if (await r.count()) {
    await r.click();
    await p.waitForTimeout(250);
  }
};
