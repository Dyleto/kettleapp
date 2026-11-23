/**
 * Le chargement (G2a) : des formes fantômes, jamais une roue seule, et
 * « C'est plus long que d'habitude » au bout de dix secondes.
 *
 * Une requête retenue par la suite garde l'écran en chargement aussi
 * longtemps qu'il faut ; l'horloge de la page avance de dix secondes sans
 * qu'on les attende. `settle` n'est pas appelé tant qu'une requête est
 * retenue : il attendrait qu'elle revienne.
 */
import {
  BASE,
  MOBILE,
  launch,
  ok,
  failureCount,
  signIn,
  clean,
} from './common.mjs';

const CLIENT = '507f1f77bcf86cd799439012';
const WIDE = { viewport: { width: 1440, height: 1000 } };
const SLOW = 'C’est plus long que d’habitude.';

/** Retient les lectures qui correspondent, jusqu'au feu vert. */
const holdBack = async (ctx, pattern) => {
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  await ctx.route(pattern, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    await gate;
    return route.fallback();
  });
  return () => release();
};
/**
 * Les formes de l'écran lui-même, dans `main`. La coque montre les siennes
 * le temps de vérifier la session, à chaque navigation : lues sans portée,
 * elles faisaient passer « Mon compte » pour chargé derrière des formes
 * quand il ne montrait rien — un sabotage l'a dit.
 */
const shapes = (p, layout) =>
  p.locator(layout ? `main [data-loading="${layout}"]` : 'main [data-loading]');
/** Les formes de la coque, avant qu'aucune page ne soit là. */
const shellShapes = (p) => p.locator('[data-loading]');
const spinners = (p) => p.locator('.chakra-spinner').count();
const slow = (p) => p.locator('main [data-slow]');

const browser = await launch();

{
  console.log('\n── « Mon compte »');
  const ctx = await browser.newContext(MOBILE);
  const release = await holdBack(ctx, /\/api\/account$/);
  const p = await signIn(ctx);
  await p.clock.install();
  await p.goto(`${BASE}/client/account`, { waitUntil: 'domcontentloaded' });
  await shapes(p, 'column')
    .waitFor({ timeout: 5000 })
    .catch(() => {});
  ok(
    '« Mon compte » charge derrière des formes, sans roue',
    (await shapes(p, 'column').count()) === 1 && (await spinners(p)) === 0,
    `${await shapes(p, 'column').count()} formes · ${await spinners(p)} roue(s)`
  );

  await p.clock.fastForward(9_000);
  const early = await slow(p).count();
  await p.clock.fastForward(1_500);
  await slow(p)
    .waitFor({ timeout: 3000 })
    .catch(() => {});
  const said = clean(
    await slow(p)
      .innerText({ timeout: 1000 })
      .catch(() => '')
  );
  ok(
    '  → rien avant dix secondes, puis « C’est plus long que d’habitude »',
    early === 0 && said === SLOW,
    `${early} avant · « ${said} »`
  );

  release();
  await p
    .getByRole('heading', { name: 'Mon compte', level: 1 })
    .waitFor({ timeout: 5000 })
    .catch(() => {});
  ok(
    '  → le contenu arrivé, les formes et la phrase partent',
    (await shapes(p).count()) === 0 && (await slow(p).count()) === 0
  );
  await ctx.close();
}

{
  console.log('\n── l’atelier d’un client');
  const ctx = await browser.newContext(WIDE);
  const release = await holdBack(
    ctx,
    new RegExp(`/api/coach/clients/${CLIENT}$`)
  );
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach/clients/${CLIENT}/s/1`, {
    waitUntil: 'domcontentloaded',
  });
  const workshop = shapes(p, 'workshop');
  await workshop.waitFor({ timeout: 5000 }).catch(() => {});
  // Les séances à gauche et les blocs au milieu : deux colonnes de formes,
  // visibles toutes deux sur grand écran.
  const columns = await workshop
    .locator('[data-loading-part]:visible')
    .evaluateAll((all) => all.map((e) => e.dataset.loadingPart).join(' '))
    .catch(() => '');
  ok(
    'l’atelier charge derrière ses formes : les séances, puis les blocs',
    (await workshop.count()) === 1 &&
      columns === 'sessions blocks' &&
      (await spinners(p)) === 0,
    `${await workshop.count()} formes · ${columns} · ${await spinners(p)} roue(s)`
  );
  release();
  await ctx.close();
}

{
  console.log('\n── avant de savoir qui est là');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  const release = await holdBack(ctx, /\/api\/auth\/me$/);
  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
  await shellShapes(p)
    .waitFor({ timeout: 5000 })
    .catch(() => {});
  ok(
    'l’application montre des formes, pas une roue ambre',
    (await shellShapes(p).count()) === 1 &&
      (await p.locator('main').count()) === 0 &&
      (await spinners(p)) === 0,
    `${await shellShapes(p).count()} formes · ${await spinners(p)} roue(s)`
  );
  release();
  await ctx.close();
}

{
  console.log('\n── un écran qui avait déjà ses formes');
  const ctx = await browser.newContext(MOBILE);
  const release = await holdBack(ctx, /\/api\/client\/program$/);
  const p = await signIn(ctx);
  await p.clock.install();
  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
  await p
    .locator('main [aria-busy="true"]')
    .first()
    .waitFor({ timeout: 5000 })
    .catch(() => {});
  await p.clock.fastForward(10_500);
  await slow(p)
    .waitFor({ timeout: 3000 })
    .catch(() => {});
  ok(
    'l’accueil aussi dit, après dix secondes, que c’est plus long',
    clean(
      await slow(p)
        .innerText({ timeout: 1000 })
        .catch(() => '')
    ) === SLOW
  );
  release();
  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
