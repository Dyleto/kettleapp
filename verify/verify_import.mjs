/**
 * Importer un modèle chez un client (E10a).
 *
 * L'import remplace tout le programme : c'est le seul geste de l'atelier qui
 * pose une question avant d'agir, et elle dit ce qui part, ce qui vient et
 * ce qui reste. Un programme vide n'a rien à perdre : le choix suffit.
 *
 * Le serveur d'essai porte six séances chez Sarah et un modèle, « Prise de
 * masse », de deux séances. La suite lit le serveur, pas seulement l'écran :
 * un import que l'écran annonce et qu'un envoi de l'ancien programme
 * écraserait ensuite serait le pire des deux.
 */
import {
  API,
  BASE,
  launch,
  ok,
  failureCount,
  signIn,
  settle,
  clean,
  autosaved,
  gone,
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
const press = async (p, name, scope = p) => {
  await scope
    .getByRole('button', { name })
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
};

const browser = await launch();
const open = async (n = 1) => {
  await reset();
  const ctx = await browser.newContext(WIDE);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach/clients/${CLIENT}/s/${n}`, {
    waitUntil: 'domcontentloaded',
  });
  await settle(p);
  return { ctx, p };
};

{
  console.log('\n── remplacer un programme');
  const { ctx, p } = await open(4);
  const before = await serverSessions();
  await press(p, 'Importer un modèle…');
  const dialog = p.getByRole('dialog');
  const listed = await text(dialog);
  ok(
    '« Importer un modèle… » au pied du rail ouvre la liste des modèles, et dit ce qu’elle fera',
    listed.includes('Importer un modèle') &&
      listed.includes('Il prend la place du programme de Sarah.') &&
      /Prise de masse\s*\n?\s*2 séances/.test(listed),
    listed.replace(/\n+/g, ' | ').slice(0, 160)
  );

  await press(p, /Prise de masse/, dialog);
  const asked = await text(dialog);
  ok(
    'un programme qui a des séances demande avant de les remplacer : ce qui part, ce qui vient, ce qui reste',
    asked.includes('Remplacer le programme de Sarah ?') &&
      asked.includes('Ses 6 séances actuelles seront retirées du programme.') &&
      asked.includes('Les 2 séances du modèle les remplacent.') &&
      asked.includes('Son historique et ses charges restent.'),
    asked.replace(/\n+/g, ' | ').slice(0, 220)
  );

  await press(p, 'Annuler', dialog);
  ok(
    '  → « Annuler » revient au choix, sans rien toucher',
    (await text(dialog)).includes('Importer un modèle') &&
      (await serverSessions()).length === before.length,
    `${(await serverSessions()).length} séances`
  );

  await press(p, /Prise de masse/, dialog);
  await press(p, 'Remplacer le programme', dialog);
  await gone(dialog);
  await settle(p);
  const after = await serverSessions();
  ok(
    '  → « Remplacer le programme » remplace, ouvre la séance 1 et l’annonce',
    after.length === 2 &&
      p.url().endsWith('/s/1') &&
      (await p.locator('[data-session-row]').count()) === 2 &&
      /« Prise de masse » importé chez Sarah/.test(
        await text(p.locator('[data-scope="toast"]').first())
      ),
    `${before.length} → ${after.length} séances · ${p.url().split('/').slice(-2).join('/')}`
  );

  // L'éditeur adopte ce que le serveur rend : rien de l'ancien programme ne
  // repart derrière l'import.
  await autosaved(p);
  ok(
    '  → et rien de l’ancien programme ne repart derrière lui',
    (await serverSessions()).length === 2,
    `${(await serverSessions()).length} séances`
  );
  await ctx.close();
}

{
  console.log('\n── pendant un enregistrement');
  // L'enregistrement de la séance renommée est retenu deux secondes et
  // demie : parti avant l'import, il arriverait au serveur après lui, et
  // remettrait l'ancien programme. L'import attend, et le dit.
  await reset();
  const ctx = await browser.newContext(WIDE);
  // `fallback()` et non `continue()` : la requête doit encore passer par la
  // route qui l'envoie au serveur d'essai de cette suite (voir `launch`).
  await ctx.route(/\/program\/sessions$/, async (route) => {
    if (route.request().method() !== 'PUT') return route.fallback();
    await new Promise((resolve) => setTimeout(resolve, 2500));
    return route.fallback();
  });
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach/clients/${CLIENT}/s/1`, {
    waitUntil: 'domcontentloaded',
  });
  await settle(p);
  await p
    .getByRole('button', { name: 'Nom de la séance 1' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await p.keyboard.type('Brouillon');
  await p.keyboard.press('Enter');
  await hold(p, 1000, 'le délai d’une frappe, pour que l’envoi parte');
  await press(p, 'Importer un modèle…');
  const dialog = p.getByRole('dialog');
  await press(p, /Prise de masse/, dialog);
  await press(p, 'Remplacer le programme', dialog);
  const toast = await text(p.locator('[data-scope="toast"]').first());
  // L'envoi retenu finit par arriver : on attend qu'il soit là — un état,
  // pas une durée —, puis on lit ce que le serveur garde.
  let stored = await serverSessions();
  for (let i = 0; i < 40 && stored[0]?.name !== 'Brouillon'; i++) {
    await settle(p);
    stored = await serverSessions();
  }
  ok(
    'pendant un enregistrement, l’import attend, et dit que rien n’a bougé',
    /Le modèle n’a pas été importé/.test(toast) &&
      /Le programme de Sarah n’a pas bougé/.test(toast) &&
      stored.length === 6 &&
      stored[0]?.name === 'Brouillon',
    `${toast.replace(/\n+/g, ' | ')} · ${stored.length} séances, la 1 : ${stored[0]?.name}`
  );
  await ctx.close();
}

{
  console.log('\n── une frappe pas encore partie');
  // L'horloge de la page est figée : la frappe attend ses 800 ms, et
  // l'import passe pendant ce temps — ce qu'un coach rapide fait sans le
  // savoir. L'écran doit montrer l'import, et rien de l'ancien programme ne
  // doit repartir quand l'horloge reprend.
  await reset();
  const ctx = await browser.newContext(WIDE);
  const p = await signIn(ctx);
  await p.goto(`${BASE}/coach/clients/${CLIENT}/s/1`, {
    waitUntil: 'domcontentloaded',
  });
  await settle(p);
  await p.clock.install();
  await p
    .getByRole('button', { name: 'Nom de la séance 1' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await p.keyboard.type('Brouillon');
  await p.keyboard.press('Enter');
  await press(p, 'Importer un modèle…');
  const dialog = p.getByRole('dialog');
  await press(p, /Prise de masse/, dialog);
  await press(p, 'Remplacer le programme', dialog);
  await settle(p);
  const shownRows = await p.locator('[data-session-row]').count();
  await p.clock.runFor(5000);
  await settle(p);
  const stored = await serverSessions();
  ok(
    'une frappe pas encore partie ne repasse pas derrière l’import',
    shownRows === 2 && stored.length === 2,
    `${shownRows} séance(s) à l’écran, ${stored.length} chez le serveur`
  );
  await ctx.close();
}

{
  console.log('\n── partir d’un modèle');
  await reset();
  // Un programme vide : le serveur d'essai en importe un vide, puis
  // l'atelier part de là.
  const ctx = await browser.newContext(WIDE);
  // La première lecture seulement : après l'import, la page doit relire le
  // vrai programme. La réponse se lit hors du navigateur, au serveur d'essai
  // de cette suite — `route.fetch()` irait au port d'origine.
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
  await press(p, 'Partir d’un modèle');
  const dialog = p.getByRole('dialog');
  const listed = await text(dialog);
  await press(p, /Prise de masse/, dialog);
  await gone(dialog);
  await settle(p);
  ok(
    'un programme vide part d’un modèle sans question : il n’a rien à perdre',
    listed.includes('Ses séances deviennent le programme de Sarah.') &&
      (await p.getByText('Remplacer le programme de Sarah ?').count()) === 0 &&
      (await serverSessions()).length === 2,
    `${(await serverSessions()).length} séances`
  );
  await ctx.close();
}

await reset();
await browser.close();
process.exit(failureCount() ? 1 : 0);
