/**
 * La planche du kit : chaque pièce, dans chacun de ses états.
 *
 * Une pièce du kit ne se voyait que dans l'écran qui l'employait, et dans
 * l'état où cet écran la mettait. Cette suite ouvre la planche (`/kit`, en
 * développement seulement) et vérifie ce qui vaut pour toutes les pièces à
 * la fois : rien ne déborde à la largeur d'un téléphone, rien ne casse,
 * le focus se voit en ambre, et « moins d'animations » coupe le mouvement.
 */
import { BASE, launch, MOBILE, ok, failureCount, settle } from './common.mjs';

const DESKTOP = { viewport: { width: 1280, height: 800 } };
const PIECES = [
  'Boutons',
  'Pastilles',
  'Bulles',
  'Cartes',
  'Progression',
  'Personnage',
  'États',
  'Saisie',
  'Feuille',
];
const browser = await launch();

// La planche se lit sans compte : le serveur d'essai du banc répond à tout
// le monde, mais une capture faite à la main, sans lui, tombait sur l'écran
// de connexion. On refuse donc ici la session pour s'en assurer.
const anonymous = async (ctx) =>
  ctx.route(/\/api\/auth\/me(\?|$)/, (r) =>
    r.fulfill({ status: 401, json: { message: 'Non connecté' } })
  );

/** Ouvre la planche, et relève les erreurs de la page en route. */
const openBoard = async (options) => {
  const ctx = await browser.newContext(options);
  await anonymous(ctx);
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  // Le 401 de `/api/auth/me` est celui qu'on pose plus haut : le navigateur
  // le signale, et ce n'est pas une erreur de la planche.
  p.on(
    'console',
    (m) =>
      m.type() === 'error' &&
      !/status of 401/.test(m.text()) &&
      errors.push(m.text())
  );
  await p.goto(`${BASE}/kit`, { waitUntil: 'domcontentloaded' });
  await p
    .getByRole('heading', { name: 'Le kit' })
    .waitFor({ timeout: 8000 })
    .catch(() => {});
  return { ctx, p, errors };
};

{
  console.log('\n── la planche, sur un téléphone');
  const { ctx, p, errors } = await openBoard(MOBILE);
  const found = await p.evaluate(() =>
    [...document.querySelectorAll('[data-piece]')].map((s) => s.dataset.piece)
  );
  ok(
    'la planche se lit sans compte',
    new URL(p.url()).pathname === '/kit',
    new URL(p.url()).pathname
  );
  ok(
    'chaque pièce a sa place sur la planche',
    PIECES.every((name) => found.includes(name)),
    found.join(' · ')
  );
  // Contre la largeur de l'appareil, pas `innerWidth` : un téléphone
  // élargit sa fenêtre à ce qui déborde, et la page et la fenêtre
  // grandissaient ensemble — l'assertion restait verte sur une planche de
  // 480 px. Relevé en E11b, où le même piège a été pris par un sabotage.
  const overflow = await p.evaluate(
    (device) => ({
      page: document.documentElement.scrollWidth,
      wide: [...document.querySelectorAll('main *')]
        .filter((e) => e.getBoundingClientRect().right > device + 1)
        .slice(0, 3)
        .map((e) => e.tagName + (e.textContent ?? '').slice(0, 20)),
    }),
    p.viewportSize().width
  );
  ok(
    'rien ne déborde à 390 px',
    overflow.page === 390 && overflow.wide.length === 0,
    `${overflow.page} px · ${overflow.wide.join(' | ')}`
  );

  const chips = await p.evaluate(() =>
    ['md', 'lg'].map((size) =>
      [...document.querySelectorAll(`[data-chip-row="${size}"] > span`)].map(
        (c) => getComputedStyle(c).backgroundColor
      )
    )
  );
  ok(
    'sept tons de pastille, sept fonds distincts, aux deux tailles',
    chips.every((row) => row.length === 7 && new Set(row).size === 7),
    chips.map((row) => new Set(row).size).join(' · ')
  );

  const clamped = await p.evaluate(() => {
    const bubbles = document.querySelectorAll('[data-piece="Bulles"] p');
    const long = [...bubbles].find((b) =>
      /coupé à deux lignes/.test(b.textContent)
    );
    if (!long) return null;
    const line = parseFloat(getComputedStyle(long).lineHeight);
    return Math.round(long.getBoundingClientRect().height / line);
  });
  ok('une bulle coupée tient en deux lignes', clamped === 2, String(clamped));

  const moods = await p.evaluate(
    () => document.querySelectorAll('[data-mascot]').length
  );
  ok(
    'les cinq humeurs du personnage, plus celles des deux états',
    moods === 7,
    String(moods)
  );
  // Sans quoi l'assertion de « moins d'animations », plus bas, constaterait
  // une absence qui était déjà là.
  const moving = await p.evaluate(() =>
    [...document.querySelectorAll('[data-kit-board] [data-mascot] svg')].map(
      (m) => getComputedStyle(m).animationName
    )
  );
  ok(
    'le personnage se balance',
    moving.length > 0 && moving.every((name) => name !== 'none'),
    [...new Set(moving)].join(' · ')
  );

  // Sans attendre si le bouton manque : c'est l'assertion qui le dira.
  await p
    .getByRole('button', { name: 'Ouvrir la feuille' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const opened = await p.getByRole('dialog', { name: 'Une feuille' }).count();
  await p.mouse.click(195, 40);
  await settle(p);
  ok(
    'la feuille s’ouvre, et toucher le fond la referme',
    opened === 1 &&
      (await p.getByRole('dialog', { name: 'Une feuille' }).count()) === 0
  );

  ok('aucune erreur dans la page', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

{
  console.log('\n── le focus se voit, en ambre');
  const { ctx, p } = await openBoard(DESKTOP);
  // Le lien d'évitement vient d'abord : on avance jusqu'au bouton principal
  // de la planche.
  for (let i = 0; i < 4; i++) {
    await p.keyboard.press('Tab');
    const name = await p.evaluate(() =>
      document.activeElement?.textContent?.trim()
    );
    if (name === 'Démarrer') break;
  }
  const ring = await p.evaluate(() => {
    const el = document.activeElement;
    const s = getComputedStyle(el);
    return {
      name: el?.textContent?.trim(),
      outline: `${s.outlineStyle} ${s.outlineColor} ${s.outlineWidth}`,
      shadow: s.boxShadow,
    };
  });
  // L'ambre de la marque, #CF9F3F.
  const amber = /rgb\(207, 159, 63\)/;
  ok(
    'le bouton focalisé au clavier porte un anneau ambre',
    ring.name === 'Démarrer' &&
      (amber.test(ring.outline) || amber.test(ring.shadow)),
    `${ring.name} · ${ring.outline} · ${ring.shadow}`
  );
  const wide = await p.evaluate(
    () => document.documentElement.scrollWidth === window.innerWidth
  );
  ok('rien ne déborde sur grand écran', wide);
  await ctx.close();
}

{
  console.log('\n── moins d’animations, quand le téléphone le demande');
  const { ctx, p } = await openBoard({ ...MOBILE, reducedMotion: 'reduce' });
  // Sans attendre si le bouton manque : c'est l'assertion qui le dira.
  await p
    .getByRole('button', { name: 'Ouvrir la feuille' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const animation = await p.evaluate(() => {
    const sheet = document.querySelector('[role="dialog"]');
    return sheet ? getComputedStyle(sheet).animationName : '(pas de feuille)';
  });
  ok('la feuille apparaît sans monter', animation === 'none', animation);
  const sway = await p.evaluate(() =>
    [...document.querySelectorAll('[data-kit-board] [data-mascot] svg')].map(
      (m) => getComputedStyle(m).animationName
    )
  );
  ok(
    'le personnage ne se balance plus',
    sway.length > 0 && sway.every((name) => name === 'none'),
    [...new Set(sway)].join(' · ')
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() ? 1 : 0);
