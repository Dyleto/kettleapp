/**
 * Les premiers pas d'un client (F8) : trois cartes de bienvenue, une fois
 * par appareil, puis la question du partage de ses données de santé, posée
 * devant tout son espace tant qu'elle n'a pas de réponse.
 *
 * Les autres suites se connectent avec les cartes déjà vues ; celle-ci les
 * rouvre (`signIn(ctx, { welcomed: false })`) pour un client sans séance.
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
const unanswered = async (
  browser,
  {
    coaches,
    healthDataCount,
    newcomer = false,
    context = MOBILE,
    path = '/client',
    answered = false,
  } = {}
) => {
  const ctx = await browser.newContext(context);
  const answers = [];
  if (!answered)
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
  // Un nouveau client : aucune séance faite, et les cartes jamais vues sur
  // cet appareil.
  if (newcomer)
    await ctx.route(/\/api\/client\/history(\?|$)/, (r) =>
      r.fulfill({ json: { history: [] } })
    );
  const p = await signIn(ctx, { welcomed: !newcomer });
  await p.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  return { ctx, p, answers };
};
const question = (p) => p.locator('[data-consent-question]');
const card = (p) => p.locator('[data-welcome]');
const cardNumber = (p) =>
  card(p)
    .getAttribute('data-welcome')
    .catch(() => '');
const marks = (p) =>
  card(p)
    .locator('[data-mark]')
    .evaluateAll((els) => els.map((el) => el.getAttribute('data-mark')))
    .catch(() => []);
/** Glisser sur la carte, d'un bord à l'autre : négatif vers la gauche. */
const swipe = async (p, distance) => {
  // `boundingBox` attend l'élément : sans carte, il lèverait au lieu de
  // rendre `null`, et la suite s'arrêterait au lieu de tomber.
  const box = await card(p)
    .boundingBox({ timeout: 2000 })
    .catch(() => null);
  if (!box) return;
  const y = box.y + box.height / 2;
  const x = box.x + box.width / 2 - distance / 2;
  await p.mouse.move(x, y);
  await p.mouse.down();
  await p.mouse.move(x + distance, y, { steps: 6 });
  await p.mouse.up();
  await settle(p);
};
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
  console.log('\n── les cartes de bienvenue');
  const { ctx, p, answers } = await unanswered(browser, { newcomer: true });
  ok(
    'un nouveau client voit trois cartes, et la première nomme son coach',
    (await cardNumber(p)) === '1' &&
      (await text(card(p).locator('h1'))) === 'Julie prépare ton programme' &&
      (await text(card(p))).includes(
        'Tes séances arrivent ici, dans l’ordre choisi pour toi.'
      ) &&
      (await marks(p)).join() === 'now,todo,todo' &&
      (await question(p).count()) === 0,
    `${await cardNumber(p)} · ${await text(card(p).locator('h1'))}`
  );
  await p
    .getByRole('button', { name: 'Suivant' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    '« Suivant » avance, et les points suivent',
    (await cardNumber(p)) === '2' &&
      (await text(card(p).locator('h1'))) === 'Tu suis la séance, pas à pas' &&
      (await marks(p)).join() === 'done,now,todo',
    `${await cardNumber(p)} · ${(await marks(p)).join()}`
  );
  await swipe(p, -220);
  const forward = await cardNumber(p);
  await swipe(p, 220);
  const back = await cardNumber(p);
  await swipe(p, -220);
  ok(
    'glisser change de carte, dans les deux sens',
    forward === '3' && back === '2' && (await cardNumber(p)) === '3',
    `${forward} · ${back} · ${await cardNumber(p)}`
  );
  ok(
    '  → la dernière dit ce qu’on demande à la fin, et propose de commencer',
    (await text(card(p).locator('h1'))) === 'Tu dis comment c’était' &&
      (await text(card(p))).includes(
        'Une touche à la fin. Julie s’en sert pour régler la suite.'
      ) &&
      (await p.getByRole('button', { name: 'Commencer' }).count()) === 1
  );
  await p
    .getByRole('button', { name: 'Commencer' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const asked = (await question(p).count()) === 1;
  await p
    .getByRole('button', { name: "J'accepte" })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const home = await atHome(p);
  await p.reload({ waitUntil: 'domcontentloaded' });
  await settle(p);
  ok(
    '« Commencer » mène à la question puis à l’accueil, et les cartes ne reviennent plus',
    asked && answers.join() === 'true' && home && (await card(p).count()) === 0,
    `${asked} · ${answers.join()} · ${home}`
  );
  await ctx.close();
}

{
  const { ctx, p } = await unanswered(browser, { newcomer: true });
  await p
    .getByRole('button', { name: 'Passer' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    '« Passer » mène droit à la question',
    (await card(p).count()) === 0 && (await question(p).count()) === 1
  );
  await ctx.close();
}

{
  const { ctx, p } = await unanswered(browser, {
    newcomer: true,
    context: { viewport: { width: 1440, height: 900 } },
  });
  const box = await card(p)
    .boundingBox({ timeout: 2000 })
    .catch(() => null);
  ok(
    'sur grand écran, la carte tient dans 480 px, au centre',
    !!box &&
      Math.round(box.width) === 480 &&
      Math.abs(box.x + box.width / 2 - 720) <= 1,
    box ? `${Math.round(box.width)} px à ${Math.round(box.x)}` : 'aucune carte'
  );
  await ctx.close();
}

{
  console.log('\n── à qui elles ne se montrent pas');
  // Le décor : un client qui s'entraîne déjà, les cartes jamais vues ici.
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx, { welcomed: false });
  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  ok(
    'un client qui s’entraîne déjà ne les voit pas, même sur un nouvel appareil',
    (await card(p).count()) === 0 && (await atHome(p))
  );
  await ctx.close();
}

{
  const { ctx, p } = await unanswered(browser, {
    newcomer: true,
    coaches: [],
  });
  ok(
    'sans coach, pas de cartes : la question vient seule',
    (await card(p).count()) === 0 && (await question(p).count()) === 1
  );
  await ctx.close();
}

{
  // La question déjà répondue : sinon c'est elle qui couvre « Mon compte ».
  const { ctx, p } = await unanswered(browser, {
    newcomer: true,
    path: '/client/account',
    answered: true,
  });
  ok(
    'elles n’arrêtent pas « Mon compte »',
    (await card(p).count()) === 0 &&
      (await p.getByRole('heading', { name: 'Mon compte' }).count()) === 1
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
