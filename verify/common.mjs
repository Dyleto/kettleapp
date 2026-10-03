/**
 * Ce que chaque suite refait : ouvrir un navigateur, se connecter, lancer une
 * séance guidée, lire l'écran.
 */
import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

/** L'adresse du front. `KETTLE_BASE` la remplace — pour viser un aperçu de
 * déploiement plutôt que le serveur de développement. */
export const BASE = process.env.KETTLE_BASE ?? 'http://localhost:5173';

/**
 * Où se trouve Chromium, quand il faut le dire.
 *
 * Ce conteneur en embarque un à un chemin fixe et interdit d'en télécharger
 * un autre, si bien que le chemin était écrit en dur. Le banc devenait alors
 * inexécutable partout ailleurs — y compris sur un exécuteur de CI, qui est
 * précisément l'endroit où il doit tourner sans que personne ne le demande.
 *
 * Donc : un `CHROME_PATH` explicite l'emporte, l'exemplaire du conteneur sert
 * quand il est là, et sinon on ne dit rien et l'on laisse Playwright résoudre
 * sa propre installation. Trois cas, aucune configuration à retenir.
 */
const CONTAINER_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
export const CHROME =
  process.env.CHROME_PATH ??
  (existsSync(CONTAINER_CHROME) ? CONTAINER_CHROME : undefined);
/** Un téléphone : 390 × 844, c'est-à-dire un iPhone 14. La plupart des
 * défauts que ce banc a trouvés n'existent qu'à cette taille. */
export const MOBILE = {
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
};

/** Ouvre un navigateur, en laissant Playwright trouver le sien quand on n'a
 * rien à lui dire. */
export const launch = () =>
  chromium.launch(CHROME ? { executablePath: CHROME } : {});

let failures = 0;
/**
 * Une assertion, et sa ligne de sortie.
 *
 * `OK` et `FAIL` sont lus par le lanceur : il compte les uns et cherche les
 * autres. Ce sont des marqueurs, pas du texte — d'où l'anglais. Ce qui suit
 * est une phrase, et se lit en français.
 *
 * `extra` porte ce qu'on a réellement lu à l'écran : une assertion qui tombe
 * sans dire ce qu'elle a vu oblige à relancer le banc pour le savoir.
 */
export const ok = (label, cond, extra = '') => {
  if (!cond) failures++;
  console.log(
    `${cond ? 'OK  ' : 'FAIL'}  ${label}${extra ? ' — ' + extra : ''}`
  );
};
/** Le compte des assertions tombées : c'est lui qui décide du code de
 * sortie de la suite. */
export const failureCount = () => failures;

/**
 * Les espaces insécables cassent les expressions écrites à la main.
 *
 * L'application en pose partout — « 45 s », « 12 min » — et une assertion qui
 * cherche « 45 s » avec une espace ordinaire tombe sans que rien ne soit
 * cassé. On les ramène donc toutes à l'espace ordinaire avant de comparer.
 */
export const clean = (t) => (t ?? '').replace(/[\u00A0\u202F\u2009]/g, ' ');

/**
 * Se connecter, par la porte de développement du serveur d'essai.
 *
 * La connexion passe par Google en production : la rejouer demanderait un
 * compte réel et un consentement à chaque exécution. Le serveur d'essai pose
 * donc le cookie de session directement, et c'est la seule chose que ce banc
 * simule.
 *
 * Les erreurs de page sont relayées dans la sortie : sans cela, une exception
 * React rend l'écran vide et les assertions tombent en accusant l'assertion.
 */
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

/**
 * Ouvrir une séance et entrer en mode guidé.
 *
 * Les attentes sont des durées et non des sélecteurs : la séance charge son
 * programme, puis monte son plein écran, et attendre l'apparition d'un
 * élément précis ferait de chaque changement de maquette une panne du banc.
 */
export const start = async (p, sess) => {
  await p.goto(`${BASE}/client/session/${sess}`, {
    waitUntil: 'domcontentloaded',
  });
  await p.waitForTimeout(1700);
  await p.getByRole('button', { name: /Démarrer la séance/ }).click();
  await p.waitForTimeout(800);
  // L'écran d'ouverture porte la note du coach : on le franchit pour
  // atteindre la séance elle-même.
  const c = p.getByRole('button', { name: /^Commencer$/ });
  if (await c.count()) {
    await c.click();
    await p.waitForTimeout(400);
  }
};

/**
 * Où l'on en est, lu sur la barre de progression.
 *
 * C'est le seul repère fiable : le texte de l'écran annonce le bloc suivant
 * dès le dernier tour, ce qui donne l'impression qu'on y est déjà.
 */
export const where = (p) =>
  p.evaluate(
    () =>
      document
        .querySelector('[aria-label="Séance guidée"] [role="progressbar"]')
        ?.getAttribute('aria-valuetext') ?? ''
  );

/** Tout ce que le plein écran affiche, en texte : c'est là-dessus que la
 * plupart des assertions portent. */
export const guidedScreen = (p) =>
  p
    .evaluate(
      () =>
        document.querySelector('[aria-label="Séance guidée"]')?.innerText ?? ''
    )
    .then(clean);

/** Le texte de toutes les boîtes ouvertes — le bilan, les confirmations. */
export const dialogs = (p) =>
  p
    .evaluate(() =>
      [...document.querySelectorAll('[role="dialog"]')]
        .map((d) => d.innerText)
        .join('\n')
    )
    .then(clean);

/**
 * Le repos entre deux séries se pose dans la liste et non en plein écran :
 * son bouton s'appelle « Passer », et rien d'autre ne porte exactement ce
 * nom.
 */
export const skipRest = async (p) => {
  const r = p.getByRole('button', { name: 'Passer', exact: true });
  if (await r.count()) {
    await r.click();
    await p.waitForTimeout(250);
  }
};
