/**
 * « Utiliser pour un client », depuis l'écran des modèles (F6b).
 *
 * Le chemin inverse de l'import d'E10a : on part du modèle, on choisit le
 * client. La feuille dit pour chacun ce que l'import ferait — un programme
 * vide s'importe d'une touche, un programme rempli demande, avec la boîte de
 * l'atelier —, et un import réussi ouvre l'atelier du client.
 *
 * La liste des clients est servie par la suite : le serveur d'essai rend
 * une liste vide. Sarah y garde son vrai nombre de séances, relu au serveur
 * à chaque demande, pour que la ligne et la question disent la même chose
 * que lui. Manon n'a rien : le serveur d'essai sert la fiche de Sarah sous
 * tous les identifiants, et c'est bien le programme importé qu'on lit.
 *
 * Depuis l'atelier d'un modèle, l'import attend que ce qu'on vient d'y
 * écrire soit enregistré : l'enregistrement est retenu, et la feuille doit
 * le dire et attendre.
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
  gone,
} from './common.mjs';

const SARAH = '507f1f77bcf86cd799439012';
const MANON = '507f1f77bcf86cd7994390aa';
const WIDE = { viewport: { width: 1440, height: 1000 } };

const serverSessions = async () => {
  const r = await fetch(`${API}/api/coach/clients/${SARAH}`);
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

const row = (_id, firstName, lastName, sessionCount) => ({
  _id,
  firstName,
  lastName,
  unseenCount: 0,
  linkedAt: '2026-06-01T09:00:00.000Z',
  tagIds: [],
  weekDone: 0,
  weekTarget: 3,
  sessionCount,
  recentEfforts: [],
});

await fetch(`${API}/api/mock/reset`, { method: 'POST' });
// Un modèle sans séance, à côté de « Prise de masse ».
const emptyId = await fetch(`${API}/api/coach/templates`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Encore vide' }),
})
  .then((r) => r.json())
  .then((body) => body.template?._id ?? '');

const browser = await launch();
const ctx = await browser.newContext(WIDE);
await ctx.route(/\/api\/coach\/clients(\?|$)/, async (r) => {
  if (r.request().method() !== 'GET') return r.fallback();
  const sessions = (await serverSessions()).length;
  return r.fulfill({
    json: [
      row(SARAH, 'Sarah', 'Martin', sessions),
      row(MANON, 'Manon', 'Petit', 0),
    ],
  });
});
// Les imports envoyés, dans l'ordre : le client nommé par l'adresse, le
// modèle par le corps.
// Une panne vaut pour toutes les tentatives : une mutation est reprise
// deux fois, et un 500 isolé passerait à la reprise.
const imports = [];
let failing = false;
await ctx.route(/\/program\/import$/, async (r) => {
  if (failing) return r.fulfill({ status: 500, json: { message: 'Panne' } });
  imports.push(
    `${r.request().url().split('/').at(-3)} ${r.request().postDataJSON().templateId}`
  );
  return r.fallback();
});

const p = await signIn(ctx);
const openTemplates = async () => {
  await p.goto(`${BASE}/coach/templates`, { waitUntil: 'domcontentloaded' });
  await settle(p);
};
const card = (name) =>
  p.locator('[data-template-card]', {
    has: p.getByRole('heading', { name, exact: true }),
  });
const useButton = (name) =>
  card(name).getByRole('button', { name: 'Utiliser pour un client' });
const sheet = p.getByRole('dialog');
const rows = () =>
  sheet
    .locator('[data-use-client]')
    .evaluateAll((els) => els.map((el) => el.getAttribute('data-use-client')))
    .catch(() => []);
// Le nom, la ligne et le bouton d'une rangée, sans les initiales de
// l'avatar.
const rowText = (id) =>
  sheet
    .locator(`[data-use-client="${id}"]`)
    .locator('p, button')
    .allInnerTexts()
    .then((parts) => clean(parts.map((t) => t.trim()).join(' / ')))
    .catch(() => '');
/** Un message de réussite ne reste que trois secondes : on l'attend dès le
 * geste, avant que l'écran suivant ait fini de charger. */
const toastSaying = (words) =>
  p
    .locator('[data-scope="toast"][data-part="title"]', { hasText: words })
    .first()
    .waitFor({ timeout: 6000 })
    .then(() => true)
    .catch(() => false);

{
  console.log('\n── la feuille');
  await openTemplates();
  ok(
    'un modèle vide ne s’utilise pour personne',
    (await useButton('Encore vide')
      .isDisabled()
      .catch(() => false)) &&
      (await useButton('Prise de masse')
        .isEnabled()
        .catch(() => false))
  );

  await useButton('Prise de masse')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const title = await text(sheet.locator('h2'));
  const sarah = await rowText(SARAH);
  const manon = await rowText(MANON);
  const sessions = (await serverSessions()).length;
  ok(
    'la feuille dit, pour chaque client, ce que son programme porte et ce que l’import fera',
    title === 'Utiliser « Prise de masse » pour…' &&
      sarah === `Sarah Martin / a déjà ${sessions} séances / Remplacer…` &&
      manon === 'Manon Petit / programme vide / Importer',
    `${title} | ${sarah} | ${manon}`
  );

  await sheet
    .getByRole('searchbox', { name: 'Chercher un client' })
    .fill('PETIT')
    .catch(() => {});
  const found = await rows();
  await sheet
    .getByRole('searchbox', { name: 'Chercher un client' })
    .fill('')
    .catch(() => {});
  ok(
    'chercher resserre la liste, sans casse',
    found.join() === MANON,
    found.join()
  );

  await press(p, 'Remplacer le programme de Sarah Martin', sheet);
  const asked = await text(sheet);
  ok(
    '« Remplacer… » pose la question de l’atelier : ce qui part, ce qui vient, ce qui reste',
    asked.includes('Remplacer le programme de Sarah ?') &&
      asked.includes(
        `Ses ${sessions} séances actuelles seront retirées du programme.`
      ) &&
      asked.includes('Les 2 séances du modèle les remplacent.') &&
      asked.includes('Son historique et ses charges restent.'),
    asked.replace(/\n+/g, ' | ').slice(0, 220)
  );
  await press(p, 'Annuler', sheet);
  ok(
    '  → « Annuler » revient à la liste, sans rien importer',
    (await rows()).length === 2 && imports.length === 0,
    imports.join()
  );
}

{
  console.log('\n── importer');
  failing = true;
  await press(p, 'Importer chez Manon Petit', sheet);
  // Trois tentatives, la dernière après trois secondes.
  await sheet
    .getByRole('alert')
    .waitFor({ timeout: 8000 })
    .catch(() => {});
  ok(
    'un import raté laisse la feuille ouverte, et dit que rien n’a bougé',
    (await text(sheet.getByRole('alert'))) ===
      'Le modèle n’a pas été importé : le programme de Manon n’a pas bougé. Réessaie.' &&
      (await rows()).length === 2
  );
  failing = false;

  const toast = toastSaying('Programme importé depuis “Prise de masse”');
  await press(p, 'Importer chez Manon Petit', sheet);
  const announced = await toast;
  await gone(sheet);
  await settle(p);
  ok(
    '« Importer » importe chez ce client, ouvre son atelier sur la séance 1, et le dit',
    imports.join() === `${MANON} tpl1` &&
      p.url().endsWith(`/coach/clients/${MANON}/s/1`) &&
      (await p.locator('[data-session-row]').count()) === 2 &&
      announced,
    `${imports.join()} · ${p.url().split('/').slice(-3).join('/')} · ${announced ? 'annoncé' : 'sans message'}`
  );

  // Sarah, cette fois : la question, puis l'import.
  await openTemplates();
  await useButton('Prise de masse')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  await press(p, 'Remplacer le programme de Sarah Martin', sheet);
  await press(p, 'Remplacer le programme', sheet);
  await gone(sheet);
  await settle(p);
  ok(
    '  → « Remplacer le programme » importe aussi, et ouvre l’atelier de ce client',
    imports.at(-1) === `${SARAH} tpl1` &&
      p.url().endsWith(`/coach/clients/${SARAH}/s/1`),
    `${imports.join()} · ${p.url().split('/').slice(-3).join('/')}`
  );
}

{
  console.log('\n── depuis l’atelier d’un modèle');
  await p.goto(`${BASE}/coach/templates/${emptyId}/s/1`, {
    waitUntil: 'domcontentloaded',
  });
  await settle(p);
  ok(
    'l’atelier d’un modèle vide ne l’offre pas non plus',
    emptyId !== '' &&
      (await p
        .getByRole('button', { name: 'Utiliser pour un client' })
        .isDisabled({ timeout: 2000 })
        .catch(() => false)),
    emptyId
  );

  // L'enregistrement de la séance ajoutée est retenu : tant qu'il n'est pas
  // arrivé, le serveur importerait le modèle d'avant.
  let release;
  const held = new Promise((resolve) => (release = resolve));
  await ctx.route(/\/api\/coach\/templates\/tpl1\/sessions$/, async (r) => {
    await held;
    return r.fallback();
  });
  await p.goto(`${BASE}/coach/templates/tpl1/s/1`, {
    waitUntil: 'domcontentloaded',
  });
  await settle(p);
  await p
    .getByRole('button', { name: '+ Séance' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await p
    .getByRole('button', { name: 'Utiliser pour un client' })
    .click({ timeout: 2000 })
    .catch(() => {});
  const importer = sheet.getByRole('button', {
    name: 'Importer chez Manon Petit',
  });
  await importer.waitFor({ timeout: 3000 }).catch(() => {});
  const waiting = await text(sheet.locator('[data-import-blocked]'));
  const disabledWhileSaving = await importer.isDisabled().catch(() => false);
  ok(
    'depuis l’atelier d’un modèle, l’import attend que ce qu’on y a écrit soit enregistré',
    waiting === 'Ton modèle finit de s’enregistrer…' && disabledWhileSaving,
    waiting
  );
  release();
  await sheet
    .locator('[data-import-blocked]')
    .waitFor({ state: 'detached', timeout: 4000 })
    .catch(() => {});
  ok(
    '  → puis s’offre, une fois l’enregistrement arrivé',
    (await importer.isEnabled().catch(() => false)) &&
      (await text(sheet.locator('h2'))) === 'Utiliser « Prise de masse » pour…'
  );
}

await browser.close();
process.exit(failureCount() > 0 ? 1 : 0);
