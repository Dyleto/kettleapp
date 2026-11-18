/**
 * Le bloc de l'atelier : une carte, des pastilles, un menu (E5b).
 *
 * L'en-tête dit le format et ses réglages en pastilles ambre ; toucher une
 * pastille l'ouvre sur place, prête à la frappe. Le « ⋯ » nomme, ajoute une
 * consigne, change de format, duplique, supprime. Sur téléphone, l'en-tête
 * entier ouvre une feuille qui rassemble tout cela.
 *
 * Les séances du coach se remettent à zéro au début de chaque partie
 * (`/api/mock/reset`) : chaque partie écrit dans le programme.
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
  gone,
} from './common.mjs';

const CLIENT = '507f1f77bcf86cd799439012';
const DESKTOP = { viewport: { width: 1440, height: 1000 } };
const SESSION_1 = `${BASE}/coach/clients/${CLIENT}/s/1`;

const reset = () => fetch(`${API}/api/mock/reset`, { method: 'POST' });
const serverBlocks = async () =>
  (await (await fetch(`${API}/api/coach/clients/${CLIENT}`)).json()).program
    .sessions[0].blocks;

const block = (p, type, nth = 0) =>
  p.locator(`main [data-block-type="${type}"]`).nth(nth);
const text = (locator) =>
  locator
    .innerText({ timeout: 2000 })
    .then(clean)
    .catch(() => '');
const press = async (p, name, scope = p) => {
  await scope
    .getByRole('button', { name, exact: typeof name === 'string' })
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
};
const menu = async (p, type, item) => {
  await press(p, `Menu du bloc ${type}`);
  await p
    .getByRole('menuitem', { name: item })
    .click({ timeout: 2000 })
    .catch(() => {});
  await settle(p);
};
/** Le coin haut gauche de l'écran, dans le rail : rien n'y est à toucher.
 * Voir `verify_exerciserow`. */
const clickElsewhere = async (p) => {
  await p.mouse.click(2, 2);
  await settle(p);
};
const focusedName = (p) =>
  p.evaluate(
    () =>
      document.activeElement?.getAttribute('aria-label') ??
      document.activeElement?.textContent ??
      ''
  );
const show = (x) => JSON.stringify(x);

const browser = await launch();

{
  console.log('\n── l’en-tête : le format et ses réglages en pastilles');
  await reset();
  const ctx = await browser.newContext(DESKTOP);
  const p = await signIn(ctx);
  await p.goto(SESSION_1, { waitUntil: 'domcontentloaded' });
  await settle(p);

  const emom = block(p, 'emom');
  const amrap = block(p, 'amrap');
  const amrapText = await text(amrap);
  ok(
    'les réglages se touchent en pastilles, le reste attend derrière « ⋯ »',
    (await emom
      .getByRole('button', { name: 'Nombre de tours : 10 tours' })
      .count()) === 1 &&
      (await emom
        .getByRole('button', {
          name: 'Intervalle en minutes : toutes les 1 min',
        })
        .count()) === 1 &&
      (await emom
        .getByRole('button', { name: /^Supprimer le bloc/ })
        .count()) === 0 &&
      (await emom
        .getByRole('button', { name: 'Menu du bloc EMOM' })
        .count()) === 1
  );
  ok(
    'le nom en pastille, la consigne en bulle avant les exercices',
    (await amrap
      .getByRole('button', {
        name: 'Nom personnalisé du bloc AMRAP : AMRAP 12',
      })
      .count()) === 1 &&
      amrapText.indexOf('Rythme régulier') > -1 &&
      amrapText.indexOf('Rythme régulier') < amrapText.indexOf('Burpee'),
    amrapText.replace(/\n+/g, ' | ').slice(0, 120)
  );

  await press(p, 'Nombre de tours : 10 tours', emom);
  const field = p.getByRole('textbox', { name: 'Nombre de tours' });
  const ready = await field
    .evaluate((el) => el === document.activeElement)
    .catch(() => false);
  await field.fill('12', { timeout: 2000 }).catch(() => {});
  await p.keyboard.press('Enter');
  await autosaved(p);
  await clickElsewhere(p);
  ok(
    'toucher une pastille l’ouvre sur place, prête à la frappe',
    ready &&
      (await emom
        .getByRole('button', { name: 'Nombre de tours : 12 tours' })
        .count()) === 1 &&
      (await serverBlocks())[1].rounds === 12,
    `champ prêt : ${ready} · serveur : ${(await serverBlocks())[1].rounds}`
  );

  await press(p, 'Intervalle en minutes : toutes les 1 min', emom);
  await press(p, 'Augmenter l’intervalle', emom);
  await autosaved(p);
  await clickElsewhere(p);
  ok(
    '  → « + » règle la valeur sans clavier',
    (await emom
      .getByRole('button', { name: 'Intervalle en minutes : toutes les 2 min' })
      .count()) === 1 && (await serverBlocks())[1].intervalMinutes === 2,
    `serveur : ${(await serverBlocks())[1].intervalMinutes}`
  );

  // Le premier Échap rend la valeur tapée ; le second referme la pastille.
  await press(p, /^Durée en minutes/, amrap);
  await p.keyboard.press('Escape');
  await p.keyboard.press('Escape');
  await settle(p);
  ok(
    'Échap referme la pastille et rend le focus à la pastille',
    (await p.locator('main [data-pill-open]').count()) === 0 &&
      /^Durée en minutes/.test(await focusedName(p)),
    `${await p.locator('main [data-pill-open]').count()} ouverte(s) · focus : ${await focusedName(p)}`
  );
  await ctx.close();
}

{
  console.log('\n── le menu d’un bloc : nom, consigne, format');
  await reset();
  const ctx = await browser.newContext(DESKTOP);
  const p = await signIn(ctx);
  await p.goto(SESSION_1, { waitUntil: 'domcontentloaded' });
  await settle(p);
  const emom = block(p, 'emom');

  await menu(p, 'EMOM', 'Nommer le bloc');
  const name = p.getByRole('textbox', {
    name: 'Nom personnalisé du bloc EMOM',
  });
  const named = await name
    .evaluate((el) => el === document.activeElement)
    .catch(() => false);
  await name.fill('Cardio', { timeout: 2000 }).catch(() => {});
  await p.keyboard.press('Enter');
  await autosaved(p);
  ok(
    '« Nommer le bloc » ouvre le nom, qui se lit ensuite en pastille',
    named &&
      (await emom
        .getByRole('button', { name: 'Nom personnalisé du bloc EMOM : Cardio' })
        .count()) === 1 &&
      (await serverBlocks())[1].label === 'Cardio',
    `champ prêt : ${named} · serveur : ${show((await serverBlocks())[1].label)}`
  );

  await menu(p, 'EMOM', 'Ajouter une consigne');
  await p
    .getByRole('textbox', { name: 'Consigne du bloc EMOM' })
    .fill('Repartir à la minute pile', { timeout: 2000 })
    .catch(() => {});
  await autosaved(p);
  await clickElsewhere(p);
  ok(
    '« Ajouter une consigne » l’écrit, et elle se relit en bulle',
    (await emom
      .getByRole('button', {
        name: 'Consigne du bloc EMOM : Repartir à la minute pile',
      })
      .count()) === 1 &&
      (await serverBlocks())[1].notes === 'Repartir à la minute pile',
    show((await serverBlocks())[1].notes)
  );

  await menu(p, 'EMOM', 'Changer de format');
  await press(p, /^AMRAP/, emom);
  await autosaved(p);
  const changed = (await serverBlocks())[1];
  const body = clean(await p.locator('body').innerText());
  ok(
    '« Changer de format » garde les exercices, et prend les réglages du format',
    changed.type === 'amrap' &&
      changed.durationMinutes === 8 &&
      changed.rounds === undefined &&
      show(changed.exercises.map((e) => e.exercise.name)) ===
        show(['Kettlebell Swing', 'Goblet Squat']) &&
      /Bloc EMOM devenu AMRAP/.test(body),
    show({
      type: changed.type,
      durationMinutes: changed.durationMinutes,
      rounds: changed.rounds,
    })
  );

  await press(p, 'Annuler');
  await autosaved(p);
  const back = (await serverBlocks())[1];
  ok(
    '  → « Annuler » remet l’EMOM et ses tours',
    back.type === 'emom' &&
      back.rounds === 10 &&
      back.durationMinutes === undefined,
    show({
      type: back.type,
      rounds: back.rounds,
      durationMinutes: back.durationMinutes,
    })
  );

  await ctx.close();
}

{
  // Un décor neuf : « Annuler » ci-dessus pourrait avoir laissé un AMRAP,
  // et ces deux gestes ne doivent pas en dépendre.
  console.log('\n── le menu d’un bloc : dupliquer, supprimer');
  await reset();
  const ctx = await browser.newContext(DESKTOP);
  const p = await signIn(ctx);
  await p.goto(SESSION_1, { waitUntil: 'domcontentloaded' });
  await settle(p);

  await menu(p, 'EMOM', 'Dupliquer le bloc');
  await autosaved(p);
  const blocks = await serverBlocks();
  ok(
    '« Dupliquer le bloc » pose la copie juste dessous',
    show(blocks.map((b) => b.type)) ===
      show(['warmup', 'emom', 'emom', 'amrap']) &&
      blocks[1]._id !== blocks[2]._id &&
      blocks[2].exercises.length === 2,
    show(blocks.map((b) => b.type))
  );

  await menu(p, 'EMOM', 'Supprimer le bloc');
  ok(
    '« Supprimer le bloc » le retire tout de suite, avec « Annuler »',
    (await p.locator('main [data-block-type="emom"]').count()) === 1 &&
      /Bloc EMOM supprimé/.test(clean(await p.locator('body').innerText())),
    `${await p.locator('main [data-block-type="emom"]').count()} bloc(s) EMOM`
  );
  await ctx.close();
}

{
  console.log('\n── sur téléphone, l’en-tête ouvre une feuille');
  await reset();
  const ctx = await browser.newContext(MOBILE);
  const p = await signIn(ctx);
  await p.goto(SESSION_1, { waitUntil: 'domcontentloaded' });
  await settle(p);
  const emom = block(p, 'emom');

  await press(p, 'Régler le bloc EMOM');
  const sheet = p.getByRole('dialog', { name: 'Régler le bloc EMOM' });
  ok(
    'l’en-tête entier ouvre les réglages du bloc, en grand',
    (await sheet.count()) === 1 &&
      (await sheet
        .getByRole('button', { name: 'Augmenter les tours' })
        .count()) === 1 &&
      (await p
        .locator('main')
        .getByRole('button', { name: /^Nombre de tours/ })
        .count()) === 0
  );

  await press(p, 'Augmenter les tours', sheet);
  await press(p, 'C’est bon', sheet);
  await gone(sheet);
  ok(
    '  → « C’est bon » la referme, le réglage lu dans l’en-tête',
    (await sheet.count()) === 0 && /11\stours/.test(await text(emom)),
    (await text(emom)).replace(/\n+/g, ' | ').slice(0, 80)
  );

  await press(p, 'Régler le bloc EMOM');
  await press(p, 'Changer de format', sheet);
  await press(p, /^AMRAP/, sheet);
  await gone(sheet);
  ok(
    '  → « Changer de format » s’y fait aussi',
    (await p.locator('main [data-block-type="amrap"]').count()) === 2,
    `${await p.locator('main [data-block-type="amrap"]').count()} bloc(s) AMRAP`
  );

  await press(p, /^Régler le bloc AMRAP/);
  await p.goBack();
  await settle(p);
  ok(
    '  → le retour du téléphone la referme, sans quitter la séance',
    (await p.getByRole('dialog').count()) === 0 &&
      new URL(p.url()).pathname === `/coach/clients/${CLIENT}/s/1`,
    p.url()
  );
  await ctx.close();
}

await reset();
await browser.close();
process.exit(failureCount() ? 1 : 0);
