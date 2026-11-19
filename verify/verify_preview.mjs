/**
 * L'aperçu « vu par le client », dans la colonne de droite de l'atelier
 * (E9b).
 *
 * C'est la scène même de la séance guidée, figée au début du bloc que le
 * coach touche, dans une iframe à la taille d'un téléphone : les scènes se
 * mettent en page d'après leur fenêtre, et rendues dans un cadre réduit de
 * l'écran du coach, elles prenaient leur mise en page large. La suite lit
 * donc l'intérieur de l'iframe — ce que le client verrait — et sa largeur.
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
} from './common.mjs';

const CLIENT = '507f1f77bcf86cd799439012';
const WIDE = { viewport: { width: 1440, height: 1000 } };
const MEDIUM = { viewport: { width: 1024, height: 900 } };

const text = (locator) =>
  locator
    .innerText({ timeout: 2000 })
    .then(clean)
    .catch(() => '');
const frameOf = (p) => p.frameLocator('iframe[title^="La séance vue par"]');
/** Ce que l'aperçu montre, une fois l'iframe chargée et la séance reçue :
 * on attend que la scène soit là, et non une durée. */
const shown = async (p, expected) => {
  const body = frameOf(p).locator('body');
  await body
    .getByText(expected)
    .first()
    .waitFor({ timeout: 5000 })
    .catch(() => {});
  return text(body);
};

const browser = await launch();
const open = async (options, path) => {
  await fetch(`${API}/api/mock/reset`, { method: 'POST' });
  const ctx = await browser.newContext(options);
  const p = await signIn(ctx);
  await p.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  return { ctx, p };
};

{
  console.log('\n── chez un client, sur grand écran');
  const { ctx, p } = await open(WIDE, `/coach/clients/${CLIENT}/s/1`);

  const first = await shown(p, 'Corde à sauter');
  ok(
    'l’aperçu montre la séance guidée, telle que le client l’aura devant lui',
    /Aperçu — vu par Sarah/i.test(await text(p.locator('main'))) &&
      /Bloc 1 sur 3/i.test(first) &&
      first.includes('Toucher pour lancer'),
    first.replace(/\n+/g, ' | ').slice(0, 120)
  );
  ok(
    '  → à la taille d’un téléphone, et non d’un écran large',
    (await frameOf(p)
      .locator('body')
      .evaluate(() => window.innerWidth)
      .catch(() => 0)) === 390,
    `${await frameOf(p)
      .locator('body')
      .evaluate(() => window.innerWidth)
      .catch(() => 0)} px de large`
  );
  ok(
    '  → rien ne s’y touche : il est inerte',
    (await p.locator('[data-session-preview] [inert] iframe').count()) === 1
  );

  const goblet = p
    .locator('main [data-exercise-row]')
    .filter({ hasText: 'Goblet Squat' })
    .first();
  await goblet
    .locator(':scope > button')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const emom = await shown(p, 'Tour 1 sur 10');
  ok(
    'il suit le bloc que le coach touche',
    /Bloc 2 sur 3/i.test(emom) && emom.includes('EMOM'),
    emom.replace(/\n+/g, ' | ').slice(0, 120)
  );

  await goblet
    .getByRole('button', { name: 'Augmenter les répétitions' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const raised = await shown(p, '13');
  ok(
    '  → et ce qu’il écrit, à la frappe',
    /13\s*\|?\s*Goblet Squat/.test(raised.replace(/\n+/g, ' | ')),
    raised.replace(/\n+/g, ' | ').slice(0, 160)
  );

  await p
    .locator('button[aria-pressed]')
    .filter({ hasText: /^Ressentis$/ })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const feedbackShown =
    (await p.locator('main [data-feedback-panel]').count()) === 1 &&
    (await p.locator('main [data-session-preview]').count()) === 0;
  await p
    .locator('button[aria-pressed]')
    .filter({ hasText: /^Aperçu$/ })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    'la bascule « Ressentis » montre les passages ; « Aperçu » rend l’aperçu',
    feedbackShown &&
      (await p.locator('main [data-session-preview]').count()) === 1
  );
  await ctx.close();
}

{
  console.log('\n── dans un modèle');
  const { ctx, p } = await open(WIDE, '/coach/templates/tpl1/s/1');
  const said = await shown(p, 'Bloc 1 sur');
  ok(
    'un modèle a son aperçu, vu par le client',
    /Aperçu — vu par le client/i.test(await text(p.locator('main'))) &&
      /Bloc 1 sur/i.test(said),
    said.replace(/\n+/g, ' | ').slice(0, 120)
  );
  await ctx.close();
}

{
  console.log('\n── sous 1 280 px');
  const { ctx, p } = await open(MEDIUM, `/coach/clients/${CLIENT}/s/1`);
  ok(
    'pas de colonne, pas d’aperçu',
    (await p.locator('[data-session-preview]').count()) === 0 &&
      (await p.locator('iframe').count()) === 0
  );
  await ctx.close();
}

await fetch(`${API}/api/mock/reset`, { method: 'POST' });
await browser.close();
process.exit(failureCount() ? 1 : 0);
