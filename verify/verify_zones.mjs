/**
 * La panne d'une zone, dans sa zone (G2b).
 *
 * Une seule lecture échoue, et le reste de l'écran reste à sa place : le
 * résumé de « Mon compte », les dernières séances d'un client dans
 * l'aperçu, l'historique dans l'atelier. Sans cela, ces zones retombaient
 * sur leur état vide et affirmaient le faux.
 *
 * Les lectures réessaient trois fois, à une, deux puis quatre secondes,
 * avant de se dire en panne : la suite avance l'horloge de la page plutôt
 * que d'attendre sept secondes.
 */
import {
  BASE,
  MOBILE,
  launch,
  ok,
  failureCount,
  signIn,
  settle,
  clean,
} from './common.mjs';

const CLIENT = '507f1f77bcf86cd799439012';
const WIDE = { viewport: { width: 1440, height: 1000 } };

const failure = (scope) => scope.locator('[data-zone-failure]');
const text = (locator) =>
  locator
    .innerText({ timeout: 2000 })
    .then(clean)
    .catch(() => '');

/** Fait échouer les lectures qui correspondent tant que `state.down`. */
const breakReads = async (ctx, pattern) => {
  const state = { down: true };
  await ctx.route(pattern, (route) =>
    state.down && route.request().method() === 'GET'
      ? route.fulfill({ status: 500, json: { message: 'Panne' } })
      : route.fallback()
  );
  return state;
};

/** Laisse passer les trois nouvelles tentatives, puis attend la panne. */
const pastRetries = async (p, scope = p) => {
  for (let i = 0; i < 4; i++) {
    await p.clock.fastForward(4_000);
    if (await failure(scope).count()) break;
    await settle(p);
  }
  await failure(scope)
    .first()
    .waitFor({ timeout: 3000 })
    .catch(() => {});
};

const browser = await launch();

{
  console.log('\n── « Mon compte » sans son résumé');
  const ctx = await browser.newContext(MOBILE);
  const reads = await breakReads(ctx, /\/api\/account$/);
  const p = await signIn(ctx);
  await p.clock.install();
  await p.goto(`${BASE}/client/account`, { waitUntil: 'domcontentloaded' });
  await pastRetries(p);
  ok(
    'la panne dit ce qui manque à sa place, et le reste de l’écran demeure',
    (await text(failure(p))).startsWith(
      'Ton coach et tes données de santé n’ont pas pu se charger. Rien n’a changé.'
    ) &&
      (await p.locator('[data-account-identity]').count()) === 1 &&
      (await p.getByRole('switch', { name: 'Sons du chronomètre' }).count()) ===
        1 &&
      (await p.getByRole('button', { name: 'Se déconnecter' }).count()) === 1,
    await text(failure(p))
  );
  ok(
    '  → sans le résumé, la suppression ne s’offre pas : elle ne saurait dire ce qui part',
    (await p.getByRole('button', { name: 'Supprimer mon compte' }).count()) ===
      0
  );

  reads.down = false;
  await failure(p)
    .getByRole('button', { name: 'Réessayer' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  await p
    .locator('[data-account-coaches]')
    .waitFor({ timeout: 4000 })
    .catch(() => {});
  ok(
    '  → « Réessayer » relit, et le bloc revient à sa place',
    (await failure(p).count()) === 0 &&
      (await p.locator('[data-account-coaches]').count()) === 1 &&
      (await p
        .getByRole('button', { name: 'Supprimer mon compte' })
        .count()) === 1
  );
  await ctx.close();
}

{
  const ctx = await browser.newContext(MOBILE);
  await breakReads(ctx, /\/api\/account$/);
  const p = await signIn(ctx);
  await p.clock.install();
  await p.goto(`${BASE}/coach/account`, { waitUntil: 'domcontentloaded' });
  await pastRetries(p);
  ok(
    'côté coach, c’est son activité qui manque',
    (await text(failure(p))).startsWith(
      'Ton activité n’a pas pu se charger. Rien n’a changé.'
    ),
    await text(failure(p))
  );
  await ctx.close();
}

{
  console.log('\n── l’aperçu d’un client sans ses séances');
  const ctx = await browser.newContext(WIDE);
  // Le serveur d'essai ne sert pas de liste de clients : un seul suffit.
  await ctx.route(/\/api\/coach\/clients(\?|$)/, (route) =>
    route.fulfill({
      json: [
        {
          _id: 'lea',
          firstName: 'Léa',
          lastName: 'Dubois',
          unseenCount: 0,
          linkedAt: '2026-06-01T10:00:00.000Z',
          tagIds: [],
          weekDone: 1,
          weekTarget: 3,
          sessionCount: 3,
          recentEfforts: [3, 3],
          lastCompletedAt: '2026-11-20T10:00:00.000Z',
        },
      ],
    })
  );
  await breakReads(ctx, /\/api\/coach\/clients\/[^/]+\/history/);
  const p = await signIn(ctx);
  await p.clock.install();
  await p.goto(`${BASE}/coach/clients`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  // Sans choix, le panneau attend : on ouvre le premier client.
  await p
    .locator('main [data-client-row]')
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
  const aside = p.getByRole('complementary', { name: 'Aperçu du client' });
  await pastRetries(p, aside);
  ok(
    'l’aperçu dit que ses séances n’ont pas chargé, et non qu’il n’en a aucune',
    (await text(failure(aside))).startsWith(
      'Ses dernières séances n’ont pas pu se charger.'
    ) &&
      !(await text(aside)).includes('Ses séances terminées apparaîtront ici') &&
      (await aside
        .getByRole('button', { name: 'Ouvrir son programme' })
        .count()) === 1,
    await text(failure(aside))
  );
  await ctx.close();
}

{
  console.log('\n── l’atelier sans l’historique');
  const ctx = await browser.newContext(WIDE);
  await breakReads(ctx, new RegExp(`/api/coach/clients/${CLIENT}/history`));
  const p = await signIn(ctx);
  await p.clock.install();
  await p.goto(`${BASE}/coach/clients/${CLIENT}/s/1`, {
    waitUntil: 'domcontentloaded',
  });
  await settle(p);
  await p
    // La pastille de la colonne, voisine d'« Aperçu », et non le bouton de
    // l'en-tête qui porte le même nom.
    .getByRole('button', { name: 'Aperçu', exact: true })
    .locator('xpath=..')
    .getByRole('button', { name: 'Ressentis', exact: true })
    .click({ timeout: 2000 })
    .catch(() => {});
  await pastRetries(p);
  const rail = await text(p.locator('main'));
  ok(
    'la colonne des ressentis dit la panne, et le rail ne dit plus « jamais faite »',
    (await text(failure(p))).startsWith(
      'Ses ressentis n’ont pas pu se charger. Son programme, lui, est là.'
    ) && !rail.includes('jamais faite'),
    await text(failure(p))
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
