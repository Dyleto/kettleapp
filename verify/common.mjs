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

/**
 * Le serveur d'essai de cette suite.
 *
 * Le front de développement vise toujours `localhost:3001`. Quand le lanceur
 * fait tourner plusieurs suites à la fois, chacune reçoit son propre serveur
 * sur son propre port — sans quoi l'état de l'une (une séance envoyée, un
 * exercice créé) fuirait dans l'autre. `API` est l'adresse à utiliser depuis
 * Node ; ce qui part du navigateur est détourné par `launch`.
 */
export const MOCK_PORT = Number(process.env.KETTLE_MOCK_PORT ?? 3001);
export const API = `http://localhost:${MOCK_PORT}`;

/**
 * Ouvre un navigateur, en laissant Playwright trouver le sien quand on n'a
 * rien à lui dire.
 *
 * Quand la suite a son propre serveur d'essai, chaque contexte détourne vers
 * lui ce que la page envoie à `localhost:3001`. La page n'en voit rien :
 * même adresse, mêmes cookies. Une route posée par une suite passe devant
 * celle-ci ; si elle laisse passer la requête, c'est par `fallback()` et non
 * `continue()`, qui l'enverrait au port d'origine sans passer par ici.
 */
export const launch = async () => {
  const browser = await chromium.launch(
    CHROME ? { executablePath: CHROME } : {}
  );
  if (MOCK_PORT === 3001) return browser;
  const newContext = browser.newContext.bind(browser);
  browser.newContext = async (options) => {
    const ctx = await newContext(options);
    await ctx.route(/^http:\/\/localhost:3001\//, (route) =>
      route.continue({
        url: route
          .request()
          .url()
          .replace('localhost:3001', `localhost:${MOCK_PORT}`),
      })
    );
    return ctx;
  };
  return browser;
};

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
 * Franchir le décompte 3, 2, 1 sans l'attendre.
 *
 * Toucher l'écran passe tout de suite à la suite : c'est le geste de
 * quelqu'un qui est déjà en place, et c'est celui du banc, qui n'a aucune
 * raison de passer trois secondes par séance à regarder des chiffres.
 */
export const skipCountdown = async (p) => {
  const countdown = p.getByRole('button', { name: /^Départ dans/ });
  if (await countdown.count()) {
    await countdown.click();
    await p.waitForTimeout(300);
  }
};

/**
 * Quitter la séance en la gardant sur l'appareil : la pause, puis
 * « Arrêter et reprendre plus tard ».
 *
 * « Quitter » n'existe plus ; la pause le remplace, et c'est elle qui dit
 * qu'on reprendra. Les suites qui sortent puis reviennent passent par ici.
 */
export const leaveSession = async (p) => {
  await p.getByRole('button', { name: 'Mettre la séance en pause' }).click();
  await p.waitForTimeout(400);
  await p
    .getByRole('button', { name: 'Arrêter et reprendre plus tard' })
    .click();
  await p.waitForTimeout(900);
};

/**
 * Terminer la séance en route, par la pause.
 *
 * C'est la sortie qui existe toujours, quel que soit le bloc et quoi que
 * dise le bouton principal : elle était un lien dans la scène, partagé avec
 * « Passer ce bloc » sous un libellé qui changeait selon le bloc.
 */
export const finishFromPause = async (p) => {
  await p.getByRole('button', { name: 'Mettre la séance en pause' }).click();
  await p.waitForTimeout(400);
  await p
    .getByRole('button', { name: 'Terminer la séance maintenant' })
    .click();
  await p.waitForTimeout(1300);
};

/**
 * Le bouton de la fiche qui ouvre la séance guidée : « Démarrer », ou
 * « Reprendre » quand elle est en cours sur l'appareil.
 */
export const START = /^(Démarrer|Reprendre)$/;

/**
 * « Je l'ai déjà faite » : la feuille qui demande la date, puis
 * « Continuer ». On arrive sur « Mes charges ».
 *
 * Le bouton se cherche dans la feuille : « Mes charges » en porte un du
 * même nom, et c'est celui de la feuille qu'on veut.
 */
export const declareDone = async (p) => {
  await p.getByRole('button', { name: /^Je l.ai déjà faite$/ }).click();
  await p.waitForTimeout(500);
  await p
    .getByRole('dialog', { name: /sans l.application/ })
    .getByRole('button', { name: 'Continuer', exact: true })
    .click();
  await p.waitForTimeout(700);
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
  await p.getByRole('button', { name: START }).click();
  await p.waitForTimeout(800);
  // L'écran d'ouverture porte la note du coach : on le franchit pour
  // atteindre la séance elle-même.
  const c = p.getByRole('button', { name: /C'est parti/ });
  if (await c.count()) {
    await c.click();
    await p.waitForTimeout(300);
    await skipCountdown(p);
  }
};

/**
 * Où l'on en est, lu sur la barre de progression : « Bloc 2 sur 3 · tour 3
 * sur 10 — EMOM ».
 *
 * C'est le seul repère fiable : le texte de l'écran annonce le bloc suivant
 * dès le dernier tour, ce qui donne l'impression qu'on y est déjà. Le format
 * du bloc vient en dernier, pour qu'un motif comme `/— EMOM$/` le désigne
 * sans dépendre du rang.
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

/**
 * Lancer l'horloge d'un bloc chronométré : « Lancer », puis le décompte
 * franchi d'une touche.
 */
export const launchClock = async (p) => {
  // Absent, il n'est pas cliqué : c'est l'assertion qui juge, la suite ne
  // plante pas sur un bouton qui manque.
  const button = p.getByRole('button', { name: 'Lancer', exact: true });
  if (!(await button.count())) return;
  await button.click();
  await p.waitForTimeout(300);
  await skipCountdown(p);
};

/**
 * Ce que dit l'horloge d'un bloc chronométré : son étiquette, « Tour 3 sur
 * 10 — 42 secondes restantes ». `null` hors d'un tel bloc.
 */
export const timerLabel = (p) =>
  p
    .locator('[role="timer"]')
    .first()
    .getAttribute('aria-label', { timeout: 1000 })
    .then(clean)
    .catch(() => null);

/**
 * Passer le bloc en cours par la pause. C'est le chemin d'un bloc
 * chronométré, qui n'a plus de bouton « Suivant » : les tours y passent à
 * l'horloge.
 */
export const passBlock = async (p) => {
  await p.getByRole('button', { name: 'Mettre la séance en pause' }).click();
  await p.waitForTimeout(400);
  await p.getByRole('button', { name: 'Passer ce bloc' }).click();
  await p.waitForTimeout(400);
};

/**
 * Un écran plus loin, quel qu'il soit.
 *
 * Le bouton principal quand il y en a un — une série, un repos, la fin d'un
 * bloc. Sur un bloc chronométré il n'y en a pas : la flèche « Tour suivant »,
 * et au dernier tour, où elle s'efface, la pause et « Passer ce bloc ». Les
 * suites qui traversent une séance pour atteindre un écran passent par ici,
 * sans avoir à savoir quel format elles franchissent.
 */
export const advance = async (p) => {
  const main = p.getByRole('button', {
    name: /^(Fait|Série faite|Palier fait|Suivant|Bloc suivant|Passer|Terminer)$/,
  });
  if (await main.count()) {
    await main.first().click();
    await p.waitForTimeout(220);
    return;
  }
  const round = p.getByRole('button', { name: 'Tour suivant', exact: true });
  if (await round.count()) {
    await round.click();
    await p.waitForTimeout(220);
    return;
  }
  await passBlock(p);
};

/**
 * De la fin d'une séance jusqu'au ressenti, quel que soit le chemin.
 *
 * Menée en mode guidé, la séance finit sur l'écran de fête : « Continuer ».
 * Déclarée faite sans lui, elle demande encore les charges : « Passer au
 * ressenti ». Les suites qui éprouvent autre chose que ces écrans les
 * franchissent par ici.
 */
export const reachFeeling = async (p) => {
  for (const name of [/^Continuer$/, /Passer au ressenti/]) {
    const button = p.getByRole('button', { name });
    if (await button.count()) {
      await button.first().click();
      await p.waitForTimeout(900);
      return;
    }
  }
};
