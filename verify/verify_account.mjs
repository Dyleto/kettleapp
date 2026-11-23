/**
 * « Mon compte » (F10a) : l'identité, le bloc de l'espace où l'on est, les
 * données de santé, les réglages de la séance, la copie des données, la
 * déconnexion sur l'écran, et la suppression qui attend le mot.
 *
 * Le serveur d'essai sert un compte à deux rôles — client de Julie, coach
 * de sept clients — : chaque espace doit n'en montrer qu'un. Les écritures
 * (partage, suppression) sont reçues par la suite, qui lit ce qui part.
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

const WIDE = { viewport: { width: 1440, height: 1000 } };
const summary = await (await fetch(`${API}/api/account`)).json();
const DONE = summary.asClient.completedCount;
const HEALTH = summary.asClient.healthDataCount;

const text = (locator) =>
  locator
    .innerText({ timeout: 2000 })
    .then(clean)
    .catch(() => '');
/** Les paragraphes d'une zone, sans les initiales d'un avatar. */
const paragraphs = (locator) =>
  locator
    .locator('p')
    .allInnerTexts()
    .then((all) => clean(all.map((t) => t.trim()).join(' / ')))
    .catch(() => '');

/** L'écran, ouvert d'un espace ; les écritures reçues, dans l'ordre. */
const open = async (
  browser,
  { path = '/client/account', context = MOBILE, account } = {}
) => {
  const ctx = await browser.newContext(context);
  const sent = [];
  await ctx.route(/\/api\/client\/health-consent$/, (r) => {
    const { granted } = r.request().postDataJSON();
    sent.push(`partage ${granted}`);
    return r.fulfill({
      json: {
        healthConsent: {
          granted,
          decidedAt: '2026-11-23T10:00:00.000Z',
          version: '1',
        },
      },
    });
  });
  await ctx.route(/\/api\/account$/, (r) => {
    if (r.request().method() === 'DELETE') {
      sent.push('suppression');
      return r.fulfill({ json: { message: 'Compte supprimé' } });
    }
    return r.fulfill({ json: account ?? summary });
  });
  await ctx.route(/\/api\/auth\/logout$/, (r) => {
    sent.push('déconnexion');
    return r.fulfill({ json: { message: 'Déconnecté' } });
  });
  const p = await signIn(ctx);
  await p.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  return { ctx, p, sent };
};

const browser = await launch();

{
  console.log('\n── côté client');
  const { ctx, p, sent } = await open(browser);
  const identity = await text(p.locator('[data-account-identity]'));
  ok(
    'l’identité : le nom, l’adresse, et qu’elle vient de Google',
    identity.includes('Corentin Le Moullec') &&
      identity.includes('corentin@example.com · compte Google'),
    identity.replace(/\n/g, ' · ')
  );
  const coaches = await paragraphs(p.locator('[data-account-coaches]'));
  ok(
    'son coach, depuis quand, et combien de séances',
    coaches ===
      `Julie Martin / depuis le 1er juin 2026 · ${DONE} séances faites`,
    coaches
  );
  const sharing = p.getByRole('switch', { name: 'Partagées avec Julie' });
  const health = await text(sharing);
  ok(
    '→ ses données de santé : avec qui, et combien de séances en contiennent',
    (await sharing.getAttribute('aria-checked').catch(() => '')) === 'true' &&
      health.includes(`${HEALTH} séances en contiennent.`) &&
      (await text(p.locator('[data-consent-trace]'))) ===
        'Accepté le 1er juin 2026.',
    health.replace(/\n/g, ' · ')
  );
  ok(
    '→ sans l’activité du coach, qui est de l’autre espace',
    (await p.locator('[data-account-activity]').count()) === 0
  );
  ok(
    '« Pendant la séance » : les sons du chronomètre',
    (await p.getByRole('switch', { name: 'Sons du chronomètre' }).count()) === 1
  );

  await sharing.click({ timeout: 2000 }).catch(() => {});
  const confirm = p.getByRole('dialog');
  const asked = await text(confirm);
  await confirm
    .getByRole('button', { name: 'Arrêter et effacer' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    'arrêter le partage demande d’abord, puisque cela efface',
    asked.includes('Ne plus partager tes données de santé ?') &&
      sent.join() === 'partage false',
    `${asked.slice(0, 50).replace(/\n/g, ' · ')} · ${sent.join()}`
  );

  await p
    .getByRole('button', { name: 'Recevoir une copie de mes données' })
    .click({ timeout: 2000 })
    .catch(() => {});
  const copySheet = p.getByRole('dialog', {
    name: 'Recevoir une copie de tes données',
  });
  ok(
    '« Recevoir une copie de mes données » donne l’adresse, et le délai',
    (await text(copySheet)).includes('Réponse sous un mois.') &&
      (await text(copySheet.locator('[data-copy-value]'))) ===
        'contact@kettleapp.fr'
  );
  await ctx.close();
}

{
  console.log('\n── côté coach');
  const { ctx, p } = await open(browser, { path: '/coach/account' });
  const activity = await paragraphs(p.locator('[data-account-activity]'));
  ok(
    'son activité, à la place du coach et des données de santé',
    activity ===
      `Clients suivis / ${summary.asCoach.clientCount} / Coach depuis / juin 2026` &&
      (await p.locator('[data-account-coaches]').count()) === 0 &&
      (await p.getByRole('switch', { name: /^Partagées/ }).count()) === 0,
    activity
  );
  await ctx.close();
}

{
  console.log('\n── partir');
  const { ctx, p, sent } = await open(browser);
  await p
    .getByRole('button', { name: 'Se déconnecter' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await p.waitForURL(/\/login$/, { timeout: 4000 }).catch(() => {});
  ok(
    '« Se déconnecter » est sur l’écran, et ramène à la connexion',
    sent.join() === 'déconnexion' && p.url().endsWith('/login'),
    `${sent.join()} · ${p.url()}`
  );
  await ctx.close();
}

{
  const { ctx, p, sent } = await open(browser);
  await p
    .getByRole('button', { name: 'Supprimer mon compte' })
    .click({ timeout: 2000 })
    .catch(() => {});
  const dialog = p.getByRole('alertdialog');
  const gone = await text(dialog.locator('[data-delete-consequences]'));
  const red = dialog.getByRole('button', { name: 'Supprimer définitivement' });
  const before = await red.isDisabled().catch(() => false);
  await dialog
    .getByRole('textbox', { name: 'Écris SUPPRIMER pour confirmer' })
    .fill('supprimer')
    .catch(() => {});
  const after = await red.isEnabled().catch(() => false);
  ok(
    'supprimer dit ce qui disparaît, et le bouton rouge attend le mot',
    gone.includes(`tes ${DONE} séances faites et tes charges`) &&
      gone.includes('ton rattachement à Julie') &&
      before &&
      after &&
      sent.length === 0,
    `${gone.replace(/\n/g, ' · ')} · ${before} · ${after}`
  );
  await red.click({ timeout: 2000 }).catch(() => {});
  await p.waitForURL(/\/login$/, { timeout: 4000 }).catch(() => {});
  ok(
    '→ « Supprimer définitivement » supprime, et ramène à la connexion',
    sent.join() === 'suppression' && p.url().endsWith('/login'),
    `${sent.join()} · ${p.url()}`
  );
  await ctx.close();
}

{
  console.log('\n── sans coach');
  const { ctx, p } = await open(browser, {
    account: { ...summary, asClient: { ...summary.asClient, coaches: [] } },
  });
  const block = await text(p.locator('[data-account-no-coach]'));
  await p
    .getByRole('button', { name: "J'ai reçu une invitation" })
    .click({ timeout: 2000 })
    .catch(() => {});
  ok(
    'sans coach : « Aucun coach pour l’instant », et de quoi coller une invitation',
    block.startsWith("Aucun coach pour l'instant.") &&
      (await p
        .getByRole('dialog', { name: 'Tu as reçu un lien ?' })
        .count()) === 1 &&
      (await p
        .getByRole('switch', { name: 'Partagées avec ton coach' })
        .count()) === 1,
    block.replace(/\n/g, ' · ')
  );
  await ctx.close();
}

{
  const { ctx, p } = await open(browser, { context: WIDE });
  const box = await p
    .locator('[data-account]')
    .boundingBox({ timeout: 2000 })
    .catch(() => null);
  ok(
    'sur grand écran, une colonne de 640 px',
    !!box && Math.round(box.width) === 640,
    box ? `${Math.round(box.width)} px` : 'aucune colonne'
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
