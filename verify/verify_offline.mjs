/**
 * Hors connexion (G1) : le bandeau, et l'atelier qui réessaie seul.
 *
 * Le réseau se coupe par `context.setOffline` : la page reçoit les mêmes
 * événements qu'un téléphone qui perd le signal, et ses requêtes échouent
 * pour de vrai. Ce qui compte est ce que l'écran dit pendant la coupure, et
 * ce qui part au retour — sans qu'on ait rien touché.
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

const CLIENT = '507f1f77bcf86cd799439012';
const WIDE = { viewport: { width: 1440, height: 1000 } };

const reset = () => fetch(`${API}/api/mock/reset`, { method: 'POST' });
const serverName = async () => {
  const r = await fetch(`${API}/api/coach/clients/${CLIENT}`);
  return (await r.json()).program.sessions[0]?.name;
};
/** Les paragraphes d'une zone, joints. */
const paragraphs = (locator) =>
  locator
    .locator('p')
    .allInnerTexts()
    .then((all) => clean(all.map((t) => t.trim()).join(' / ')))
    .catch(() => '');
/** L'état de l'enregistrement dans l'en-tête, attendu ; `null` s'il ne
 * vient pas. */
const statusOf = async (p, signal, timeout = 8000) => {
  const shown = p.locator(`[data-save-status="${signal}"]`);
  await shown
    .first()
    .waitFor({ state: 'visible', timeout })
    .catch(() => {});
  return (await shown.count()) ? shown.first() : null;
};
const banner = (p) => p.locator('[data-offline]');
const rename = async (p, name) => {
  await p
    .getByRole('button', { name: 'Nom de la séance 1' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await p.keyboard.type(name);
  await p.keyboard.press('Enter');
};
const openWorkshop = async (ctx) => {
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach/clients/${CLIENT}/s/1`, {
    waitUntil: 'domcontentloaded',
  });
  await settle(p);
  return p;
};

const browser = await launch();

{
  console.log('\n── le client perd le réseau');
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
  await settle(p);
  const before = await banner(p).count();
  await ctx.setOffline(true);
  await banner(p)
    .waitFor({ timeout: 3000 })
    .catch(() => {});
  const said = await paragraphs(banner(p));
  const overflow = await p
    .evaluate(
      (width) =>
        Math.ceil(
          Math.max(
            ...[...document.querySelectorAll('[data-offline] *')].map(
              (e) => e.getBoundingClientRect().right
            )
          )
        ) - width,
      MOBILE.viewport.width
    )
    .catch(() => 1);
  ok(
    'sans réseau, « Hors connexion » et ce qui est sauf : la séance',
    before === 0 &&
      said ===
        'Hors connexion / Tu peux faire ta séance : elle s’enverra au retour du réseau.' &&
      overflow <= 0,
    `${said} · débord ${overflow} px`
  );
  await ctx.setOffline(false);
  await banner(p)
    .waitFor({ state: 'detached', timeout: 3000 })
    .catch(() => {});
  ok(
    '  → le bandeau part au retour du réseau',
    (await banner(p).count()) === 0
  );
  await ctx.close();
}

{
  console.log('\n── le coach écrit sans réseau');
  await reset();
  const ctx = await browser.newContext(WIDE);
  const p = await openWorkshop(ctx);
  await ctx.setOffline(true);
  await rename(p, 'Brouillon');
  const waiting = await statusOf(p, 'offline', 4000);
  const waitingText = waiting
    ? clean(await waiting.innerText()).replace(/\s+/g, ' ')
    : '';
  ok(
    'une modification sans réseau : « Non enregistré », sans « Réessayer » inutile',
    waitingText === 'Non enregistré · envoi au retour du réseau' &&
      (await p.getByRole('button', { name: 'Réessayer' }).count()) === 0 &&
      (await serverName()) !== 'Brouillon',
    `« ${waitingText} »`
  );
  ok(
    '  → le bandeau du coach dit que ce qu’il écrit reste là',
    (await paragraphs(banner(p))) ===
      'Hors connexion / Ce que tu écris reste sur cet appareil, et s’enregistre au retour du réseau.',
    await paragraphs(banner(p))
  );
  await ctx.setOffline(false);
  const saved = await statusOf(p, 'saved', 8000);
  ok(
    '  → au retour du réseau, elle part seule',
    !!saved && (await serverName()) === 'Brouillon',
    `${saved ? 'Enregistré' : 'rien'} · ${await serverName()}`
  );
  await ctx.close();
}

{
  console.log('\n── un échec, puis la coupure');
  await reset();
  const ctx = await browser.newContext(WIDE);
  let failing = true;
  await ctx.route(/\/program\/sessions$/, (route) =>
    failing && route.request().method() === 'PUT'
      ? route.fulfill({ status: 500, json: { message: 'Panne' } })
      : route.fallback()
  );
  const p = await openWorkshop(ctx);
  await rename(p, 'Brouillon');
  // Les écritures réessaient deux fois : l'échec met quatre secondes à se
  // dire.
  const failed = await statusOf(p, 'failed', 10000);
  await ctx.setOffline(true);
  failing = false;
  await ctx.setOffline(false);
  const saved = await statusOf(p, 'saved', 8000);
  ok(
    'un envoi qui a échoué avant la coupure repart seul au retour du réseau',
    !!failed && !!saved && (await serverName()) === 'Brouillon',
    `${failed ? 'échec vu' : 'pas d’échec'} · ${saved ? 'Enregistré' : 'rien'} · ${await serverName()}`
  );
  await ctx.close();
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
