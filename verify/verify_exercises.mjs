/**
 * La bibliothèque d'exercices (F7a) : les lignes, leur ordre, le champ qui
 * cherche et crée, la fiche en panneau ou en feuille.
 *
 * Le serveur d'essai porte dix exercices, dont un seul avec une vidéo
 * (« Kettlebell Swing ») et deux jamais utilisés. Les ordres attendus sont
 * recalculés depuis ce qu'il sert, et non écrits en dur : un décor qui gagne
 * un exercice ne fait pas tomber une assertion qui ne parle pas de lui.
 *
 * Aucun nom du décor ne commence par un accent, et ses deux ex æquo sont
 * déjà dans l'ordre alphabétique chez l'API : l'accent et les ex æquo se
 * vérifient dans `library.test.ts`, pas ici.
 */
import {
  API,
  BASE,
  MOBILE,
  launch,
  ok,
  failureCount,
  signIn,
  settle,
  clean,
  gone,
} from './common.mjs';

const WIDE = { viewport: { width: 1440, height: 1000 } };

await fetch(`${API}/api/mock/reset`, { method: 'POST' });
const served = await (await fetch(`${API}/api/coach/exercises`)).json();
const byName = (a, b) =>
  a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
const nameOrder = [...served].sort(byName).map((e) => e._id);
const usageOrder = [...served]
  .sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0) || byName(a, b))
  .map((e) => e._id);

const text = (locator) =>
  locator
    .innerText({ timeout: 2000 })
    .then(clean)
    .catch(() => '');
const rows = (p) =>
  p
    .locator('[data-exercise-row]')
    .evaluateAll((els) => els.map((el) => el.getAttribute('data-exercise-row')))
    .catch(() => []);
const row = (p, id) => p.locator(`[data-exercise-row="${id}"]`);
const field = (p) =>
  p.getByRole('searchbox', { name: 'Chercher ou créer un exercice' });
const open = async (ctx, path = '/coach/exercises') => {
  const p = await signIn(ctx);
  await p.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  return p;
};

const browser = await launch();

{
  console.log('\n── la liste');
  const ctx = await browser.newContext(WIDE);
  const p = await open(ctx);
  ok(
    'l’écran porte le nom de son onglet, et compte ses exercices',
    (await text(p.locator('h1'))) === 'Exercices' &&
      (await text(p.locator('[data-exercise-count]'))) ===
        `${served.length} exercices`
  );
  ok(
    'par nom d’abord',
    (await rows(p)).join() === nameOrder.join(),
    (await rows(p)).join()
  );
  const withVideo = await p
    .locator('[data-exercise-row]:has([data-thumb="video"])')
    .evaluateAll((els) => els.map((el) => el.getAttribute('data-exercise-row')))
    .catch(() => []);
  ok(
    'une vignette dit quels mouvements ont une vidéo',
    withVideo.join() ===
      served
        .filter((e) => e.videoUrl)
        .map((e) => e._id)
        .join(),
    withVideo.join()
  );
  const usage = async (id) => text(row(p, id).locator('[data-usage]'));
  ok(
    'chaque ligne dit son usage : séances, une séance, jamais utilisé',
    (await usage('ex1')) === '12 séances' &&
      (await usage('ex7')) === '1 séance' &&
      (await usage('ex8')) === 'jamais utilisé',
    `${await usage('ex1')} · ${await usage('ex7')} · ${await usage('ex8')}`
  );
  ok(
    '  → et sa consigne, quand elle en a une',
    (await text(row(p, 'ex2').locator('[data-description]'))) ===
      'Kettlebell contre la poitrine, descendre entre les talons.' &&
      (await row(p, 'ex3').locator('[data-description]').count()) === 0
  );

  ok(
    'sans choix, le panneau montre le premier de la liste',
    (await p
      .locator('[data-exercise-panel]')
      .getAttribute('data-exercise-panel')
      .catch(() => '')) === nameOrder[0] &&
      (await row(p, nameOrder[0])
        .getAttribute('aria-current')
        .catch(() => '')) === 'true'
  );
  await row(p, 'ex2')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    'toucher une ligne ouvre sa fiche dans le panneau, et la marque',
    p.url().endsWith('/coach/exercises/ex2') &&
      (await p
        .locator('[data-exercise-panel]')
        .getAttribute('data-exercise-panel')
        .catch(() => '')) === 'ex2' &&
      (await row(p, 'ex2')
        .getAttribute('aria-current')
        .catch(() => '')) === 'true' &&
      (await row(p, nameOrder[0])
        .getAttribute('aria-current')
        .catch(() => '')) === null,
    p.url().split('/').at(-1)
  );

  await p
    .getByRole('button', { name: 'Trier : Par nom' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await p
    .getByRole('menuitem', { name: 'Les plus utilisés' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    '« Les plus utilisés » range par usage',
    (await rows(p)).join() === usageOrder.join() &&
      (await p
        .getByRole('button', { name: 'Trier : Les plus utilisés' })
        .count()) === 1,
    (await rows(p)).join()
  );
  await ctx.close();
}

{
  console.log('\n── le champ qui cherche et crée');
  const ctx = await browser.newContext(WIDE);
  const p = await open(ctx);
  await field(p)
    .fill('CORDE a')
    .catch(() => {});
  ok(
    'chercher garde chaque mot, sans accent ni casse',
    (await rows(p)).join() === 'ex8',
    (await rows(p)).join()
  );
  await field(p)
    .fill('corde a sauter')
    .catch(() => {});
  ok(
    'un nom qui existe déjà, à l’accent près, ne se propose pas',
    (await rows(p)).join() === 'ex8' &&
      (await p.locator('[data-create-exercise]').count()) === 0
  );
  await field(p)
    .fill('Soulevé de terre')
    .catch(() => {});
  const offer = await text(p.locator('[data-create-exercise]'));
  const body = await text(p.locator('main'));
  ok(
    'un nom neuf : « Créer », et la phrase qui dit pourquoi',
    (await rows(p)).length === 0 &&
      offer === 'Créer « Soulevé de terre »' &&
      body.includes('Aucun exercice ne porte ce nom.'),
    offer
  );
  await field(p)
    .press('Enter')
    .catch(() => {});
  await settle(p);
  const created = (
    await (await fetch(`${API}/api/coach/exercises`)).json()
  ).find((e) => e.name === 'Soulevé de terre');
  ok(
    'Entrée le crée, ouvre sa fiche et vide le champ',
    !!created &&
      p.url().endsWith(`/coach/exercises/${created._id}`) &&
      (await p
        .locator('[data-exercise-panel]')
        .getAttribute('data-exercise-panel')
        .catch(() => '')) === created._id &&
      (await field(p)
        .inputValue()
        .catch(() => '?')) === '' &&
      (await text(p.locator('[data-exercise-count]'))) ===
        `${served.length + 1} exercices`,
    `${created?._id} · ${p.url().split('/').at(-1)}`
  );
  await ctx.close();
}

{
  console.log('\n── sur téléphone');
  const ctx = await browser.newContext(MOBILE);
  const p = await open(ctx);
  ok(
    'sans choix, aucune fiche ne s’ouvre',
    (await p.getByRole('dialog').count()) === 0 &&
      (await p.locator('[data-exercise-panel]').count()) === 0
  );
  await row(p, 'ex1')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const sheet = p.getByRole('dialog', { name: 'Kettlebell Swing' });
  ok(
    'toucher une ligne monte sa fiche dans une feuille',
    (await sheet.count()) === 1 &&
      (await sheet
        .getByRole('button', { name: "Nom de l'exercice" })
        .count()) === 1
  );
  await p.goBack();
  await gone(sheet);
  ok(
    '  → et le retour du téléphone la referme',
    (await sheet.count()) === 0 && p.url().endsWith('/coach/exercises'),
    p.url().split('/').at(-1)
  );
  await ctx.close();
}

{
  console.log('\n── une bibliothèque vide');
  const ctx = await browser.newContext(MOBILE);
  await ctx.route(/\/api\/coach\/exercises$/, (r) =>
    r.request().method() === 'GET' ? r.fulfill({ json: [] }) : r.fallback()
  );
  const p = await open(ctx);
  const body = await text(p.locator('main'));
  ok(
    'une bibliothèque vide dit comment la remplir',
    body.includes('Ta bibliothèque est vide') &&
      body.includes('Tape le nom d') &&
      (await p.locator('main [data-mascot="hello"]').count()) === 1 &&
      (await p.getByRole('button', { name: /^Trier/ }).count()) === 0,
    body.slice(0, 120).replace(/\n/g, ' · ')
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
