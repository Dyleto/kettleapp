/**
 * Les premiers pas d'un client (F8) : la question du partage de ses données
 * de santé, posée devant tout son espace tant qu'elle n'a pas de réponse.
 *
 * Le serveur d'essai sert un client qui a déjà répondu ; la suite lui fait
 * dire le contraire (`needsHealthConsent`) et reçoit elle-même la réponse,
 * pour lire ce qui part. Le décor porte « Julie » et des ressentis déjà
 * enregistrés : de quoi éprouver le refus qui efface, et, en le
 * remplaçant, celui qui n'a rien à effacer.
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

const { user } = await (await fetch(`${API}/api/auth/me`)).json();
const program = await (await fetch(`${API}/api/client/program`)).json();
// Lu ici et non relayé depuis le navigateur : `route.fetch` plantait la
// suite quand le banc tournait sur quatre files.
const summary = await (await fetch(`${API}/api/account`)).json();

const text = (locator) =>
  locator
    .innerText({ timeout: 2000 })
    .then(clean)
    .catch(() => '');

/** Un client qui n'a pas encore répondu ; les réponses envoyées, dans l'ordre. */
const unanswered = async (browser, { coaches, healthDataCount } = {}) => {
  const ctx = await browser.newContext(MOBILE);
  const answers = [];
  await ctx.route(/\/api\/auth\/me$/, (r) =>
    r.fulfill({
      json: {
        user: { ...user, needsHealthConsent: true, healthConsent: null },
      },
    })
  );
  await ctx.route(/\/api\/client\/health-consent$/, (r) => {
    const { granted } = r.request().postDataJSON();
    answers.push(granted);
    return r.fulfill({
      json: {
        healthConsent: {
          granted,
          decidedAt: '2026-11-22T10:00:00.000Z',
          version: '1',
        },
      },
    });
  });
  if (coaches)
    await ctx.route(/\/api\/client\/program$/, (r) =>
      r.fulfill({ json: { ...program, coaches } })
    );
  if (healthDataCount !== undefined)
    await ctx.route(/\/api\/account$/, (r) =>
      r.fulfill({
        json: {
          ...summary,
          asClient: { ...summary.asClient, healthDataCount },
        },
      })
    );
  const p = await signIn(ctx);
  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  return { ctx, p, answers };
};
const question = (p) => p.locator('[data-consent-question]');
/** L'accueil, une fois la question passée : la barre d'onglets est revenue. */
const atHome = async (p) =>
  (await question(p).count()) === 0 &&
  (await p.getByRole('link', { name: "Aujourd'hui" }).count()) > 0;

const browser = await launch();

{
  console.log('\n── la question');
  const { ctx, p, answers } = await unanswered(browser);
  ok(
    'la question tient en une phrase, et nomme le coach',
    (await text(p.locator('h1'))) === 'Une question avant de commencer' &&
      (await text(question(p))) ===
        'Après chaque séance, tu pourras dire si tu as mal dormi, si tu as une douleur, ou laisser un mot. Ce sont des données de santé : acceptes-tu que Julie les lise ?',
    await text(question(p))
  );

  // Le focus se lit à l'arrivée, avant tout geste : toucher « En savoir
  // plus » le prendrait, et une réponse choisie d'avance passerait
  // inaperçue — c'est ce que le premier rejeu a montré.
  const focused = await p.evaluate(
    () => !!document.activeElement?.closest('[data-consent-answer]')
  );
  const more = p.getByRole('button', { name: 'En savoir plus' });
  const closed =
    (await more.getAttribute('aria-expanded').catch(() => '')) === 'false' &&
    (await p.locator('[data-consent-detail]').count()) === 0;
  await more.click({ timeout: 2000 }).catch(() => {});
  const detail = p.locator('[data-consent-detail]');
  ok(
    'le détail se déplie : ce qu’un refus change, et la politique de confidentialité',
    closed &&
      (await more.getAttribute('aria-expanded').catch(() => '')) === 'true' &&
      (await text(detail)).includes(
        "Si tu refuses, l'application fonctionne pareil. Tu notes tes charges et ton niveau d'effort, et Julie les voit."
      ) &&
      (
        await detail
          .getByRole('link', { name: 'Lire la politique de confidentialité' })
          .getAttribute('href')
          .catch(() => '')
      )?.endsWith('/confidentialite'),
    (await text(detail)).slice(0, 80)
  );

  const sizes = await p.locator('[data-consent-answer]').evaluateAll((els) =>
    els.map((el) => {
      const box = el.getBoundingClientRect();
      return `${Math.round(box.width)}×${Math.round(box.height)}`;
    })
  );
  ok(
    'les deux réponses ont la même taille, et aucune n’est choisie d’avance',
    sizes.length === 2 && sizes[0] === sizes[1] && !focused,
    `${sizes.join(' / ')}${focused ? ' · une réponse a le focus' : ''}`
  );

  await p
    .getByRole('button', { name: "J'accepte" })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    '« J’accepte » enregistre l’accord, et ouvre l’accueil',
    answers.join() === 'true' && (await atHome(p)),
    answers.join()
  );
  await ctx.close();
}

{
  console.log('\n── plusieurs coachs');
  const { ctx, p } = await unanswered(browser, {
    coaches: [{ firstName: 'Julie' }, { firstName: 'Marc' }],
  });
  ok(
    'avec plusieurs coachs, la question dit « ton coach »',
    (await text(question(p))).endsWith('acceptes-tu que ton coach les lise ?'),
    await text(question(p))
  );
  await ctx.close();
}

{
  console.log('\n── refuser');
  const { ctx, p, answers } = await unanswered(browser);
  await p
    .getByRole('button', { name: 'Je refuse' })
    .click({ timeout: 2000 })
    .catch(() => {});
  const confirm = p.getByRole('dialog');
  const asked = await text(confirm);
  await confirm
    .getByRole('button', { name: 'Refuser et effacer' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await gone(confirm);
  await settle(p);
  ok(
    '« Je refuse » demande d’abord quand des ressentis seraient effacés, puis ouvre l’accueil',
    asked.includes('Refuser le partage ?') &&
      answers.join() === 'false' &&
      (await atHome(p)),
    `${asked.slice(0, 60).replace(/\n/g, ' · ')} · ${answers.join()}`
  );
  await ctx.close();
}

{
  const { ctx, p, answers } = await unanswered(browser, {
    healthDataCount: 0,
  });
  await p
    .getByRole('button', { name: 'Je refuse' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    '  → sans rien à effacer, refuser tient en un geste',
    (await p.getByRole('dialog').count()) === 0 &&
      answers.join() === 'false' &&
      (await atHome(p)),
    answers.join()
  );
  await ctx.close();
}

{
  console.log('\n── le mauvais compte');
  const { ctx, p } = await unanswered(browser);
  const left = p.waitForRequest(/\/api\/auth\/logout$/, { timeout: 3000 });
  await p
    .getByRole('button', { name: 'Se déconnecter' })
    .click({ timeout: 2000 })
    .catch(() => {});
  const sent = await left.then(() => true).catch(() => false);
  await p.waitForURL(/\/login$/, { timeout: 4000 }).catch(() => {});
  ok(
    '« Se déconnecter » reste offert, pour qui s’est trompé de compte',
    sent && p.url().endsWith('/login'),
    p.url()
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
