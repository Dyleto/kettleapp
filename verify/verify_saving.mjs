/**
 * L'état de l'enregistrement, et le programme vide (E10b).
 *
 * L'atelier s'enregistre seul. Son état se lisait au bas de la page, loin
 * de ce qu'on venait d'écrire, et aucune suite ne lisait l'échec. La
 * maquette le pose dans l'en-tête de la séance : « Enregistrement… », puis
 * « Enregistré » trois secondes ; en échec, « Non enregistré · Réessayer »,
 * qui reste jusqu'à ce qu'un enregistrement réussisse. Sur téléphone, où
 * l'en-tête cède sa place, la ligne du bas le dit.
 *
 * Les mutations réessaient deux fois avant d'échouer : un échec met environ
 * quatre secondes à s'afficher, et la suite attend l'état, pas la durée.
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
  hold,
} from './common.mjs';

const CLIENT = '507f1f77bcf86cd799439012';
const WIDE = { viewport: { width: 1440, height: 1000 } };

const reset = () => fetch(`${API}/api/mock/reset`, { method: 'POST' });
const serverSessions = async () => {
  const r = await fetch(`${API}/api/coach/clients/${CLIENT}`);
  return (await r.json()).program.sessions;
};
const text = (locator) =>
  locator
    .innerText({ timeout: 2000 })
    .then(clean)
    .catch(() => '');
/** L'état affiché, attendu jusqu'à `until` : `null` quand il ne vient pas. */
const statusOf = async (p, signal, timeout = 8000) => {
  const shown = p.locator(`[data-save-status="${signal}"]`);
  await shown
    .first()
    .waitFor({ state: 'visible', timeout })
    .catch(() => {});
  return (await shown.count()) ? shown.first() : null;
};
/** Les lignes d'état visibles à l'écran, où qu'elles soient. */
const visibleStatuses = (p) =>
  p
    .getByRole('status')
    .filter({ hasText: /Enregistr|Non enregistré/ })
    .filter({ visible: true })
    .count();
const rename = async (p, name) => {
  await p
    .getByRole('button', { name: 'Nom de la séance 1' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await p.keyboard.type(name);
  await p.keyboard.press('Enter');
};

const browser = await launch();

{
  console.log('\n── un enregistrement qui se passe bien');
  await reset();
  const ctx = await browser.newContext(WIDE);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach/clients/${CLIENT}/s/1`, {
    waitUntil: 'domcontentloaded',
  });
  await settle(p);
  await rename(p, 'Brouillon');
  const saving = await statusOf(p, 'saving', 2000);
  const savingText = saving ? await text(saving) : '';
  const shownTogether = await visibleStatuses(p);
  const title = await p
    .getByRole('button', { name: 'Nom de la séance 1' })
    .boundingBox();
  const box = saving ? await saving.boundingBox() : null;
  const saved = await statusOf(p, 'saved');
  ok(
    'l’état de l’enregistrement se lit dans l’en-tête de la séance : « Enregistrement… », puis « Enregistré »',
    savingText === 'Enregistrement…' &&
      shownTogether === 1 &&
      !!title &&
      !!box &&
      Math.abs(box.y + box.height / 2 - (title.y + title.height / 2)) < 20 &&
      (saved ? await text(saved) : '') === 'Enregistré',
    `« ${savingText} » · ${shownTogether} ligne(s) d’état visible(s)`
  );

  await hold(p, 2000, '« Enregistré » doit encore se lire à deux secondes');
  const stillThere =
    (await p.locator('[data-save-status="saved"]').count()) === 1;
  await p
    .locator('[data-save-status]')
    .first()
    .waitFor({ state: 'detached', timeout: 3000 })
    .catch(() => {});
  ok(
    '  → « Enregistré » reste trois secondes, puis s’efface',
    stillThere && (await p.locator('[data-save-status]').count()) === 0
  );
  await ctx.close();
}

{
  console.log('\n── un enregistrement qui échoue');
  await reset();
  const ctx = await browser.newContext(WIDE);
  let failing = true;
  await ctx.route(/\/program\/sessions$/, (route) =>
    failing && route.request().method() === 'PUT'
      ? route.fulfill({ status: 500, json: { message: 'Panne' } })
      : route.fallback()
  );
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach/clients/${CLIENT}/s/1`, {
    waitUntil: 'domcontentloaded',
  });
  await settle(p);
  await rename(p, 'Brouillon');
  const failed = await statusOf(p, 'failed', 10000);
  // `innerText` passe à la ligne entre les éléments d'une rangée flexible.
  const said = failed ? (await text(failed)).replace(/\s+/g, ' ') : '';
  await hold(p, 4000, 'un échec ne s’efface pas de lui-même');
  const stays = (await p.locator('[data-save-status="failed"]').count()) === 1;

  failing = false;
  await p
    .locator('[data-save-status="failed"]')
    .getByRole('button', { name: 'Réessayer' })
    .click({ timeout: 2000 })
    .catch(() => {});
  const saved = await statusOf(p, 'saved');
  ok(
    'un échec reste, « Non enregistré · Réessayer », jusqu’à ce que « Réessayer » réussisse',
    said === 'Non enregistré · Réessayer' &&
      stays &&
      !!saved &&
      (await serverSessions())[0]?.name === 'Brouillon',
    `« ${said} » · ${stays ? 'resté' : 'parti'} · le serveur porte « ${(await serverSessions())[0]?.name} »`
  );
  await ctx.close();
}

{
  console.log('\n── sur téléphone');
  await reset();
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach/clients/${CLIENT}/s/1`, {
    waitUntil: 'domcontentloaded',
  });
  await settle(p);
  await p
    .getByRole('button', { name: 'Menu de la séance 1' })
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  await p
    .getByRole('textbox', { name: 'Nom de la séance 1' })
    .fill('Brouillon')
    .catch(() => {});
  const line = p.getByRole('status').filter({ hasText: /Enregistr/ });
  await line
    .filter({ visible: true })
    .first()
    .waitFor({ timeout: 3000 })
    .catch(() => {});
  ok(
    'sur téléphone, l’état se lit au bas de l’écran',
    (await visibleStatuses(p)) === 1 &&
      (await p
        .locator('[data-save-status]')
        .filter({ visible: true })
        .count()) === 0,
    `${await visibleStatuses(p)} ligne(s) visible(s)`
  );
  await ctx.close();
}

{
  console.log('\n── un programme vide');
  await reset();
  const ctx = await browser.newContext(WIDE);
  let emptied = false;
  await ctx.route(
    new RegExp(`/api/coach/clients/${CLIENT}$`),
    async (route) => {
      if (emptied || route.request().method() !== 'GET')
        return route.fallback();
      emptied = true;
      const body = await (
        await fetch(`${API}/api/coach/clients/${CLIENT}`)
      ).json();
      return route.fulfill({
        json: { ...body, program: { ...body.program, sessions: [] } },
      });
    }
  );
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach/clients/${CLIENT}/s/1`, {
    waitUntil: 'domcontentloaded',
  });
  await settle(p);
  const main = await text(p.locator('main'));
  ok(
    'un programme vide accueille : le personnage, le prénom, et deux façons de commencer',
    (await p.locator('main [data-mascot="hello"]').count()) === 1 &&
      main.includes('Le programme de Sarah est vide') &&
      main.includes('Écris sa première séance, ou pars d’un de tes modèles.') &&
      (await p.getByRole('button', { name: 'Ajouter une séance' }).count()) ===
        1 &&
      (await p.getByRole('button', { name: 'Partir d’un modèle' }).count()) ===
        1,
    main.replace(/\n+/g, ' | ').slice(0, 160)
  );
  await ctx.close();
}

await reset();
await browser.close();
process.exit(failureCount() ? 1 : 0);
