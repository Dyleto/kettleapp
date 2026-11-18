/**
 * Ajouter un bloc : la palette des formats, dessinée (E6a).
 *
 * « Ajouter un bloc » déplie neuf formats, chacun avec son dessin ; en
 * choisir un crée le bloc en fin de séance et ouvre aussitôt son
 * « + exercice » — dans le bloc sur grand écran, en tiroir sur téléphone, où
 * la palette elle-même monte en feuille. Et les paliers d'une échelle se
 * tapent comme on veut : tirets, espaces ou virgules.
 *
 * Aucune suite ne couvrait l'ajout d'un bloc avant celle-ci.
 */
import {
  API,
  BASE,
  launch,
  ok,
  failureCount,
  signIn,
  settle,
  autosaved,
  MOBILE,
  clean,
} from './common.mjs';

const CLIENT = '507f1f77bcf86cd799439012';
const DESKTOP = { viewport: { width: 1440, height: 1000 } };
const session = (n) => `${BASE}/coach/clients/${CLIENT}/s/${n}`;

const reset = () => fetch(`${API}/api/mock/reset`, { method: 'POST' });
const serverBlocks = async (n) =>
  (await (await fetch(`${API}/api/coach/clients/${CLIENT}`)).json()).program
    .sessions[n - 1].blocks;
const press = async (p, name, scope = p) => {
  await scope
    .getByRole('button', { name, exact: typeof name === 'string' })
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
};
const isFocused = (locator) =>
  locator.evaluate((el) => el === document.activeElement).catch(() => false);
const show = (x) => JSON.stringify(x);

/** Ce que chaque tuile dessine : ses traits, par sorte. */
const sketches = (scope) =>
  scope.locator('[data-format]').evaluateAll((tiles) =>
    tiles.map((tile) => ({
      format: tile.getAttribute('data-format'),
      kinds: [...tile.querySelectorAll('[data-stroke]')].map((s) =>
        s.getAttribute('data-stroke')
      ),
    }))
  );

const browser = await launch();

{
  console.log('\n── « Ajouter un bloc » déplie la palette');
  await reset();
  const ctx = await browser.newContext(DESKTOP);
  const p = await signIn(ctx);
  await p.goto(session(2), { waitUntil: 'domcontentloaded' });
  await settle(p);

  await press(p, 'Ajouter un bloc');
  const palette = p.locator('main [data-block-picker]');
  const drawn = await sketches(palette);
  const of = (format) => drawn.find((d) => d.format === format)?.kinds ?? [];
  ok(
    'neuf formats, chacun dessiné, sans « Every »',
    drawn.length === 9 &&
      drawn.every((d) => d.kinds.length > 0) &&
      !drawn.some((d) => d.format === 'every') &&
      of('tabata').includes('rest') &&
      !of('warmup').includes('work'),
    show(drawn.map((d) => `${d.format}:${d.kinds.length}`))
  );

  await press(p, 'Annuler', palette);
  ok(
    '  → « Annuler » la replie',
    (await palette.count()) === 0 &&
      (await p.getByRole('button', { name: 'Ajouter un bloc' }).count()) === 1
  );

  await press(p, 'Ajouter un bloc');
  await press(p, /^Tabata/, palette);
  const blocks = await serverBlocks(2).catch(() => []);
  const search = p
    .locator('main [data-block-type]')
    .last()
    .getByRole('textbox', { name: 'Chercher un exercice' });
  const ready = await isFocused(search);
  ok(
    'choisir un format crée le bloc en fin de séance, son « + exercice » ouvert',
    show(blocks.map((b) => b.type)) === show(['tabata', 'classic', 'tabata']) &&
      blocks[2].rounds === 8 &&
      ready,
    `${show(blocks.map((b) => b.type))} · champ prêt : ${ready}`
  );

  await search.fill('Burpee').catch(() => {});
  await settle(p);
  await p.keyboard.press('Enter');
  await autosaved(p);
  const added = (await serverBlocks(2))[2]?.exercises ?? [];
  ok(
    '  → l’exercice choisi s’y place',
    show(added.map((e) => e.exercise.name)) === show(['Burpee']),
    show(added.map((e) => e.exercise.name))
  );
  await ctx.close();
}

{
  console.log('\n── sur téléphone, la palette monte en feuille');
  await reset();
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.goto(session(2), { waitUntil: 'domcontentloaded' });
  await settle(p);

  await press(p, 'Ajouter un bloc');
  const sheet = p.getByRole('dialog', { name: 'Quel format ?' });
  const first = await sheet.locator('[data-format]').count();
  await press(p, 'TimeCap et les autres', sheet);
  const all = await sheet.locator('[data-format]').count();
  ok(
    'huit formats sous le pouce, et TimeCap se déplie',
    first === 8 && all === 9,
    `${first} puis ${all}`
  );

  await press(p, /^Chipper/, sheet);
  const drawer = p.getByRole('dialog');
  const opened =
    (await drawer
      .getByRole('textbox', { name: 'Chercher un exercice' })
      .count()) === 1;
  // Le tiroir s'ouvrirait aussi pour un bloc qui n'existe pas : c'est
  // l'exercice choisi, retrouvé dans le bloc créé, qui dit qu'il était le bon.
  await drawer
    .getByRole('textbox', { name: 'Chercher un exercice' })
    .fill('Burpee')
    .catch(() => {});
  await settle(p);
  await drawer
    .getByText('Burpee', { exact: true })
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
  await autosaved(p);
  const blocks = await serverBlocks(2).catch(() => []);
  ok(
    '  → choisir crée le bloc et ouvre le tiroir de ses exercices',
    opened &&
      blocks.at(-1)?.type === 'chipper' &&
      show(blocks.at(-1)?.exercises.map((e) => e.exercise.name)) ===
        show(['Burpee']),
    `tiroir : ${opened} · ${show(blocks.map((b) => `${b.type}:${b.exercises.length}`))}`
  );
  await ctx.close();
}

{
  console.log('\n── les paliers d’une échelle, tapés librement');
  await reset();
  const ctx = await browser.newContext(DESKTOP);
  const p = await signIn(ctx);
  await p.goto(session(5), { waitUntil: 'domcontentloaded' });
  await settle(p);

  await press(p, /^Paliers de répétitions/);
  // Le champ s'ouvre sélectionné : la frappe remplace les paliers.
  await p.keyboard.type('2, 4 6-8');
  await settle(p);
  const header = clean(
    await p
      .locator('main [data-block-type="ladder"]')
      .innerText({ timeout: 2000 })
      .catch(() => '')
  );
  await p.keyboard.press('Enter');
  await autosaved(p);
  const ladder = (await serverBlocks(5))[0];
  ok(
    'virgules, espaces et tirets se lisent, et le rappel le dit',
    /2 · 4 · 6 · 8 — 4 paliers/.test(header) &&
      /Tirets, espaces ou virgules/.test(header) &&
      show(ladder.repsScheme) === show([2, 4, 6, 8]),
    `${show(ladder.repsScheme)} · ${header.replace(/\n+/g, ' | ').slice(0, 100)}`
  );
  await ctx.close();
}

await reset();
await browser.close();
process.exit(failureCount() ? 1 : 0);
