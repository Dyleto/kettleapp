/**
 * Les messages (G3) : un seul à la fois, trois secondes, jamais pour un
 * enregistrement automatique ; la bannière « Annuler » reste huit secondes,
 * et une suppression nouvelle chasse la précédente, qui devient définitive.
 *
 * Les durées se mènent à l'horloge de la page : on avance de 2,5 s puis
 * d'une seconde, sans les attendre.
 */
import {
  API,
  BASE,
  launch,
  ok,
  failureCount,
  signIn,
  settle,
  clean,
  autosaved,
} from './common.mjs';

const CLIENT = '507f1f77bcf86cd799439012';
const WIDE = { viewport: { width: 1440, height: 1000 } };

const reset = () => fetch(`${API}/api/mock/reset`, { method: 'POST' });
const toasts = (p) => p.locator('[data-scope="toast"][data-part="root"]');
/** Les messages encore ouverts : un message fermé reste un instant dans le
 * DOM, le temps de sa sortie. */
const open = (p) =>
  p.locator('[data-scope="toast"][data-part="root"][data-state="open"]');
/**
 * Fige l'horloge de la page à l'instant présent.
 *
 * Installée, elle tourne au rythme réel : une attente de la suite laissait
 * le temps passer, et le message partait de lui-même. Les assertions des
 * durées restaient vertes un message de cinq secondes ou une bannière de
 * trois — un sabotage l'a dit.
 */
const freeze = async (p) => {
  const now = await p.evaluate(() => Date.now());
  await p.clock.pauseAt(now + 50);
};
const titles = (p) =>
  p
    .locator('[data-scope="toast"][data-part="title"]')
    .allInnerTexts()
    .then((all) => all.map(clean))
    .catch(() => []);
const rows = (p) => p.locator('main [data-exercise-row]');
const row = (p, name) => rows(p).filter({ hasText: name }).first();
/** Ouvre la ligne d'un exercice et le retire. */
const removeExercise = async (p, name) => {
  const toggle = row(p, name).locator(':scope > button');
  if (
    (await toggle
      .getAttribute('aria-expanded', { timeout: 2000 })
      .catch(() => null)) !== 'true'
  )
    await toggle.click({ timeout: 2000 }).catch(() => {});
  await settle(p);
  await p
    .getByRole('button', { name: `Retirer ${name}`, exact: true })
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
};
const openWorkshop = async (ctx, { clock = false } = {}) => {
  const p = await signIn(ctx);
  if (clock) await p.clock.install();
  await p.goto(`${BASE}/coach/clients/${CLIENT}/s/1`, {
    waitUntil: 'domcontentloaded',
  });
  await settle(p);
  return p;
};

const browser = await launch();

{
  console.log('\n── l’atelier');
  await reset();
  const ctx = await browser.newContext(WIDE);
  const p = await openWorkshop(ctx);

  await p
    .getByRole('button', { name: 'Nom de la séance 1' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await p.keyboard.type('Brouillon');
  await p.keyboard.press('Enter');
  await autosaved(p);
  ok(
    'un enregistrement automatique ne s’annonce par aucun message',
    (await toasts(p).count()) === 0,
    (await titles(p)).join(' | ')
  );

  await removeExercise(p, 'Corde à sauter');
  await removeExercise(p, 'Mountain Climbers');
  const shown = await titles(p);
  ok(
    'deux suppressions de suite : une seule bannière, celle de la dernière',
    shown.length === 1 && shown[0] === 'Mountain Climbers retiré',
    shown.join(' | ')
  );

  await toasts(p)
    .first()
    .getByRole('button', { name: 'Annuler' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await autosaved(p);
  ok(
    '  → « Annuler » reprend la dernière ; la première, chassée, reste faite',
    (await row(p, 'Mountain Climbers').count()) === 1 &&
      (await row(p, 'Corde à sauter').count()) === 0,
    `${await row(p, 'Mountain Climbers').count()} · ${await row(p, 'Corde à sauter').count()}`
  );
  await ctx.close();
}

{
  console.log('\n── les durées');
  await reset();
  const ctx = await browser.newContext(WIDE);
  const p = await openWorkshop(ctx, { clock: true });
  await removeExercise(p, 'Corde à sauter');
  await toasts(p)
    .first()
    .waitFor({ timeout: 3000 })
    .catch(() => {});
  await freeze(p);
  await p.clock.fastForward(7_000);
  const stillThere = await open(p).count();
  await p.clock.fastForward(1_500);
  ok(
    'la bannière « Annuler » reste huit secondes, pas davantage',
    stillThere === 1 && (await open(p).count()) === 0,
    `${stillThere} à 7 s · ${await open(p).count()} à 8,5 s`
  );
  await ctx.close();
}

{
  await reset();
  const ctx = await browser.newContext(WIDE);
  const p = await signIn(ctx);
  await p.clock.install();
  await p.goto(`${BASE}/coach/templates`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  await p
    .getByRole('button', { name: 'Menu du modèle Prise de masse' })
    .click({ timeout: 3000 })
    .catch(() => {});
  await p
    .getByRole('menuitem', { name: 'Supprimer' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await p
    .getByRole('alertdialog')
    .getByRole('button', { name: /^Supprimer$/ })
    .click({ timeout: 2000 })
    .catch(() => {});
  await toasts(p)
    .first()
    .waitFor({ timeout: 4000 })
    .catch(() => {});
  await freeze(p);
  const said = await titles(p);
  await p.clock.fastForward(2_000);
  const stillThere = await open(p).count();
  await p.clock.fastForward(1_500);
  ok(
    'un message ordinaire reste trois secondes',
    said.join() === 'Modèle supprimé' &&
      stillThere === 1 &&
      (await open(p).count()) === 0,
    `${said.join()} · ${stillThere} à 2 s · ${await open(p).count()} à 3,5 s`
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
