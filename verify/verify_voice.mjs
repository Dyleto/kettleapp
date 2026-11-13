/**
 * La voix : ce que l'application dit, et à qui elle le dit.
 *
 * Le vouvoiement lui-même se vérifie dans le code, d'un motif —
 * `npm run lint:langue` s'en charge, et bien mieux qu'un navigateur qui ne
 * lirait que les écrans qu'on pense à lui montrer. Cette suite prend ce
 * qu'un motif ne voit pas : à qui un texte s'adresse dépend de qui le lit.
 *
 * 1. Un onglet et l'écran qu'il ouvre portent le même nom. L'écran des
 *    exercices s'est appelé « Mes exercices » sous un onglet
 *    « Bibliothèque » : deux noms à un clic l'un de l'autre.
 * 2. L'invitation ne s'accorde avec personne — « vous invite à le
 *    rejoindre » décidait que le coach était un homme — et un lien mort ne
 *    se confond pas avec une coupure de réseau.
 * 3. Le bilan d'un client, ouvert par son coach, se lit sans se modifier.
 *    L'aperçu réutilisait la carte du client telle quelle : le coach y
 *    lisait « Ton commentaire » et pouvait corriger la séance de quelqu'un
 *    d'autre.
 */
import {
  BASE,
  launch,
  ok,
  failureCount,
  signIn,
  MOBILE,
  clean,
} from './common.mjs';

const API = 'http://localhost:3001';
const CLIENT = '507f1f77bcf86cd799439012';
const DESKTOP = { viewport: { width: 1280, height: 800 } };

const INVITE = /\/api\/auth\/verify-invite-token/;
const FORMAL = /\b(vous|votre|vos|veuillez)\b/i;

const screen = (p) => p.evaluate(() => document.body.innerText).then(clean);

const appears = async (p, text, timeout = 6000) => {
  try {
    await p.getByText(text, { exact: false }).first().waitFor({ timeout });
    return true;
  } catch {
    return false;
  }
};

/** Le titre de premier niveau de l'écran, tel qu'un lecteur d'écran le
 * donnerait. */
const pageTitle = (p) =>
  p
    .locator('h1')
    .first()
    .innerText({ timeout: 4000 })
    .then(clean)
    .catch(() => '');

/** Les libellés de la navigation visible — la barre d'onglets sur un
 * téléphone, le rail sur un bureau. */
const navLabels = (p) =>
  p.evaluate(() =>
    [...document.querySelectorAll('nav a')]
      .filter((a) => a.getClientRects().length > 0)
      .map((a) => a.innerText.trim())
  );

/** Presse un bouton s'il est là : son absence est jugée par l'assertion qui
 * suit, pas par un délai de trente secondes. */
const press = async (p, name) => {
  const button = p.getByRole('button', { name });
  if (await button.count()) await button.first().click();
};

const browser = await launch();

{
  console.log('\n── un onglet et son écran portent le même nom, côté client');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);

  const labels = await navLabels(p);
  ok(
    'les onglets sont Aujourd’hui, Programme, Progrès',
    labels.join(' · ') === "Aujourd'hui · Programme · Progrès",
    labels.join(' · ')
  );

  for (const name of ['Programme', 'Progrès']) {
    // Un onglet absent laisse l'écran précédent en place, et c'est son
    // titre que l'assertion lira : elle tombe, la suite ne plante pas.
    const link = p
      .getByRole('navigation', { name: 'Navigation principale' })
      .getByRole('link', { name });
    if (await link.count()) await link.first().click();
    await p.waitForTimeout(700);
    const title = await pageTitle(p);
    ok(`l'onglet « ${name} » ouvre l'écran « ${name} »`, title === name, title);
  }
  await ctx.close();
}

{
  console.log('\n── un onglet et son écran portent le même nom, côté coach');
  const ctx = await browser.newContext(DESKTOP);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);

  const labels = await navLabels(p);
  ok(
    'le rail est Clients, Modèles, Exercices',
    labels.join(' · ') === 'Clients · Modèles · Exercices',
    labels.join(' · ')
  );
  const clientsTitle = await pageTitle(p);
  ok(
    "l'entrée « Clients » ouvre l'écran « Clients »",
    clientsTitle === 'Clients',
    clientsTitle
  );

  await p.goto(`${BASE}/coach/exercises`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);
  const exercisesTitle = await pageTitle(p);
  ok(
    "l'entrée « Exercices » ouvre l'écran « Exercices »",
    exercisesTitle === 'Exercices',
    exercisesTitle
  );
  await ctx.close();
}

{
  console.log("\n── l'invitation ne s'accorde avec personne");
  const ctx = await browser.newContext(MOBILE);
  const accept = (r) =>
    r.fulfill({
      json: {
        valid: true,
        coach: { id: 'c1', firstName: 'Julie', lastName: 'Martin' },
      },
    });
  await ctx.route(INVITE, accept);
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await p.goto(`${BASE}/join?token=abc`, { waitUntil: 'domcontentloaded' });
  await appears(p, 'Rejoindre avec Google');

  const title = await pageTitle(p);
  ok(
    'le titre est « Julie t’invite sur Kettle »',
    title === "Julie t'invite sur Kettle",
    title
  );
  const invitation = await screen(p);
  ok(
    '  → sans vouvoyer la personne invitée',
    !FORMAL.test(invitation),
    invitation.match(FORMAL)?.[0] ?? ''
  );
  ok(
    '  → et dit à quel compte elle sera rattachée',
    invitation.includes('Ton compte sera rattaché à Julie Martin')
  );

  // Un lien sans jeton : les messageries coupent les adresses longues.
  await p.goto(`${BASE}/join`, { waitUntil: 'domcontentloaded' });
  ok(
    'un lien tronqué dit qu’il lui manque un bout',
    await appears(p, 'Il manque un bout à ce lien')
  );

  // Un lien que le serveur refuse.
  await ctx.unroute(INVITE, accept);
  const expired = (r) =>
    r.fulfill({ status: 410, json: { message: 'Lien expiré' } });
  await ctx.route(INVITE, expired);
  await p.goto(`${BASE}/join?token=vieux`, { waitUntil: 'domcontentloaded' });
  ok(
    'un lien expiré dit qu’il ne marche plus',
    await appears(p, 'Ce lien ne marche plus')
  );
  ok(
    '  → sans proposer de réessayer',
    (await p.getByRole('button', { name: 'Réessayer' }).count()) === 0
  );

  // Le réseau tombe : ce n'est pas le lien qui est en cause, et le dire
  // évite au client d'en réclamer un autre pour rien.
  await ctx.unroute(INVITE, expired);
  const cut = (r) => r.abort();
  await ctx.route(INVITE, cut);
  await p.goto(`${BASE}/join?token=bon`, { waitUntil: 'domcontentloaded' });
  ok(
    'une coupure de réseau dit que Kettle ne répond pas',
    await appears(p, 'Kettle ne répond pas')
  );
  const outage = await screen(p);
  ok(
    '  → et non que le lien est mort',
    !outage.includes('Ce lien ne marche plus') &&
      outage.includes("Ton lien n'est pas en cause"),
    outage.slice(0, 120)
  );
  await ctx.unroute(INVITE, cut);
  await ctx.route(INVITE, accept);
  await press(p, 'Réessayer');
  ok(
    '  → et « Réessayer » ramène l’invitation',
    await appears(p, "Julie t'invite sur Kettle")
  );

  await ctx.close();
}

{
  console.log("\n── le bilan d'un client, lu par son coach");
  // Le serveur d'essai ne donne au coach ni client ni historique : on lui
  // sert ceux du client, qui sont les mêmes séances vues de l'autre côté.
  const history = (await (await fetch(`${API}/api/client/history`)).json())
    .history;
  const ctx = await browser.newContext(DESKTOP);
  await ctx.route(/\/api\/coach\/clients(\?|$)/, (r) =>
    r.fulfill({
      json: [
        {
          _id: CLIENT,
          firstName: 'Sarah',
          lastName: 'Martin',
          unseenCount: 1,
          linkedAt: '2026-06-01T09:00:00.000Z',
          lastCompletedAt: history[0]?.completedAt,
          lastEffort: 4,
        },
      ],
    })
  );
  await ctx.route(new RegExp(`/api/coach/clients/${CLIENT}/history`), (r) =>
    r.fulfill({ json: history })
  );
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach`, { waitUntil: 'domcontentloaded' });
  await appears(p, 'Sarah Martin');

  // L'aperçu, puis une séance qui porte un mot du client.
  await p
    .getByRole('button', { name: /Sarah Martin/ })
    .first()
    .click();
  await appears(p, 'Dernières séances');
  const card = p.getByRole('button').filter({ hasText: 'Dur sur la fin' });
  ok("l'aperçu montre la séance commentée", (await card.count()) >= 1);
  if (await card.count()) await card.first().click();
  await p.waitForTimeout(700);

  const drawer = clean(
    await p
      .locator('[role="dialog"]')
      .first()
      .innerText({ timeout: 3000 })
      .catch(() => '')
  );
  ok('le coach lit « Son mot »', /son mot/i.test(drawer), drawer.slice(0, 80));
  ok(
    '  → et non « Ton mot » ni « Ton commentaire »',
    drawer !== '' && !/ton (mot|commentaire)/i.test(drawer)
  );
  ok(
    '  → sans pouvoir corriger la séance de son client',
    drawer !== '' &&
      (await p.getByRole('button', { name: 'Corriger' }).count()) === 0
  );
  await ctx.close();
}

{
  console.log('\n── le même bilan, relu par celui qui a fait la séance');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/client/history`, { waitUntil: 'domcontentloaded' });
  await appears(p, 'Dur sur la fin');
  const card = p.getByRole('button').filter({ hasText: 'Dur sur la fin' });
  if (await card.count()) await card.first().click();
  await p.waitForTimeout(700);

  const drawer = clean(
    await p
      .locator('[role="dialog"]')
      .first()
      .innerText({ timeout: 3000 })
      .catch(() => '')
  );
  ok('le client lit « Ton mot »', /ton mot/i.test(drawer), drawer.slice(0, 80));
  ok(
    '  → et peut toujours corriger sa séance',
    (await p.getByRole('button', { name: 'Corriger' }).count()) === 1
  );
  await ctx.close();
}

{
  console.log(
    '\n── un écran vide nomme la personne plutôt que « votre client »'
  );
  const ctx = await browser.newContext(DESKTOP);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach/clients/${CLIENT}/journal`, {
    waitUntil: 'domcontentloaded',
  });
  ok(
    'les ressentis vides disent « Sarah n’a encore rien fait »',
    await appears(p, "Sarah n'a encore rien fait")
  );
  const title = await pageTitle(p);
  ok(
    '  → sous le titre « Ressentis de Sarah »',
    title === 'Ressentis de Sarah',
    title
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
