/**
 * Un lien d'invitation ouvert sur un compte déjà connecté (F9b).
 *
 * Deux cas que Google ne distinguait pas : un client qui suit déjà ce coach
 * va droit à son accueil ; tout autre compte se voit demander « Rejoindre
 * Julie avec ce compte ? » avant d'être rattaché. Le rattachement passe par
 * `POST /auth/join`, que la suite reçoit elle-même pour lire ce qui part.
 *
 * Le serveur d'essai tient tout le monde pour connecté — un coach qui est
 * aussi client ; la suite répond à la vérification du lien.
 */
import {
  API,
  BASE,
  MOBILE,
  launch,
  ok,
  failureCount,
  settle,
  clean,
  markWelcomed,
} from './common.mjs';

const TOKEN = 'a3f9'.repeat(16);
const { user } = await (await fetch(`${API}/api/auth/me`)).json();

const text = (locator) =>
  locator
    .innerText({ timeout: 2000 })
    .then(clean)
    .catch(() => '');

/**
 * Le lien ouvert sur la session du décor. `coach` : qui invite ;
 * `linked` : la session suit-elle déjà ce coach ; `failing` : le
 * rattachement échoue, à chaque tentative.
 */
const open = async (
  browser,
  {
    coach = { id: 'c1', firstName: 'Julie', lastName: 'Martin' },
    linked = false,
    failing = false,
    signedIn = true,
  } = {}
) => {
  const ctx = await browser.newContext(MOBILE);
  await markWelcomed(ctx);
  const joins = [];
  const logouts = [];
  await ctx.route(/\/api\/auth\/verify-invite-token/, (r) =>
    r.fulfill({ json: { valid: true, coach, alreadyLinked: linked } })
  );
  await ctx.route(/\/api\/auth\/join$/, (r) => {
    joins.push(r.request().postDataJSON()?.invitationToken);
    return failing
      ? r.fulfill({ status: 500, json: { message: 'Panne' } })
      : // Un autre prénom que celui de `/me` : l'accueil ne peut le dire
        // que si le compte rendu a remplacé celui du contexte.
        r.fulfill({
          json: { status: 'success', user: { ...user, firstName: 'Camille' } },
        });
  });
  await ctx.route(/\/api\/auth\/logout$/, (r) => {
    logouts.push(true);
    return r.fulfill({ json: { message: 'Déconnecté' } });
  });
  if (!signedIn)
    await ctx.route(/\/api\/auth\/me$/, (r) =>
      r.fulfill({ status: 401, json: { message: 'Non connecté' } })
    );
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await p.goto(`${BASE}/join?token=${TOKEN}`, {
    waitUntil: 'domcontentloaded',
  });
  await settle(p);
  return { ctx, p, joins, logouts };
};

const browser = await launch();

{
  console.log('\n── un compte connecté');
  const { ctx, p, joins } = await open(browser);
  const asked = await text(p.locator('main'));
  ok(
    'le lien demande avant de rattacher le compte ouvert, et dit lequel',
    (await text(p.locator('h1'))) === 'Rejoindre Julie avec ce compte ?' &&
      asked.includes(`Le compte ouvert ici : ${user.email}.`) &&
      (await p
        .getByRole('button', { name: 'Rejoindre avec Google' })
        .count()) === 0 &&
      !asked.includes("Rien d'autre à créer") &&
      joins.length === 0,
    asked.slice(0, 120).replace(/\n/g, ' · ')
  );
  await p
    .getByRole('button', { name: 'Rejoindre Julie' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await p.waitForURL(/\/client$/, { timeout: 4000 }).catch(() => {});
  const greeting = await p
    .getByText('Salut Camille')
    .waitFor({ timeout: 4000 })
    .then(() => true)
    .catch(() => false);
  ok(
    '« Rejoindre Julie » rattache ce compte par son jeton, et ouvre son espace client à son nom',
    joins.join() === TOKEN &&
      new URL(p.url()).pathname === '/client' &&
      greeting,
    `${joins.length} envoi(s) · ${new URL(p.url()).pathname} · ${greeting}`
  );
  await ctx.close();
}

{
  const { ctx, p, joins } = await open(browser, { failing: true });
  await p
    .getByRole('button', { name: 'Rejoindre Julie' })
    .click({ timeout: 2000 })
    .catch(() => {});
  // Une mutation est reprise deux fois : l'échec se dit à la troisième.
  await p
    .getByRole('alert')
    .waitFor({ timeout: 8000 })
    .catch(() => {});
  ok(
    '  → un rattachement raté le dit, et ne quitte pas le lien',
    (await text(p.getByRole('alert'))) ===
      "Le rattachement n'a pas abouti : rien n'a changé. Réessaie." &&
      new URL(p.url()).pathname === '/join' &&
      joins.length > 0
  );
  await ctx.close();
}

{
  const { ctx, p, joins, logouts } = await open(browser);
  await p
    .getByRole('button', { name: 'Utiliser un autre compte' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await p.waitForLoadState('domcontentloaded').catch(() => {});
  await settle(p);
  ok(
    '« Utiliser un autre compte » ferme la session et revient au même lien',
    logouts.length === 1 &&
      joins.length === 0 &&
      new URL(p.url()).pathname === '/join' &&
      new URL(p.url()).searchParams.get('token') === TOKEN,
    p.url()
  );
  await ctx.close();
}

{
  console.log('\n── déjà client de ce coach');
  const { ctx, p, joins } = await open(browser, { linked: true });
  await p.waitForURL(/\/client$/, { timeout: 4000 }).catch(() => {});
  const toast = await text(
    p.locator('[data-scope="toast"][data-part="title"]').first()
  );
  ok(
    'un client qui suit déjà ce coach va droit à son accueil, et le lit',
    new URL(p.url()).pathname === '/client' &&
      toast === 'Tu es déjà avec Julie' &&
      joins.length === 0,
    `${new URL(p.url()).pathname} · ${toast}`
  );
  await ctx.close();
}

{
  console.log('\n── un coach sans nom');
  const { ctx, p } = await open(browser, {
    coach: { id: 'c1' },
    signedIn: false,
  });
  ok(
    'sans prénom, « Ton coach t’invite sur Kettle »',
    (await text(p.locator('h1'))) === "Ton coach t'invite sur Kettle",
    await text(p.locator('h1'))
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
