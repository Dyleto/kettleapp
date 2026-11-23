/**
 * L'écran de connexion (F9a) : la promesse, l'action, et les deux chemins
 * de qui n'a pas encore de compte — « J'ai reçu une invitation », qui
 * accepte un lien collé, et « Je suis coach », qui donne l'adresse à copier.
 *
 * Le serveur d'essai tient tout le monde pour connecté : la suite fait
 * répondre 401 à `/api/auth/me` pour voir l'écran. La connexion Google ne se
 * rejoue pas ; on vérifie seulement qu'on y part.
 */
import {
  BASE,
  MOBILE,
  launch,
  ok,
  failureCount,
  settle,
  clean,
} from './common.mjs';

const WIDE = { viewport: { width: 1440, height: 900 } };
const TOKEN = 'a3f9'.repeat(16);
const ADDRESS = 'contact@kettleapp.fr';
const PROMISE =
  'Ton coach écrit ta séance. Tu la suis pas à pas. Ton ressenti règle la suite.';

const text = (locator) =>
  locator
    .innerText({ timeout: 2000 })
    .then(clean)
    .catch(() => '');

/** Un visiteur sans session, sur l'écran de connexion. */
const visitor = async (browser, context = MOBILE, { clipboard } = {}) => {
  const ctx = await browser.newContext({
    ...context,
    ...(clipboard
      ? { permissions: ['clipboard-read', 'clipboard-write'] }
      : {}),
  });
  await ctx.route(/\/api\/auth\/me$/, (r) =>
    r.fulfill({ status: 401, json: { message: 'Non connecté' } })
  );
  await ctx.route(/\/api\/auth\/verify-invite-token/, (r) =>
    r.fulfill({
      json: {
        valid: true,
        coach: { id: 'c1', firstName: 'Julie', lastName: 'Martin' },
      },
    })
  );
  // Google ne se rejoue pas : on retient seulement qu'on y est allé.
  await ctx.route(/accounts\.google\.com/, (r) =>
    r.fulfill({ contentType: 'text/html', body: '<p>Google</p>' })
  );
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await p.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  return { ctx, p };
};

const browser = await launch();

{
  console.log('\n── l’écran');
  const { ctx, p } = await visitor(browser);
  const promise = await text(p.locator('[data-login-promise]'));
  ok(
    'une promesse en une phrase, sous le nom du produit',
    (await text(p.locator('h1'))) === 'KETTLE' && promise.endsWith(PROMISE),
    promise
  );
  const action = p.locator('[data-login-action]');
  ok(
    'l’action : Google, puis les deux chemins de qui n’a pas de compte, puis les pages légales',
    (await action
      .getByRole('button', { name: 'Continuer avec Google' })
      .count()) === 1 &&
      (await action
        .getByRole('button', { name: "J'ai reçu une invitation" })
        .count()) === 1 &&
      (await action.getByRole('button', { name: 'Je suis coach' }).count()) ===
        1 &&
      (await action
        .getByRole('link', { name: 'Politique de confidentialité' })
        .count()) === 1
  );
  await ctx.close();
}

{
  const { ctx, p } = await visitor(browser, WIDE);
  const promise = await p
    .locator('[data-login-promise]')
    .boundingBox({ timeout: 2000 })
    .catch(() => null);
  const pane = await p
    .locator('[data-login-action]')
    .locator('..')
    .boundingBox({ timeout: 2000 })
    .catch(() => null);
  ok(
    'sur grand écran, deux volets : la promesse à gauche, l’action à droite dans 480 px',
    !!promise &&
      !!pane &&
      Math.round(pane.width) === 480 &&
      Math.round(pane.x + pane.width) === 1440 &&
      promise.x + promise.width < pane.x &&
      (await text(p.locator('h2'))) === 'Connexion',
    pane
      ? `${Math.round(pane.width)} px à ${Math.round(pane.x)}`
      : 'aucun volet'
  );
  await ctx.close();
}

{
  console.log('\n── « J’ai reçu une invitation »');
  const { ctx, p } = await visitor(browser);
  await p
    .getByRole('button', { name: "J'ai reçu une invitation" })
    .click({ timeout: 2000 })
    .catch(() => {});
  const sheet = p.getByRole('dialog', { name: 'Tu as reçu un lien ?' });
  const field = sheet.getByRole('textbox', { name: "Ton lien d'invitation" });
  const go = sheet.getByRole('button', { name: 'Continuer' });
  const disabled = async () => go.isDisabled().catch(() => false);
  const empty = await disabled();
  await field.fill('kettleapp.fr/join').catch(() => {});
  const cut = await disabled();
  const hint = await text(sheet.locator('[data-paste-hint]'));
  ok(
    'la feuille dit quoi faire, et « Continuer » attend un lien qui en a l’air',
    (await text(sheet)).includes(
      'Ouvre-le : il te rattache à ton coach et crée ton compte en même temps.'
    ) &&
      empty &&
      cut &&
      hint.includes('« join?token= »'),
    `${empty} · ${cut} · ${hint}`
  );
  await field.fill(`https://kettleapp.fr/join?token=${TOKEN}`).catch(() => {});
  const ready = !(await disabled());
  await go.click({ timeout: 2000 }).catch(() => {});
  await settle(p);
  ok(
    '  → un lien collé ouvre l’invitation de son jeton',
    ready &&
      new URL(p.url()).pathname === '/join' &&
      new URL(p.url()).searchParams.get('token') === TOKEN &&
      (await text(p.locator('h1'))) === "Julie t'invite sur Kettle",
    p.url()
  );
  await ctx.close();
}

{
  console.log('\n── « Je suis coach »');
  const { ctx, p } = await visitor(browser, MOBILE, { clipboard: true });
  await p
    .getByRole('button', { name: 'Je suis coach' })
    .click({ timeout: 2000 })
    .catch(() => {});
  const sheet = p.getByRole('dialog', { name: 'Tu es coach ?' });
  await sheet
    .getByRole('button', { name: "Copier l'adresse" })
    .click({ timeout: 2000 })
    .catch(() => {});
  const copied = await p
    .evaluate(() => navigator.clipboard.readText())
    .catch(() => '');
  ok(
    'la feuille donne l’adresse, qui se copie d’une touche',
    (await text(sheet)).includes(
      'Les comptes de coach sont ouverts à la main'
    ) &&
      copied === ADDRESS &&
      (await text(sheet.getByRole('status'))) === 'Adresse copiée.',
    copied
  );
  await sheet
    .getByRole('button', { name: "J'ai déjà un compte coach" })
    .click({ timeout: 2000 })
    .catch(() => {});
  await p
    .waitForURL(/accounts\.google\.com/, { timeout: 4000 })
    .catch(() => {});
  ok(
    '  → « J’ai déjà un compte coach » part à la connexion Google',
    /accounts\.google\.com/.test(p.url()),
    p.url().slice(0, 60)
  );
  await ctx.close();
}

{
  const { ctx, p } = await visitor(browser);
  // Une copie que le navigateur refuse.
  await p.evaluate(() => {
    navigator.clipboard.writeText = () => Promise.reject(new Error('refusé'));
  });
  await p
    .getByRole('button', { name: 'Je suis coach' })
    .click({ timeout: 2000 })
    .catch(() => {});
  const sheet = p.getByRole('dialog', { name: 'Tu es coach ?' });
  await sheet
    .getByRole('button', { name: "Copier l'adresse" })
    .click({ timeout: 2000 })
    .catch(() => {});
  const selected = await p.evaluate(() => String(window.getSelection()));
  ok(
    '  → une copie refusée sélectionne l’adresse, et le dit',
    selected.trim() === ADDRESS &&
      (await text(sheet.getByRole('status'))).startsWith(
        'La copie n’est pas permise ici'
      ),
    selected
  );
  await ctx.close();
}

{
  console.log('\n── déjà connecté');
  // Le décor : une session ouverte, celle d'un coach.
  const ctx = await browser.newContext(MOBILE);
  const p = await ctx.newPage();
  await p.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await p.waitForURL(/\/coach/, { timeout: 4000 }).catch(() => {});
  ok(
    'une session ouverte ne reste pas sur la connexion',
    new URL(p.url()).pathname.startsWith('/coach'),
    p.url()
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
