/**
 * Le menu du compte (G4b) : une feuille sur téléphone, un menu qui monte de
 * l'avatar sur grand écran ; « Mon compte », le passage vers les autres
 * espaces du compte — et seulement eux —, « Se déconnecter ».
 *
 * Le compte du serveur d'essai porte deux rôles, client et coach, et son
 * fil « À lire » compte une ressource non lue.
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
} from './common.mjs';

const WIDE = { viewport: { width: 1440, height: 900 } };
const me = (await (await fetch(`${API}/api/auth/me`)).json()).user;
const unread = (
  await (await fetch(`${API}/api/coach/inbox?state=unread`)).json()
).total;

const trigger = (p) => p.getByRole('button', { name: /^Menu du compte/ });
const sheet = (p) => p.getByRole('dialog', { name: 'Menu du compte' });
/** Les entrées de la feuille, dans l'ordre : leur nom, et ce qui attend. */
const sheetEntries = (p) =>
  sheet(p)
    .getByRole('button')
    .evaluateAll((all) =>
      all.map((b) => b.innerText.replace(/\s+/g, ' ').trim())
    )
    .catch(() => []);
const menuEntries = (p) =>
  p
    .getByRole('menuitem')
    .evaluateAll((all) =>
      all.map((b) => b.innerText.replace(/\s+/g, ' ').trim())
    )
    .catch(() => []);

const open = async (
  browser,
  { context = MOBILE, path = '/client', user } = {}
) => {
  const ctx = await browser.newContext(context);
  const reads = [];
  ctx.on('request', (r) => {
    if (/\/api\/coach\/inbox/.test(r.url())) reads.push(r.url());
  });
  if (user)
    await ctx.route(/\/api\/auth\/me$/, (r) =>
      r.fulfill({ json: { user: { ...me, ...user } } })
    );
  const p = await signIn(ctx);
  await p.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  return { ctx, p, reads };
};

const browser = await launch();

{
  console.log('\n── sur téléphone');
  const { ctx, p } = await open(browser);
  await trigger(p)
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const identity = clean(
    await sheet(p)
      .locator('[data-account-sheet-identity]')
      .innerText({ timeout: 2000 })
      .catch(() => '')
  ).replace(/\s+/g, ' ');
  const entries = await sheetEntries(p);
  ok(
    'une feuille : l’identité, puis « Mon compte », l’espace coach et ce qui l’y attend, « Se déconnecter »',
    identity.includes('Corentin Le Moullec') &&
      identity.includes('corentin@example.com') &&
      entries.join(' | ') ===
        `Mon compte | Passer à l’espace coach ${unread} à lire | Se déconnecter`,
    `${identity} · ${entries.join(' | ')}`
  );
  await p.keyboard.press('Escape');
  await settle(p);
  ok('  → Échap la referme', (await sheet(p).count()) === 0);

  await trigger(p)
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  await sheet(p)
    .getByRole('button', { name: /^Passer à l’espace coach/ })
    .click({ timeout: 2000 })
    .catch(() => {});
  await p.waitForURL(/\/coach/, { timeout: 4000 }).catch(() => {});
  ok(
    '  → « Passer à l’espace coach » y mène, et referme la feuille',
    new URL(p.url()).pathname.startsWith('/coach') &&
      (await sheet(p).count()) === 0,
    p.url()
  );
  await ctx.close();
}

{
  const { ctx, p } = await open(browser, { path: '/coach' });
  await trigger(p)
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    'côté coach, on passe à l’espace client, jamais à celui où l’on est',
    (await sheetEntries(p)).join(' | ') ===
      'Mon compte | Passer à l’espace client | Se déconnecter',
    (await sheetEntries(p)).join(' | ')
  );
  await ctx.close();
}

{
  const { ctx, p, reads } = await open(browser, {
    user: { isCoach: false, coachId: undefined },
  });
  await trigger(p)
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    'un compte à un seul rôle n’a nulle part où passer, et « À lire » n’est pas lu',
    (await sheetEntries(p)).join(' | ') === 'Mon compte | Se déconnecter' &&
      reads.length === 0,
    `${(await sheetEntries(p)).join(' | ')} · ${reads.length} lecture(s)`
  );
  await ctx.close();
}

{
  console.log('\n── sur grand écran');
  const { ctx, p } = await open(browser, { context: WIDE });
  await trigger(p)
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const menu = await p
    .getByRole('menu')
    .boundingBox({ timeout: 2000 })
    .catch(() => null);
  const button = await trigger(p)
    .boundingBox({ timeout: 2000 })
    .catch(() => null);
  ok(
    'un menu qui monte de l’avatar, avec les mêmes entrées',
    !!menu &&
      !!button &&
      menu.y + menu.height <= button.y + 1 &&
      (await menuEntries(p)).join(' | ') ===
        `Mon compte | Passer à l’espace coach ${unread} à lire | Se déconnecter`,
    `${(await menuEntries(p)).join(' | ')} · ${menu ? Math.round(menu.y + menu.height) : '?'} / ${button ? Math.round(button.y) : '?'}`
  );

  const left = p.waitForRequest(/\/api\/auth\/logout$/, { timeout: 3000 });
  await p
    .getByRole('menuitem', { name: 'Se déconnecter' })
    .click({ timeout: 2000 })
    .catch(() => {});
  const sent = await left.then(() => true).catch(() => false);
  await p.waitForURL(/\/login$/, { timeout: 4000 }).catch(() => {});
  ok(
    '  → « Se déconnecter » déconnecte, et ramène à la connexion',
    sent && p.url().endsWith('/login'),
    p.url()
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
