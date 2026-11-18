/**
 * « + exercice » rangé, et la fiche à la place de l'aperçu (E6b).
 *
 * À la frappe, le sélecteur range d'abord les mouvements déjà dans ce
 * programme, puis la bibliothèque, puis « Créer « … » et ouvrir sa fiche » ;
 * chaque ligne dit son usage et si elle a une vidéo. La fiche d'un exercice,
 * ouverte depuis une ligne, prend la colonne de droite à partir de 1 280 px —
 * la ligne reste ouverte à côté — et dit chez combien de clients ce qu'on y
 * change changera.
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

const CLIENT = '507f1f77bcf86cd799439012';
const SESSION_1 = `${BASE}/coach/clients/${CLIENT}/s/1`;
const WIDE = { viewport: { width: 1440, height: 1000 } };
const MEDIUM = { viewport: { width: 1024, height: 900 } };

const reset = () => fetch(`${API}/api/mock/reset`, { method: 'POST' });
const press = async (p, name, scope = p) => {
  await scope
    .getByRole('button', { name, exact: typeof name === 'string' })
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
};
const text = (locator) =>
  locator
    .innerText({ timeout: 2000 })
    .then(clean)
    .catch(() => '');
const openRow = async (p, name) => {
  await p
    .locator('main [data-exercise-row]')
    .filter({ hasText: name })
    .first()
    .locator(':scope > button')
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
};
const openRows = (p) => p.locator('main [data-exercise-row][data-open]');
/** Les positions de ces mots dans un texte, dans l'ordre donné. */
const inOrder = (haystack, words) => {
  const at = words.map((w) => haystack.indexOf(w));
  return at.every((i, k) => i >= 0 && (k === 0 || i > at[k - 1]));
};

const browser = await launch();

{
  console.log('\n── « + exercice », à la frappe');
  await reset();
  const ctx = await browser.newContext(WIDE);
  const p = await signIn(ctx);
  await p.goto(SESSION_1, { waitUntil: 'domcontentloaded' });
  await settle(p);

  // Le « + exercice » de l'échauffement.
  await p
    .locator('main [data-block-type="warmup"]')
    .getByRole('button', { name: 'exercice' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  const search = p.getByRole('textbox', { name: 'Chercher un exercice' });
  await search.fill('ur').catch(() => {});
  await settle(p);
  const list = await text(p.locator('main [data-exercise-picker]'));
  ok(
    'd’abord ce programme, puis la bibliothèque, puis « Créer »',
    inOrder(list.toLowerCase(), [
      'dans ce programme',
      'burpee',
      'dans ta bibliothèque',
      'turkish get-up',
      'créer « ur » et ouvrir sa fiche',
    ]),
    list.replace(/\n+/g, ' | ').slice(0, 200)
  );
  ok(
    '  → chaque mouvement dit son usage',
    /Burpee\s*\|?\s*7 séances/.test(list.replace(/\n+/g, ' | ')) &&
      /Turkish Get-Up\s*\|?\s*5 séances/.test(list.replace(/\n+/g, ' | ')),
    list.replace(/\n+/g, ' | ').slice(0, 200)
  );

  await search.fill('swing').catch(() => {});
  await settle(p);
  ok(
    '  → une vidéo posée se voit avant de choisir',
    (await p
      .locator('main [data-exercise-picker]')
      .getByRole('img', { name: 'avec vidéo' })
      .count()) === 1
  );
  await ctx.close();
}

{
  console.log('\n── la fiche, à la place de l’aperçu');
  await reset();
  const ctx = await browser.newContext(WIDE);
  const p = await signIn(ctx);
  await p.goto(SESSION_1, { waitUntil: 'domcontentloaded' });
  await settle(p);

  await openRow(p, 'Goblet Squat');
  await press(p, 'Ouvrir la fiche de Goblet Squat');
  const aside = p.getByRole('complementary', { name: 'Fiche de Goblet Squat' });
  const said = await text(aside);
  ok(
    'à partir de 1 280 px, elle prend la colonne de droite, sans recouvrir',
    (await aside.count()) === 1 &&
      (await p.getByRole('dialog').count()) === 0 &&
      !/Retour du client/i.test(await text(p.locator('main'))),
    said.replace(/\n+/g, ' | ').slice(0, 120)
  );
  ok(
    '  → elle dit chez combien de clients ce qu’on change changera',
    said.includes(
      'Utilisé dans 9 séances, chez 4 clients. Ce que tu changes ici change partout.'
    ),
    said.replace(/\n+/g, ' | ').slice(-140)
  );

  // Travailler dans la fiche n'est pas cliquer à côté de la ligne.
  await aside
    .getByLabel(/^Consigne — /)
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
  ok(
    '  → la ligne reste ouverte pendant qu’on écrit dans la fiche',
    (await openRows(p).count()) === 1 &&
      /Goblet Squat/.test(await text(openRows(p).first())),
    `${await openRows(p).count()} ligne(s) ouverte(s)`
  );

  await press(p, 'Retour au programme', aside);
  await gone(aside);
  ok(
    '  → « Retour au programme » rend la colonne à son retour du client',
    (await aside.count()) === 0 &&
      /Retour du client/i.test(await text(p.locator('main'))),
    (await text(p.locator('main'))).slice(-80)
  );
  await ctx.close();
}

{
  console.log('\n── sous 1 280 px, un tiroir');
  await reset();
  const ctx = await browser.newContext(MEDIUM);
  const p = await signIn(ctx);
  await p.goto(SESSION_1, { waitUntil: 'domcontentloaded' });
  await settle(p);
  await openRow(p, 'Goblet Squat');
  await press(p, 'Ouvrir la fiche de Goblet Squat');
  ok(
    'la fiche s’ouvre par-dessus l’atelier, faute de colonne',
    (await p
      .getByRole('dialog')
      .getByLabel(/^Consigne — /)
      .count()) >= 1 &&
      (await p.getByRole('complementary', { name: /^Fiche de / }).count()) === 0
  );
  await ctx.close();
}

await reset();
await browser.close();
process.exit(failureCount() ? 1 : 0);
