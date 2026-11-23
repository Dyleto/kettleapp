/**
 * Ce que la relecture d'accessibilité (H1b) a trouvé, tenu.
 *
 * La relecture a passé chaque écran à axe-core, au téléphone et sur grand
 * écran, puis à la main : le focus à chaque arrêt de tabulation, le titre
 * du document, la largeur de 320 px. Ce banc ne charge pas axe : il vérifie
 * les propriétés qu'elle a fait réparer, sur tous les écrans à la fois
 * quand la propriété vaut partout.
 *
 * - un seul titre de niveau 1 visible par écran — l'atelier et les
 *   ressentis d'un client n'en avaient aucun sur grand écran ;
 * - un repère principal pour le lien « Aller au contenu » — les pages
 *   légales n'en avaient pas, et un titre de document qui les nomme ;
 * - le texte de danger lisible aux seuils — « Se déconnecter » tenait
 *   4,4:1 dans le menu, « Supprimer le bloc » 4,0:1 ;
 * - rien de plus large que 320 px — le programme et les modèles
 *   débordaient.
 */
import {
  BASE,
  MOBILE,
  launch,
  ok,
  failureCount,
  signIn,
  settle,
} from './common.mjs';

const CLIENT = '507f1f77bcf86cd799439012';
const WIDE = { viewport: { width: 1440, height: 1000 } };
const NARROW = {
  viewport: { width: 320, height: 640 },
  isMobile: true,
  hasTouch: true,
};
const row = (o) => ({
  unseenCount: 0,
  linkedAt: '2026-08-01T10:00:00.000Z',
  tagIds: [],
  weekDone: 1,
  weekTarget: 3,
  sessionCount: 3,
  recentEfforts: [3, 3],
  lastCompletedAt: '2026-11-20T10:00:00.000Z',
  ...o,
});
const ROSTER = [
  row({ _id: CLIENT, firstName: 'Sarah', lastName: 'Martin' }),
  row({ _id: 'karim', firstName: 'Karim', lastName: 'Haddad' }),
];
const SCREENS = [
  ['/client', 'Aujourd’hui'],
  ['/client/program', 'Programme'],
  ['/client/session/sess1', 'fiche de séance'],
  ['/client/history', 'Progrès'],
  ['/client/account', 'Mon compte (client)'],
  ['/coach', 'À lire'],
  ['/coach/clients', 'Clients'],
  [`/coach/clients/${CLIENT}/s/1`, 'atelier'],
  [`/coach/clients/${CLIENT}/journal`, 'ressentis'],
  ['/coach/templates', 'Modèles'],
  ['/coach/templates/tpl1/s/1', 'un modèle'],
  ['/coach/exercises', 'Exercices'],
  ['/coach/account', 'Mon compte (coach)'],
  ['/confidentialite', 'confidentialité'],
  ['/mentions-legales', 'mentions légales'],
];

const browser = await launch();
const open = async (options, path) => {
  const ctx = await browser.newContext(options);
  await ctx.route(/\/api\/coach\/clients(\?|$)/, (r) =>
    r.fulfill({ json: ROSTER })
  );
  const p = await signIn(ctx);
  await p.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  return { ctx, p };
};
/** Les titres de niveau 1 qu'un lecteur d'écran trouve : ceux qu'on voit. */
const visibleH1 = (p) =>
  p.evaluate(() =>
    [...document.querySelectorAll('h1')]
      .filter((h) => h.checkVisibility())
      .map((h) => h.innerText.trim())
  );
/**
 * Le contraste d'un texte sur le premier fond opaque sous lui, selon la
 * formule du WCAG.
 */
const contrast = (locator) =>
  locator
    .evaluate((el) => {
      const rgb = (c) => (c.match(/[\d.]+/g) ?? []).map(Number);
      const lum = ([r, g, b]) =>
        [r, g, b]
          .map((v) => v / 255)
          .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
          .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
      let node = el;
      let back = null;
      while (node) {
        const c = rgb(getComputedStyle(node).backgroundColor);
        if (c.length === 3 || (c.length === 4 && c[3] >= 0.99)) {
          back = c;
          break;
        }
        node = node.parentElement;
      }
      const front = rgb(getComputedStyle(el).color);
      if (!back) return null;
      const [a, b] = [lum(front), lum(back)].sort((x, y) => y - x);
      return Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100;
    })
    .catch(() => null);

{
  console.log('\n── un seul titre de niveau 1 par écran');
  for (const [label, options] of [
    ['téléphone', MOBILE],
    ['grand écran', WIDE],
  ]) {
    const wrong = [];
    for (const [path, name] of SCREENS) {
      const { ctx, p } = await open(options, path);
      const h1 = await visibleH1(p);
      if (h1.length !== 1) wrong.push(`${name} : ${h1.length}`);
      await ctx.close();
    }
    ok(
      `${label} : chaque écran porte un titre de niveau 1, et un seul`,
      wrong.length === 0,
      wrong.join(' · ') || 'tous'
    );
  }
  const { ctx, p } = await open(WIDE, `/coach/clients/${CLIENT}/s/1`);
  const workshop = await visibleH1(p);
  await p.goto(`${BASE}/coach/clients/${CLIENT}/journal`, {
    waitUntil: 'domcontentloaded',
  });
  await settle(p);
  const journal = await visibleH1(p);
  ok(
    '  → sur grand écran, l’atelier et les ressentis s’intitulent du nom du client',
    workshop.join() === 'Sarah Martin' && journal.join() === 'Sarah Martin',
    `${workshop.join()} | ${journal.join()}`
  );
  await ctx.close();
}

{
  console.log('\n── les pages légales');
  const seen = [];
  for (const [path, expected] of [
    ['/confidentialite', 'Politique de confidentialité · Kettle'],
    ['/mentions-legales', 'Mentions légales · Kettle'],
  ]) {
    const ctx = await browser.newContext(MOBILE);
    const p = await ctx.newPage();
    await p.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
    await settle(p);
    const page = await p.evaluate(() => {
      const target = document.getElementById(
        (
          document.querySelector('a[href^="#"]')?.getAttribute('href') ?? '#'
        ).slice(1)
      );
      return {
        skip: target?.tagName.toLowerCase() ?? null,
        mains: document.querySelectorAll('main').length,
        title: document.title,
      };
    });
    seen.push({ path, expected, ...page });
    await ctx.close();
  }
  ok(
    'le lien « Aller au contenu » y mène au repère principal, et il n’y en a qu’un',
    seen.every((s) => s.skip === 'main' && s.mains === 1),
    seen.map((s) => `${s.path} → ${s.skip} (${s.mains})`).join(' · ')
  );
  ok(
    'l’onglet dit quel document est ouvert',
    seen.every((s) => s.title === s.expected),
    seen.map((s) => `« ${s.title} »`).join(' · ')
  );
}

{
  console.log('\n── le texte de danger, lisible');
  const measured = [];
  {
    const { ctx, p } = await open(MOBILE, '/client');
    await p
      .getByRole('button', { name: /^Menu du compte/ })
      .first()
      .click({ timeout: 2000 })
      .catch(() => {});
    await settle(p);
    measured.push([
      'feuille du compte',
      await contrast(
        p
          .getByRole('dialog', { name: 'Menu du compte' })
          .getByText('Se déconnecter', { exact: true })
      ),
    ]);
    await ctx.close();
  }
  {
    const { ctx, p } = await open(WIDE, `/coach/clients/${CLIENT}/s/1`);
    await p
      .getByRole('button', { name: /^Menu du compte/ })
      .first()
      .click({ timeout: 2000 })
      .catch(() => {});
    await settle(p);
    measured.push([
      'menu du compte',
      await contrast(p.getByRole('menuitem', { name: 'Se déconnecter' })),
    ]);
    await p.keyboard.press('Escape');
    await settle(p);
    await p
      .getByRole('button', { name: /^Menu du bloc / })
      .first()
      .click({ timeout: 2000 })
      .catch(() => {});
    await settle(p);
    measured.push([
      'menu d’un bloc',
      await contrast(p.getByRole('menuitem', { name: 'Supprimer le bloc' })),
    ]);
    await p.keyboard.press('Escape');
    await settle(p);
    await p
      .getByRole('button', { name: 'Menu de la séance 1' })
      .click({ timeout: 2000 })
      .catch(() => {});
    await settle(p);
    measured.push([
      'menu d’une séance',
      await contrast(
        p.getByRole('menuitem', { name: 'Supprimer la séance 1' })
      ),
    ]);
    await ctx.close();
  }
  ok(
    '« Se déconnecter », « Supprimer » : au moins 4,5:1 sur leur fond',
    measured.every(([, ratio]) => ratio !== null && ratio >= 4.5),
    measured.map(([where, ratio]) => `${where} ${ratio}`).join(' · ')
  );
}

{
  console.log('\n── 320 px de large');
  const wide = [];
  for (const [path, name] of SCREENS) {
    const { ctx, p } = await open(NARROW, path);
    const width = await p.evaluate(() => document.documentElement.scrollWidth);
    if (width > 320) wide.push(`${name} : ${width} px`);
    await ctx.close();
  }
  ok(
    'aucun écran ne défile de côté à 320 px de large',
    wide.length === 0,
    wide.join(' · ') || 'tous tiennent'
  );

  // La carte d'un modèle ne débordait pas de l'écran, mais de sa colonne :
  // elle touchait le bord droit, quatre pixels de marge contre seize à
  // gauche.
  const cards = [];
  for (const [path, selector] of [
    ['/client/program', '[data-program-card]'],
    ['/coach/templates', '[data-template-card]'],
  ]) {
    const { ctx, p } = await open(NARROW, path);
    const right = await p
      .locator(selector)
      .evaluateAll((all) =>
        Math.max(...all.map((el) => el.getBoundingClientRect().right))
      )
      .catch(() => null);
    cards.push(`${path} ${Math.round(right)}`);
    await ctx.close();
  }
  ok(
    '  → les cartes du programme et des modèles gardent leur marge de 16 px',
    cards.every((c) => Number(c.split(' ')[1]) <= 304),
    cards.join(' · ')
  );
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
